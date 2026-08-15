// Aerial Transit Noir — VNext signals decouple movement outcomes from reactive presentation systems.
import type { CharacterId, DistrictId, TraversalState, WeatherMode } from "./types";
import type { CityEventKind } from "./CityEvents";

export type GameSignal =
  | { type: "traversal"; action: "target-acquired" | "web-attached" | "web-released" | "zip-started" | "wall-kick" | "landed" | "chain"; state: TraversalState; speed: number; chain: number }
  | { type: "district"; district: DistrictId; entering: boolean }
  | { type: "environment"; weather: WeatherMode; intensity: number }
  | { type: "operator"; character: CharacterId }
  | { type: "world-event"; id: CityEventKind | null; district: DistrictId | null; label: string; intensity: number };

export type GameSignalListener = (signal: GameSignal) => void;

export class GameSignalBus {
  private readonly listeners = new Set<GameSignalListener>();

  public subscribe(listener: GameSignalListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public emit(signal: GameSignal): void {
    Array.from(this.listeners).forEach((listener) => listener(signal));
  }

  public clear(): void {
    this.listeners.clear();
  }
}
