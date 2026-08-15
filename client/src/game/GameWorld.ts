// Aerial Transit Noir — world ownership keeps menu, traversal, quality, and HUD phases coherent.
import type { Scene } from "@babylonjs/core";
import type { AmbientCitySystem } from "./AmbientCitySystem";
import { AudioManager } from "./AudioManager";
import { GameSignalBus } from "./GameSignals";
import type { CameraRig } from "./CameraRig";
import { ChallengeManager } from "./ChallengeManager";
import type { CityBuilder } from "./CityBuilder";
import { InputManager } from "./InputManager";
import { PlayerController } from "./PlayerController";
import { ProgressionManager } from "./ProgressionManager";
import { QualityManager } from "./QualityManager";
import { RuntimeTelemetry } from "./RuntimeTelemetry";
import { loadSettings, saveSettings, type GameplaySettings } from "./SettingsStore";
import { SimulationDirector } from "./SimulationDirector";
import type { TimeOfDaySystem } from "./TimeOfDaySystem";
import type { WeatherSystem } from "./WeatherSystem";
import type { CharacterId, GamePhase, GameStatus, InputSnapshot, QualityPreset, SectorReadout, WeatherMode } from "./types";

const idleInput: InputSnapshot = {
  moveX: 0, moveY: 0, lookX: 0, lookY: 0, sprint: false, swingHeld: false, wallRunHeld: false,
  diveHeld: false, jumpPressed: false, swingPressed: false, zipPressed: false, pausePressed: false,
  restartPressed: false, enterPressed: false,
};

export class GameWorld {
  private phase: GamePhase = "loading";
  private notification = "Synchronizing city lattice…";
  private transitionRemaining = 0;
  private demoClock = 0;
  private readonly listeners: Array<() => void> = [];
  private readonly timers: number[] = [];
  private lastStatusAt = 0;
  private readonly demo: boolean;
  private weatherMode: WeatherMode = "rain";
  private showcase = false;
  private readonly challenge: ChallengeManager;
  private readonly progression: ProgressionManager;
  private settings: GameplaySettings;
  private readonly audio: AudioManager;
  private readonly signals = new GameSignalBus();
  private readonly simulation: SimulationDirector;
  private readonly telemetry = new RuntimeTelemetry();
  private eventIntensity = 0;
  private sectors: SectorReadout = { district: "civic-core", districtLabel: "CIVIC TRANSFER CORE", active: ["civic-core"], predicted: [] };
  private diagnosticsVisible = false;

  public constructor(
    private readonly scene: Scene,
    private readonly input: InputManager,
    private readonly city: CityBuilder,
    private readonly player: PlayerController,
    private readonly camera: CameraRig,
    private readonly quality: QualityManager,
    private readonly weather: WeatherSystem,
    private readonly ambient: AmbientCitySystem,
    private readonly timeOfDay: TimeOfDaySystem,
  ) {
    this.demo = new URLSearchParams(window.location.search).has("demo");
    this.challenge = new ChallengeManager(scene);
    this.progression = new ProgressionManager(scene);
    this.settings = loadSettings();
    this.audio = new AudioManager(this.settings);
    this.simulation = new SimulationDirector(this.ambient, this.signals, this.city);
    this.player.setSignals(this.signals);
    this.listeners.push(this.signals.subscribe((signal) => this.handleSignal(signal)));
    this.camera.setPreferences(this.settings);
    this.camera.setReducedMotion(this.settings.reducedMotion);
    this.weather.setDensity(this.quality.effectDensity);
    this.bindEvents();
    this.timers.push(window.setTimeout(() => {
      if (this.phase !== "loading") return;
      this.phase = "selection";
      this.notification = "Select an operator. Traverse when ready.";
      this.publishStatus(true);
      if (this.demo) {
        this.timers.push(window.setTimeout(() => {
          if (this.phase !== "selection") return;
          this.phase = "playing";
          this.notification = "Autopilot route live. Anchor network engaged.";
          this.publishStatus(true);
        }, 80));
      }
    }, 700));
  }

