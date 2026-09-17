import { Car } from './car';
import { RoadGenerator } from './generator';
import { Rng } from './rng';
import { STAGES, type Stage } from './stages';
import { Traffic } from './traffic';
import type { Segment, StageId } from './types';
import {
  BRAKE,
  CORNER_MARGIN,
  CUE_LEAD,
  G,
  HORIZON_SECONDS,
  MAX_HITS,
  MIN_HORIZON_M,
  RUN_IN_M,
  speedRamp,
} from './tuning';

export type Phase = 'choosing' | 'driving' | 'ended';

/**
 * One run, and the attract state before the first one. Best distance is held
 * for the session only: whether a personal best survives a reload is an open
 * product decision, and inventing storage here would answer it silently.
 */
export class Run {
  phase: Phase = 'choosing';
  stage: Stage = STAGES.road;
  car!: Car;
  gen!: RoadGenerator;
  traffic!: Traffic;
  private rng!: Rng;
  readonly best = new Map<StageId, number>();
  /** Changes whenever the road is rebuilt, so readers holding per-segment
   *  state know their keys no longer mean anything. */
  token = 0;
  /** Set for one frame when a corner leaves the book. */
  cornerPassed = false;
  private lastLeadCorner = -1;

  constructor() {
    this.build(STAGES.road);
  }

  get distance(): number {
    return this.car.s;
  }

  get bestForStage(): number {
    return this.best.get(this.stage.id) ?? 0;
  }

  start(stageId: StageId): void {
    this.build(STAGES[stageId]);
    this.phase = 'driving';
  }

  restart(): void {
    this.build(this.stage);
    this.phase = 'driving';
  }

  private build(stage: Stage): void {
    this.token++;
    this.stage = stage;
    this.rng = new Rng((Math.random() * 0xffffffff) >>> 0);
    const car = new Car(stage.traffic ? stage.halfWidth * 0.5 : 0);
    this.car = car;
    this.gen = new RoadGenerator(
      stage,
      this.rng,
      (distanceM) => stage.topSpeed * car.speedScale * speedRamp(distanceM),
      -RUN_IN_M,
    );
    this.traffic = new Traffic(stage, this.rng);
    this.gen.ensure(0, MIN_HORIZON_M);
    this.lastLeadCorner = -1;
    this.cornerPassed = false;
  }

  update(dt: number, steer: number, hand: boolean): void {
    const preview = this.phase === 'choosing';
    const drive = preview ? this.autoSteer() : this.phase === 'driving' ? steer : 0;
    const speedFactor = preview ? 0.4 : this.phase === 'ended' ? 0 : 1;

    const pulling = hand && this.phase === 'driving';
    this.car.update(
      dt,
      drive,
      pulling,
      this.gen,
      this.stage,
      speedFactor,
      this.phase === 'driving',
      preview,
    );
    this.gen.ensure(this.car.s, Math.max(MIN_HORIZON_M, this.car.v * HORIZON_SECONDS));
    this.gen.prune(this.car.s);

    if (this.phase === 'driving') {
      this.traffic.update(dt, this.car, (fromN) => this.car.strike(fromN));
      if (this.car.hits >= MAX_HITS) this.end();
    }

    const lead = this.corners()[0];
    const leadIndex = lead ? lead.index : -1;
    this.cornerPassed = this.lastLeadCorner !== -1 && leadIndex !== this.lastLeadCorner;
    this.lastLeadCorner = leadIndex;
  }

  /**
   * The braking gate for whatever is tightest in range: how far the car can
   * still run before it should be slowing, and the speed it needs to arrive
   * at. It carries CUE_LEAD of margin, so reaching it is the moment to brake
   * rather than the last moment braking would work. Negative metres means the
   * corner is going to arrive too fast. Nothing acts on this — it is what the
   * plate draws so the player can learn where the point is.
   */
  brakeCue(): { metres: number; hold: number; late: boolean } | null {
    const car = this.car;
    const mu = this.stage.mu * car.gripScale;
    const zone = (car.v * car.v) / (2 * BRAKE) + 140;
    const worst = this.gen.worstCurvatureIn(car.s, car.s + zone);
    if (Math.abs(worst.curvature) < 1e-6) return null;
    const hold = Math.sqrt((mu * CORNER_MARGIN * G) / Math.abs(worst.curvature));
    if (car.v <= hold) return null;
    const needed = (car.v * car.v - hold * hold) / (2 * BRAKE);
    const metres = worst.at - car.s - needed - CUE_LEAD;
    return { metres, hold, late: metres <= 0 };
  }

  corners(): Segment[] {
    return this.gen.upcomingCorners(this.car.s, 3);
  }

  /** Metres until the given corner begins. */
  distanceTo(segment: Segment): number {
    return Math.max(0, segment.startS - this.car.s);
  }

  private end(): void {
    this.phase = 'ended';
    this.traffic.clear();
    const best = this.best.get(this.stage.id) ?? 0;
    if (this.car.s > best) this.best.set(this.stage.id, this.car.s);
  }

  /** Holds the line during the attract state, so the plate is never a still. */
  private autoSteer(): number {
    const desired = clamp(-this.car.n * 0.05, -0.22, 0.22);
    return clamp((desired - this.car.alpha) * 2.4, -1, 1);
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
