// Aerial Transit Noir — diagnostics aggregate browser-friendly budgets without affecting normal player presentation.
import type { Scene } from "@babylonjs/core";
import type { DistrictId, DiagnosticReadout, TraversalState } from "./types";

export interface TelemetryContext {
  district: DistrictId;
  traversal: TraversalState;
  speed: number;
  target: string;
  activeActors: number;
  activeSectors: number;
}

export class RuntimeTelemetry {
  private smoothedFrameMs = 16.7;
  private elapsed = 0;
  private readout: DiagnosticReadout = { fps: 60, frameMs: 16.7, drawCalls: 0, triangles: 0, activeMeshes: 0, activeActors: 0, activeSectors: 1, district: "civic-core", traversal: "idle", speed: 0, target: "SCANNING" };

  public update(scene: Scene, delta: number, context: TelemetryContext): void {
    this.elapsed += delta;
    this.smoothedFrameMs += ((delta * 1000) - this.smoothedFrameMs) * Math.min(1, delta * 5);
    if (this.elapsed < 0.12) return;
    this.elapsed = 0;
    const activeMeshes = scene.getActiveMeshes().length;
    this.readout = {
      fps: Math.round(1000 / Math.max(1, this.smoothedFrameMs)),
      frameMs: Number(this.smoothedFrameMs.toFixed(1)),
      drawCalls: activeMeshes,
      triangles: Math.round(scene.getActiveIndices() / 3),
      activeMeshes,
      activeActors: context.activeActors,
      activeSectors: context.activeSectors,
      district: context.district,
      traversal: context.traversal,
      speed: Math.round(context.speed * 3.6),
      target: context.target,
    };
  }

  public get snapshot(): DiagnosticReadout {
    return this.readout;
  }
}
