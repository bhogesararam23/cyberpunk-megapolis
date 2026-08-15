// Aerial Transit Noir — objectives turn real city coordinates and traversal skill into repeatable local contracts.
import { Color3, Mesh, MeshBuilder, Scene, StandardMaterial, TransformNode, Vector3 } from "@babylonjs/core";
import type { CityBuilder } from "./CityBuilder";
import type { CityNavigationNode, ObjectiveReadout, TraversalState } from "./types";

const RECORD_KEY = "cyberpunk-megapolis.objective-records.v1";
type ObjectiveKind = "route" | "ascent" | "arrival";
type ObjectiveState = "idle" | "active";

interface ObjectiveDefinition {
  id: string;
  label: string;
  kind: ObjectiveKind;
  startId: string;
  targetId: string;
  instruction: string;
  reward: number;
  limit: number;
  ascent?: number;
  requiresDiscovery?: string;
}

interface ObjectiveRuntime extends ObjectiveDefinition {
  start: CityNavigationNode;
  target: CityNavigationNode;
  startMarker: Mesh;
  targetMarker: Mesh;
}

export interface ObjectiveEvent {
  type: "started" | "completed" | "failed";
  id: string;
  label: string;
  kind: ObjectiveKind;
  reward: number;
  elapsed: number;
}

export class ObjectiveManager {
  private readonly root: TransformNode;
  private readonly activeMaterial: StandardMaterial;
  private readonly idleMaterial: StandardMaterial;
  private readonly targetMaterial: StandardMaterial;
  private readonly completed = new Set<string>();
  private readonly bests: Record<string, number>;
  private readonly objectives: ObjectiveRuntime[];
  private current = 0;
  private state: ObjectiveState = "idle";
  private elapsed = 0;
  private peakY = 0;
  private startDistance = 1;
  private readonly available = new Set<string>();

  public constructor(scene: Scene, city: CityBuilder, completedIds: string[]) {
    this.root = new TransformNode("objective-root", scene);
    this.activeMaterial = this.material("objective-active", "#133a45", "#43f6e8");
    this.idleMaterial = this.material("objective-idle", "#21313a", "#315c62");
    this.targetMaterial = this.material("objective-target", "#533716", "#f6a84d");
    completedIds.forEach((id) => this.completed.add(id));
    this.bests = this.loadRecords();
    const nodes = new Map(city.getNavigationNodes().map((node) => [node.id, node]));
    const definitions: ObjectiveDefinition[] = [
      { id: "skyrail-relay", label: "SKYRAIL RELAY", kind: "route", startId: "route-skyrail", targetId: "civic-crown", instruction: "ENTER THE SKYRAIL CIRCUIT // CLEAR ALL NODES", reward: 180, limit: 58 },
      { id: "market-ascent", label: "MARKET ASCENT", kind: "ascent", startId: "market-ascent", targetId: "market-spine", instruction: "CLIMB THE VERTICAL MARKET // HOLD THE HIGH LINE", reward: 150, limit: 40, ascent: 25, requiresDiscovery: "market-spine" },
      { id: "foundry-vector", label: "FOUNDRY VECTOR", kind: "arrival", startId: "route-foundry", targetId: "foundry-breath", instruction: "CUT THE FOUNDRY LINE // HIT THE VENT ARRAY", reward: 140, limit: 34, requiresDiscovery: "foundry-breath" },
    ];
    this.objectives = definitions.flatMap((definition) => {
      const start = nodes.get(definition.startId);
      const target = nodes.get(definition.targetId);
      if (!start || !target) return [];
      return [{ ...definition, start, target, startMarker: this.marker(`objective-start-${definition.id}`, start.position, false), targetMarker: this.marker(`objective-target-${definition.id}`, target.position, true) }];
    });
    this.syncUnlocks([]);
    this.refreshMarkers();
  }

