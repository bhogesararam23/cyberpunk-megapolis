// Aerial Transit Noir — Flow Circuit turns existing high-skill traversal transitions into a compact, local-only mastery loop.
import type { GameSignal } from "./GameSignals";
import type { FlowReadout } from "./types";

const RECORD_KEY = "cyberpunk-megapolis.flow-circuit.v1";
const TARGET_STEPS = 4;
const WINDOW_SECONDS = 4.6;

type FlowAction = "WEB LINK" | "RELEASE" | "VECTOR ZIP" | "WALL KICK";
type FlowEventType = "advanced" | "completed" | "expired";

interface FlowRecord {
  best: number;
  completed: number;
}

export interface FlowEvent {
  type: FlowEventType;
  readout: FlowReadout;
}

const labels: Partial<Record<Extract<GameSignal, { type: "traversal" }>["action"], FlowAction>> = {
  "web-attached": "WEB LINK",
  "web-released": "RELEASE",
  "zip-started": "VECTOR ZIP",
  "wall-kick": "WALL KICK",
};

export class FlowCircuitManager {
  private readonly record: FlowRecord;
  private state: FlowReadout["state"] = "idle";
  private window = 0;
  private steps = 0;
  private lastAction = "STANDBY";
  private readonly actions = new Set<FlowAction>();

  public constructor() {
    this.record = this.load();
  }

  /** Consumes existing typed traversal signals only; physics and player input remain untouched. */
  public recordAction(signal: GameSignal): FlowEvent | null {
    if (signal.type !== "traversal") return null;
    const action = labels[signal.action];
    if (!action || signal.speed < 8) return null;

    this.window = WINDOW_SECONDS;
    if (this.state === "complete") this.resetActive();
    if (this.actions.has(action)) {
      this.lastAction = action;
      return null;
    }

    this.actions.add(action);
    this.steps = this.actions.size;
    this.lastAction = action;
    this.state = "building";
    if (this.steps < TARGET_STEPS) return { type: "advanced", readout: this.readout() };

    this.state = "complete";
    this.record.completed += 1;
    this.record.best = Math.max(this.record.best, this.steps);
    this.save();
    return { type: "completed", readout: this.readout() };
  }

  /** Expires visual progress without allocating on ordinary simulation frames. */
  public update(delta: number): FlowEvent | null {
    if (this.state === "idle") return null;
    this.window = Math.max(0, this.window - delta);
    if (this.window > 0) return null;
    const previous = this.readout();
    this.resetActive();
    return { type: "expired", readout: previous };
  }

  public resetRun(): void {
    this.resetActive();
  }

  public readout(): FlowReadout {
    return {
      state: this.state,
      steps: this.steps,
      target: TARGET_STEPS,
      window: Math.round(this.window * 10) / 10,
      lastAction: this.lastAction,
      best: this.record.best,
      completed: this.record.completed,
    };
  }

  private resetActive(): void {
    this.state = "idle";
    this.window = 0;
    this.steps = 0;
    this.lastAction = "STANDBY";
    this.actions.clear();
  }

  private load(): FlowRecord {
    try {
      const raw = globalThis.window?.localStorage?.getItem(RECORD_KEY);
      if (!raw) return { best: 0, completed: 0 };
      const parsed = JSON.parse(raw) as Partial<FlowRecord>;
      return {
        best: Number.isFinite(parsed.best) ? Math.max(0, Math.floor(parsed.best as number)) : 0,
        completed: Number.isFinite(parsed.completed) ? Math.max(0, Math.floor(parsed.completed as number)) : 0,
      };
    } catch {
      return { best: 0, completed: 0 };
    }
  }

  private save(): void {
    try {
      globalThis.window?.localStorage?.setItem(RECORD_KEY, JSON.stringify(this.record));
    } catch {
      // Local records are an enhancement; private-mode storage cannot block traversal.
    }
  }
}
