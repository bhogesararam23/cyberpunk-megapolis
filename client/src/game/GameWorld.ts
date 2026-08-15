// Aerial Transit Noir — world ownership keeps menu, traversal, quality, and HUD phases coherent.
import type { Scene } from "@babylonjs/core";
import type { CameraRig } from "./CameraRig";
import { ChallengeManager } from "./ChallengeManager";
import type { CityBuilder } from "./CityBuilder";
import { InputManager } from "./InputManager";
import { PlayerController } from "./PlayerController";
import { QualityManager } from "./QualityManager";
import type { WeatherSystem } from "./WeatherSystem";
import type { CharacterId, GamePhase, GameStatus, InputSnapshot, QualityPreset, WeatherMode } from "./types";

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

  public constructor(
    private readonly scene: Scene,
    private readonly input: InputManager,
    private readonly city: CityBuilder,
    private readonly player: PlayerController,
    private readonly camera: CameraRig,
    private readonly quality: QualityManager,
    private readonly weather: WeatherSystem,
  ) {
    this.demo = new URLSearchParams(window.location.search).has("demo");
    this.challenge = new ChallengeManager(scene);
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
    this.city.update(delta);
    this.weather.update(this.player.root.position, delta);
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
        this.camera.registerImpact(this.player.consumeImpact());
        this.camera.update(this.player.root.position, this.player.getSpeed(), this.city, delta, ["swing", "zip", "dive"].includes(this.player.traversal));
        if (this.challenge.update(this.player.root.position, delta)) {
          const progress = this.challenge.readout();
          this.notification = progress.state === "complete" ? `Circuit clear: ${progress.elapsed.toFixed(1)} seconds.` : `Route node ${progress.node - 1}/${progress.total} captured.`;
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
    this.city.dispose();
  }

  private beginTraversal(): void {
    if (this.phase !== "selection") return;
    this.input.capturePointer();
    this.phase = "transition";
    this.challenge.start();
    this.transitionRemaining = 0.78;
    this.player.root.rotation.set(0, 0.4, 0);
    this.notification = "Transit clearance granted.";
    this.publishStatus(true);
  }

  private togglePause(): void {
    if (this.phase === "playing") {
      this.phase = "paused";
      this.notification = "Traversal held. Systems standing by.";
      if (document.pointerLockElement) document.exitPointerLock();
    } else if (this.phase === "paused") {
      this.phase = "playing";
      this.notification = "Momentum restored.";
      this.input.capturePointer();
    } else return;
    this.publishStatus(true);
  }

  private restart(): void {
    if (!["playing", "paused", "recovery"].includes(this.phase)) return;
    this.player.reset();
    this.challenge.reset();
    this.phase = "playing";
    this.notification = "Route re-entered at Sector Zero.";
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
    this.camera.setReducedMotion(value);
    this.notification = value ? "Reduced motion enabled." : "Cinematic damping restored.";
    this.publishStatus(true);
  }

  private setWeather(value: WeatherMode): void {
    this.weatherMode = value;
    this.weather.setMode(value);
    this.notification = value === "clear" ? "Dry visibility profile active." : `${value.toUpperCase()} weather lattice active.`;
    this.publishStatus(true);
  }

  private setShowcase(value: boolean): void {
    this.showcase = value;
    this.camera.setShowcase(value);
    this.notification = value ? "Showcase camera active. Traversal input held." : "Showcase released. Traversal input restored.";
    this.publishStatus(true);
  }

  private publishStatus(force = false): void {
    if (!force && this.phase === "loading") return;
    const target = this.player.target;
    const status: GameStatus = {
      phase: this.phase,
      character: this.player.selected,
      traversal: this.player.traversal,
      speed: Math.round(this.player.getSpeed() * 3.6),
      momentum: this.player.getMomentum(),
      target: target ? `${target.kind.toUpperCase()} LINK` : "SCANNING",
      targetDistance: target ? Math.round(target.position.subtract(this.player.root.position).length()) : 0,
      quality: this.quality.current,
      fps: Math.round(this.scene.getEngine().getFps()),
      notification: this.notification,
      menuHint: "WASD move · Space jump · LMB swing · RMB zip · Q wall-run · E dive",
      weather: this.weatherMode,
      showcase: this.showcase,
      challenge: this.challenge.readout(),
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
    listen("megapolis:pause", () => this.togglePause());
    listen("megapolis:restart", () => this.restart());
  }
}
