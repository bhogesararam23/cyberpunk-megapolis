import { NullEngine, Scene, Vector3 } from "@babylonjs/core";
import { afterEach, describe, expect, it } from "vitest";
import { WeatherSystem } from "./WeatherSystem";

const resources: Array<{ scene: Scene; engine: NullEngine; weather: WeatherSystem }> = [];

function createWeather() {
  const engine = new NullEngine({ renderWidth: 1280, renderHeight: 720 });
  const scene = new Scene(engine);
  const weather = new WeatherSystem(scene, 100);
  const resource = { scene, engine, weather };
  resources.push(resource);
  return resource;
}

afterEach(() => {
  while (resources.length) {
    const resource = resources.pop();
    resource?.weather.dispose();
    resource?.scene.dispose();
    resource?.engine.dispose();
  }
});

describe("pooled weather", () => {
  it("reduces active rain instances according to the current quality density budget", () => {
    const { weather } = createWeather();
    expect(weather.activeDropCount).toBe(100);
    weather.setDensity(0.38);
    expect(weather.activeDropCount).toBe(38);
    weather.update(Vector3.Zero(), 0.016);
    weather.setDensity(3);
    expect(weather.activeDropCount).toBe(100);
  });

  it("clamps a zero density request to a visible minimum rather than dropping every cue", () => {
    const { weather } = createWeather();
    weather.setDensity(0);
    expect(weather.activeDropCount).toBe(10);
  });
});
