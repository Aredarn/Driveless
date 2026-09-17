/**
 * Steering, and nothing else. One hand in portrait cannot afford a second
 * control, so the throttle belongs to the distance ramp and both input
 * surfaces carry exactly the same verb.
 */
export class Input {
  steer = 0;
  private target = 0;
  private keyLeft = false;
  private keyRight = false;
  private pointers = new Map<number, number>();

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
    const keyed = (this.keyRight ? 1 : 0) - (this.keyLeft ? 1 : 0);
    const pointed = this.pointerSteer();
    this.target = clamp(keyed + pointed, -1, 1);
    this.steer += (this.target - this.steer) * (1 - Math.exp(-dt / 0.085));
  }

  private pointerSteer(): number {
    if (this.pointers.size === 0) return 0;
    const mid = this.surface.getBoundingClientRect();
    let sum = 0;
    for (const x of this.pointers.values()) {
      sum += x < mid.left + mid.width / 2 ? -1 : 1;
    }
    return clamp(sum, -1, 1);
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    if (key === 'arrowleft' || key === 'a') this.keyLeft = true;
    else if (key === 'arrowright' || key === 'd') this.keyRight = true;
    else if (key === 'tab' || key === 'shift') return;
    if (key === 'arrowleft' || key === 'arrowright' || key === ' ') event.preventDefault();
    this.press();
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    const key = event.key.toLowerCase();
    if (key === 'arrowleft' || key === 'a') this.keyLeft = false;
    if (key === 'arrowright' || key === 'd') this.keyRight = false;
  };

  private onPointerDown = (event: PointerEvent): void => {
    this.pointers.set(event.pointerId, event.clientX);
    this.press();
  };

  private onPointerUp = (event: PointerEvent): void => {
    this.pointers.delete(event.pointerId);
  };

  private release = (): void => {
    this.keyLeft = false;
    this.keyRight = false;
    this.pointers.clear();
  };

  private press(): void {
    this.onPress();
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
