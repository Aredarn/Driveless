import type { RoadGenerator } from './generator';
import type { Stage } from './stages';
import {
  BITE_GRIP_TAU,
  BITE_LOOSEN_TAU,
  BRAKE,
  CAR_WIDTH,
  CHASE,
  CORNER_MARGIN,
  DRIFT_ANGLE,
  G,
  HAND_BRAKE,
  HAND_CHASE,
  HAND_YAW_GAIN,
  MAX_SLIP,
  SLIP_DRAG,
  TURN_AUTHORITY,
  HIT_GRIP_COST,
  HIT_SPEED_COST,
  OFFROAD_DAMAGE_RATE,
  OFFROAD_DRAG,
  OFFROAD_GRIP,
  speedRamp,
} from './tuning';

/**
 * The car lives in the road's own frame: distance along the centreline,
 * lateral offset from it, and heading relative to the tangent.
 *
 * Two controls: steer, and brake. Nothing slows the car for you — the
 * throttle is automatic and pins itself open, and shedding speed for what the
 * book is calling is the player's job. The generator guarantees the room to
 * do it exists in front of every corner; using that room is the skill.
 *
 * Heading and travel are separate. `alpha` is the direction the car is
 * actually moving, relative to the road; `slip` is how far the body is turned
 * away from that. Grip drags slip back towards zero, so ordinary cornering
 * carries only a few degrees of it. The handbrake cuts that link: the body
 * rotates freely while the car keeps going the way it was going, and
 * releasing snaps the velocity round to meet the heading.
 */
export class Car {
  s = 0;
  /** Metres right of the centreline. */
  n = 0;
  /** Heading relative to the road tangent, radians. */
  alpha = 0;
  v = 0;
  /** Accrued damage; the whole part is hits taken. */
  damage = 0;
  appliedHits = 0;
  speedScale = 1;
  gripScale = 1;
  /** Slip angle: body heading minus direction of travel, radians. */
  slip = 0;
  /** True while shedding speed for something ahead. */
  braking = false;
  /** True while sideways enough to be marking the road. */
  drifting = false;
  /** Where the car has been marking, newest last. */
  readonly marks: { s: number; n: number; heavy: boolean }[] = [];
  private lastMarkS = -Infinity;
  /** How much the tyres are currently biting; moves, never jumps. */
  private bite = CHASE;
  offRoad = false;
  lastKnock = 0;

  constructor(startN: number) {
    this.n = startN;
  }

  get hits(): number {
    return Math.floor(this.damage);
  }

  update(
    dt: number,
    steer: number,
    hand: boolean,
    gen: RoadGenerator,
    stage: Stage,
    speedFactor = 1,
    accrueDamage = true,
    assist = false,
  ): void {
    const point = gen.pointAt(this.s);
    const kappa = gen.curvatureAt(this.s);

    this.offRoad = Math.abs(this.n) > point.w + CAR_WIDTH * 0.35;
    const mu = stage.mu * this.gripScale * (this.offRoad ? OFFROAD_GRIP : 1);

    const flatOut =
      stage.topSpeed * this.speedScale * speedFactor * speedRamp(this.s) * (this.offRoad ? 0.5 : 1);

    // Assist exists only for the attract loop, which nobody is driving.
    let target = flatOut;
    if (assist) {
      const zone = (this.v * this.v) / (2 * BRAKE) + 55;
      const worst = gen.worstCurvatureIn(this.s, this.s + zone);
      if (Math.abs(worst.curvature) > 1e-6) {
        const hold = Math.sqrt((mu * CORNER_MARGIN * G) / Math.abs(worst.curvature));
        const runIn = Math.max(0, worst.at - this.s);
        target = Math.min(target, Math.sqrt(hold * hold + 2 * BRAKE * runIn));
      }
    }

    this.braking = hand || (assist && target < this.v - 0.5);
    if (this.v > target) {
      const rate = this.offRoad ? BRAKE * OFFROAD_DRAG : BRAKE;
      this.v = Math.max(target, this.v - rate * dt);
    } else {
      this.v += (target - this.v) * (1 - Math.exp(-dt / 3.2));
    }
    if (hand) this.v = Math.max(3, this.v - HAND_BRAKE * dt);

    // Everything the car can do laterally comes out of the same grip budget.
    // The handbrake spends it differently: more rotation, far less hold.
    const cornering = (mu * G * TURN_AUTHORITY) / Math.max(this.v, 7);
    const yaw = steer * cornering * (hand ? HAND_YAW_GAIN : stage.looseness);

    // Grip lets go quickly and comes back progressively, so releasing the
    // brake hooks the car up over a beat instead of snapping it straight.
    const wanted = hand ? HAND_CHASE : CHASE;
    const tau = wanted < this.bite ? BITE_LOOSEN_TAU : BITE_GRIP_TAU;
    this.bite += (wanted - this.bite) * (1 - Math.exp(-dt / tau));
    const chase = cornering * this.bite;

    // Slip builds while the body out-turns the tyres and decays as they bite.
    this.slip += (yaw - chase * this.slip) * dt;
    this.slip = clamp(this.slip, -MAX_SLIP, MAX_SLIP);
    this.drifting = Math.abs(this.slip) > DRIFT_ANGLE;

    // Only the tyres turn the car's actual direction of travel.
    const denom = Math.max(0.25, 1 - this.n * kappa);
    const sDot = (this.v * Math.cos(this.alpha)) / denom;
    // Whatever the body is doing, the tyres cannot turn the car faster than
    // the surface allows. This is what keeps the generator's promise honest
    // through a slide.
    const turn = clamp(chase * this.slip, -cornering, cornering);
    this.alpha += (turn - kappa * sDot) * dt;
    this.alpha = clamp(this.alpha, -1.2, 1.2);

    // A sideways car scrubs its own speed off.
    if (this.drifting) {
      this.v = Math.max(3, this.v - SLIP_DRAG * Math.abs(Math.sin(this.slip)) * this.v * dt);
    }

    this.s += sDot * dt;
    this.n += this.v * Math.sin(this.alpha) * dt;
    this.n = clamp(this.n, -point.w - 14, point.w + 14);

    this.recordMark();

    if (this.offRoad && accrueDamage) this.damage += OFFROAD_DAMAGE_RATE * dt;
    this.settleHits();

    this.lastKnock = Math.max(0, this.lastKnock - dt);
  }

  /** Lays down what the tyres are doing, so the page keeps the evidence. */
  private recordMark(): void {
    if (!this.drifting && !this.braking) {
      this.lastMarkS = -Infinity;
      return;
    }
    if (this.s - this.lastMarkS < 2.4) return;
    this.lastMarkS = this.s;
    this.marks.push({ s: this.s, n: this.n, heavy: this.drifting });
    while (this.marks.length > 0 && this.s - this.marks[0]!.s > 90) this.marks.shift();
  }

  /** A struck vehicle: one hit, a shove, and speed scrubbed off. */
  strike(fromN: number): void {
    this.damage = Math.floor(this.damage) + 1;
    this.settleHits();
    this.v *= 0.62;
    this.n += Math.sign(this.n - fromN || 1) * 1.5;
    this.alpha += (Math.random() - 0.5) * 0.18;
    this.lastKnock = 0.42;
  }

  private settleHits(): void {
    while (this.appliedHits < Math.floor(this.damage)) {
      this.appliedHits++;
      this.speedScale *= 1 - HIT_SPEED_COST;
      this.gripScale *= 1 - HIT_GRIP_COST;
    }
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
