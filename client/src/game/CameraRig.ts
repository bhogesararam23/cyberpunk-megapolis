// Aerial Transit Noir — a damped chase camera frames the travel corridor and respects obstructions.
import { UniversalCamera, Vector3 } from "@babylonjs/core";
import type { CityBuilder } from "./CityBuilder";

export class CameraRig {
  public readonly camera: UniversalCamera;
  private yaw = 0.4;
  private pitch = -0.16;
  private reducedMotion = false;

  public constructor(scene: import("@babylonjs/core").Scene, canvas: HTMLCanvasElement) {
    this.camera = new UniversalCamera("chase-camera", new Vector3(0, 5, -12), scene);
    this.camera.minZ = 0.05;
    this.camera.fov = 0.96;
    this.camera.inputs.clear();
    this.camera.attachControl(canvas, false);
  }

  public setReducedMotion(value: boolean): void {
    this.reducedMotion = value;
  }

  public getForward(): Vector3 {
    const cosPitch = Math.cos(this.pitch);
    return new Vector3(Math.sin(this.yaw) * cosPitch, Math.sin(this.pitch), Math.cos(this.yaw) * cosPitch).normalize();
  }

  public look(dx: number, dy: number): void {
    this.yaw -= dx * 0.0022;
    this.pitch = Math.max(-0.68, Math.min(0.32, this.pitch - dy * 0.0018));
  }

  public update(playerPosition: Vector3, speed: number, city: CityBuilder, delta: number, dramatic = false): void {
    const forward = this.getForward();
    const distance = 10.8 + Math.min(7.5, speed * 0.17) + (dramatic ? 1.8 : 0);
    const target = playerPosition.add(new Vector3(0, 1.65, 0)).add(forward.scale(7.5));
    const desired = playerPosition.add(new Vector3(0, 3.4 + (dramatic ? 1.2 : 0), 0)).subtract(forward.scale(distance));
    const safePosition = city.resolveCameraPath(target, desired);
    const damping = this.reducedMotion ? 1 : 1 - Math.exp(-delta * 9);
    this.camera.position = Vector3.Lerp(this.camera.position, safePosition, damping);
    this.camera.setTarget(target);
    this.camera.fov = 0.91 + Math.min(0.12, speed / 330);
  }
}
