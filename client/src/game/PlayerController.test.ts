import { NullEngine, Scene, Vector3 } from "@babylonjs/core";
import { afterEach, describe, expect, it } from "vitest";
import { CityBuilder } from "./CityBuilder";
import { PlayerController } from "./PlayerController";
import type { CameraRig } from "./CameraRig";
import type { InputSnapshot } from "./types";

const resources: Array<{ scene: Scene; engine: NullEngine; city: CityBuilder; player: PlayerController }> = [];
const camera = { getForward: () => new Vector3(0.4, 0, 1).normalize() } as CameraRig;
const idle: InputSnapshot = {
  moveX: 0, moveY: 0, lookX: 0, lookY: 0, sprint: false, swingHeld: false, wallRunHeld: false,
  diveHeld: false, jumpPressed: false, swingPressed: false, zipPressed: false, pausePressed: false,
  restartPressed: false, enterPressed: false,
};

function createTraversal() {
  const engine = new NullEngine({ renderWidth: 1280, renderHeight: 720 });
  const scene = new Scene(engine);
  const city = new CityBuilder(scene);
  city.build();
  const player = new PlayerController(scene);
  const resource = { scene, engine, city, player };
  resources.push(resource);
  return resource;
}

afterEach(() => {
  while (resources.length) {
    const resource = resources.pop();
    resource?.player.dispose();
    resource?.city.dispose();
    resource?.scene.dispose();
    resource?.engine.dispose();
  }
});

describe("player traversal smoke path", () => {
  it("transitions from grounded idle into a buffered jump with upward velocity", () => {
    const { city, player } = createTraversal();
    player.root.position.set(0, 0, 0);
    player.grounded = true;

    player.update({ ...idle, jumpPressed: true }, camera, city, 1 / 60, true);

    expect(player.traversal).toBe("jump");
    expect(player.grounded).toBe(false);
    expect(player.velocity.y).toBeGreaterThan(0);
  });

  it("acquires an anchor, starts a swing, and retains forward momentum when released", () => {
    const { city, player } = createTraversal();
    player.root.position.set(0, 8, 0);
    player.grounded = false;
    player.velocity.set(8, 0, 14);

    player.update(idle, camera, city, 1 / 60, true);
    expect(player.target).not.toBeNull();

    player.update({ ...idle, swingHeld: true, swingPressed: true, moveY: 1 }, camera, city, 1 / 60, true);
    expect(player.traversal).toBe("swing");

    player.update({ ...idle, moveY: 1 }, camera, city, 1 / 60, true);
    expect(player.traversal).toBe("fall");
    expect(player.getSpeed()).toBeGreaterThan(1);
  });

  it("keeps extreme airborne input finite and restores a bounded horizontal velocity", () => {
    const { city, player } = createTraversal();
    player.root.position.set(0, 34, 0);
    player.grounded = false;
    player.velocity.set(360, -120, 300);

    for (let frame = 0; frame < 90; frame += 1) {
      player.update({ ...idle, moveX: 1, moveY: 1, diveHeld: frame < 12 }, camera, city, 1 / 60, true);
    }

    expect([player.root.position.x, player.root.position.y, player.root.position.z, player.velocity.x, player.velocity.y, player.velocity.z].every(Number.isFinite)).toBe(true);
    expect(player.getSpeed()).toBeLessThanOrEqual(32.1);
    expect(player.root.position.y).toBeGreaterThanOrEqual(-24);
  });

  it("keeps a long zip bounded before recovering into a normal traversal state", () => {
    const { city, player } = createTraversal();
    player.root.position.set(0, 8, 0);
    player.grounded = false;
    player.velocity.set(12, 0, 20);
    player.update(idle, camera, city, 1 / 60, true);
    expect(player.target).not.toBeNull();

    player.update({ ...idle, zipPressed: true }, camera, city, 1 / 60, true);
    for (let frame = 0; frame < 180; frame += 1) player.update(idle, camera, city, 1 / 60, true);

    expect([player.root.position.x, player.root.position.y, player.root.position.z, player.velocity.x, player.velocity.y, player.velocity.z].every(Number.isFinite)).toBe(true);
    expect(player.velocity.length()).toBeLessThanOrEqual(60.1);
    expect(["zip", "fall", "landing", "idle", "run", "sprint", "jump"]).toContain(player.traversal);
  });
});
