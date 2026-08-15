// Aerial Transit Noir — local discoveries and distance records turn traversal space into a persistent city relationship.
import { Color3, Mesh, MeshBuilder, Scene, StandardMaterial, TransformNode, Vector3 } from "@babylonjs/core";
import type { ProgressReadout } from "./types";

const PROFILE_KEY = "cyberpunk-megapolis.profile.v3";

interface Landmark {
  id: string;
  label: string;
  district: string;
  position: Vector3;
  marker: Mesh;
}

interface StoredProfile {
  discoveries: string[];
  credits: number;
  totalDistance: number;
  longestRun: number;
}

const DEFAULT_PROFILE: StoredProfile = { discoveries: [], credits: 0, totalDistance: 0, longestRun: 0 };

export class ProgressionManager {
  private readonly root: TransformNode;
  private readonly landmarks: Landmark[] = [];
  private readonly activeMaterial: StandardMaterial;
  private readonly completeMaterial: StandardMaterial;
  private profile: StoredProfile;
  private runDistance = 0;
  private lastSave = 0;

  public constructor(private readonly scene: Scene) {
    this.root = new TransformNode("progression-root", scene);
    this.activeMaterial = this.material("discovery-active", "#103a4a", "#50f5ef");
    this.completeMaterial = this.material("discovery-complete", "#4a3515", "#f5ad5c");
    this.profile = this.load();
    const records: Array<[string, string, string, Vector3]> = [
      ["arcade-portal", "SPECTRUM PORTAL", "COMMERCIAL ARCADE", new Vector3(57, 12, -59)],
      ["foundry-breath", "FOUNDRY BREATH", "INDUSTRIAL FOUNDRY", new Vector3(-84, 16, 77)],
      ["market-spine", "MARKET SPINE", "VERTICAL MARKET", new Vector3(34, 20, 98)],
      ["civic-crown", "CIVIC CROWN", "CENTRAL SPIRE", new Vector3(-32, 52, -38)],
      ["north-rail", "NORTH RAIL", "SKYRAIL CORRIDOR", new Vector3(-38, 23, 82)],
      ["waterline", "WATERLINE DECK", "LOWER AIRSPACE", new Vector3(88, 11, 18)],
    ];
    for (const [id, label, district, position] of records) this.landmarks.push({ id, label, district, position, marker: this.marker(id, position) });
    this.refresh();
  }

  public resetRun(): void {
    this.runDistance = 0;
  }

  public update(position: Vector3, speed: number, delta: number): string | null {
    const travelled = Math.max(0, speed) * delta;
    this.runDistance += travelled;
    this.profile.totalDistance += travelled;
    this.profile.longestRun = Math.max(this.profile.longestRun, this.runDistance);
    for (const landmark of this.landmarks) {
      landmark.marker.rotation.y += delta * 1.3;
      landmark.marker.position.y = landmark.position.y + Math.sin(performance.now() * 0.001 + landmark.position.x) * 0.25;
      if (!this.profile.discoveries.includes(landmark.id) && Vector3.DistanceSquared(position, landmark.position) < 7.5 * 7.5) {
        this.profile.discoveries.push(landmark.id);
        this.profile.credits += 125;
        this.refresh();
        this.save();
        return `${landmark.label} charted // +125 signal.`;
      }
    }
    this.lastSave += delta;
    if (this.lastSave > 15) { this.lastSave = 0; this.save(); }
    return null;
  }

  public readout(): ProgressReadout {
    const next = this.landmarks.find((landmark) => !this.profile.discoveries.includes(landmark.id));
    return {
      discoveries: this.profile.discoveries.length,
      discoveryTotal: this.landmarks.length,
      credits: this.profile.credits,
      distance: Math.round(this.profile.totalDistance),
      record: Math.round(this.profile.longestRun),
      nextLandmark: next?.label ?? "CITY LATTICE CHARTED",
      district: next?.district ?? "SECTOR ZERO",
    };
  }

  public dispose(): void {
    this.save();
    this.root.dispose(false, true);
    this.activeMaterial.dispose();
    this.completeMaterial.dispose();
  }

  private refresh(): void {
    for (const landmark of this.landmarks) {
      const claimed = this.profile.discoveries.includes(landmark.id);
      landmark.marker.material = claimed ? this.completeMaterial : this.activeMaterial;
      landmark.marker.setEnabled(!claimed);
    }
  }

  private marker(id: string, position: Vector3): Mesh {
    const marker = MeshBuilder.CreateTorus(`discovery-${id}`, { diameter: 3.8, thickness: 0.18, tessellation: 10 }, this.scene);
    marker.parent = this.root;
    marker.position.copyFrom(position);
    marker.rotation.x = Math.PI / 2;
    marker.isPickable = false;
    return marker;
  }

  private material(name: string, diffuse: string, emissive: string): StandardMaterial {
    const material = new StandardMaterial(name, this.scene);
    material.diffuseColor = Color3.FromHexString(diffuse);
    material.emissiveColor = Color3.FromHexString(emissive);
    material.specularColor = Color3.Black();
    return material;
  }

  private load(): StoredProfile {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(PROFILE_KEY) ?? "null") as Partial<StoredProfile> | null;
      return { discoveries: Array.isArray(parsed?.discoveries) ? parsed.discoveries.filter((item): item is string => typeof item === "string") : [], credits: Number.isFinite(parsed?.credits) ? Number(parsed?.credits) : 0, totalDistance: Number.isFinite(parsed?.totalDistance) ? Number(parsed?.totalDistance) : 0, longestRun: Number.isFinite(parsed?.longestRun) ? Number(parsed?.longestRun) : 0 };
    } catch { return { ...DEFAULT_PROFILE }; }
  }

  private save(): void {
    try { window.localStorage.setItem(PROFILE_KEY, JSON.stringify(this.profile)); } catch { /* storage is an optional enhancement */ }
  }
}
