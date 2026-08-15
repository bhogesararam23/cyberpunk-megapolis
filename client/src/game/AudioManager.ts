// Aerial Transit Noir — restrained synthesis provides responsive flight feedback without network audio or autoplay violations.
import type { TraversalState, WeatherMode } from "./types";
import type { GameplaySettings } from "./SettingsStore";

type Cue = "launch" | "swing" | "zip" | "land" | "discover" | "route" | "pause";

export class AudioManager {
  private context: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private ambientOscillator: OscillatorNode | null = null;
  private settings: GameplaySettings;
  private enabled = false;
  private lastTraversal: TraversalState = "idle";

  public constructor(settings: GameplaySettings) { this.settings = settings; }

  public activate(): void {
    if (this.enabled) { void this.context?.resume(); return; }
    const Audio = window.AudioContext ?? window.webkitAudioContext;
    if (!Audio) return;
    try {
      this.context = new Audio();
      this.ambientGain = this.context.createGain();
      this.ambientGain.gain.value = 0;
      this.ambientGain.connect(this.context.destination);
      this.ambientOscillator = this.context.createOscillator();
      this.ambientOscillator.type = "sine";
      this.ambientOscillator.frequency.value = 42;
      this.ambientOscillator.connect(this.ambientGain);
      this.ambientOscillator.start();
      this.enabled = true;
      void this.context.resume();
    } catch { this.dispose(); }
  }

  public setSettings(settings: GameplaySettings): void { this.settings = settings; }

  public update(speed: number, traversal: TraversalState, weather: WeatherMode, delta: number): void {
    if (!this.enabled || !this.context || !this.ambientGain || !this.ambientOscillator) return;
    const now = this.context.currentTime;
    const weatherLift = weather === "storm" ? 0.022 : weather === "rain" ? 0.012 : 0.004;
    const level = Math.min(0.09, (weatherLift + Math.min(0.045, speed * 0.0011)) * this.settings.masterVolume * this.settings.ambienceVolume);
    this.ambientGain.gain.setTargetAtTime(level, now, Math.max(0.03, delta * 1.6));
    this.ambientOscillator.frequency.setTargetAtTime(38 + Math.min(62, speed * 1.2), now, 0.12);
    if (traversal !== this.lastTraversal) {
      if (traversal === "swing") this.cue("swing");
      else if (traversal === "zip") this.cue("zip");
      else if (traversal === "landing") this.cue("land");
      this.lastTraversal = traversal;
    }
  }

  public cue(cue: Cue): void {
    if (!this.enabled || !this.context) return;
    const table: Record<Cue, [number, number, number, OscillatorType]> = { launch: [150, 290, 0.13, "triangle"], swing: [210, 380, 0.09, "sine"], zip: [320, 690, 0.11, "square"], land: [105, 54, 0.13, "triangle"], discover: [380, 720, 0.21, "sine"], route: [260, 510, 0.16, "triangle"], pause: [190, 110, 0.1, "sine"] };
    const [from, to, duration, kind] = table[cue];
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const now = this.context.currentTime;
    oscillator.type = kind;
    oscillator.frequency.setValueAtTime(from, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, to), now + duration);
    gain.gain.setValueAtTime(Math.max(0.0001, 0.13 * this.settings.masterVolume * this.settings.sfxVolume), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain); gain.connect(this.context.destination);
    oscillator.start(now); oscillator.stop(now + duration + 0.03);
  }

  public dispose(): void { this.ambientOscillator?.stop(); this.ambientOscillator?.disconnect(); this.ambientGain?.disconnect(); void this.context?.close(); this.context = null; this.ambientGain = null; this.ambientOscillator = null; this.enabled = false; }
}

declare global { interface Window { webkitAudioContext?: typeof AudioContext; } }
