import { NullEngine, Scene, Vector3 } from "@babylonjs/core";
import { afterEach, describe, expect, it } from "vitest";
import { ObjectiveManager } from "./ObjectiveManager";
import type { CityBuilder } from "./CityBuilder";

const resources: Array<{ scene: Scene; engine: NullEngine; objectives: ObjectiveManager }> = [];

function createObjectives() {
  const engine = new NullEngine({ renderWidth: 1280, renderHeight: 720 });
  const scene = new Scene(engine);
  const nodes = [
    { id: "route-skyrail", label: "SKYRAIL CIRCUIT", district: "commercial-arcade", kind: "route", position: new Vector3(0, 8, 0) },
    { id: "civic-crown", label: "CIVIC CROWN", district: "civic-core", kind: "landmark", position: new Vector3(24, 32, 10) },
    { id: "market-ascent", label: "MARKET ASCENT", district: "vertical-market", kind: "vertical", position: new Vector3(20, 10, 50) },
    { id: "market-spine", label: "MARKET SPINE", district: "vertical-market", kind: "landmark", position: new Vector3(20, 42, 50) },
    { id: "route-foundry", label: "FOUNDRY VECTOR", district: "foundry", kind: "route", position: new Vector3(-25, 9, 22) },
    { id: "foundry-breath", label: "FOUNDRY BREATH", district: "foundry", kind: "landmark", position: new Vector3(-38, 16, 42) },
  ] as const;
  const city = { getNavigationNodes: () => nodes.map((node) => ({ ...node, position: node.position.clone() })) } as unknown as CityBuilder;
  const objectives = new ObjectiveManager(scene, city, []);
  resources.push({ scene, engine, objectives });
  return { objectives, nodes };
}

afterEach(() => {
  while (resources.length) {
    const resource = resources.pop();
    resource?.objectives.dispose();
    resource?.scene.dispose();
    resource?.engine.dispose();
  }
});

describe("local traversal objectives", () => {
  it("requires a real city start beacon and completes the armed route with a durable local record", () => {
    const { objectives, nodes } = createObjectives();
    expect(objectives.update(new Vector3(80, 0, 80), "run", 0, [], 0.25)).toBeNull();
    const started = objectives.update(nodes[0].position, "run", 0, [], 0.25);
    expect(started?.type).toBe("started");
    expect(objectives.readout().state).toBe("active");
    const complete = objectives.completeRoute();
    expect(complete?.type).toBe("completed");
    expect(complete?.reward).toBe(180);
    expect(objectives.readout().completed).toBe(1);
    expect(objectives.readout().state).toBe("locked");
    expect(objectives.syncUnlocks(["market-spine"])).toContain("MARKET ASCENT");
    const ascentStart = objectives.update(nodes[2].position, "wall-run", 1, ["market-spine"], 0.25);
    expect(ascentStart?.type).toBe("started");
    const ascentComplete = objectives.update(nodes[3].position, "swing", 3, ["market-spine"], 0.5);
    expect(ascentComplete?.type).toBe("completed");
    expect(objectives.readout().completed).toBe(2);
  });
});