  public update(position: Vector3, _traversal: TraversalState, _chain: number, discoveries: string[], delta: number): ObjectiveEvent | null {
    this.animate(delta);
    this.syncUnlocks(discoveries);
    const objective = this.objectives[this.current];
    if (!objective || !this.isAvailable(objective) || !this.isFinite(position)) return null;
    if (this.state === "idle") {
      if (Vector3.DistanceSquared(position, objective.start.position) > 8 * 8) return null;
      this.state = "active";
      this.elapsed = 0;
      this.peakY = position.y;
      this.startDistance = Math.max(1, Vector3.Distance(position, objective.target.position));
      this.refreshMarkers();
      return { type: "started", id: objective.id, label: objective.label, kind: objective.kind, reward: objective.reward, elapsed: 0 };
    }
    this.elapsed += delta;
    this.peakY = Math.max(this.peakY, position.y);
    if (this.elapsed > objective.limit) {
      this.state = "idle";
      this.elapsed = 0;
      this.refreshMarkers();
      return { type: "failed", id: objective.id, label: objective.label, kind: objective.kind, reward: objective.reward, elapsed: objective.limit };
    }
    if (objective.kind === "route") return null;
    const reachedTarget = Vector3.DistanceSquared(position, objective.target.position) < 9 * 9;
    const climbed = objective.kind !== "ascent" || this.peakY - objective.start.position.y >= (objective.ascent ?? 0);
    if (!reachedTarget || !climbed) return null;
    return this.completeCurrent();
  }

  public completeRoute(): ObjectiveEvent | null {
    const objective = this.objectives[this.current];
    return objective?.kind === "route" && this.state === "active" ? this.completeCurrent() : null;
  }

  public resetRun(): void {
    this.state = "idle";
    this.elapsed = 0;
    this.peakY = 0;
    this.refreshMarkers();
  }

  /** Charts unlock activity beacons only once and keep existing completed contracts out of the active queue. */
  public syncUnlocks(discoveries: string[]): string | null {
    const newlyUnlocked: ObjectiveRuntime[] = [];
    for (const objective of this.objectives) {
      if (this.isAvailable(objective, discoveries) && !this.available.has(objective.id)) {
        this.available.add(objective.id);
        if (!this.completed.has(objective.id)) newlyUnlocked.push(objective);
      }
    }
    const current = this.objectives[this.current];
    if (!current || this.completed.has(current.id) || !this.isAvailable(current)) this.selectNext();
    this.refreshMarkers();
    const unlocked = newlyUnlocked.find((objective) => objective.id !== "skyrail-relay");
    return unlocked ? `${unlocked.label} unlocked // follow the ${unlocked.start.label} beacon.` : null;
  }

  public readout(): ObjectiveReadout {
    const objective = this.objectives[this.current];
    if (!objective) return { id: "city-charted", label: "CITY LATTICE", state: "complete", instruction: "ALL LOCAL OBJECTIVES COMPLETE", unlockLabel: null, progress: 100, reward: 0, elapsed: 0, limit: 0, best: null, completed: this.completed.size, total: this.objectives.length };
    if (!this.isAvailable(objective)) return { id: objective.id, label: objective.label, state: "locked", instruction: "CHART THE REQUIRED LANDMARK TO OPEN THIS ACTIVITY", unlockLabel: objective.requiresDiscovery ?? null, progress: 0, reward: objective.reward, elapsed: 0, limit: objective.limit, best: this.bests[objective.id] ?? null, completed: this.completed.size, total: this.objectives.length };
    const distance = objective.target.position.length();
    const progress = this.state === "idle" ? 0 : objective.kind === "ascent" ? Math.min(0.92, Math.max(0, (this.peakY - objective.start.position.y) / (objective.ascent ?? 1))) : objective.kind === "route" ? 0.15 : Math.min(0.92, 1 - Math.min(1, distance / this.startDistance));
    return { id: objective.id, label: objective.label, state: this.state, instruction: objective.instruction, unlockLabel: null, progress: Math.round(progress * 100), reward: objective.reward, elapsed: Math.round(this.elapsed * 10) / 10, limit: objective.limit, best: this.bests[objective.id] ? Math.round(this.bests[objective.id] * 10) / 10 : null, completed: this.completed.size, total: this.objectives.length };
  }

