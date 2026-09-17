import type { Car } from './car';
import type { Rng } from './rng';
import type { Stage } from './stages';
import { CAR_LENGTH, CAR_WIDTH, speedRamp, trafficDensity } from './tuning';

export interface Vehicle {
  s: number;
  n: number;
  v: number;
  /** +1 travelling with the player, -1 against. */
  dir: 1 | -1;
  length: number;
  width: number;
  /** Stable per-vehicle jitter so the printed plate is not a rank of clones. */
  shade: number;
}

const SPAWN_NEAR = 110;
const SPAWN_FAR = 620;

/**
 * Traffic on the open road. The generator guarantees a passable line;
 * traffic is what fills it, so density is an escalation vector and the lane
 * a vehicle sits in is never the whole road.
 */
export class Traffic {
  readonly vehicles: Vehicle[] = [];

  constructor(
    private readonly stage: Stage,
    private readonly rng: Rng,
  ) {}

  update(dt: number, car: Car, onHit: (fromN: number) => void): void {
    if (!this.stage.traffic) return;

    for (let i = this.vehicles.length - 1; i >= 0; i--) {
      const veh = this.vehicles[i]!;
      veh.s += veh.v * veh.dir * dt;
      if (veh.s < car.s - 140 || veh.s > car.s + SPAWN_FAR + 260) {
        this.vehicles.splice(i, 1);
        continue;
      }
      const gapS = Math.abs(veh.s - car.s);
      const gapN = Math.abs(veh.n - car.n);
      if (
        gapS < (CAR_LENGTH + veh.length) * 0.5 &&
        gapN < (CAR_WIDTH + veh.width) * 0.5 &&
        car.lastKnock <= 0
      ) {
        this.vehicles.splice(i, 1);
        onHit(veh.n);
      }
    }

    const want = Math.round((trafficDensity(car.s) * (SPAWN_FAR - SPAWN_NEAR)) / 1000);
    let guard = 0;
    while (this.vehicles.length < want && guard++ < 6) {
      this.spawn(car);
    }
  }

  private spawn(car: Car): void {
    const lane = this.stage.halfWidth * 0.5;
    const oncoming = this.rng.chance(0.42);
    const cruise = this.stage.topSpeed * speedRamp(car.s);
    // Every so often it is a truck: long, slow, and squarely in the way.
    const truck = this.rng.chance(0.22);
    this.vehicles.push({
      s: car.s + this.rng.range(SPAWN_NEAR, SPAWN_FAR),
      n: oncoming ? -lane + this.rng.range(-0.5, 0.5) : lane + this.rng.range(-0.5, 0.5),
      v: (oncoming ? cruise * this.rng.range(0.45, 0.68) : cruise * this.rng.range(0.4, 0.66)) *
        (truck ? 0.68 : 1),
      dir: oncoming ? -1 : 1,
      length: truck ? this.rng.range(11, 16) : this.rng.range(4.2, 7.6),
      width: truck ? this.rng.range(2.4, 2.7) : this.rng.range(1.8, 2.2),
      shade: this.rng.next(),
    });
  }

  clear(): void {
    this.vehicles.length = 0;
  }
}
