// Aerial Transit Noir — semantic actions centralize all movement and phase-safe input.
import type { InputSnapshot } from "./types";

export class InputManager {
  private readonly held = new Set<string>();
  private readonly pressed = new Set<string>();
  private lookX = 0;
  private lookY = 0;
  private readonly onKeyDown = (event: KeyboardEvent) => {
    const action = this.actionForKey(event.code);
    if (!action) return;
    if (["jump", "pause", "restart", "enter"].includes(action) && !event.repeat) this.pressed.add(action);
    this.held.add(action);
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) event.preventDefault();
  };
  private readonly onKeyUp = (event: KeyboardEvent) => {
    const action = this.actionForKey(event.code);
    if (action) this.held.delete(action);
  };
  private readonly onPointerDown = (event: PointerEvent) => {
    if (event.button === 0) {
      this.held.add("swing");
      this.pressed.add("swing");
    }
    if (event.button === 2) {
      this.held.add("zip");
      this.pressed.add("zip");
    }
  };
  private readonly onPointerUp = (event: PointerEvent) => {
    if (event.button === 0) this.held.delete("swing");
    if (event.button === 2) this.held.delete("zip");
  };
  private readonly onPointerMove = (event: PointerEvent) => {
    if (document.pointerLockElement === this.canvas) {
      this.lookX += event.movementX;
      this.lookY += event.movementY;
    }
  };
  private readonly onContextMenu = (event: MouseEvent) => event.preventDefault();

  public constructor(private readonly canvas: HTMLCanvasElement) {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    canvas.addEventListener("pointerdown", this.onPointerDown);
    window.addEventListener("pointerup", this.onPointerUp);
    window.addEventListener("pointermove", this.onPointerMove);
    canvas.addEventListener("contextmenu", this.onContextMenu);
  }

  public snapshot(): InputSnapshot {
    return {
      moveX: (this.held.has("right") ? 1 : 0) - (this.held.has("left") ? 1 : 0),
      moveY: (this.held.has("forward") ? 1 : 0) - (this.held.has("back") ? 1 : 0),
      lookX: this.lookX,
      lookY: this.lookY,
      sprint: this.held.has("sprint"),
      swingHeld: this.held.has("swing"),
      wallRunHeld: this.held.has("wallrun"),
      diveHeld: this.held.has("dive"),
      jumpPressed: this.pressed.has("jump"),
      swingPressed: this.pressed.has("swing"),
      zipPressed: this.pressed.has("zip"),
      pausePressed: this.pressed.has("pause"),
      restartPressed: this.pressed.has("restart"),
      enterPressed: this.pressed.has("enter"),
    };
  }

  public endFrame(): void {
    this.pressed.clear();
    this.lookX = 0;
    this.lookY = 0;
  }

  public capturePointer(): void {
    this.canvas.focus();
    try {
      const request = (this.canvas.requestPointerLock as (() => unknown) | undefined)?.call(this.canvas);
      if (request && typeof (request as Promise<void>).catch === "function") void (request as Promise<void>).catch(() => undefined);
    } catch {
      // Pointer lock is optional: mouse and keyboard traversal remain available when the host denies it.
    }
  }

  public dispose(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    window.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("pointermove", this.onPointerMove);
    this.canvas.removeEventListener("contextmenu", this.onContextMenu);
    if (document.pointerLockElement === this.canvas) document.exitPointerLock();
  }

  private actionForKey(code: string): string | null {
    const actions: Record<string, string> = {
      KeyW: "forward", KeyS: "back", KeyA: "left", KeyD: "right",
      ShiftLeft: "sprint", ShiftRight: "sprint", Space: "jump", KeyQ: "wallrun",
      KeyE: "dive", Escape: "pause", KeyR: "restart", Enter: "enter",
    };
    return actions[code] ?? null;
  }
}
