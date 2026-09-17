/**
 * The co-driver's notation. This is the generator's public interface: the
 * road book and the driving plate are two readers of the same objects, so a
 * call can never describe a corner the road does not have.
 */

export type Dir = 'L' | 'R' | 'S';
export type Caution = 'CREST' | 'NARROWS' | 'CARE' | 'JUNCTION' | 'TIGHTENS' | 'LONG' | 'INTO';

export interface Note {
  /** Left, right, or straight. */
  dir: Dir;
  /** 1 tightest through 6 flat. 0 on a straight. */
  severity: number;
  /** Length of the segment this note describes, in metres. */
  runM: number;
  caution: Caution | null;
}

export function noteCode(note: Note): string {
  if (note.dir === 'S') return 'STRAIGHT';
  return `${note.dir}${note.severity}`;
}

export function noteLabel(note: Note): string {
  if (note.dir === 'S') return note.caution ? `Straight, ${note.caution.toLowerCase()}` : 'Straight';
  const side = note.dir === 'L' ? 'left' : 'right';
  const base = `${side} ${note.severity}`;
  return note.caution ? `${base}, ${note.caution.toLowerCase()}` : base;
}

/**
 * Radius written into a corner of this severity, in metres. Absolute, not a
 * share of what the car can hold at its current speed: the car brakes for
 * what is written, so a hairpin is a hairpin at any point in the run.
 */
export function radiusFor(severity: number): number {
  switch (severity) {
    case 1:
      return 19;
    case 2:
      return 34;
    case 3:
      return 62;
    case 4:
      return 105;
    case 5:
      return 185;
    default:
      return 330;
  }
}

/** How far a corner of this severity turns through, in radians. */
export function sweepFor(severity: number): number {
  switch (severity) {
    case 1:
      return 2.5;
    case 2:
      return 1.7;
    case 3:
      return 1.25;
    case 4:
      return 0.9;
    case 5:
      return 0.62;
    default:
      return 0.4;
  }
}

/** The speed this corner can be held at on a surface of this grip, m/s. */
export function cornerSpeed(severity: number, mu: number, gravity: number): number {
  return Math.sqrt(mu * gravity * radiusFor(severity));
}