  public update(delta: number): void {
    this.audio.setEnvironment(this.timeOfDay.readout, this.eventIntensity);
    if (this.shouldAdvanceEnvironment()) {
      this.city.update(delta);
      this.weather.update(this.player.root.position, delta);
    }
    const raw = this.input.snapshot();
    if (this.phase === "selection") {
      if (raw.enterPressed) this.beginTraversal();
      this.player.root.rotation.y += delta * 0.55;
      this.camera.look(-delta * 6, 0);
      this.camera.update(this.player.root.position, 0, this.city, delta);
    } else if (this.phase === "transition") {
      this.transitionRemaining -= delta;
      this.player.root.position.y = 2 + Math.sin(this.transitionRemaining * 8) * 0.22;
      this.camera.update(this.player.root.position, 4, this.city, delta);
      if (this.transitionRemaining <= 0) {
        this.phase = "playing";
        this.notification = "Anchor network live. Find the line.";
      }
    } else if (this.phase === "playing") {
      if (raw.pausePressed) this.togglePause();
      else if (raw.restartPressed) this.restart();
      else {
        const actions = this.showcase ? idleInput : (this.demo ? this.demoInput(delta) : raw);
        this.camera.look(actions.lookX, actions.lookY);
        this.player.update(actions, this.camera, this.city, delta, true);
        this.audio.update(this.player.getSpeed(), this.player.traversal, this.weatherMode, delta);
        this.camera.registerImpact(this.player.consumeImpact());
        this.camera.update(this.player.root.position, this.player.getSpeed(), this.city, delta, ["swing", "zip", "dive"].includes(this.player.traversal));
        const simulation = this.simulation.update(this.player.root.position, this.player.velocity, this.quality.effectDensity, delta);
        this.sectors = simulation.sectors;
        if (simulation.notification) this.notification = simulation.notification;
        this.telemetry.update(this.scene, delta, { district: simulation.sectors.district, traversal: this.player.traversal, speed: this.player.getSpeed(), target: this.player.target?.id ?? "SCANNING", activeActors: simulation.activeActors, activeSectors: simulation.sectors.active.length + simulation.sectors.predicted.length });
        const discovery = this.progression.update(this.player.root.position, this.player.getSpeed(), delta);
        if (discovery) { this.notification = discovery; this.audio.cue("discover"); }
        if (this.challenge.update(this.player.root.position, delta)) {
          const progress = this.challenge.readout();
          this.notification = progress.state === "complete" ? `Circuit clear: ${progress.elapsed.toFixed(1)} seconds.` : `Route node ${progress.node - 1}/${progress.total} captured.`;
          this.audio.cue("route");
        }
      }
    } else if (this.phase === "paused") {
      if (raw.pausePressed || raw.enterPressed) this.togglePause();
      this.camera.update(this.player.root.position, 0, this.city, delta);
    } else if (this.phase === "recovery") {
      this.transitionRemaining -= delta;
      if (this.transitionRemaining <= 0) this.restart();
    }
    this.quality.update(delta, (preset) => {
      this.weather.setDensity(this.quality.effectDensity);
      this.notification = `Performance guard: ${preset.toUpperCase()} lattice.`;
      this.publishStatus(true);
    });
    this.input.endFrame();
    this.lastStatusAt += delta;
    if (this.lastStatusAt > 0.1) {
      this.lastStatusAt = 0;
      this.publishStatus();
    }
  }

  public dispose(): void {
    for (const timer of this.timers) window.clearTimeout(timer);
    this.timers.length = 0;
    for (const unbind of this.listeners) unbind();
    this.input.dispose();
    this.player.dispose();
    this.challenge.dispose();
    this.progression.dispose();
    this.audio.dispose();
    this.signals.clear();
    this.ambient.dispose();
    this.city.dispose();
  }

