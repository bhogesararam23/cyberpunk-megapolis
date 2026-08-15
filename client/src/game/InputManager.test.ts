import { afterEach, describe, expect, it } from "vitest";
import { InputManager } from "./InputManager";

const originalWindow = globalThis.window;
const originalDocument = globalThis.document;

function installDomStubs() {
  const windowTarget = new EventTarget();
  const documentTarget = new EventTarget();
  const canvasTarget = new EventTarget() as EventTarget & { focus: () => void; requestPointerLock: () => void };
  canvasTarget.focus = () => undefined;
  canvasTarget.requestPointerLock = () => undefined;
  Object.defineProperty(globalThis, "window", { configurable: true, value: windowTarget });
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: Object.assign(documentTarget, { pointerLockElement: null, visibilityState: "visible", exitPointerLock: () => undefined }),
  });
  return { windowTarget, documentTarget, canvas: canvasTarget as unknown as HTMLCanvasElement };
}

afterEach(() => {
  Object.defineProperty(globalThis, "window", { configurable: true, value: originalWindow });
  Object.defineProperty(globalThis, "document", { configurable: true, value: originalDocument });
});

describe("input focus recovery", () => {
  it("clears held movement and traversal actions when the host loses focus", () => {
    const { windowTarget, canvas } = installDomStubs();
    const input = new InputManager(canvas);
    const internal = input as unknown as {
      onKeyDown: (event: KeyboardEvent) => void;
      onPointerDown: (event: PointerEvent) => void;
    };
    internal.onKeyDown({ code: "KeyW", repeat: false, preventDefault: () => undefined } as unknown as KeyboardEvent);
    internal.onPointerDown({ button: 0 } as PointerEvent);

    expect(input.snapshot().moveY).toBe(1);
    expect(input.snapshot().swingHeld).toBe(true);

    windowTarget.dispatchEvent(new Event("blur"));

    const recovered = input.snapshot();
    expect(recovered.moveY).toBe(0);
    expect(recovered.swingHeld).toBe(false);
    expect(recovered.swingPressed).toBe(false);
    input.dispose();
  });
});
