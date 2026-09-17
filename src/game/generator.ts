import { Rng } from './rng';
import type { Caution, Note } from './notes';
import { severityLoad, sweepFor } from './notes';
import type { RoadPoint, Segment } from './types';
import type { Stage } from './stages';
import { G, MIN_HORIZON_M, PASSABILITY_MARGIN, SAMPLE_M, severityPressure } from './tuning';

const CAUTIONS: Caution[] = ['CREST', 'NARROWS', 'CARE', 'JUNCTION'];

/**
 * Writes the road ahead of the car and the notation describing it in the
 * same pass, so the book can never call a corner the road does not have.
 *
 * The obligation the product makes: whatever is written must remain passable
 * at the speed the car will be carrying when it arrives. Curvature is
 * therefore never chosen freely — it is chosen as a share of the adhesion
 * limit at that expected speed, and the share is what escalates.
 */
export class RoadGenerator {
  readonly segments: Segment[] = [];
  private points: RoadPoint[] = [];
  private head = { x: 0, y: 0, h: 0, s: 0, w: 0 };
  private lastDir: 1 | -1 = 1;
  private sinceCorner = 0;

  constructor(
    private readonly stage: Stage,
    private readonly rng: Rng,
    /** Expected speed in m/s at a given distance travelled. */
    private readonly expectedSpeed: (distanceM: number) => number,
    /** Road is written from here, so a run never starts on a cut edge. */
    startS = 0,
  ) {
    this.head.s = startS;
    this.head.w = stage.halfWidth;
    this.points.push({ ...this.head });
  }

  get writtenTo(): number {
    return this.head.s;
  }

  /** Writes road until it extends `aheadM` beyond `s`. */
  ensure(s: number, aheadM: number): void {
    const target = s + Math.max(aheadM, MIN_HORIZON_M);
    let guard = 0;
    while (this.head.s < target && guard++ < 200) {
      this.writeSegment();
    }
  }

  private writeSegment(): void {
    const startS = this.head.s;
    const v = Math.max(8, this.expectedSpeed(Math.max(0, startS)));
    const pressure = severityPressure(Math.max(0, startS));

    // The most curvature this surface can hold at that speed, with room left
    // for the player to react.
    const limit = (PASSABILITY_MARGIN * this.stage.mu * G) / Math.max(v * v, 36);

    const straightChance = this.stage.straightBias * (1 - 0.45 * pressure);
    const wantStraight = this.sinceCorner < 1 ? false : this.rng.chance(straightChance);

    let note: Note;
    let curvature: number;
    let length: number;
    let halfWidth = this.stage.halfWidth;

    if (wantStraight) {
      const seconds = this.rng.range(0.55, 2.1) * (1 - 0.35 * pressure);
      length = clamp(v * seconds, 36, 620);
      curvature = 0;
      note = { dir: 'S', severity: 0, runM: 0, caution: null };
      this.sinceCorner = 0;
    } else {
      const severity = this.pickSeverity(pressure);
      const sweep = sweepFor(severity) * this.rng.range(0.82, 1.24);
      const magnitude = severityLoad(severity) * limit;
      // Alternate direction more often than chance would, the way a real
      // stage reads, without ever making it predictable.
      const dirSign: 1 | -1 = this.rng.chance(0.68) ? (-this.lastDir as 1 | -1) : this.lastDir;
      this.lastDir = dirSign;
      curvature = magnitude * dirSign;
      length = clamp(sweep / magnitude, 42, 900);

      let caution: Caution | null = null;
      if (this.rng.chance(0.16)) {
        caution = this.rng.pick(CAUTIONS);
        if (caution === 'NARROWS') halfWidth *= 0.76;
      }

      note = {
        dir: dirSign > 0 ? 'R' : 'L',
        severity,
        runM: 0,
        caution,
      };
      this.sinceCorner += 1;
    }

    // Segment lengths are whole samples, so stepping the centreline is exact.
    length = Math.max(SAMPLE_M * 4, Math.round(length / SAMPLE_M) * SAMPLE_M);
    note.runM = Math.round(length);

    const segment: Segment = {
      index: this.segments.length,
      startS,
      length,
      curvature,
      note,
      halfWidth,
    };
    this.segments.push(segment);
    this.sample(segment);
  }

  private pickSeverity(pressure: number): number {
    // Skews toward 1 (tightest) as pressure rises. The corner never exceeds
    // the adhesion limit either way — what rises is how close to it the road
    // is written.
    const roll = Math.pow(this.rng.next(), 1 / (0.55 + 1.7 * pressure));
    return clamp(Math.round(6 - roll * 5), 1, 6);
  }

  private sample(segment: Segment): void {
    const steps = Math.round(segment.length / SAMPLE_M);
    for (let i = 0; i < steps; i++) {
      this.head.h += segment.curvature * SAMPLE_M;
      this.head.x += Math.cos(this.head.h) * SAMPLE_M;
      this.head.y += Math.sin(this.head.h) * SAMPLE_M;
      this.head.s += SAMPLE_M;
      // Width eases across a join rather than stepping.
      this.head.w += (segment.halfWidth - this.head.w) * 0.14;
      this.points.push({ ...this.head });
    }
  }

  /** Drops road the car has left behind. */
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

  /** Points spanning [from, to], for drawing the road band. */
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
