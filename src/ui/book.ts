import { noteCode, noteLabel } from '../game/notes';
import type { Run } from '../game/run';
import type { Stage } from '../game/stages';
import type { Segment } from '../game/types';
import { MAX_HITS } from '../game/tuning';
import { tulip } from '../render/tulip';

export interface BookRefs {
  stageName: HTMLElement;
  stageChip: HTMLElement;
  distance: HTMLElement;
  speed: HTMLElement;
  speedLine: HTMLElement;
  best: HTMLElement;
  damage: HTMLElement;
  notes: HTMLElement;
  dividers: HTMLElement;
  hint: HTMLElement;
  call: HTMLElement;
}

/**
 * The book: real text on the page, not a layer over the game. It is the
 * accessible reading of the run as well as its most prominent one.
 */
export class Book {
  private marks: HTMLElement[] = [];
  private rows = new Map<number, HTMLLIElement>();
  private shownHits = -1;
  private shownSpeed = -1;
  private token = -1;

  constructor(private readonly refs: BookRefs) {
    for (let i = 0; i < MAX_HITS; i++) {
      const mark = document.createElement('span');
      mark.className = 'damage__mark';
      this.marks.push(mark);
      refs.damage.append(mark);
    }
  }

  setStage(stage: Stage): void {
    this.refs.stageName.textContent = stage.surface;
    document.documentElement.style.setProperty('--stage', stage.tint);
  }

  showDividers(show: boolean): void {
    this.refs.dividers.hidden = !show;
  }

  frame(run: Run): void {
    const { refs } = this;

    // Segment indices restart with every run, so rows cached against the
    // last one would show notation for a road that no longer exists.
    if (run.token !== this.token) {
      this.token = run.token;
      this.rows.clear();
      this.shownHits = -1;
      this.shownSpeed = -1;
      refs.notes.replaceChildren();
    }

    refs.distance.textContent = (run.distance / 1000).toFixed(2);

    // Speed is a reading now, not a constant: the car brakes for what the
    // book is calling, so the figure falls into a corner and climbs out.
    const kmh = Math.round(run.car.v * 3.6);
    if (kmh !== this.shownSpeed) {
      this.shownSpeed = kmh;
      refs.speed.textContent = String(kmh);
    }
    refs.speedLine.classList.toggle(
      'book__speed--braking',
      run.car.braking && run.phase === 'driving',
    );

    const best = run.bestForStage;
    refs.best.textContent = best > 0 ? `Best ${(best / 1000).toFixed(2)} km` : '';

    const hits = run.car.hits;
    if (hits !== this.shownHits) {
      this.shownHits = hits;
      this.marks.forEach((mark, i) => {
        mark.classList.toggle('damage__mark--struck', i < hits);
      });
      refs.damage.setAttribute(
        'aria-label',
        hits === 0 ? 'Car undamaged' : `${hits} of ${MAX_HITS} hits taken`,
      );
    }

    this.renderNotes(run);
    this.renderCall(run);
    this.renderHint(run);
  }

  private renderNotes(run: Run): void {
    const corners = run.corners();
    const next = new Map<number, HTMLLIElement>();
    const ordered: HTMLLIElement[] = [];

    corners.forEach((corner, position) => {
      let row = this.rows.get(corner.index);
      if (!row) {
        row = this.buildRow(corner);
        // Only a corner arriving behind the ones already on the page is
        // written in; the first fill of an empty page is not an event.
        if (this.rows.size > 0) row.classList.add('note--written');
      }
      row.classList.toggle('note--next', position === 0);
      const run_ = row.querySelector('.note__run');
      const metres = run.distanceTo(corner);
      if (run_) run_.textContent = metres < 12 ? 'NOW' : `${Math.round(metres)} m`;
      next.set(corner.index, row);
      ordered.push(row);
    });

    this.rows = next;
    const current = Array.from(this.refs.notes.children);
    const same =
      current.length === ordered.length && ordered.every((row, i) => current[i] === row);
    if (!same) this.refs.notes.replaceChildren(...ordered);
  }

  private buildRow(corner: Segment): HTMLLIElement {
    const row = document.createElement('li');
    row.className = 'note';

    row.append(tulip(corner.note));

    const code = document.createElement('p');
    code.className = 'note__code';
    const severity = document.createElement('b');
    severity.textContent = String(corner.note.severity);
    code.append(corner.note.dir, severity);
    if (corner.note.caution) {
      const caution = document.createElement('span');
      caution.className = 'note__caution';
      caution.textContent = corner.note.caution;
      code.append(caution);
    }
    code.setAttribute('aria-label', noteLabel(corner.note));
    row.append(code);

    const distance = document.createElement('p');
    distance.className = 'note__run';
    row.append(distance);

    return row;
  }

  private renderCall(run: Run): void {
    const { call } = this.refs;
    if (run.phase === 'ended') {
      if (call.dataset.state !== 'stop') {
        call.dataset.state = 'stop';
        call.replaceChildren(text('b', 'STOP'), text('span', 'Any key runs it again'));
      }
      return;
    }
    if (run.phase === 'choosing') {
      if (call.dataset.state !== 'idle') {
        call.dataset.state = 'idle';
        call.replaceChildren();
      }
      return;
    }

    const corner = run.corners()[0];
    const seconds = corner ? run.distanceTo(corner) / Math.max(8, run.car.v) : Infinity;
    if (!corner || seconds > 2.6) {
      if (call.dataset.state !== 'quiet') {
        call.dataset.state = 'quiet';
        call.replaceChildren();
      }
      return;
    }

    const key = `call-${corner.index}`;
    if (call.dataset.state === key) return;
    call.dataset.state = key;
    call.classList.toggle('plate__call--hard', corner.note.severity <= 2);
    call.replaceChildren(
      text('b', noteCode(corner.note)),
      text('span', corner.note.caution ?? `${corner.note.runM} m`),
    );
  }

  private renderHint(run: Run): void {
    const { hint } = this.refs;
    let copy = '';
    if (run.phase === 'choosing') {
      copy = 'Steer with <b>←</b> <b>→</b>, or either side of the plate.';
    } else if (run.phase === 'ended') {
      copy = 'The book stays open at this stage.';
    } else if (run.distance < 700) {
      copy = 'The book calls the corner before you can see it.';
    }
    if (hint.dataset.copy !== copy) {
      hint.dataset.copy = copy;
      hint.innerHTML = copy;
    }
  }
}

function text(tag: string, content: string): HTMLElement {
  const el = document.createElement(tag);
  el.textContent = content;
  return el;
}
