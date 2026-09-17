import type { RoadGenerator } from '../game/generator';
import type { Run } from '../game/run';
import type { RoadPoint } from '../game/types';
import { CAR_LENGTH, CAR_WIDTH } from '../game/tuning';

const INK = '#171a1a';
const GROUND = '#bfc4c3';
const ROAD_FILL = '#e7eae9';
const ROAD_FILL_LOOSE = '#d4d8d7';
const STOCK = '#dde0df';
const RED = '#b52f26';

/**
 * The driving plate: the stage drawn as a printed page, seen from above.
 * Ink casing, a ruled surface, staked or kerbed edges, and one red mark for
 * the car — the same hand the road book is written in.
 */
export class Plate {
  private ctx: CanvasRenderingContext2D;
  private grain: CanvasPattern | null = null;
  private view = 150;
  private width = 0;
  private height = 0;
  private dpr = 1;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Canvas 2D is unavailable in this browser.');
    this.ctx = ctx;
    this.grain = makeGrain(ctx);
    this.resize();
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.width = Math.max(1, Math.round(rect.width));
    this.height = Math.max(1, Math.round(rect.height));
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
  }

  draw(run: Run, dt: number): void {
    const { ctx } = this;
    const { car, gen, stage } = run;

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = GROUND;
    ctx.fillRect(0, 0, this.width, this.height);

    if (this.grain) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = this.grain;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
    }

    // Zoom out as speed rises, so the road ahead stays readable in time
    // rather than in metres.
    const wantView = 40 + car.v * 1.05;
    this.view += (wantView - this.view) * (1 - Math.exp(-dt / 0.6));
    const ppm = (this.height * 0.66) / this.view;

    const anchor = gen.pointAt(car.s);
    const normal = rightNormal(anchor.h);
    const carX = anchor.x + normal.x * car.n;
    const carY = anchor.y + normal.y * car.n;
    const heading = anchor.h + car.alpha;

    ctx.save();
    ctx.translate(this.width / 2, this.height * 0.68);
    ctx.rotate(-Math.PI / 2 - heading);
    ctx.scale(ppm, ppm);
    ctx.translate(-carX, -carY);

    const reach = Math.hypot(this.width, this.height) / (2 * ppm) + 30;
    this.drawGround(carX, carY, reach);

    const span = gen.span(car.s - 140, car.s + this.view * 1.7);
    if (span.length > 2) {
      this.drawSurface(span, stage.edge, stage.id === 'rally');
      this.drawEdges(span, stage.edge);
      this.drawFurniture(span, gen, stage.edge);
      this.drawJunctions(run, car.s);
      this.drawTicks(span);
      if (stage.id === 'road') this.drawCentreLine(span);
    }

    this.drawTraffic(run, ppm);
    if (car.braking) this.drawBrakeMarks(gen, car.s, car.n);
    this.drawCar(car.offRoad, carX, carY, heading, car.slip, ppm, run.phase === 'ended');

    ctx.restore();
    this.drawChainage(run);
    this.drawCropMarks();
  }

  /**
   * The book's distance column, continued onto the plate. Ticks are the
   * road's own chaining; the corners the book is holding sit on it at the
   * distance they will actually arrive, so what is written and where it is
   * are the same fact seen twice.
   */
  private drawChainage(run: Run): void {
    const { ctx } = this;
    const span = 520;
    const axis = this.width - 46;
    const bottom = this.height * 0.68;
    const top = 30;
    const scale = (bottom - top) / span;

    ctx.save();
    ctx.strokeStyle = 'rgba(23, 26, 26, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(axis + 0.5, top);
    ctx.lineTo(axis + 0.5, bottom);
    ctx.stroke();

    ctx.font = '600 12px "Archivo Narrow", sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'right';
    for (let m = 0; m <= span; m += 50) {
      const y = Math.round(bottom - m * scale) + 0.5;
      const major = m % 250 === 0;
      ctx.beginPath();
      ctx.moveTo(axis + 0.5, y);
      ctx.lineTo(axis + 0.5 + (major ? 11 : 6), y);
      ctx.stroke();
      if (major && m > 0) {
        ctx.fillStyle = 'rgba(23, 26, 26, 0.72)';
        ctx.fillText(String(m), axis - 6, y);
      }
    }

    // Where the car stands on its own chain.
    ctx.fillStyle = RED;
    ctx.beginPath();
    ctx.moveTo(axis - 1, bottom);
    ctx.lineTo(axis - 10, bottom - 5);
    ctx.lineTo(axis - 10, bottom + 5);
    ctx.closePath();
    ctx.fill();

    for (const veh of run.traffic.vehicles) {
      const metres = veh.s - run.car.s;
      if (metres < 0 || metres > span) continue;
      const y = Math.round(bottom - metres * scale);
      ctx.fillStyle = veh.dir < 0 ? INK : 'rgba(23, 26, 26, 0.42)';
      ctx.fillRect(axis - 21, y - 2, 9, 4);
    }

    if (run.phase !== 'choosing') {
      ctx.textAlign = 'left';
      ctx.font = '700 15px "Archivo Narrow", sans-serif';
      for (const corner of run.corners()) {
        const metres = run.distanceTo(corner);
        if (metres > span) continue;
        const y = Math.round(bottom - metres * scale) + 0.5;
        ctx.strokeStyle = RED;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(axis - 7, y);
        ctx.lineTo(axis + 7, y);
        ctx.stroke();
        ctx.fillStyle = RED;
        ctx.fillText(`${corner.note.dir}${corner.note.severity}`, axis + 12, y);
      }
    }
    ctx.restore();
  }

  /**
   * The land the stage runs through, drawn the way a printed plate screens
   * it: hatched fields, scrub stipple, contour strokes. Anchored to world
   * coordinates, so it travels with the road instead of crawling.
   */
  private drawGround(cx: number, cy: number, reach: number): void {
    const { ctx } = this;
    const cell = 19;
    ctx.save();
    ctx.lineCap = 'butt';
    for (let gx = Math.floor((cx - reach) / cell); gx <= Math.ceil((cx + reach) / cell); gx++) {
      for (let gy = Math.floor((cy - reach) / cell); gy <= Math.ceil((cy + reach) / cell); gy++) {
        const seed = hash(gx, gy);
        const x = (gx + 0.12 + ((seed & 255) / 255) * 0.76) * cell;
        const y = (gy + 0.12 + (((seed >> 8) & 255) / 255) * 0.76) * cell;
        const angle = (((seed >> 16) & 255) / 255) * Math.PI;
        switch ((seed >> 24) % 7) {
          case 0:
          case 1: {
            // Hatched field.
            ctx.strokeStyle = 'rgba(23, 26, 26, 0.17)';
            ctx.lineWidth = 0.32;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            const rows = 2 + (seed % 3);
            const reach = 5 + (seed % 5);
            for (let i = -rows; i <= rows; i++) {
              ctx.beginPath();
              ctx.moveTo(-reach, i * 2.6);
              ctx.lineTo(reach, i * 2.6);
              ctx.stroke();
            }
            ctx.restore();
            break;
          }
          case 2:
          case 3: {
            // Scrub stipple.
            ctx.fillStyle = 'rgba(23, 26, 26, 0.24)';
            for (let i = 0; i < 7; i++) {
              const px = x + Math.cos(angle * (i + 1) * 2.3) * (2 + i * 0.9);
              const py = y + Math.sin(angle * (i + 1) * 1.7) * (2 + i * 0.9);
              ctx.beginPath();
              ctx.arc(px, py, 0.55, 0, Math.PI * 2);
              ctx.fill();
            }
            break;
          }
          case 4: {
            // Woodland: a block of crowns, drawn as the plate would screen it.
            const crowns = 9 + (seed % 8);
            ctx.fillStyle = 'rgba(23, 26, 26, 0.1)';
            ctx.strokeStyle = 'rgba(23, 26, 26, 0.34)';
            ctx.lineWidth = 0.16;
            for (let i = 0; i < crowns; i++) {
              const px = x + Math.cos(angle * 3 + i * 2.1) * (2 + (i % 5) * 2.2);
              const py = y + Math.sin(angle * 2 + i * 1.6) * (2 + (i % 4) * 2.3);
              ctx.beginPath();
              ctx.arc(px, py, 0.95 + ((seed >> i) & 3) * 0.22, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            }
            break;
          }
          case 5: {
            // A building or two: the stage runs past somebody's yard.
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            const count = 1 + (seed % 3);
            for (let i = 0; i < count; i++) {
              const w = 3.4 + ((seed >> (i * 3)) & 3) * 0.8;
              const h = 2.6 + ((seed >> (i * 2)) & 3) * 0.7;
              const bx = i * 6 - 4;
              const by = ((seed >> i) & 3) - 2;
              ctx.beginPath();
              ctx.rect(bx, by, w, h);
              ctx.fillStyle = 'rgba(23, 26, 26, 0.16)';
              ctx.fill();
              ctx.strokeStyle = 'rgba(23, 26, 26, 0.58)';
              ctx.lineWidth = 0.24;
              ctx.stroke();
              // Ridge line, so a roof reads as a roof and not a filled box.
              ctx.beginPath();
              ctx.moveTo(bx, by + h / 2);
              ctx.lineTo(bx + w, by + h / 2);
              ctx.stroke();
            }
            ctx.restore();
            break;
          }
          default: {
            // Contour stroke.
            ctx.strokeStyle = 'rgba(23, 26, 26, 0.13)';
            ctx.lineWidth = 0.34;
            ctx.beginPath();
            ctx.arc(x, y, 7 + (seed % 13), angle, angle + 0.9 + ((seed >> 5) % 5) * 0.45);
            ctx.stroke();
          }
        }
      }
    }
    ctx.restore();
  }

  /** Crop marks: the plate is a printed page, and says so at its corners. */
  private drawCropMarks(): void {
    const { ctx } = this;
    const inset = 14;
    const arm = 13;
    ctx.save();
    ctx.strokeStyle = 'rgba(23, 26, 26, 0.5)';
    ctx.lineWidth = 1;
    for (const [x, sx] of [
      [inset, 1],
      [this.width - inset, -1],
    ] as const) {
      for (const [y, sy] of [
        [inset, 1],
        [this.height - inset, -1],
      ] as const) {
        ctx.beginPath();
        ctx.moveTo(x + 0.5, y + 0.5);
        ctx.lineTo(x + sx * arm + 0.5, y + 0.5);
        ctx.moveTo(x + 0.5, y + 0.5);
        ctx.lineTo(x + 0.5, y + sy * arm + 0.5);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  private drawSurface(span: RoadPoint[], edge: string, loose: boolean): void {
    const { ctx } = this;
    ctx.beginPath();
    traceEdge(ctx, span, 1, true);
    traceEdge(ctx, span, -1, false);
    ctx.closePath();
    ctx.fillStyle = loose ? ROAD_FILL_LOOSE : ROAD_FILL;
    ctx.fill();

    if (loose) {
      // Gravel, stippled the way a printed plate would screen it.
      ctx.save();
      ctx.clip();
      ctx.fillStyle = 'rgba(23, 26, 26, 0.16)';
      for (let i = 0; i < span.length; i += 2) {
        const p = span[i]!;
        const n = rightNormal(p.h);
        for (let k = -2; k <= 2; k++) {
          const off = (k + ((i * 7919) % 11) / 11 - 0.5) * (p.w * 0.42);
          ctx.fillRect(p.x + n.x * off, p.y + n.y * off, 0.34, 0.34);
        }
      }
      ctx.restore();
    }

    ctx.lineWidth = edge === 'kerb' ? 0.22 : 0.32;
    ctx.strokeStyle = INK;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    traceEdge(ctx, span, 1, true);
    ctx.stroke();
    ctx.beginPath();
    traceEdge(ctx, span, -1, true);
    ctx.stroke();
  }

  private drawEdges(span: RoadPoint[], edge: string): void {
    const { ctx } = this;
    if (edge === 'kerb') {
      for (const side of [1, -1]) {
        for (let i = 0; i < span.length - 1; i += 3) {
          const p = span[i]!;
          const q = span[Math.min(span.length - 1, i + 3)]!;
          const n = rightNormal(p.h);
          const m = rightNormal(q.h);
          ctx.beginPath();
          ctx.moveTo(p.x + n.x * p.w * side, p.y + n.y * p.w * side);
          ctx.lineTo(q.x + m.x * q.w * side, q.y + m.y * q.w * side);
          ctx.lineTo(q.x + m.x * (q.w + 0.75) * side, q.y + m.y * (q.w + 0.75) * side);
          ctx.lineTo(p.x + n.x * (p.w + 0.75) * side, p.y + n.y * (p.w + 0.75) * side);
          ctx.closePath();
          ctx.fillStyle = (i / 3) % 2 === 0 ? RED : STOCK;
          ctx.fill();
        }
      }
      return;
    }

    if (edge === 'stake') {
      ctx.strokeStyle = INK;
      ctx.lineWidth = 0.3;
      for (const side of [1, -1]) {
        for (let i = 0; i < span.length; i += 4) {
          const p = span[i]!;
          const n = rightNormal(p.h);
          const base = p.w + 0.35;
          ctx.beginPath();
          ctx.moveTo(p.x + n.x * base * side, p.y + n.y * base * side);
          ctx.lineTo(p.x + n.x * (base + 1.1) * side, p.y + n.y * (base + 1.1) * side);
          ctx.stroke();
        }
      }
      return;
    }

    // Verge: a soft ruled shoulder outside the casing.
    ctx.strokeStyle = 'rgba(23, 26, 26, 0.24)';
    ctx.lineWidth = 0.16;
    for (const side of [1, -1]) {
      ctx.beginPath();
      for (let i = 0; i < span.length; i++) {
        const p = span[i]!;
        const n = rightNormal(p.h);
        const off = (p.w + 1.3) * side;
        const x = p.x + n.x * off;
        const y = p.y + n.y * off;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  /**
   * What stands at the edge of the road: hedge and poles on the open road,
   * barrier on the circuit, trees and walls on a rally stage. It hugs the
   * road through the tight stuff, which is where a stage feels like it is
   * closing in on you.
   */
  private drawFurniture(span: RoadPoint[], gen: RoadGenerator, edge: string): void {
    const { ctx } = this;
    for (let i = 0; i < span.length; i += 2) {
      const p = span[i]!;
      const n = rightNormal(p.h);
      const tight = Math.min(1, Math.abs(gen.curvatureAt(p.s)) * 55);
      // Close in where the road bends hardest.
      const stand = p.w + (edge === 'kerb' ? 3.2 : 4.4) - tight * 2.4;
      const metres = Math.round(p.s);

      for (const side of [1, -1]) {
        const x = p.x + n.x * stand * side;
        const y = p.y + n.y * stand * side;

        if (edge === 'kerb') {
          if (metres % 6 !== 0) continue;
          ctx.strokeStyle = 'rgba(23, 26, 26, 0.55)';
          ctx.lineWidth = 0.26;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + n.x * 1.1 * side, y + n.y * 1.1 * side);
          ctx.stroke();
          continue;
        }

        if (edge === 'verge') {
          // Hedgerow: a broken line the way a printed field boundary is.
          if (metres % 6 !== 0) continue;
          const along = { x: -n.y, y: n.x };
          ctx.strokeStyle = 'rgba(23, 26, 26, 0.34)';
          ctx.lineWidth = 0.42;
          ctx.beginPath();
          ctx.moveTo(x - along.x * 1.7, y - along.y * 1.7);
          ctx.lineTo(x + along.x * 1.7, y + along.y * 1.7);
          ctx.stroke();
          if (metres % 44 === 0) {
            // Telegraph pole.
            ctx.strokeStyle = 'rgba(23, 26, 26, 0.62)';
            ctx.lineWidth = 0.3;
            const t1 = { x: -n.y, y: n.x };
            ctx.beginPath();
            ctx.moveTo(x - t1.x * 1.4, y - t1.y * 1.4);
            ctx.lineTo(x + t1.x * 1.4, y + t1.y * 1.4);
            ctx.stroke();
          }
          continue;
        }

        // Rally: trees close in, with drystone wall through the tight stuff.
        if (tight > 0.55 && metres % 3 === 0) {
          ctx.strokeStyle = 'rgba(23, 26, 26, 0.8)';
          ctx.lineWidth = 0.75;
          const t1 = { x: -n.y, y: n.x };
          ctx.beginPath();
          ctx.moveTo(x - t1.x * 1.6, y - t1.y * 1.6);
          ctx.lineTo(x + t1.x * 1.6, y + t1.y * 1.6);
          ctx.stroke();
        } else if (metres % 6 === 0) {
          const crown = 1.4 + ((metres / 6) % 3) * 0.5;
          ctx.fillStyle = 'rgba(23, 26, 26, 0.14)';
          ctx.strokeStyle = 'rgba(23, 26, 26, 0.52)';
          ctx.lineWidth = 0.22;
          ctx.beginPath();
          ctx.arc(x, y, crown, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      }
    }
  }

  /** A side road where the notation calls a junction: the caution is a
   *  thing in the world, not a word on the page. */
  private drawJunctions(run: Run, s: number): void {
    const { ctx } = this;
    for (const corner of run.gen.upcomingCorners(s - 120, 5)) {
      if (corner.note.caution !== 'JUNCTION') continue;
      const p = run.gen.pointAt(corner.startS);
      const n = rightNormal(p.h);
      const side = corner.note.dir === 'R' ? -1 : 1;
      const from = { x: p.x + n.x * p.w * side, y: p.y + n.y * p.w * side };
      const to = { x: from.x + n.x * 26 * side, y: from.y + n.y * 26 * side };
      const across = { x: -n.y * (p.w * 0.62), y: n.x * (p.w * 0.62) };
      ctx.beginPath();
      ctx.moveTo(from.x + across.x, from.y + across.y);
      ctx.lineTo(to.x + across.x, to.y + across.y);
      ctx.lineTo(to.x - across.x, to.y - across.y);
      ctx.lineTo(from.x - across.x, from.y - across.y);
      ctx.closePath();
      ctx.fillStyle = ROAD_FILL;
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 0.3;
      ctx.beginPath();
      ctx.moveTo(from.x + across.x, from.y + across.y);
      ctx.lineTo(to.x + across.x, to.y + across.y);
      ctx.moveTo(from.x - across.x, from.y - across.y);
      ctx.lineTo(to.x - across.x, to.y - across.y);
      ctx.stroke();
    }
  }

  private drawCentreLine(span: RoadPoint[]): void {
    const { ctx } = this;
    ctx.strokeStyle = 'rgba(23, 26, 26, 0.55)';
    ctx.lineWidth = 0.22;
    ctx.setLineDash([3, 6]);
    ctx.beginPath();
    for (let i = 0; i < span.length; i++) {
      const p = span[i]!;
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /** Distance ticks off the casing, the way a stage plate is chained. */
  private drawTicks(span: RoadPoint[]): void {
    const { ctx } = this;
    ctx.strokeStyle = 'rgba(23, 26, 26, 0.45)';
    for (const p of span) {
      const metres = Math.round(p.s);
      if (metres % 50 !== 0) continue;
      const major = metres % 250 === 0;
      const n = rightNormal(p.h);
      ctx.lineWidth = major ? 0.3 : 0.18;
      const from = p.w + 0.2;
      const to = p.w + (major ? 2.4 : 1.2);
      for (const side of [1, -1]) {
        ctx.beginPath();
        ctx.moveTo(p.x + n.x * from * side, p.y + n.y * from * side);
        ctx.lineTo(p.x + n.x * to * side, p.y + n.y * to * side);
        ctx.stroke();
      }
    }
  }

  private drawTraffic(run: Run, ppm: number): void {
    const { ctx } = this;
    for (const veh of run.traffic.vehicles) {
      const p = run.gen.pointAt(veh.s);
      const n = rightNormal(p.h);
      const x = p.x + n.x * veh.n;
      const y = p.y + n.y * veh.n;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(p.h);
      ctx.beginPath();
      roundRect(ctx, -veh.length / 2, -veh.width / 2, veh.length, veh.width, 0.5);
      // Oncoming reads solid; overtaking traffic reads hollow.
      ctx.fillStyle = veh.dir < 0 ? INK : '#b0b5b4';
      ctx.fill();
      ctx.lineWidth = 0.2 / Math.max(0.6, ppm / 3);
      ctx.strokeStyle = INK;
      ctx.stroke();
      if (veh.dir > 0) {
        ctx.fillStyle = INK;
        ctx.fillRect(veh.length * 0.04, -veh.width / 2 + 0.28, 0.9, veh.width - 0.56);
      }
      ctx.restore();
    }
  }

  /** Where the car has been shedding speed, laid down like tyre marks. */
  private drawBrakeMarks(gen: RoadGenerator, s: number, n: number): void {
    const { ctx } = this;
    ctx.strokeStyle = 'rgba(23, 26, 26, 0.34)';
    ctx.lineWidth = 0.32;
    for (const offset of [-0.62, 0.62]) {
      ctx.beginPath();
      for (let back = 0; back <= 16; back += 2) {
        const p = gen.pointAt(Math.max(0, s - back));
        const nor = rightNormal(p.h);
        const lat = n + offset;
        const x = p.x + nor.x * lat;
        const y = p.y + nor.y * lat;
        if (back === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  private drawCar(
    offRoad: boolean,
    x: number,
    y: number,
    heading: number,
    slip: number,
    ppm: number,
    stopped: boolean,
  ): void {
    const { ctx } = this;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(heading + slip);

    ctx.shadowColor = 'rgba(23, 26, 26, 0.34)';
    ctx.shadowBlur = 0.9;
    ctx.shadowOffsetY = 0.35 * ppm * 0.12;

    ctx.beginPath();
    roundRect(ctx, -CAR_LENGTH / 2, -CAR_WIDTH / 2, CAR_LENGTH, CAR_WIDTH, 0.55);
    ctx.fillStyle = stopped ? '#878c8b' : RED;
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.lineWidth = 0.22;
    ctx.strokeStyle = INK;
    ctx.stroke();

    // Windscreen slot, so the mark reads as a car and shows which way it points.
    ctx.fillStyle = offRoad ? '#eef1f0' : STOCK;
    ctx.fillRect(CAR_LENGTH * 0.06, -CAR_WIDTH / 2 + 0.3, 0.75, CAR_WIDTH - 0.6);
    ctx.restore();
  }
}

function traceEdge(
  ctx: CanvasRenderingContext2D,
  span: RoadPoint[],
  side: number,
  fresh: boolean,
): void {
  const order = side > 0 ? span : [...span].reverse();
  for (let i = 0; i < order.length; i++) {
    const p = order[i]!;
    const n = rightNormal(p.h);
    const x = p.x + n.x * p.w * side;
    const y = p.y + n.y * p.w * side;
    if (i === 0 && fresh) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
}

/** Stable per-cell noise, so the land is the same land every frame. */
function hash(x: number, y: number): number {
  let h = Math.imul(x, 0x27d4eb2d) ^ Math.imul(y, 0x165667b1);
  h = Math.imul(h ^ (h >>> 15), 0x2545f491);
  return (h ^ (h >>> 13)) >>> 0;
}

function rightNormal(h: number): { x: number; y: number } {
  return { x: -Math.sin(h), y: Math.cos(h) };
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/** One noise tile, made once: the tooth of the paper the plate is printed on. */
function makeGrain(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  const size = 96;
  const tile = document.createElement('canvas');
  tile.width = size;
  tile.height = size;
  const tctx = tile.getContext('2d');
  if (!tctx) return null;
  const image = tctx.createImageData(size, size);
  for (let i = 0; i < image.data.length; i += 4) {
    const v = 150 + Math.random() * 105;
    image.data[i] = v;
    image.data[i + 1] = v;
    image.data[i + 2] = v + 5;
    image.data[i + 3] = 20;
  }
  tctx.putImageData(image, 0, 0);
  return ctx.createPattern(tile, 'repeat');
}
