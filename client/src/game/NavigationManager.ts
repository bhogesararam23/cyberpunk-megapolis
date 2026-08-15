// Aerial Transit Noir — a tactical atlas is derived from the generated city rather than a decorative fake map.
import { Vector3 } from "@babylonjs/core";
import type { CityBuilder } from "./CityBuilder";
import type { CityNavigationNode, NavigationReadout } from "./types";

export class NavigationManager {
  private readonly nodes: CityNavigationNode[];
  private visible = false;
  private selectedId = "civic-crown";
  private player = Vector3.Zero();
  private discoveries = new Set<string>();

  public constructor(city: CityBuilder) {
    this.nodes = city.getNavigationNodes();
  }

  public get isVisible(): boolean { return this.visible; }

  public setVisible(value: boolean): void { this.visible = value; }

  public toggle(): void { this.visible = !this.visible; }

  public select(id: string): boolean {
    if (!this.nodes.some((node) => node.id === id)) return false;
    this.selectedId = id;
    this.visible = true;
    return true;
  }

  public update(position: Vector3, discoveries: readonly string[]): void {
    this.player.copyFrom(position);
    this.discoveries = new Set(discoveries);
    const selected = this.nodes.find((node) => node.id === this.selectedId);
    if (selected?.kind === "landmark" && this.discoveries.has(selected.id)) {
      this.selectedId = this.nodes.find((node) => node.kind === "landmark" && !this.discoveries.has(node.id))?.id ?? selected.id;
    }
  }

  public readout(): NavigationReadout {
    const waypoint = this.nodes.find((node) => node.id === this.selectedId) ?? null;
    const markerReadout = this.nodes.map((node) => ({
      id: node.id,
      label: node.label,
      district: node.district,
      kind: node.kind,
      x: Math.max(-138, Math.min(138, node.position.x)),
      z: Math.max(-138, Math.min(138, node.position.z)),
      discovered: node.kind !== "landmark" || this.discoveries.has(node.id),
      selected: node.id === waypoint?.id,
    }));
    if (!waypoint) return { visible: this.visible, player: { x: this.player.x, z: this.player.z }, waypoint: null, markers: markerReadout };
    const offset = waypoint.position.subtract(this.player);
    const bearing = (Math.atan2(offset.x, offset.z) * 180 / Math.PI + 360) % 360;
    return {
      visible: this.visible,
      player: { x: this.player.x, z: this.player.z },
      waypoint: { id: waypoint.id, label: waypoint.label, district: waypoint.district, kind: waypoint.kind, distance: Math.round(Math.hypot(offset.x, offset.z)), bearing: Math.round(bearing) },
      markers: markerReadout,
    };
  }
}
