// Aerial Transit Noir — quality settings favor legible traversal responsiveness over effects.
import type { Engine, GlowLayer, Scene } from "@babylonjs/core";
import type { QualityPreset } from "./types";

export class QualityManager {
  private preset: QualityPreset;
  private samples: number[] = [];
  private fallbackCooldown = 0;

  public constructor(
    private readonly engine: Engine,
    private readonly scene: Scene,
    private readonly glow: GlowLayer,
    onPreset: (preset: QualityPreset) => void,
  ) {
    const lowDevice = typeof navigator !== "undefined" && navigator.hardwareConcurrency !== undefined && navigator.hardwareConcurrency <= 4;
    this.preset = lowDevice ? "medium" : "high";
    this.apply(this.preset);
    onPreset(this.preset);
  }

  public get current(): QualityPreset {
    return this.preset;
  }

  public get effectDensity(): number {
    return { high: 1, medium: 0.68, low: 0.38 }[this.preset];
  }

  public apply(preset: QualityPreset): void {
    this.preset = preset;
    const settings = {
      high: { scale: 1, fog: 0.0057, glow: 0.68 },
      medium: { scale: 1.25, fog: 0.0073, glow: 0.48 },
      low: { scale: 1.65, fog: 0.0102, glow: 0.28 },
    }[preset];
    this.engine.setHardwareScalingLevel(settings.scale);
    this.scene.fogDensity = settings.fog;
    this.glow.intensity = settings.glow;
  }

  public update(delta: number, onFallback: (preset: QualityPreset) => void): void {
    this.fallbackCooldown = Math.max(0, this.fallbackCooldown - delta);
    this.samples.push(delta);
    if (this.samples.length > 150) this.samples.shift();
    if (this.samples.length < 120 || this.fallbackCooldown > 0) return;
    const average = this.samples.reduce((sum, sample) => sum + sample, 0) / this.samples.length;
    if (average > 0.030 && this.preset !== "low") {
      const next: QualityPreset = this.preset === "high" ? "medium" : "low";
      this.apply(next);
      this.samples = [];
      this.fallbackCooldown = 8;
      onFallback(next);
    }
  }
}
