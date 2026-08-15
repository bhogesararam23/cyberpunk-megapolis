// Aerial Transit Noir — a damped chase camera frames the travel corridor and respects obstructions.
import { UniversalCamera, Vector3 } from "@babylonjs/core";
import type { CityBuilder } from "./CityBuilder";

export class CameraRig {
  public readonly camera: UniversalCamera;
  private yaw = 0.4;
  private pitch = -0.16;
  private reducedMotion = false;
  private impact = 0;
  private cameraRoll = 0;
  private lastPosition = Vector3.Zero();
  private verticalVelocity = 0;
  private showcase = false;

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

  public setShowcase(value: boolean): void {
    this.showcase = value;
  }

  public registerImpact(strength: number): void {
    if (this.reducedMotion) return;
    this.impact = Math.min(1, Math.max(this.impact, strength));
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
    if (this.showcase && !this.reducedMotion) this.yaw += delta * 0.18;
    const forward = this.getForward();
    const displacement = playerPosition.subtract(this.lastPosition);
    this.verticalVelocity = Vector3.Lerp(new Vector3(0, this.verticalVelocity, 0), new Vector3(0, displacement.y / Math.max(0.001, delta), 0), Math.min(1, delta * 8)).y;
    this.lastPosition.copyFrom(playerPosition);
    this.impact = Math.max(0, this.impact - delta * 2.7);
    const speedRatio = Math.min(1, speed / 38);
    const distance = 8.5 + Math.min(6.2, speed * 0.15) + (dramatic ? 1.5 : 0);
    const anticipation = Math.min(11.6, 5.2 + speed * 0.14);
    const verticalLead = Math.max(-1.8, Math.min(2.8, this.verticalVelocity * 0.05));
    const target = playerPosition.add(new Vector3(0, 1.65 + verticalLead, 0)).add(forward.scale(anticipation));
    const orbitOffset = this.showcase ? new Vector3(Math.cos(this.yaw) * 3.2, 1.1, -Math.sin(this.yaw) * 3.2) : Vector3.Zero();
    const desired = playerPosition.add(new Vector3(0, 3.4 + (dramatic ? 1.5 : 0) + speedRatio * 1.1, 0)).subtract(forward.scale(distance)).add(orbitOffset);
    const safePosition = city.resolveCameraPath(target, desired);
    const damping = this.reducedMotion ? 1 : 1 - Math.exp(-delta * (dramatic ? 11 : 8));
    this.camera.position = Vector3.Lerp(this.camera.position, safePosition, damping);
    this.camera.setTarget(target);
    const desiredRoll = this.reducedMotion ? 0 : Math.max(-0.085, Math.min(0.085, -displacement.x * 0.018 + forward.x * speedRatio * 0.035));
    this.cameraRoll += (desiredRoll - this.cameraRoll) * Math.min(1, delta * 7);
    this.camera.rotation.z = this.cameraRoll + (this.reducedMotion ? 0 : Math.sin(performance.now() * 0.033) * this.impact * 0.018);
    this.camera.fov += ((0.84 + Math.min(0.12, speed / 320) + (dramatic ? 0.014 : 0)) - this.camera.fov) * Math.min(1, delta * 6);
  }
}
