/**
 * Two verbs: steer, and pull the handbrake. The throttle still belongs to the
 * road. On a keyboard the brake is the down arrow, S, or space; on a touch
 * screen it is the band across the bottom of the plate, so a thumb can hold
 * it while the same thumb — or the other one — steers above it.
 */
/** Share of the plate, measured from the bottom, that brakes when touched. */
const BRAKE_BAND = 0.26;

export class Input {
  steer = 0;
  brake = false;
  private target = 0;
  private keyLeft = false;
  private keyRight = false;
  private keyBrake = false;
  private pointers = new Map<number, { x: number; y: number }>();

  constructor(
    private readonly surface: HTMLElement,
    private readonly onPress: () => void,
  ) {
    window.addEventListener('keydown', this.onKeyDown, { passive: false });
    window.addEventListener('keyup', this.onKeyUp);
    surface.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerUp);
    window.addEventListener('blur', this.release);
  }

  update(dt: number): void {
    const rect = this.surface.getBoundingClientRect();
    const brakeLine = rect.bottom - rect.height * BRAKE_BAND;

    let pointed = 0;
    let touchBrake = false;
    for (const p of this.pointers.values()) {
      if (p.y >= brakeLine) touchBrake = true;
      else pointed += p.x < rect.left + rect.width / 2 ? -1 : 1;
    }

    const keyed = (this.keyRight ? 1 : 0) - (this.keyLeft ? 1 : 0);
    this.target = clamp(keyed + clamp(pointed, -1, 1), -1, 1);
    this.steer += (this.target - this.steer) * (1 - Math.exp(-dt / 0.085));
    this.brake = this.keyBrake || touchBrake;
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    if (key === 'arrowleft' || key === 'a') this.keyLeft = true;
    else if (key === 'arrowright' || key === 'd') this.keyRight = true;
    else if (key === 'arrowdown' || key === 's' || key === ' ') this.keyBrake = true;
    else if (key === 'tab' || key === 'shift') return;
    if (key === 'arrowleft' || key === 'arrowright' || key === 'arrowdown' || key === ' ') {
      event.preventDefault();
    }
    this.press();
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    const key = event.key.toLowerCase();
    if (key === 'arrowleft' || key === 'a') this.keyLeft = false;
    if (key === 'arrowright' || key === 'd') this.keyRight = false;
    if (key === 'arrowdown' || key === 's' || key === ' ') this.keyBrake = false;
  };

  private onPointerDown = (event: PointerEvent): void => {
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    this.press();
  };

  private onPointerUp = (event: PointerEvent): void => {
    this.pointers.delete(event.pointerId);
  };

  private release = (): void => {
    this.keyLeft = false;
    this.keyRight = false;
    this.keyBrake = false;
    this.brake = false;
    this.pointers.clear();
  };

  private press(): void {
    this.onPress();
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
