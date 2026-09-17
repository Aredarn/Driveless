/**
 * The co-driver's notation. This is the generator's public interface: the
 * road book and the driving plate are two readers of the same objects, so a
 * call can never describe a corner the road does not have.
 */

export type Dir = 'L' | 'R' | 'S';
export type Caution = 'CREST' | 'NARROWS' | 'CARE' | 'JUNCTION';

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

/** Sweep angle written into a corner of this severity, in radians. */
export function sweepFor(severity: number): number {
  switch (severity) {
    case 1:
      return 1.45;
    case 2:
      return 1.15;
    case 3:
      return 0.92;
    case 4:
      return 0.72;
    case 5:
      return 0.54;
    default:
      return 0.38;
  }
}

/** Share of the adhesion limit a corner of this severity is written at. */
export function severityLoad(severity: number): number {
  switch (severity) {
    case 1:
      return 1;
    case 2:
      return 0.78;
    case 3:
      return 0.6;
    case 4:
      return 0.45;
    case 5:
      return 0.32;
    default:
      return 0.2;
  }
}
