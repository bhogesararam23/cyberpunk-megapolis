import { Color3, Color4, DirectionalLight, GlowLayer, HemisphericLight, Scene } from "@babylonjs/core";
import type { WeatherMode } from "./WeatherSystem";

export interface AtmosphereProfile {
  phase: "night" | "dawn" | "blue-hour" | "dusk";
  bedFrequency: number;
  overtoneFrequency: number;
  luminance: number;
  weather: WeatherMode;
}

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
  { at: 0, clear: Color4.FromHexString("#010614ff"), fog: Color3.FromHexString("#040b18"), sky: Color3.FromHexString("#203557"), horizon: Color3.FromHexString("#4563a5"), skyIntensity: 0.28, horizonIntensity: 0.08, glow: 0.66 },
  { at: 0.25, clear: Color4.FromHexString("#1a304fff"), fog: Color3.FromHexString("#12233c"), sky: Color3.FromHexString("#6683a8"), horizon: Color3.FromHexString("#e5a46a"), skyIntensity: 0.46, horizonIntensity: 0.32, glow: 0.5 },
  { at: 0.5, clear: Color4.FromHexString("#061329ff"), fog: Color3.FromHexString("#061329"), sky: Color3.FromHexString("#45698f"), horizon: Color3.FromHexString("#d9915e"), skyIntensity: 0.5, horizonIntensity: 0.4, glow: 0.42 },
  { at: 0.75, clear: Color4.FromHexString("#010817ff"), fog: Color3.FromHexString("#031022"), sky: Color3.FromHexString("#294467"), horizon: Color3.FromHexString("#4d6db5"), skyIntensity: 0.31, horizonIntensity: 0.11, glow: 0.62 },
  { at: 1, clear: Color4.FromHexString("#010614ff"), fog: Color3.FromHexString("#040b18"), sky: Color3.FromHexString("#203557"), horizon: Color3.FromHexString("#4563a5"), skyIntensity: 0.28, horizonIntensity: 0.08, glow: 0.66 },
];

export class TimeOfDaySystem {
  private elapsed = 120;
  private profile: AtmosphereProfile = { phase: "blue-hour", bedFrequency: 46, overtoneFrequency: 118, luminance: 0.6, weather: "rain" };

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
    const stormGlow = weather === "storm" ? 0.055 : weather === "rain" ? 0.022 : 0;

    this.scene.clearColor = Color4.Lerp(current.clear, next.clear, mix);
    this.scene.fogColor = Color3.Lerp(current.fog, next.fog, mix);
    this.hemisphere.diffuse = Color3.Lerp(current.sky, next.sky, mix);
    this.horizon.diffuse = Color3.Lerp(current.horizon, next.horizon, mix);
    this.hemisphere.intensity = (current.skyIntensity + (next.skyIntensity - current.skyIntensity) * mix) * weatherDim;
    this.horizon.intensity = (current.horizonIntensity + (next.horizonIntensity - current.horizonIntensity) * mix) * weatherDim;
    this.glow.intensity = current.glow + (next.glow - current.glow) * mix + stormGlow;
    const luminance = (this.hemisphere.intensity + this.horizon.intensity) * 0.5;
    const phase = time < 0.18 || time >= 0.78 ? "night" : time < 0.38 ? "dawn" : time < 0.62 ? "blue-hour" : "dusk";
    const phaseOffset = phase === "night" ? -8 : phase === "dawn" ? 14 : phase === "dusk" ? 8 : 0;
    this.profile = {
      phase,
      bedFrequency: 44 + phaseOffset + (weather === "storm" ? -6 : 0),
      overtoneFrequency: 110 + phaseOffset * 2 + (weather === "rain" ? 8 : weather === "storm" ? 16 : 0),
      luminance,
      weather,
    };
  }

  public get readout(): AtmosphereProfile { return this.profile; }
}
