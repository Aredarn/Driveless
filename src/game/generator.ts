import { Rng } from './rng';
import type { Caution, Note } from './notes';
import { cornerSpeed, radiusFor, sweepFor } from './notes';
import type { RoadPoint, Segment } from './types';
import type { Stage } from './stages';
import { BRAKE, G, MIN_HORIZON_M, SAMPLE_M, severityPressure } from './tuning';

/** A phrase is a shape of road, not a single corner. */
type Phrase = 'straight' | 'sweeper' | 'esses' | 'chicane' | 'hairpin' | 'tightening';

/**
 * Writes the road ahead of the car and the notation describing it in the
 * same pass, so the book can never call a corner the road does not have.
 *
 * The obligation the product makes: every corner is reachable. Corners carry
 * absolute radii — a hairpin is a hairpin however fast the run has become —
 * and the generator guarantees there is enough road in front of each one to
 * brake into it from the speed the previous phrase leaves the car carrying.
 * What escalates with distance is how often the road asks for the hard stuff,
 * not how far it bends.
 *
 * Road is built in phrases rather than independent corners: esses, chicanes,
 * hairpins and tightening sequences, because a stage that is only unrelated
 * bends reads the same at every distance.
 */
export class RoadGenerator {
  readonly segments: Segment[] = [];
  private points: RoadPoint[] = [];
  private head = { x: 0, y: 0, h: 0, s: 0, w: 0 };
  private lastDir: 1 | -1 = 1;
  /** Speed the car will be carrying as it leaves what has been written. */
  private exitSpeed: number;

  constructor(
    private readonly stage: Stage,
    private readonly rng: Rng,
    /** Top speed in m/s at a given distance travelled. */
    private readonly topSpeed: (distanceM: number) => number,
    startS = 0,
  ) {
    this.head.s = startS;
    this.head.w = stage.halfWidth;
    this.points.push({ ...this.head });
    this.exitSpeed = topSpeed(0);
  }

  get writtenTo(): number {
    return this.head.s;
  }

  ensure(s: number, aheadM: number): void {
    const target = s + Math.max(aheadM, MIN_HORIZON_M);
    let guard = 0;
    while (this.head.s < target && guard++ < 120) {
      this.writePhrase();
    }
  }

  private writePhrase(): void {
    const pressure = severityPressure(Math.max(0, this.head.s));
    const phrase = this.pickPhrase(pressure);

    switch (phrase) {
      case 'straight':
        this.writeStraight(this.rng.range(55, 190) * (1 - 0.4 * pressure) + 30, null);
        break;

      case 'sweeper': {
        const severity = this.rng.chance(0.5) ? 5 : 6;
        this.writeCorner(severity, this.nextDir(), this.rng.chance(0.3) ? 'LONG' : null);
        break;
      }

      case 'esses': {
        // Alternating medium corners with no straight between them.
        const count = 2 + this.rng.int(1, 3);
        let dir = this.nextDir();
        for (let i = 0; i < count; i++) {
          const severity = 3 + this.rng.int(0, 1);
          this.writeCorner(severity, dir, i === 0 ? 'INTO' : null);
          dir = -dir as 1 | -1;
          this.lastDir = dir;
        }
        break;
      }

      case 'chicane': {
        const dir = this.nextDir();
        this.writeCorner(2, dir, 'INTO');
        this.writeCorner(2, -dir as 1 | -1, null);
        this.lastDir = -dir as 1 | -1;
        break;
      }

      case 'hairpin':
        this.writeCorner(1, this.nextDir(), 'CARE');
        break;

      case 'tightening': {
        // One corner that arrives open and closes on you.
        const dir = this.nextDir();
        this.writeCorner(4, dir, 'TIGHTENS');
        this.writeCorner(this.rng.chance(0.5) ? 2 : 3, dir, null);
        break;
      }
    }
  }

  private pickPhrase(pressure: number): Phrase {
    const roll = this.rng.next();
    // Early road is mostly open; the hard shapes arrive as pressure rises.
    // The stage decides how much of it is straight at all: an open road
    // breathes, a circuit links up, a rally stage barely stops turning.
    const straight = this.stage.straightBias * 0.8 * (1 - 0.55 * pressure);
    const sweeper = straight + 0.26 * (1 - 0.3 * pressure);
    const esses = sweeper + 0.14 + 0.1 * pressure;
    const tightening = esses + 0.08 + 0.08 * pressure;
    const chicane = tightening + 0.06 + 0.09 * pressure;
    if (roll < straight) return 'straight';
    if (roll < sweeper) return 'sweeper';
    if (roll < esses) return 'esses';
    if (roll < tightening) return 'tightening';
    if (roll < chicane) return 'chicane';
    return 'hairpin';
  }

  private nextDir(): 1 | -1 {
    const dir: 1 | -1 = this.rng.chance(0.72) ? (-this.lastDir as 1 | -1) : this.lastDir;
    this.lastDir = dir;
    return dir;
  }

