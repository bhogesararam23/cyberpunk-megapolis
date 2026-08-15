// Aerial Transit Noir — engine-neutral checks protect core city interaction invariants.
import { NullEngine, Scene, Vector3 } from "@babylonjs/core";
import { afterEach, describe, expect, it } from "vitest";
import { CityBuilder } from "./CityBuilder";

const resources: Array<{ scene: Scene; engine: NullEngine; city: CityBuilder }> = [];

function createCity() {
  const engine = new NullEngine({ renderWidth: 1280, renderHeight: 720 });
  const scene = new Scene(engine);
  const city = new CityBuilder(scene);
  city.build();
  const resource = { scene, engine, city };
  resources.push(resource);
  return resource;
}

afterEach(() => {
  while (resources.length) {
    const resource = resources.pop();
    resource?.city.dispose();
    resource?.scene.dispose();
    resource?.engine.dispose();
  }
});

describe("city traversal lattice", () => {
  it("provides an unblocked ground surface and a forward-facing traversal anchor", () => {
    const { city } = createCity();
    expect(city.getSurfaceHeight(0, 0)).toBe(0);
    const anchor = city.findBestAnchor(new Vector3(0, 2, 0), new Vector3(1, 0, 0));
    expect(anchor).not.toBeNull();
    expect(anchor?.position.x).toBeGreaterThan(0);
  });

  it("resolves an attempted move into a tower rather than allowing an interior position", () => {
    const { city } = createCity();
    const start = new Vector3(-117, 2, -108);
    const end = new Vector3(-108, 2, -108);
    const resolved = city.resolveMove(start, end);
    expect(resolved.x).toBeLessThan(start.x);
    expect(resolved.x).toBeLessThan(end.x);
  });
});
