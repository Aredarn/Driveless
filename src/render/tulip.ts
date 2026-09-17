import type { Note } from '../game/notes';

const NS = 'http://www.w3.org/2000/svg';

const ENTRY_RUN = 30;
const EXIT_RUN = 34;
const STROKE = 8;
const FRAME = 124;

/**
 * Turn and radius per severity. Both move together: a hairpin is a big turn
 * on a small radius, a fast kink is a small turn on a large one. Varying
 * only the angle — which the first version did — draws a hairpin as a loop
 * folded back over its own entry line, which is unreadable at this size.
 */
function shapeFor(severity: number): { turn: number; radius: number } {
  const table: Record<number, [number, number]> = {
    1: [155, 14],
    2: [130, 17],
    3: [105, 21],
    4: [80, 25],
    5: [55, 30],
    6: [30, 36],
  };
  const [degrees, radius] = table[severity] ?? [30, 36];
  return { turn: (degrees * Math.PI) / 180, radius };
}

interface Point {
  x: number;
  y: number;
}

/**
 * A tulip: the co-driver's junction diagram. Entry ball at the bottom, the
 * road bending the way the corner bends, arrow at the exit. Built from the
 * note, so it cannot disagree with the road.
 *
 * Every diagram is drawn at one scale and framed on its own centre, so a
 * hairpin and a flat kink sit the same size on the page and neither clips.
 */
export function tulip(note: Note): SVGSVGElement {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'note__tulip');
  svg.setAttribute('aria-hidden', 'true');

  const start: Point = { x: 0, y: 0 };
  const hull: Point[] = [start];

  let d: string;
  let tip: Point;
  let heading: Point;

  if (note.dir === 'S') {
    tip = { x: 0, y: -(ENTRY_RUN + EXIT_RUN) };
    heading = { x: 0, y: -1 };
    d = `M0,0 L0,${round(tip.y)}`;
    hull.push(tip);
  } else {
    const sign = note.dir === 'R' ? 1 : -1;
    const { turn, radius } = shapeFor(note.severity);
    const h0: Point = { x: 0, y: -1 };
    const bend: Point = { x: 0, y: -ENTRY_RUN };
    // Right of "up" in a y-down space; the arc centre sits that way for a
    // right-hander and the other way for a left.
    const centre: Point = {
      x: bend.x + sign * radius * perp(h0).x,
      y: bend.y + sign * radius * perp(h0).y,
    };
    heading = rotate(h0, sign * turn);
    const exit: Point = {
      x: centre.x - sign * radius * perp(heading).x,
      y: centre.y - sign * radius * perp(heading).y,
    };
    tip = { x: exit.x + heading.x * EXIT_RUN, y: exit.y + heading.y * EXIT_RUN };

    d =
      `M0,0 L${round(bend.x)},${round(bend.y)} ` +
      `A${radius},${radius} 0 ${turn > Math.PI ? 1 : 0},${sign > 0 ? 1 : 0} ` +
      `${round(exit.x)},${round(exit.y)} ` +
      `L${round(tip.x)},${round(tip.y)}`;

    hull.push(bend, exit, tip);
    // Sample the arc so the framing accounts for its bulge, not just its ends.
    for (let step = 1; step < 6; step++) {
      const partial = rotate(h0, sign * turn * (step / 6));
      hull.push({
        x: centre.x - sign * radius * perp(partial).x,
        y: centre.y - sign * radius * perp(partial).y,
      });
    }
  }

  const path = document.createElementNS(NS, 'path');
  path.setAttribute('d', d);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', String(STROKE));
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  path.setAttribute('stroke-dasharray', '420');
  path.style.setProperty('--len', '420');
  svg.append(path);

  const back = { x: -heading.x, y: -heading.y };
  const side = perp(heading);
  const wingA: Point = { x: tip.x + back.x * 16 + side.x * 9, y: tip.y + back.y * 16 + side.y * 9 };
  const wingB: Point = { x: tip.x + back.x * 16 - side.x * 9, y: tip.y + back.y * 16 - side.y * 9 };
  const head = document.createElementNS(NS, 'path');
  head.setAttribute(
    'd',
    `M${round(tip.x)},${round(tip.y)} L${round(wingA.x)},${round(wingA.y)} ` +
      `L${round(wingB.x)},${round(wingB.y)} Z`,
  );
  head.setAttribute('fill', 'currentColor');
  svg.append(head);
  hull.push(wingA, wingB);

  const ball = document.createElementNS(NS, 'circle');
  ball.setAttribute('cx', '0');
  ball.setAttribute('cy', '0');
  ball.setAttribute('r', '7');
  ball.setAttribute('fill', 'currentColor');
  svg.append(ball);

  // One frame size for every severity, centred on the shape: constant scale,
  // constant apparent stroke weight, nothing cropped.
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of hull) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  svg.setAttribute('viewBox', `${round(cx - FRAME / 2)} ${round(cy - FRAME / 2)} ${FRAME} ${FRAME}`);

  return svg;
}

function perp(v: Point): Point {
  return { x: -v.y, y: v.x };
}

function rotate(v: Point, angle: number): Point {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x: v.x * cos - v.y * sin, y: v.x * sin + v.y * cos };
}

function round(v: number): number {
  return Math.round(v * 10) / 10;
}
