// Aerial Transit Noir — multi-route traversal contracts turn city knowledge into repeatable flight lines.
import { Color3, Mesh, MeshBuilder, Scene, StandardMaterial, TransformNode, Vector3 } from "@babylonjs/core";
import type { ChallengeReadout } from "./types";

const BEST_KEY = "cyberpunk-megapolis.skyrail-circuit.bests.v2";
const LEGACY_BEST_KEY = "cyberpunk-megapolis.skyrail-circuit.best";

const ROUTES: Array<{ label: string; par: number; nodes: Array<[string, Vector3]> }> = [
  { label: "SKYRAIL CIRCUIT", par: 23, nodes: [["STREET LAUNCH", new Vector3(0, 4.8, 22)], ["SIGNAL PYLON", new Vector3(14, 31, -78)], ["CIVIC CROWN", new Vector3(-32, 50, -38)], ["NORTH RAIL", new Vector3(-38, 19, 82)], ["SKYLINE EXIT", new Vector3(82, 31, 20)]] },
  { label: "MARKET DROP", par: 25, nodes: [["MARKET GATE", new Vector3(32, 12, 94)], ["STACKED WALK", new Vector3(45, 23, 100)], ["GLASS BRIDGE", new Vector3(59, 28, 64)], ["ARCADE PORTAL", new Vector3(57, 12, -59)], ["CANAL EXIT", new Vector3(86, 11, 18)]] },
  { label: "FOUNDRY ELEVATION", par: 27, nodes: [["FOUNDRY FLOOR", new Vector3(-85, 7, 76)], ["VENT ARRAY", new Vector3(-83, 16, 78)], ["CATWALK BEND", new Vector3(-69, 25, 52)], ["RAIL JUNCTION", new Vector3(-38, 23, 82)], ["CROWN RETURN", new Vector3(-32, 50, -38)]] },
];

interface RouteNode { label: string; position: Vector3; marker: Mesh; }

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
  private readonly bestTimes: Record<string, number>;
  private routeIndex = 0;

  public constructor(private readonly scene: Scene) {
    this.root = new TransformNode("challenge-root", scene);
    this.activeMaterial = this.makeMaterial("challenge-active", "#194b50", "#43f6e8");
    this.idleMaterial = this.makeMaterial("challenge-idle", "#223141", "#28505c");
    this.completeMaterial = this.makeMaterial("challenge-complete", "#503619", "#f6a84d");
    this.bestTimes = this.loadBests();
    this.bestTime = this.bestTimes[ROUTES[this.routeIndex].label] ?? null;
    this.populateRoute();
    this.refreshMarkers();
  }

  public start(): void { this.nodeIndex = 0; this.elapsed = 0; this.running = true; this.completed = false; this.refreshMarkers(); }
  /** Shows a route's physical start beacon without starting the clock. */
  public arm(): void { this.nodeIndex = 0; this.elapsed = 0; this.running = false; this.completed = false; this.refreshMarkers(); }
  public reset(): void { this.arm(); }

  public nextRoute(): void {
    this.routeIndex = (this.routeIndex + 1) % ROUTES.length;
    this.bestTime = this.bestTimes[ROUTES[this.routeIndex].label] ?? null;
    while (this.nodes.length) this.nodes.pop()?.marker.dispose();
    this.populateRoute();
    this.arm();
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
        this.bestTimes[ROUTES[this.routeIndex].label] = this.elapsed;
        this.saveBests();
      }
    }
    this.refreshMarkers();
    return true;
  }

  public readout(): ChallengeReadout {
    const active = this.nodes[Math.min(this.nodeIndex, this.nodes.length - 1)];
    const best = this.bestTime === null ? null : Math.round(this.bestTime * 10) / 10;
    const par = ROUTES[this.routeIndex].par;
    const medal = best === null ? null : best <= par * 0.8 ? "kinetic" : best <= par ? "vector" : "signal";
    return { route: ROUTES[this.routeIndex].label, state: this.completed ? "complete" : this.running ? "active" : "idle", node: Math.min(this.nodeIndex + 1, this.nodes.length), total: this.nodes.length, target: active?.label ?? "CIRCUIT CLEAR", elapsed: Math.round(this.elapsed * 10) / 10, best, medal };
  }

  public getActivePosition(): Vector3 | null { return this.nodes[this.nodeIndex]?.position.clone() ?? null; }

  public dispose(): void {
    this.root.dispose(false, true);
    this.activeMaterial.dispose(); this.idleMaterial.dispose(); this.completeMaterial.dispose();
  }

  private populateRoute(): void {
    for (const [label, position] of ROUTES[this.routeIndex].nodes) this.nodes.push({ label, position, marker: this.createMarker(label, position) });
  }

  private createMarker(name: string, position: Vector3): Mesh {
    const marker = MeshBuilder.CreateTorus(`route-node-${name}`, { diameter: 5.2, thickness: 0.24, tessellation: 12 }, this.scene);
    marker.position.copyFrom(position); marker.rotation.x = Math.PI / 2; marker.parent = this.root; marker.isPickable = false;
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
    material.diffuseColor = Color3.FromHexString(diffuse); material.emissiveColor = Color3.FromHexString(emissive); material.specularColor = Color3.Black();
    return material;
  }

  private loadBests(): Record<string, number> {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(BEST_KEY) ?? "{}") as Record<string, number>;
      if (parsed && typeof parsed === "object") return Object.fromEntries(Object.entries(parsed).filter(([, value]) => Number.isFinite(value) && value > 0));
      const legacy = Number(window.localStorage.getItem(LEGACY_BEST_KEY));
      return Number.isFinite(legacy) && legacy > 0 ? { [ROUTES[0].label]: legacy } : {};
    } catch { return {}; }
  }

  private saveBests(): void { try { window.localStorage.setItem(BEST_KEY, JSON.stringify(this.bestTimes)); } catch { /* storage is optional */ } }
}
