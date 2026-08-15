import { Color3, Mesh, MeshBuilder, Scene, StandardMaterial, TransformNode, Vector3 } from "@babylonjs/core";
import type { ChallengeReadout } from "./types";

const ROUTE_ID = "SKYRAIL_CIRCUIT";
const BEST_KEY = "cyberpunk-megapolis.skyrail-circuit.best";

interface RouteNode {
  label: string;
  position: Vector3;
  marker: Mesh;
}

export class ChallengeManager {
  private readonly root: TransformNode;
  private readonly activeMaterial: StandardMaterial;
  private readonly idleMaterial: StandardMaterial;
  private readonly completeMaterial: StandardMaterial;
  private readonly nodes: RouteNode[] = [];
  private nodeIndex = 0;
  private elapsed = 0;
  private running = false;
  private completed = false;
  private bestTime: number | null;

  public constructor(private readonly scene: Scene) {
    this.root = new TransformNode("challenge-root", scene);
    this.activeMaterial = this.makeMaterial("challenge-active", "#194b50", "#43f6e8");
    this.idleMaterial = this.makeMaterial("challenge-idle", "#223141", "#28505c");
    this.completeMaterial = this.makeMaterial("challenge-complete", "#503619", "#f6a84d");
    this.bestTime = this.loadBest();
    const route: Array<[string, Vector3]> = [
      ["STREET LAUNCH", new Vector3(0, 4.8, 22)],
      ["SIGNAL PYLON", new Vector3(14, 31, -78)],
      ["CIVIC CROWN", new Vector3(-32, 50, -38)],
      ["NORTH RAIL", new Vector3(-38, 19, 82)],
      ["SKYLINE EXIT", new Vector3(82, 31, 20)],
    ];
    for (const [label, position] of route) this.nodes.push({ label, position, marker: this.createMarker(label, position) });
    this.refreshMarkers();
  }

  public start(): void {
    this.nodeIndex = 0;
    this.elapsed = 0;
    this.running = true;
    this.completed = false;
    this.refreshMarkers();
  }

  public reset(): void {
    this.start();
  }

  public update(playerPosition: Vector3, delta: number): boolean {
    for (let index = 0; index < this.nodes.length; index += 1) {
      const node = this.nodes[index];
      node.marker.rotation.y += delta * (index === this.nodeIndex ? 1.9 : 0.55);
      node.marker.position.y = node.position.y + Math.sin((performance.now() * 0.001) + index) * 0.35;
    }
    if (!this.running || this.completed) return false;
    this.elapsed += delta;
    const active = this.nodes[this.nodeIndex];
    if (!active || !Number.isFinite(playerPosition.x) || !Number.isFinite(playerPosition.y) || !Number.isFinite(playerPosition.z) || Vector3.DistanceSquared(playerPosition, active.position) > 7.2 * 7.2) return false;
    this.nodeIndex += 1;
    if (this.nodeIndex >= this.nodes.length) {
      this.running = false;
      this.completed = true;
      if (this.bestTime === null || this.elapsed < this.bestTime) {
        this.bestTime = this.elapsed;
        this.saveBest(this.elapsed);
      }
    }
    this.refreshMarkers();
    return true;
  }

  public readout(): ChallengeReadout {
    const active = this.nodes[Math.min(this.nodeIndex, this.nodes.length - 1)];
    return {
      route: "SKYRAIL CIRCUIT",
      state: this.completed ? "complete" : this.running ? "active" : "idle",
      node: Math.min(this.nodeIndex + 1, this.nodes.length),
      total: this.nodes.length,
      target: active?.label ?? "CIRCUIT CLEAR",
      elapsed: Math.round(this.elapsed * 10) / 10,
      best: this.bestTime === null ? null : Math.round(this.bestTime * 10) / 10,
    };
  }

  public getActivePosition(): Vector3 | null {
    return this.nodes[this.nodeIndex]?.position.clone() ?? null;
  }

  public dispose(): void {
    this.root.dispose(false, true);
    this.activeMaterial.dispose();
    this.idleMaterial.dispose();
    this.completeMaterial.dispose();
  }

  private createMarker(name: string, position: Vector3): Mesh {
    const marker = MeshBuilder.CreateTorus(`route-node-${name}`, { diameter: 5.2, thickness: 0.24, tessellation: 12 }, this.scene);
    marker.position.copyFrom(position);
    marker.rotation.x = Math.PI / 2;
    marker.parent = this.root;
    marker.isPickable = false;
    return marker;
  }

  private refreshMarkers(): void {
    for (let index = 0; index < this.nodes.length; index += 1) {
      const node = this.nodes[index];
      node.marker.material = this.completed ? this.completeMaterial : index === this.nodeIndex ? this.activeMaterial : this.idleMaterial;
      node.marker.setEnabled(this.completed || index <= this.nodeIndex + 1);
    }
  }

  private makeMaterial(name: string, diffuse: string, emissive: string): StandardMaterial {
    const material = new StandardMaterial(name, this.scene);
    material.diffuseColor = Color3.FromHexString(diffuse);
    material.emissiveColor = Color3.FromHexString(emissive);
    material.specularColor = Color3.Black();
    return material;
  }

  private loadBest(): number | null {
    try {
      const value = window.localStorage.getItem(BEST_KEY);
      return value === null || Number.isNaN(Number(value)) ? null : Number(value);
    } catch {
      return null;
    }
  }

  private saveBest(value: number): void {
    try {
      window.localStorage.setItem(BEST_KEY, String(value));
    } catch {
      // Storage access is optional; the active session remains playable when it is unavailable.
    }
  }
}
