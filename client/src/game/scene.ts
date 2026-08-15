// Aerial Transit Noir — scene assembly uses city geometry and dynamic lighting as a playable transport network.
import {
  Color3, Color4, DirectionalLight, Engine, GlowLayer, HemisphericLight, Scene, Vector3,
} from "@babylonjs/core";
import { CameraRig } from "./CameraRig";
import { AmbientCitySystem } from "./AmbientCitySystem";
import { CityBuilder } from "./CityBuilder";
import { GameWorld } from "./GameWorld";
import { InputManager } from "./InputManager";
import { PlayerController } from "./PlayerController";
import { QualityManager } from "./QualityManager";
import { WeatherSystem } from "./WeatherSystem";
import { TimeOfDaySystem } from "./TimeOfDaySystem";
import type { QualityPreset } from "./types";

export interface GameHandle {
  scene: Scene;
  dispose: () => void;
}

export async function createGameScene(engine: Engine, canvas: HTMLCanvasElement): Promise<GameHandle> {
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.012, 0.028, 0.07, 1);
  scene.fogMode = Scene.FOGMODE_EXP2;
  scene.fogColor = Color3.FromHexString("#07152a");
  scene.fogDensity = 0.0057;
  const dusk = new HemisphericLight("dusk-hemisphere", new Vector3(0, 1, 0), scene);
  dusk.diffuse = Color3.FromHexString("#5a799f");
  dusk.groundColor = Color3.FromHexString("#02060e");
  dusk.intensity = 0.6;
  const horizon = new DirectionalLight("amber-horizon", new Vector3(-0.45, -0.75, 0.35), scene);
  horizon.diffuse = Color3.FromHexString("#f4a567");
  horizon.intensity = 0.55;
  const glow = new GlowLayer("city-glow", scene, { mainTextureSamples: 2, blurKernelSize: 40 });
  glow.intensity = 0.68;
  const city = new CityBuilder(scene);
  city.build();
  const player = new PlayerController(scene);
  const camera = new CameraRig(scene, canvas);
  scene.activeCamera = camera.camera;
  const input = new InputManager(canvas);
  const weather = new WeatherSystem(scene);
  const timeOfDay = new TimeOfDaySystem(scene, dusk, horizon, glow);
  const ambient = new AmbientCitySystem(scene);
  let quality!: QualityManager;
  quality = new QualityManager(engine, scene, glow, (preset: QualityPreset) => {
    window.dispatchEvent(new CustomEvent<QualityPreset>("megapolis:quality-ready", { detail: preset }));
  });
  const world = new GameWorld(scene, input, city, player, camera, quality, weather, ambient, timeOfDay);
  scene.onBeforeRenderObservable.add(() => {
    const rawDelta = scene.getEngine().getDeltaTime() / 1000;
    const delta = Math.min(0.05, Math.max(0.001, rawDelta));
    if (world.shouldAdvanceEnvironment()) timeOfDay.update(delta, weather.currentMode);
    world.update(delta);
  });
  return {
    scene,
    dispose: () => {
      world.dispose();
      weather.dispose();
      glow.dispose();
      scene.dispose();
    },
  };
}
