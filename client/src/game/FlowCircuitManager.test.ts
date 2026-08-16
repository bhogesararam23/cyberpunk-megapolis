import { afterEach, describe, expect, it } from "vitest";
import { FlowCircuitManager } from "./FlowCircuitManager";

const originalWindow = globalThis.window;

function installStorage() {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { localStorage: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) } },
  });
}

afterEach(() => {
  Object.defineProperty(globalThis, "window", { configurable: true, value: originalWindow });
});

function traversal(action: "web-attached" | "web-released" | "zip-started" | "wall-kick", chain: number) {
  return { type: "traversal" as const, action, state: "swing" as const, speed: 28, chain };
}

describe("Flow Circuit mastery loop", () => {
  it("requires distinct existing traversal actions before completing a persistent circuit", () => {
    const flow = new FlowCircuitManager();
    flow.recordAction(traversal("web-attached", 1));
    flow.recordAction(traversal("web-released", 2));
    flow.recordAction(traversal("zip-started", 3));
    const completed = flow.recordAction(traversal("wall-kick", 4));

    expect(completed?.type).toBe("completed");
    expect(flow.readout()).toMatchObject({ state: "complete", steps: 4, target: 4, best: 4, completed: 1, lastAction: "WALL KICK" });
  });

  it("does not inflate a circuit with repeated actions and cleanly expires incomplete flow", () => {
    const flow = new FlowCircuitManager();
    flow.recordAction(traversal("web-attached", 1));
    flow.recordAction(traversal("web-attached", 2));
    flow.recordAction(traversal("web-released", 3));

    expect(flow.readout().steps).toBe(2);
    expect(flow.update(4.7)?.type).toBe("expired");
    expect(flow.readout()).toMatchObject({ state: "idle", steps: 0, window: 0, lastAction: "STANDBY" });
  });

  it("restores the best circuit and completed count from local browser storage", () => {
    installStorage();
    const flow = new FlowCircuitManager();
    flow.recordAction(traversal("web-attached", 1));
    flow.recordAction(traversal("web-released", 2));
    flow.recordAction(traversal("zip-started", 3));
    flow.recordAction(traversal("wall-kick", 4));

    expect(new FlowCircuitManager().readout()).toMatchObject({ state: "idle", best: 4, completed: 1 });
  });
});
