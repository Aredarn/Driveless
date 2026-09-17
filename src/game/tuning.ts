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
  return 0.68 + 0.32 * (1 - Math.exp(-distanceM / 3000));
}

/** How hard the generator leans on the adhesion limit, over distance.
 *  Corners start well inside what the car can hold and end just under it. */
export function severityPressure(distanceM: number): number {
  return Math.min(1, 0.3 + 0.7 * (1 - Math.exp(-distanceM / 2400)));
}

/** Traffic per kilometre of road ahead, over distance travelled. */
export function trafficDensity(distanceM: number): number {
  return 7 + 11 * (1 - Math.exp(-distanceM / 4500));
}

/** How hard the car can shed speed, m/s^2. The generator measures every
 *  corner's run-in against this, so it is the number that decides whether a
 *  hairpin after a fast sweeper is fair or cruel. */
export const BRAKE = 11;

/** Share of the surface's grip the car reserves for the corner it is braking
 *  into. Below 1 there is a sliver spare for a steering correction; damage
 *  and a bad line eat it. */
export const CORNER_MARGIN = 0.92;

/** How far ahead the road is written, in seconds of travel. */
export const HORIZON_SECONDS = 16;
export const MIN_HORIZON_M = 950;

/** Road written behind the start line, so the plate never shows a cut edge. */
export const RUN_IN_M = 220;

/** Centreline sample spacing, metres. */
export const SAMPLE_M = 3;

export const CAR_LENGTH = 4.4;
export const CAR_WIDTH = 1.9;
