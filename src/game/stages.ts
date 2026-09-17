import type { StageId } from './types';

/**
 * Two fields here carry decisions the surface brief records as UNRESOLVED,
 * not as answers: `mu` (the numeric grip model separating the stages) and
 * `traffic` (whether traffic belongs on track and rally at all). They are
 * playable placeholders, marked OPEN the same way src/game/tuning.ts marks
 * its own, and they are the product owner's to settle.
 */
export interface Stage {
  id: StageId;
  name: string;
  gloss: string;
  /** Tab card colour. */
  tint: string;
  /** OPEN: coefficient of friction the surface offers. The numeric grip
   *  model separating the stages has not been decided. */
  mu: number;
  /** Top speed in m/s before the distance ramp and damage are applied. */
  topSpeed: number;
  /** Half the road width, in metres. */
  halfWidth: number;
  /** Share of segments written as straights before pressure tightens them. */
  straightBias: number;
  /** OPEN: whether this stage carries traffic at all. */
  traffic: boolean;
  edge: 'verge' | 'kerb' | 'stake';
  surface: string;
}

export const STAGES: Record<StageId, Stage> = {
  road: {
    id: 'road',
    name: 'Road',
    gloss: 'Traffic, two ways, good tarmac',
    tint: '#2f5f8f',
    mu: 1.02,
    topSpeed: 54,
    halfWidth: 4.4,
    straightBias: 0.52,
    traffic: true,
    edge: 'verge',
    surface: 'Tarmac, open to traffic',
  },
  track: {
    id: 'track',
    name: 'Track',
    gloss: 'Closed circuit, kerbs, no traffic',
    tint: '#26654a',
    mu: 1.28,
    topSpeed: 60,
    halfWidth: 5.6,
    straightBias: 0.4,
    traffic: false,
    edge: 'kerb',
    surface: 'Sealed circuit, closed',
  },
  rally: {
    id: 'rally',
    name: 'Rally',
    gloss: 'Loose surface, narrow, staked edges',
    tint: '#a2611c',
    mu: 0.74,
    topSpeed: 45,
    halfWidth: 3.1,
    straightBias: 0.3,
    traffic: false,
    edge: 'stake',
    surface: 'Gravel, stage closed',
  },
};

export const STAGE_ORDER: StageId[] = ['road', 'track', 'rally'];