  /** Scene-owned environment systems must not advance while gameplay is deliberately paused. */
  public shouldAdvanceEnvironment(): boolean {
    return this.phase === "transition" || this.phase === "playing" || this.phase === "recovery";
  }

  private beginTraversal(): void {
    if (this.phase !== "selection") return;
    this.input.capturePointer();
    this.audio.activate();
    this.audio.cue("launch");
    this.phase = "transition";
    this.challenge.start();
    this.progression.resetRun();
    this.transitionRemaining = 0.78;
    this.player.root.rotation.set(0, 0.4, 0);
    this.notification = "Transit clearance granted.";
    this.publishStatus(true);
  }

  private togglePause(): void {
    if (this.phase === "playing") {
      this.phase = "paused";
      this.notification = "Traversal held. Systems standing by.";
      this.input.reset();
      if (document.pointerLockElement) document.exitPointerLock();
      this.audio.cue("pause");
      this.audio.setPaused(true);
    } else if (this.phase === "paused") {
      this.phase = "playing";
      this.notification = "Momentum restored.";
      this.audio.setPaused(false);
      this.input.capturePointer();
    } else return;
    this.publishStatus(true);
  }

  private restart(): void {
    if (!["playing", "paused", "recovery"].includes(this.phase)) return;
    this.player.reset();
    const completedRoute = this.challenge.readout().state === "complete";
    if (completedRoute) this.challenge.nextRoute();
    else this.challenge.reset();
    this.progression.resetRun();
    this.phase = "playing";
    this.notification = completedRoute ? `New contract live: ${this.challenge.readout().route}.` : "Route re-entered at Sector Zero.";
    this.publishStatus(true);
  }

  private setCharacter(character: CharacterId): void {
    if (this.phase !== "selection") return;
    this.player.setCharacter(character);
    this.notification = character === "vanta" ? "VANTA // kinetic weave selected." : "KITE // vector pulse selected.";
    this.publishStatus(true);
  }

  private setQuality(preset: QualityPreset): void {
    this.quality.apply(preset);
    this.weather.setDensity(this.quality.effectDensity);
    this.notification = `Quality lattice: ${preset.toUpperCase()}.`;
    this.publishStatus(true);
  }

  private setReducedMotion(value: boolean): void {
    this.settings = { ...this.settings, reducedMotion: value };
    saveSettings(this.settings);
    this.camera.setReducedMotion(value);
    this.notification = value ? "Reduced motion enabled." : "Cinematic damping restored.";
    this.publishStatus(true);
  }

  private setWeather(value: WeatherMode): void {
    this.weatherMode = value;
    this.weather.setMode(value);
    this.signals.emit({ type: "environment", weather: value, intensity: value === "storm" ? 1 : value === "rain" ? 0.56 : 0.16 });
    this.notification = value === "clear" ? "Dry visibility profile active." : `${value.toUpperCase()} weather lattice active.`;
    this.publishStatus(true);
  }

  private handleSignal(signal: import("./GameSignals").GameSignal): void {
    if (signal.type === "traversal") {
      this.camera.registerTraversalSignal(signal);
      if (signal.action === "web-attached") this.audio.cue("swing");
      else if (signal.action === "zip-started") this.audio.cue("zip");
      else if (signal.action === "landed") this.audio.cue("land");
      if (signal.action === "chain" && signal.chain > 2) this.notification = `Chain ${signal.chain} // vector window sustained.`;
      return;
    }
    if (signal.type === "district" && signal.entering) this.notification = `${signal.district.replace(/-/g, " ").toUpperCase()} // local lattice engaged.`;
    if (signal.type === "world-event") {
      this.eventIntensity = signal.intensity;
      if (signal.id && signal.intensity > 0) this.notification = `${signal.label} // live.`;
    }
  }

  private setShowcase(value: boolean): void {
    this.showcase = value;
    this.camera.setShowcase(value);
    this.notification = value ? "Showcase camera active. Traversal input held." : "Showcase released. Traversal input restored.";
    this.publishStatus(true);
  }