  /**
   * Emits a corner, inserting the run-in it needs first. This is where the
   * reachability promise is kept: if the car cannot shed the speed in the
   * road that exists, more road is written before the corner rather than the
   * corner being softened.
   */
  private writeCorner(severity: number, dir: 1 | -1, caution: Caution | null): void {
    const speed = cornerSpeed(severity, this.stage.mu, G);
    const needed = Math.max(0, (this.exitSpeed * this.exitSpeed - speed * speed) / (2 * BRAKE));
    if (needed > SAMPLE_M * 2) this.writeStraight(needed + 25, null);

    const radius = radiusFor(severity) * this.rng.range(0.88, 1.18);
    const sweep = sweepFor(severity) * this.rng.range(0.85, 1.2);
    let halfWidth = this.stage.halfWidth;

    let mark = caution;
    if (!mark && this.rng.chance(0.14)) {
      mark = this.rng.pick(['CREST', 'NARROWS', 'JUNCTION'] as Caution[]);
    }
    if (mark === 'NARROWS') halfWidth *= 0.74;

    this.push({
      curvature: dir / radius,
      length: sweep * radius,
      halfWidth,
      note: { dir: dir > 0 ? 'R' : 'L', severity, runM: 0, caution: mark },
    });
    this.exitSpeed = speed;
  }

  private writeStraight(length: number, caution: Caution | null): void {
    this.push({
      curvature: 0,
      length: clamp(length, 30, 900),
      halfWidth: this.stage.halfWidth,
      note: { dir: 'S', severity: 0, runM: 0, caution },
    });
    this.exitSpeed = this.topSpeed(Math.max(0, this.head.s));
  }

  private push(spec: {
    curvature: number;
    length: number;
    halfWidth: number;
    note: Note;
  }): void {
    // Whole samples, so stepping the centreline is exact.
    const length = Math.max(SAMPLE_M * 3, Math.round(spec.length / SAMPLE_M) * SAMPLE_M);
    spec.note.runM = Math.round(length);
    const segment: Segment = {
      index: this.segments.length,
      startS: this.head.s,
      length,
      curvature: spec.curvature,
      note: spec.note,
      halfWidth: spec.halfWidth,
    };
    this.segments.push(segment);

    const steps = Math.round(length / SAMPLE_M);
    for (let i = 0; i < steps; i++) {
      this.head.h += segment.curvature * SAMPLE_M;
      this.head.x += Math.cos(this.head.h) * SAMPLE_M;
      this.head.y += Math.sin(this.head.h) * SAMPLE_M;
      this.head.s += SAMPLE_M;
      this.head.w += (segment.halfWidth - this.head.w) * 0.14;
      this.points.push({ ...this.head });
    }
  }

  prune(s: number): void {
    const keepFrom = s - 160;
    let drop = 0;
    while (drop < this.points.length && this.points[drop]!.s < keepFrom) drop++;
    if (drop > 0) this.points.splice(0, drop);
  }

  pointAt(s: number): RoadPoint {
    const first = this.points[0]!;
    const raw = (s - first.s) / SAMPLE_M;
    const i = clamp(Math.floor(raw), 0, this.points.length - 2);
    const a = this.points[i]!;
    const b = this.points[i + 1]!;
    const t = clamp(raw - i, 0, 1);
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      h: a.h + (b.h - a.h) * t,
      s,
      w: a.w + (b.w - a.w) * t,
    };
  }

  span(from: number, to: number): RoadPoint[] {
    const first = this.points[0]!;
    const lo = clamp(Math.floor((from - first.s) / SAMPLE_M), 0, this.points.length - 1);
    const hi = clamp(Math.ceil((to - first.s) / SAMPLE_M), 0, this.points.length - 1);
    return this.points.slice(lo, hi + 1);
  }

  segmentAt(s: number): Segment {
    const last = this.segments[this.segments.length - 1]!;
    if (s >= last.startS) return last;
    let lo = 0;
    let hi = this.segments.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (this.segments[mid]!.startS <= s) lo = mid;
      else hi = mid - 1;
    }
    return this.segments[lo]!;
  }

  curvatureAt(s: number): number {
    return this.segmentAt(s).curvature;
  }

  /** The tightest curvature anywhere in [from, to]: what the car brakes for. */
  worstCurvatureIn(from: number, to: number): { curvature: number; at: number } {
    let worst = 0;
    let at = to;
    const first = this.segmentAt(from);
    for (let i = first.index; i < this.segments.length; i++) {
      const seg = this.segments[i]!;
      if (seg.startS > to) break;
      if (seg.startS + seg.length < from) continue;
      if (Math.abs(seg.curvature) > Math.abs(worst)) {
        worst = seg.curvature;
        at = Math.max(from, seg.startS);
      }
    }
    return { curvature: worst, at };
  }

  /** The next `count` corners, straights skipped: the book's own reading. */
  upcomingCorners(s: number, count: number): Segment[] {
    const out: Segment[] = [];
    const from = this.segmentAt(s);
    for (let i = from.index; i < this.segments.length && out.length < count; i++) {
      const seg = this.segments[i]!;
      if (seg.note.dir === 'S') continue;
      if (seg.startS + seg.length < s) continue;
      out.push(seg);
    }
    return out;
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