  public dispose(): void {
    this.root.dispose(false, true);
    this.activeMaterial.dispose();
    this.idleMaterial.dispose();
    this.targetMaterial.dispose();
  }

  private completeCurrent(): ObjectiveEvent | null {
    const objective = this.objectives[this.current];
    if (!objective) return null;
    const elapsed = Math.round(this.elapsed * 10) / 10;
    this.completed.add(objective.id);
    if (!this.bests[objective.id] || elapsed < this.bests[objective.id]) {
      this.bests[objective.id] = elapsed;
      this.saveRecords();
    }
    const event: ObjectiveEvent = { type: "completed", id: objective.id, label: objective.label, kind: objective.kind, reward: objective.reward, elapsed };
    this.state = "idle";
    this.elapsed = 0;
    this.selectNext();
    this.refreshMarkers();
    return event;
  }

  private selectNext(): void {
    const next = this.objectives.findIndex((objective) => !this.completed.has(objective.id) && this.isAvailable(objective));
    const locked = this.objectives.findIndex((objective) => !this.completed.has(objective.id));
    this.current = next >= 0 ? next : locked >= 0 ? locked : Math.max(0, this.objectives.length - 1);
  }

  private refreshMarkers(): void {
    this.objectives.forEach((objective, index) => {
      const current = index === this.current && !this.completed.has(objective.id) && this.isAvailable(objective);
      objective.startMarker.setEnabled(current && this.state === "idle");
      objective.targetMarker.setEnabled(current && this.state === "active");
      objective.startMarker.material = this.activeMaterial;
      objective.targetMarker.material = this.targetMaterial;
    });
  }

  private animate(delta: number): void {
    this.objectives.forEach((objective, index) => {
      objective.startMarker.rotation.y += delta * (index === this.current ? 1.3 : 0.25);
      objective.targetMarker.rotation.y -= delta * (index === this.current ? 1.5 : 0.2);
      objective.startMarker.position.y = objective.start.position.y + Math.sin(performance.now() * 0.001 + index) * 0.28;
      objective.targetMarker.position.y = objective.target.position.y + Math.sin(performance.now() * 0.001 + index + 1) * 0.32;
    });
  }

  private marker(name: string, position: Vector3, target: boolean): Mesh {
    const marker = target ? MeshBuilder.CreateCylinder(name, { height: 4.2, diameterTop: 0.25, diameterBottom: 2.4, tessellation: 8 }, this.root.getScene()) : MeshBuilder.CreateTorus(name, { diameter: 5.8, thickness: 0.22, tessellation: 12 }, this.root.getScene());
    marker.parent = this.root;
    marker.position.copyFrom(position);
    marker.rotation.x = target ? 0 : Math.PI / 2;
    marker.isPickable = false;
    return marker;
  }

  private material(name: string, diffuse: string, emissive: string): StandardMaterial {
    const material = new StandardMaterial(name, this.root?.getScene());
    material.diffuseColor = Color3.FromHexString(diffuse);
    material.emissiveColor = Color3.FromHexString(emissive);
    material.specularColor = Color3.Black();
    return material;
  }

  private isFinite(position: Vector3): boolean { return Number.isFinite(position.x) && Number.isFinite(position.y) && Number.isFinite(position.z); }
  private isAvailable(objective: ObjectiveRuntime, discoveries: string[] = []): boolean { return !objective.requiresDiscovery || discoveries.includes(objective.requiresDiscovery) || this.available.has(objective.id); }
  private loadRecords(): Record<string, number> {
    try {
      const value = JSON.parse(window.localStorage.getItem(RECORD_KEY) ?? "{}") as Record<string, unknown>;
      return value && typeof value === "object" ? Object.fromEntries(Object.entries(value).filter((entry): entry is [string, number] => typeof entry[1] === "number" && Number.isFinite(entry[1]) && entry[1] > 0)) : {};
    } catch { return {}; }
  }
  private saveRecords(): void { try { window.localStorage.setItem(RECORD_KEY, JSON.stringify(this.bests)); } catch { /* optional local record */ } }
}