  private setSettings(value: GameplaySettings): void {
    this.settings = value;
    saveSettings(this.settings);
    this.camera.setPreferences(this.settings);
    this.camera.setReducedMotion(this.settings.reducedMotion);
    this.audio.setSettings(this.settings);
    this.notification = "Flight deck preferences stored.";
    this.publishStatus(true);
  }

  private setContrast(value: boolean): void {
    this.settings = { ...this.settings, highContrast: value };
    saveSettings(this.settings);
    this.publishStatus(true);
  }

  private publishStatus(force = false): void {
    if (!force && this.phase === "loading") return;
    const target = this.player.target;
    const status: GameStatus = {
      phase: this.phase,
      character: this.player.selected,
      characterTrait: this.player.getTrait(),
      traversal: this.player.traversal,
      speed: Math.round(this.player.getSpeed() * 3.6),
      momentum: this.player.getMomentum(),
      chain: this.player.getChain(),
      target: target ? `${target.kind.toUpperCase()} LINK` : "SCANNING",
      targetDistance: target ? Math.round(target.position.subtract(this.player.root.position).length()) : 0,
      anchorCue: this.player.getAnchorCue(),
      quality: this.quality.current,
      fps: Math.round(this.scene.getEngine().getFps()),
      notification: this.notification,
      menuHint: "WASD move · Space jump · LMB swing · RMB zip · Q wall-run · E dive",
      weather: this.weatherMode,
      showcase: this.showcase,
      challenge: this.challenge.readout(),
      progression: this.progression.readout(),
      settings: this.settings,
      sectors: this.sectors,
      diagnostics: this.telemetry.snapshot,
      diagnosticsVisible: this.diagnosticsVisible,
    };
    window.dispatchEvent(new CustomEvent<GameStatus>("megapolis:status", { detail: status }));
  }

  private demoInput(delta: number): InputSnapshot {
    this.demoClock += delta;
    const cycle = this.demoClock % 14;
    const cycleSwing = cycle > 0.24 && cycle < 8.4;
    const cycleZip = cycle > 9.2 && cycle < 11.2;
    return {
      ...idleInput,
      moveY: 1,
      moveX: Math.sin(this.demoClock * 0.55) * 0.45,
      sprint: cycle < 2.3,
      swingHeld: cycleSwing,
      swingPressed: Math.abs(cycle - 0.3) < delta * 1.2,
      zipPressed: Math.abs(cycle - 9.25) < delta * 1.2,
      diveHeld: cycle > 11.4 && cycle < 12.7,
      jumpPressed: Math.abs(cycle - 0.9) < delta * 1.1,
      lookX: -0.35,
      lookY: 0,
    };
  }

  private bindEvents(): void {
    const listen = <T>(name: string, callback: (detail: T) => void) => {
      const handler = (event: Event) => callback((event as CustomEvent<T>).detail);
      window.addEventListener(name, handler);
      this.listeners.push(() => window.removeEventListener(name, handler));
    };
    listen("megapolis:start", () => this.beginTraversal());
    listen<CharacterId>("megapolis:character", (value) => this.setCharacter(value));
    listen<QualityPreset>("megapolis:quality", (value) => this.setQuality(value));
    listen<boolean>("megapolis:motion", (value) => this.setReducedMotion(value));
    listen<WeatherMode>("megapolis:weather", (value) => this.setWeather(value));
    listen<boolean>("megapolis:showcase", (value) => this.setShowcase(value));
    listen<GameplaySettings>("megapolis:settings", (value) => this.setSettings(value));
    listen<boolean>("megapolis:contrast", (value) => this.setContrast(value));
    listen<boolean>("megapolis:diagnostics", (value) => { this.diagnosticsVisible = value; this.notification = value ? "Telemetry lattice visible." : "Telemetry lattice hidden."; this.publishStatus(true); });
    listen("megapolis:pause", () => this.togglePause());
    listen("megapolis:restart", () => this.restart());
  }
}
