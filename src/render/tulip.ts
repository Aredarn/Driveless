import type { Note } from '../game/notes';

const NS = 'http://www.w3.org/2000/svg';

/** Turn written into the diagram, radians, by severity. 1 is tightest. */
function turnFor(severity: number): number {
  const degrees = [0, 146, 121, 99, 77, 55, 33][severity] ?? 33;
  return (degrees * Math.PI) / 180;
}

/**
 * A tulip: the co-driver's junction diagram. Entry ball at the bottom, the
 * road turning the way the corner turns, arrow at the exit. Drawn from the
 * note, so it cannot disagree with the road.
 */
export function tulip(note: Note): SVGSVGElement {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 100 124');
  svg.setAttribute('class', 'note__tulip');
  svg.setAttribute('aria-hidden', 'true');

  const entry = { x: 50, y: 114 };
  const junction = { x: 50, y: 66 };
  const radius = 21;
  const exitLength = 34;

  let d: string;
  let tip = { x: 50, y: 20 };
  let heading = { x: 0, y: -1 };

  if (note.dir === 'S') {
    tip = { x: 50, y: 22 };
    d = `M${entry.x},${entry.y} L${tip.x},${tip.y}`;
  } else {
    const sign = note.dir === 'R' ? 1 : -1;
    const turn = turnFor(note.severity);
    // Right normal of "up" in a y-down space.
    const normal = { x: sign, y: 0 };
    const centre = { x: junction.x + normal.x * radius, y: junction.y + normal.y * radius };
    const cos = Math.cos(turn);
    const sin = Math.sin(turn);
    // Rotate the heading by the turn, clockwise for a right-hander.
    heading = { x: -sin * sign, y: -cos };
    const endNormal = { x: -heading.y * sign, y: heading.x * sign };
    const end = { x: centre.x - endNormal.x * radius, y: centre.y - endNormal.y * radius };
    tip = { x: end.x + heading.x * exitLength, y: end.y + heading.y * exitLength };
    const large = turn > Math.PI ? 1 : 0;
    const sweep = sign > 0 ? 1 : 0;
    d =
      `M${entry.x},${entry.y} L${junction.x},${junction.y} ` +
      `A${radius},${radius} 0 ${large},${sweep} ${round(end.x)},${round(end.y)} ` +
      `L${round(tip.x)},${round(tip.y)}`;
  }

  const path = document.createElementNS(NS, 'path');
  path.setAttribute('d', d);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '6');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  path.setAttribute('stroke-dasharray', '420');
  path.style.setProperty('--len', '420');
  svg.append(path);

  const head = document.createElementNS(NS, 'path');
  const back = { x: -heading.x, y: -heading.y };
  const side = { x: -heading.y, y: heading.x };
  const a = { x: tip.x + back.x * 17 + side.x * 9, y: tip.y + back.y * 17 + side.y * 9 };
  const b = { x: tip.x + back.x * 17 - side.x * 9, y: tip.y + back.y * 17 - side.y * 9 };
  head.setAttribute(
    'd',
    `M${round(tip.x)},${round(tip.y)} L${round(a.x)},${round(a.y)} L${round(b.x)},${round(b.y)} Z`,
  );
  head.setAttribute('fill', 'currentColor');
  svg.append(head);

  const ball = document.createElementNS(NS, 'circle');
  ball.setAttribute('cx', String(entry.x));
  ball.setAttribute('cy', String(entry.y));
  ball.setAttribute('r', '7');
  ball.setAttribute('fill', 'currentColor');
  svg.append(ball);

  return svg;
}

function round(v: number): number {
  return Math.round(v * 10) / 10;
}
