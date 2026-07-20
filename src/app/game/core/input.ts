export class InputState {
  readonly keys = new Set<string>();
  mouseX = 0;
  mouseY = 0;
  mouseDown = false;

  attach(target: HTMLElement): () => void {
    const onKeyDown = (e: KeyboardEvent) => {
      this.keys.add(e.code);
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => this.keys.delete(e.code);
    const onBlur = () => {
      this.keys.clear();
      this.mouseDown = false;
    };
    const onMove = (e: PointerEvent) => {
      const rect = target.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
    };
    const onDown = (e: PointerEvent) => {
      if (e.button === 0) this.mouseDown = true;
    };
    const onUp = (e: PointerEvent) => {
      if (e.button === 0) this.mouseDown = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    target.addEventListener('pointermove', onMove);
    target.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
    };
  }

  axis(): { x: number; y: number } {
    let x = 0;
    let y = 0;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y += 1;
    const len = Math.hypot(x, y);
    if (len > 0) {
      x /= len;
      y /= len;
    }
    return { x, y };
  }
}
