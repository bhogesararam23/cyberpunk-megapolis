// Aerial Transit Noir — shared gameplay vocabulary keeps Signal Cyan actions explicit.
import type { Vector3 } from "@babylonjs/core";

export type GamePhase = "loading" | "selection" | "transition" | "playing" | "paused" | "recovery" | "error";
export type TraversalState = "idle" | "run" | "sprint" | "jump" | "fall" | "swing" | "zip" | "wall-run" | "dive" | "landing" | "recovery";
export type QualityPreset = "high" | "medium" | "low";
export type CharacterId = "vanta" | "kite";

export interface Aabb {
  min: Vector3;
  max: Vector3;
}

export interface Anchor {
  id: string;
  position: Vector3;
  kind: "roof" | "rail" | "bridge" | "spire";
}

export interface GameStatus {
  phase: GamePhase;
  character: CharacterId;
  traversal: TraversalState;
  speed: number;
  momentum: number;
  target: string;
  targetDistance: number;
  quality: QualityPreset;
  fps: number;
  notification: string;
  menuHint: string;
}

export interface InputSnapshot {
  moveX: number;
  moveY: number;
  lookX: number;
  lookY: number;
  sprint: boolean;
  swingHeld: boolean;
  wallRunHeld: boolean;
  diveHeld: boolean;
  jumpPressed: boolean;
  swingPressed: boolean;
  zipPressed: boolean;
  pausePressed: boolean;
  restartPressed: boolean;
  enterPressed: boolean;
}
