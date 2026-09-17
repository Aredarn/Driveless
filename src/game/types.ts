import type { Note } from './notes';

export type StageId = 'road' | 'track' | 'rally';

export interface Segment {
  index: number;
  startS: number;
  length: number;
  /** Signed curvature, 1/m. Positive turns right. */
  curvature: number;
  note: Note;
  halfWidth: number;
}

export interface RoadPoint {
  x: number;
  y: number;
  /** Continuous, never normalised, so interpolation never wraps. */
  h: number;
  s: number;
  /** Half width at this point, smoothed across segment joins. */
  w: number;
}
