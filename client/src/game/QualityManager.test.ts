import { GlowLayer, NullEngine, Scene } from "@babylonjs/core";
import { afterEach, describe, expect, it } from "vitest";
import { QualityManager } from "./QualityManager";

const resources: Array<{ scene: Scene; engine: NullEngine; glow: GlowLayer }> = [];

function createQuality() {
  const engine = new NullEngine({ renderWidth: 1280, renderHeight: 720 });
  const scene = new Scene(engine);
  const glow = new GlowLayer("quality-test-glow", scene);
  const notices: string[] = [];
  const quality = new QualityManager(engine, scene, glow, (preset) => notices.push(preset));
  const resource = { scene, engine, glow };
  resources.push(resource);
  return { quality, notices, engine };
}

afterEach(() => {
  while (resources.length) {
    const resource = resources.pop();
    resource?.glow.dispose();
    resource?.scene.dispose();
    resource?.engine.dispose();
  }
});

describe("quality governor", () => {
  it("applies deterministic effect-density budgets for every manual preset", () => {
    const { quality } = createQuality();
    quality.apply("high");
    expect(quality.effectDensity).toBe(1);
    quality.apply("medium");
    expect(quality.effectDensity).toBe(0.68);
    quality.apply("low");
    expect(quality.effectDensity).toBe(0.38);
  });

  it("steps down from high to medium after a sustained slow frame window", () => {
    const { quality, notices } = createQuality();
    quality.apply("high");
    for (let index = 0; index < 120; index += 1) quality.update(0.041, (preset) => notices.push(preset));
    expect(quality.current).toBe("medium");
    expect(notices.at(-1)).toBe("medium");
  });
});
