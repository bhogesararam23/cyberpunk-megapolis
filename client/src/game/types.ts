// Aerial Transit Noir — shared gameplay vocabulary keeps Signal Cyan actions explicit.
import type { Vector3 } from "@babylonjs/core";
import type { GameplaySettings } from "./SettingsStore";

export type GamePhase = "loading" | "selection" | "transition" | "playing" | "paused" | "recovery" | "error";
export type TraversalState = "idle" | "run" | "sprint" | "jump" | "fall" | "swing" | "zip" | "wall-run" | "dive" | "landing" | "recovery";
export type QualityPreset = "high" | "medium" | "low";
export type CharacterId = "vanta" | "kite";
export type WeatherMode = "clear" | "rain" | "storm";
export type ChallengeState = "idle" | "active" | "complete";
export type DistrictId = "commercial-arcade" | "foundry" | "vertical-market" | "civic-core";

export interface Aabb {
  min: Vector3;
  max: Vector3;
}

export interface Anchor {
  id: string;
  position: Vector3;
  kind: "roof" | "rail" | "bridge" | "spire";
}

export interface ChallengeReadout {
  route: string;
  state: ChallengeState;
  node: number;
  total: number;
  target: string;
  elapsed: number;
  best: number | null;
  medal: "signal" | "vector" | "kinetic" | null;
}

export interface ProgressReadout {
  discoveries: number;
  discoveryTotal: number;
  credits: number;
  distance: number;
  record: number;
  nextLandmark: string;
  district: string;
}

export interface SectorReadout {
  district: DistrictId;
  districtLabel: string;
  active: DistrictId[];
  predicted: DistrictId[];
}

export interface DiagnosticReadout {
  fps: number;
  frameMs: number;
  drawCalls: number;
  triangles: number;
  activeMeshes: number;
  activeActors: number;
  activeSectors: number;
  district: DistrictId;
  traversal: TraversalState;
  speed: number;
  target: string;
}

export interface GameStatus {
  phase: GamePhase;
  character: CharacterId;
  characterTrait: string;
  traversal: TraversalState;
  speed: number;
  momentum: number;
  chain: number;
  target: string;
  targetDistance: number;
  anchorCue: "scanning" | "ready" | "boost";
  quality: QualityPreset;
  fps: number;
  notification: string;
  menuHint: string;
  weather: WeatherMode;
  showcase: boolean;
  challenge: ChallengeReadout;
  progression: ProgressReadout;
  settings: GameplaySettings;
  sectors: SectorReadout;
  diagnostics: DiagnosticReadout;
  diagnosticsVisible: boolean;
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
