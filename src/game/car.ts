import type { RoadGenerator } from './generator';
import type { Stage } from './stages';
import {
  BRAKE,
  CAR_WIDTH,
  CORNER_MARGIN,
  G,
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
 * Steering is the only control the player has. The throttle is not a ramp:
 * the car reads the road ahead and brakes for what it cannot hold, so speed
 * rises and falls with the shape of the stage. That is what lets the road
 * contain hairpins and chicanes at all — while the car only ever accelerated,
 * every corner had to be gentle enough to take flat, and the stage got
 * blander the faster the run became.
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
  /** Smoothed slide angle, for drawing a car that is sideways when it is. */
  slip = 0;
  /** True while shedding speed for something ahead. */
  braking = false;
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
    gen: RoadGenerator,
    stage: Stage,
    speedFactor = 1,
    accrueDamage = true,
  ): void {
    const point = gen.pointAt(this.s);
    const kappa = gen.curvatureAt(this.s);

    this.offRoad = Math.abs(this.n) > point.w + CAR_WIDTH * 0.35;
    const mu = stage.mu * this.gripScale * (this.offRoad ? OFFROAD_GRIP : 1);

    const flatOut =
      stage.topSpeed * this.speedScale * speedFactor * speedRamp(this.s) * (this.offRoad ? 0.5 : 1);

    // Look far enough ahead to stop for anything inside braking range, and
    // brake for the tightest thing in it.
    const zone = (this.v * this.v) / (2 * BRAKE) + 55;
    const worst = gen.worstCurvatureIn(this.s, this.s + zone);
    let target = flatOut;
    if (Math.abs(worst.curvature) > 1e-6) {
      const hold = Math.sqrt((mu * CORNER_MARGIN * G) / Math.abs(worst.curvature));
      const runIn = Math.max(0, worst.at - this.s);
      target = Math.min(target, Math.sqrt(hold * hold + 2 * BRAKE * runIn));
    }

    this.braking = target < this.v - 0.5;
    if (this.v > target) {
      const rate = this.offRoad ? BRAKE * OFFROAD_DRAG : BRAKE;
      this.v = Math.max(target, this.v - rate * dt);
    } else {
      this.v += (target - this.v) * (1 - Math.exp(-dt / 3.2));
    }

    // Everything the car can do laterally comes out of the same grip budget.
    const maxYaw = (mu * G) / Math.max(this.v, 7);
    const yaw = steer * maxYaw;

    const denom = Math.max(0.25, 1 - this.n * kappa);
    const sDot = (this.v * Math.cos(this.alpha)) / denom;

    this.alpha += (yaw - kappa * sDot) * dt;
    this.alpha = clamp(this.alpha, -1.05, 1.05);

    this.s += sDot * dt;
    this.n += this.v * Math.sin(this.alpha) * dt;
    this.n = clamp(this.n, -point.w - 14, point.w + 14);

    const slipTarget = steer * (1 - Math.min(1, mu)) * Math.min(1, this.v / 26) * 0.55;
    this.slip += (slipTarget - this.slip) * (1 - Math.exp(-dt / 0.18));

    if (this.offRoad && accrueDamage) this.damage += OFFROAD_DAMAGE_RATE * dt;
    this.settleHits();

    this.lastKnock = Math.max(0, this.lastKnock - dt);
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
