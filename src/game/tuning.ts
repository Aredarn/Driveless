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

/** Off the road surface: grip left, and hits accrued per second of scraping.
 *  Running wide costs speed and time; it is not meant to end the run before
 *  the player has had a chance to get back on. */
export const OFFROAD_GRIP = 0.34;
export const OFFROAD_DAMAGE_RATE = 0.18;
export const OFFROAD_DRAG = 1.45;

/** Speed ramp: the difficulty curve. Top speed approaches stage.topSpeed
 *  times this, over distance travelled in metres. */
export function speedRamp(distanceM: number): number {
  return 0.68 + 0.32 * (1 - Math.exp(-distanceM / 3000));
}

/** How hard the generator leans on the adhesion limit, over distance.
 *  Corners start well inside what the car can hold and end just under it. */
export function severityPressure(distanceM: number): number {
  return Math.min(1, 0.06 + 0.94 * (1 - Math.exp(-distanceM / 2600)));
}

/** Traffic per kilometre of road ahead, over distance travelled. */
export function trafficDensity(distanceM: number): number {
  return 7 + 11 * (1 - Math.exp(-distanceM / 4500));
}

/** How hard the car can shed speed, m/s^2. The generator measures every
 *  corner's run-in against this, so it is the number that decides whether a
 *  hairpin after a fast sweeper is fair or cruel. The player's brake is the
 *  same number: the road is written for the car you are actually driving. */
export const BRAKE = 11;

/**
 * Drift. The car's body heading and the direction it is actually travelling
 * are separate; the angle between them is slip. Tyres pull the velocity back
 * towards the heading at CHASE times the cornering rate, which is why normal
 * driving only ever carries a few degrees of it. The handbrake breaks that
 * link — the body rotates faster and the velocity stops following — and
 * letting go snaps it back, which is the moment the car hooks up.
 */
export const CHASE = 30;
/**
 * How fast grip returns after a slide, and how fast it lets go. Asymmetric
 * on purpose: the rear steps out quickly and hooks back up progressively.
 * Snapping straight back to full bite in one frame is what made releasing
 * the brake feel like the car teleported upright.
 */
export const BITE_LOOSEN_TAU = 0.12;
export const BITE_GRIP_TAU = 0.45;
/**
 * Arcade turn authority. The car may out-turn what the corner geometrically
 * demands by this much, so a corner taken slightly too fast still comes back
 * rather than washing wide. Deliberately applied to handling only, never to
 * the corner speeds the generator and the braking gate are computed from —
 * so the gate stays honest and errs towards forgiving.
 */
export const TURN_AUTHORITY = 1.45;
export const HAND_CHASE = 0.8;
export const HAND_YAW_GAIN = 1.85;
export const MAX_SLIP = 0.92;
/**
 * Braking is the player's job. This is deliberately the same number the
 * generator measures run-ins against: if the car stopped worse than the road
 * was written for, every corner would be unfair by arithmetic.
 */
export const HAND_BRAKE = BRAKE;
/** How hard a sideways car scrubs its own speed off. */
export const SLIP_DRAG = 0.32;
/** Slip past this is a drift: it marks the road and shows in the book. */
export const DRIFT_ANGLE = 0.2;

/**
 * The braking gate is drawn this far before the last possible moment, so
 * that "brake when it reaches the car" is actually the right move. Measured:
 * braking exactly at the theoretical point still ended runs, braking 25 m
 * early roughly doubled the distance, and 60 m early was worse again.
 */
export const CUE_LEAD = 25;

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
