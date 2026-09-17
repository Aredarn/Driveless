/**
 * Every number the run is balanced on, in one place.
 *
 * The ones marked OPEN are decisions the surface brief records as not yet
 * made by the product owner. They are placeholders chosen to be playable,
 * not answers: change the value here, nowhere else.
 */

export const G = 9.81;

/** OPEN: how many hits the car absorbs before the run ends. */
export const MAX_HITS = 4;

/** Each hit taken permanently costs this share of top speed and of grip. */
export const HIT_SPEED_COST = 0.12;
export const HIT_GRIP_COST = 0.07;

/** Off the road surface: grip left, and hits accrued per second of scraping. */
export const OFFROAD_GRIP = 0.34;
export const OFFROAD_DAMAGE_RATE = 0.55;
export const OFFROAD_DRAG = 1.45;

/** Speed ramp: the difficulty curve. Top speed approaches stage.topSpeed
 *  times this, over distance travelled in metres. */
export function speedRamp(distanceM: number): number {
  return 0.62 + 0.38 * (1 - Math.exp(-distanceM / 5200));
}

/** How hard the generator leans on the adhesion limit, over distance.
 *  Corners start well inside what the car can hold and end just under it. */
export function severityPressure(distanceM: number): number {
  return Math.min(1, 0.32 + 0.68 * (1 - Math.exp(-distanceM / 4200)));
}

/** Traffic per kilometre of road ahead, over distance travelled. */
export function trafficDensity(distanceM: number): number {
  return 5 + 9 * (1 - Math.exp(-distanceM / 6000));
}

/** Safety margin applied to the adhesion limit when a corner is written.
 *  1.0 would mean every corner sits exactly on the limit with no room for
 *  the player's reaction time. */
export const PASSABILITY_MARGIN = 0.82;

/** How far ahead the road is written, in seconds of travel. */
export const HORIZON_SECONDS = 14;
export const MIN_HORIZON_M = 700;

/** Road written behind the start line, so the plate never shows a cut edge. */
export const RUN_IN_M = 220;

/** Centreline sample spacing, metres. */
export const SAMPLE_M = 3;

export const CAR_LENGTH = 4.4;
export const CAR_WIDTH = 1.9;
