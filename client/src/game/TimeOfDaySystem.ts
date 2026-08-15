import { Color3, Color4, DirectionalLight, GlowLayer, HemisphericLight, Scene } from "@babylonjs/core";
import type { WeatherMode } from "./WeatherSystem";

interface AtmosphereKeyframe {
  at: number;
  clear: Color4;
  fog: Color3;
  sky: Color3;
  horizon: Color3;
  skyIntensity: number;
  horizonIntensity: number;
  glow: number;
}

const KEYFRAMES: AtmosphereKeyframe[] = [
  { at: 0, clear: Color4.FromHexString("#010614ff"), fog: Color3.FromHexString("#040b18"), sky: Color3.FromHexString("#273c64"), horizon: Color3.FromHexString("#506ebb"), skyIntensity: 0.32, horizonIntensity: 0.1, glow: 0.98 },
  { at: 0.25, clear: Color4.FromHexString("#243e64ff"), fog: Color3.FromHexString("#182943"), sky: Color3.FromHexString("#7998bd"), horizon: Color3.FromHexString("#ffc27f"), skyIntensity: 0.55, horizonIntensity: 0.45, glow: 0.8 },
  { at: 0.5, clear: Color4.FromHexString("#07152aff"), fog: Color3.FromHexString("#07152a"), sky: Color3.FromHexString("#5a799f"), horizon: Color3.FromHexString("#f4a567"), skyIntensity: 0.6, horizonIntensity: 0.55, glow: 0.68 },
  { at: 0.75, clear: Color4.FromHexString("#010817ff"), fog: Color3.FromHexString("#031022"), sky: Color3.FromHexString("#314f7a"), horizon: Color3.FromHexString("#5d7fd0"), skyIntensity: 0.36, horizonIntensity: 0.13, glow: 0.96 },
  { at: 1, clear: Color4.FromHexString("#010614ff"), fog: Color3.FromHexString("#040b18"), sky: Color3.FromHexString("#273c64"), horizon: Color3.FromHexString("#506ebb"), skyIntensity: 0.32, horizonIntensity: 0.1, glow: 0.98 },
];

export class TimeOfDaySystem {
  private elapsed = 120;

  public constructor(
    private readonly scene: Scene,
    private readonly hemisphere: HemisphericLight,
    private readonly horizon: DirectionalLight,
    private readonly glow: GlowLayer,
  ) {}

  public update(delta: number, weather: WeatherMode): void {
    this.elapsed = (this.elapsed + delta) % 240;
    const time = this.elapsed / 240;
    const current = KEYFRAMES.findLast((key) => key.at <= time) ?? KEYFRAMES[0];
    const next = KEYFRAMES[KEYFRAMES.indexOf(current) + 1] ?? KEYFRAMES[1];
    const mix = (time - current.at) / Math.max(0.0001, next.at - current.at);
    const weatherDim = weather === "storm" ? 0.68 : weather === "rain" ? 0.86 : 1;
    const stormGlow = weather === "storm" ? 0.12 : weather === "rain" ? 0.05 : 0;

    this.scene.clearColor = Color4.Lerp(current.clear, next.clear, mix);
    this.scene.fogColor = Color3.Lerp(current.fog, next.fog, mix);
    this.hemisphere.diffuse = Color3.Lerp(current.sky, next.sky, mix);
    this.horizon.diffuse = Color3.Lerp(current.horizon, next.horizon, mix);
    this.hemisphere.intensity = (current.skyIntensity + (next.skyIntensity - current.skyIntensity) * mix) * weatherDim;
    this.horizon.intensity = (current.horizonIntensity + (next.horizonIntensity - current.horizonIntensity) * mix) * weatherDim;
    this.glow.intensity = current.glow + (next.glow - current.glow) * mix + stormGlow;
  }
}
