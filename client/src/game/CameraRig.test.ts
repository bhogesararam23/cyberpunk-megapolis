import { NullEngine, Scene, Vector3 } from "@babylonjs/core";
import { describe, expect, it } from "vitest";
import { CameraRig } from "./CameraRig";
import { CityBuilder } from "./CityBuilder";

describe("camera rig traversal resilience", () => {
  it("keeps chase framing finite across rapid movement, impact signals, and reduced-motion showcase mode", () => {
    const engine = new NullEngine({ renderWidth: 1280, renderHeight: 720 });
    const scene = new Scene(engine);
    const city = new CityBuilder(scene);
    city.build();
    const rig = new CameraRig(scene, {} as HTMLCanvasElement);
    const position = new Vector3(0, 8, 0);

    try {
      for (let frame = 0; frame < 120; frame += 1) {
        position.x += 0.8;
        position.y = 8 + Math.sin(frame * 0.18) * 5;
        position.z += 1.35;
        rig.look(3.8, frame % 9 === 0 ? 260 : -2.5);
        rig.registerTraversalSignal({ type: "traversal", action: frame % 3 === 0 ? "web-attached" : "chain", state: "swing", speed: 42, chain: 6 });
        rig.update(position, 56, city, 1 / 60, true);
      }
      rig.setReducedMotion(true);
      rig.setShowcase(true);
      rig.setPhotoOptions({ orbitDistance: 14, orbitSpeed: 0.45, fov: 0.72 });
      for (let frame = 0; frame < 90; frame += 1) rig.update(position, 0, city, 1 / 30, false);

      expect([rig.camera.position.x, rig.camera.position.y, rig.camera.position.z, rig.camera.fov, rig.camera.rotation.z].every(Number.isFinite)).toBe(true);
      expect(rig.camera.fov).toBeGreaterThan(0.5);
      expect(rig.camera.fov).toBeLessThan(1.3);
      expect(rig.camera.fov).toBeCloseTo(0.72, 2);
      expect(Vector3.Distance(rig.camera.position, position)).toBeGreaterThan(12);
    } finally {
      rig.camera.dispose();
      city.dispose();
      scene.dispose();
      engine.dispose();
    }
  });
});
