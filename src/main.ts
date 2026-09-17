import './styles.css';
import { Input } from './game/input';
import { Run } from './game/run';
import { STAGES, STAGE_ORDER } from './game/stages';
import type { StageId } from './game/types';
import { Plate } from './render/plate';
import { Book } from './ui/book';

const need = <T extends Element>(selector: string): T => {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`Missing element: ${selector}`);
  return el;
};

const canvas = need<HTMLCanvasElement>('#plate');
const plateEl = need<HTMLElement>('.plate');

const plate = new Plate(canvas);
const run = new Run();
const book = new Book({
  stageName: need('#stage-name'),
  stageChip: need('#stage-chip'),
  distance: need('#distance'),
  speed: need('#speed'),
  speedLine: need('#speed-line'),
  slip: need('#slip'),
  best: need('#best'),
  damage: need('#damage'),
  notes: need('#notes'),
  dividers: need('#dividers'),
  hint: need('#hint'),
  call: need('#call'),
});

let endedAt = 0;

function startStage(id: StageId): void {
  run.start(id);
  book.setStage(STAGES[id]);
  book.showDividers(false);
}

for (const button of document.querySelectorAll<HTMLButtonElement>('.tab')) {
  button.addEventListener('click', () => {
    const id = button.dataset.stage as StageId | undefined;
    if (id) startStage(id);
  });
}

// A stage is one keystroke away, so a keyboard player never has to tab.
window.addEventListener('keydown', (event) => {
  const index = Number(event.key) - 1;
  if (run.phase === 'choosing' && index >= 0 && index < STAGE_ORDER.length) {
    startStage(STAGE_ORDER[index]!);
  }
});

const input = new Input(plateEl, () => {
  // The crash is not a menu: any press puts the same stage back under the car.
  if (run.phase === 'ended' && performance.now() - endedAt > 550) {
    run.restart();
  }
});

const resize = () => plate.resize();
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', resize);
if ('ResizeObserver' in window) new ResizeObserver(resize).observe(plateEl);

book.showDividers(true);

let last = performance.now();
let wasEnded = false;

function frame(now: number): void {
  const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
  last = now;

  input.update(dt);
  run.update(dt, input.steer, input.brake);

  const ended = run.phase === 'ended';
  if (ended && !wasEnded) endedAt = now;
  wasEnded = ended;

  plate.draw(run, dt);
  book.frame(run);

  requestAnimationFrame(frame);
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) last = performance.now();
});

if (import.meta.env.DEV) {
  // Development only, and stripped from the production bundle: lets a
  // headless browser read the run it is driving.
  (window as unknown as { __driveless?: unknown }).__driveless = { run };
}

requestAnimationFrame(frame);
