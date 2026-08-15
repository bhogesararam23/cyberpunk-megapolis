import { NullEngine, Scene, Vector3 } from "@babylonjs/core";
import { describe, expect, it } from "vitest";
import { ChallengeManager } from "./ChallengeManager";
import { ProgressionManager } from "./ProgressionManager";

describe("persistent city progression", () => {
  it("charts a landmark once and awards a signal record", () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const progression = new ProgressionManager(scene);
    const result = progression.update(new Vector3(57, 12, -59), 12, 0.4);
    expect(result).toContain("SPECTRUM PORTAL");
    expect(progression.readout()).toMatchObject({ discoveries: 1, discoveryTotal: 6, credits: 125 });
    expect(progression.update(new Vector3(57, 12, -59), 12, 0.4)).toBeNull();
    progression.dispose(); scene.dispose(); engine.dispose();
  });

  it("rotates to a new contract and waits for a physical route start", () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const challenge = new ChallengeManager(scene);
    challenge.start();
    for (let index = 0; index < 5; index += 1) {
      const target = challenge.getActivePosition();
      expect(target).not.toBeNull();
      challenge.update(target!, 0.2);
    }
    expect(challenge.readout().state).toBe("complete");
    challenge.nextRoute();
    expect(challenge.readout()).toMatchObject({ route: "MARKET DROP", state: "idle", node: 1, total: 5 });
    challenge.start();
    expect(challenge.readout().state).toBe("active");
    challenge.dispose(); scene.dispose(); engine.dispose();
  });
});
