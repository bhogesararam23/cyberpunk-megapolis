// Aerial Transit Noir — restrained synthesis provides responsive flight feedback without network audio or autoplay violations.
import type { TraversalState, WeatherMode } from "./types";
import type { GameplaySettings } from "./SettingsStore";
import type { AtmosphereProfile } from "./TimeOfDaySystem";

type Cue = "launch" | "swing" | "zip" | "land" | "discover" | "route" | "pause";

export class AudioManager {
  private context: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private ambientOscillator: OscillatorNode | null = null;
  private overtoneGain: GainNode | null = null;
  private overtoneOscillator: OscillatorNode | null = null;
  private settings: GameplaySettings;
  private enabled = false;
  private lastTraversal: TraversalState = "idle";
  private atmosphere: AtmosphereProfile | null = null;
  private eventIntensity = 0;
  private paused = false;

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
      this.overtoneGain = this.context.createGain();
      this.overtoneGain.gain.value = 0;
      this.overtoneGain.connect(this.context.destination);
      this.overtoneOscillator = this.context.createOscillator();
      this.overtoneOscillator.type = "triangle";
      this.overtoneOscillator.frequency.value = 118;
      this.overtoneOscillator.connect(this.overtoneGain);
      this.overtoneOscillator.start();
      this.enabled = true;
      void this.context.resume();
    } catch { this.dispose(); }
  }

  public setSettings(settings: GameplaySettings): void { this.settings = settings; }

  public setEnvironment(profile: AtmosphereProfile, eventIntensity: number): void {
    this.atmosphere = profile;
    this.eventIntensity = eventIntensity;
  }

  public setPaused(value: boolean): void {
    this.paused = value;
    if (!value || !this.context) return;
    const now = this.context.currentTime;
    this.ambientGain?.gain.cancelScheduledValues(now);
    this.overtoneGain?.gain.cancelScheduledValues(now);
    this.ambientGain?.gain.setTargetAtTime(0, now, 0.035);
    this.overtoneGain?.gain.setTargetAtTime(0, now, 0.035);
  }

  public update(speed: number, traversal: TraversalState, weather: WeatherMode, delta: number): void {
    if (!this.enabled || !this.context || !this.ambientGain || !this.ambientOscillator || !this.overtoneGain || !this.overtoneOscillator) return;
    const now = this.context.currentTime;
    if (this.paused) {
      this.ambientGain.gain.setTargetAtTime(0, now, 0.035);
      this.overtoneGain.gain.setTargetAtTime(0, now, 0.035);
      return;
    }
    const weatherLift = weather === "storm" ? 0.022 : weather === "rain" ? 0.012 : 0.004;
    const phaseLift = this.atmosphere?.phase === "night" ? 0.012 : this.atmosphere?.phase === "dawn" ? 0.007 : 0.004;
    const level = Math.min(0.1, (weatherLift + phaseLift + this.eventIntensity * 0.012 + Math.min(0.045, speed * 0.0011)) * this.settings.masterVolume * this.settings.ambienceVolume);
    this.ambientGain.gain.setTargetAtTime(level, now, Math.max(0.03, delta * 1.6));
    const bed = this.atmosphere?.bedFrequency ?? 42;
    const overtone = this.atmosphere?.overtoneFrequency ?? 118;
    this.ambientOscillator.frequency.setTargetAtTime(bed + Math.min(62, speed * 1.2), now, 0.12);
    const overtoneLevel = Math.min(0.045, (0.006 + this.eventIntensity * 0.02 + Math.min(0.014, speed * 0.00035)) * this.settings.masterVolume * this.settings.ambienceVolume);
    this.overtoneGain.gain.setTargetAtTime(overtoneLevel, now, Math.max(0.05, delta * 2));
    this.overtoneOscillator.frequency.setTargetAtTime(overtone + Math.min(90, speed * 1.5), now, 0.16);
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

  public dispose(): void { this.ambientOscillator?.stop(); this.ambientOscillator?.disconnect(); this.ambientGain?.disconnect(); this.overtoneOscillator?.stop(); this.overtoneOscillator?.disconnect(); this.overtoneGain?.disconnect(); void this.context?.close(); this.context = null; this.ambientGain = null; this.ambientOscillator = null; this.overtoneGain = null; this.overtoneOscillator = null; this.enabled = false; this.paused = false; }
}

declare global { interface Window { webkitAudioContext?: typeof AudioContext; } }
