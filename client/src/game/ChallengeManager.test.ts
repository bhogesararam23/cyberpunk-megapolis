import { NullEngine, Scene, Vector3 } from "@babylonjs/core";
import { afterEach, describe, expect, it } from "vitest";
import { ChallengeManager } from "./ChallengeManager";

const resources: Array<{ scene: Scene; engine: NullEngine; challenge: ChallengeManager }> = [];

function createChallenge() {
  const engine = new NullEngine({ renderWidth: 1280, renderHeight: 720 });
  const scene = new Scene(engine);
  const challenge = new ChallengeManager(scene);
  const resource = { scene, engine, challenge };
  resources.push(resource);
  return resource;
}

afterEach(() => {
  while (resources.length) {
    const resource = resources.pop();
    resource?.challenge.dispose();
    resource?.scene.dispose();
    resource?.engine.dispose();
  }
});

describe("Skyrail Circuit", () => {
  it("progresses deterministically through every route node and records a completed run", () => {
    const { challenge } = createChallenge();
    challenge.start();
    for (let index = 0; index < 5; index += 1) {
      const target = challenge.getActivePosition();
      expect(target).not.toBeNull();
      expect(challenge.update(target!, 1.25)).toBe(true);
    }
    const readout = challenge.readout();
    expect(readout.state).toBe("complete");
    expect(readout.node).toBe(5);
    expect(readout.elapsed).toBe(6.3);
    expect(readout.best).toBe(6.3);
    expect(readout.medal).toBe("kinetic");
  });

  it("does not advance when the player remains outside the active node radius", () => {
    const { challenge } = createChallenge();
    challenge.start();
    expect(challenge.update(challenge.getActivePosition()!.add(new Vector3(30, 0, 0)), 0.5)).toBe(false);
    expect(challenge.readout().node).toBe(1);
    expect(challenge.readout().state).toBe("active");
  });
});
