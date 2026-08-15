// Aerial Transit Noir — a predictive chase rig leads traversal lines while retaining calm, accessible showcase framing.
import { UniversalCamera, Vector3 } from "@babylonjs/core";
import type { CityBuilder } from "./CityBuilder";
import type { GameSignal } from "./GameSignals";

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
  private sensitivity = 1;
  private invertY = false;
  private screenShake = true;
  private baseFov = 0.96;
  private traversalEnergy = 0;
  private chainBias = 0;
  private sideLead = 0;
  private photoDistance = 10.5;
  private photoOrbitSpeed = 0.15;
  private photoFov = 0.9;

  public constructor(scene: import("@babylonjs/core").Scene, canvas: HTMLCanvasElement) {
    this.camera = new UniversalCamera("chase-camera", new Vector3(0, 5, -12), scene);
    this.camera.minZ = 0.05;
    this.camera.fov = 0.96;
    this.camera.inputs.clear();
    this.camera.attachControl(canvas, false);
  }

  public setReducedMotion(value: boolean): void { this.reducedMotion = value; }
  public setShowcase(value: boolean): void { this.showcase = value; }
  public setPhotoOptions(options: { orbitDistance?: number; orbitSpeed?: number; fov?: number }): void {
    if (options.orbitDistance !== undefined) this.photoDistance = Math.max(5, Math.min(18, options.orbitDistance));
    if (options.orbitSpeed !== undefined) this.photoOrbitSpeed = Math.max(0, Math.min(0.75, options.orbitSpeed));
    if (options.fov !== undefined) this.photoFov = Math.max(0.58, Math.min(1.2, options.fov));
  }

  public setPreferences(preferences: { sensitivity: number; invertY: boolean; screenShake: boolean; fov: number }): void {
    this.sensitivity = preferences.sensitivity;
    this.invertY = preferences.invertY;
    this.screenShake = preferences.screenShake;
    this.baseFov = preferences.fov;
  }

  public registerImpact(strength: number): void {
    if (this.reducedMotion || !this.screenShake) return;
    this.impact = Math.min(1, Math.max(this.impact, strength));
  }

  public registerTraversalSignal(signal: Extract<GameSignal, { type: "traversal" }>): void {
    const strength = signal.action === "web-attached" || signal.action === "zip-started" ? 1 : signal.action === "wall-kick" || signal.action === "chain" ? 0.78 : signal.action === "landed" ? 0.62 : 0.38;
    this.traversalEnergy = Math.max(this.traversalEnergy, strength);
    this.chainBias = Math.min(1, signal.chain * 0.14);
    this.sideLead = signal.action === "wall-kick" ? 1 : signal.action === "zip-started" ? -0.65 : this.sideLead;
    this.registerImpact(strength * 0.55);
  }

  public getForward(): Vector3 {
    const cosPitch = Math.cos(this.pitch);
    return new Vector3(Math.sin(this.yaw) * cosPitch, Math.sin(this.pitch), Math.cos(this.yaw) * cosPitch).normalize();
  }

  public look(dx: number, dy: number): void {
    this.yaw -= dx * 0.0022 * this.sensitivity;
    const vertical = dy * 0.0018 * this.sensitivity * (this.invertY ? -1 : 1);
    this.pitch = Math.max(-0.68, Math.min(0.32, this.pitch - vertical));
  }

  public update(playerPosition: Vector3, speed: number, city: CityBuilder, delta: number, dramatic = false): void {
    if (this.showcase && !this.reducedMotion) {
      this.yaw += delta * this.photoOrbitSpeed;
      this.pitch += (-0.08 - this.pitch) * Math.min(1, delta * 1.6);
    }
    const forward = this.getForward();
    const displacement = playerPosition.subtract(this.lastPosition);
    this.verticalVelocity = Vector3.Lerp(new Vector3(0, this.verticalVelocity, 0), new Vector3(0, displacement.y / Math.max(0.001, delta), 0), Math.min(1, delta * 8)).y;
    this.lastPosition.copyFrom(playerPosition);
    this.impact = Math.max(0, this.impact - delta * 2.7);
    this.traversalEnergy = Math.max(0, this.traversalEnergy - delta * 1.45);
    this.sideLead += (0 - this.sideLead) * Math.min(1, delta * 2.8);
    const speedRatio = Math.min(1, speed / 38);
    const distance = this.showcase ? this.photoDistance : 8.5 + Math.min(6.2, speed * 0.15) + (dramatic ? 1.5 : 0);
    const anticipation = Math.min(11.6, 5.2 + speed * 0.14);
    const verticalLead = Math.max(-1.8, Math.min(2.8, this.verticalVelocity * 0.05));
    const lateral = Vector3.Cross(new Vector3(0, 1, 0), forward).normalize().scale(this.sideLead * (0.7 + speedRatio * 0.9));
    const target = playerPosition.add(new Vector3(0, 1.65 + verticalLead + this.traversalEnergy * 0.34, 0)).add(forward.scale(anticipation + this.chainBias * 1.8)).add(lateral);
    const desired = this.showcase
      ? playerPosition.add(new Vector3(Math.cos(this.yaw) * distance, 4.2 + Math.sin(this.yaw * 0.72) * 1.4, Math.sin(this.yaw) * distance))
      : playerPosition.add(new Vector3(0, 3.4 + (dramatic ? 1.5 : 0) + speedRatio * 1.1 + this.traversalEnergy * 0.36, 0)).subtract(forward.scale(distance + this.chainBias * 1.1)).add(lateral.scale(0.28));
    const safePosition = city.resolveCameraPath(target, desired);
    const damping = this.reducedMotion ? 1 : 1 - Math.exp(-delta * (this.showcase ? 4.5 : dramatic ? 11 : 8));
    this.camera.position = Vector3.Lerp(this.camera.position, safePosition, damping);
    this.camera.setTarget(target);
    const desiredRoll = this.reducedMotion || this.showcase ? 0 : Math.max(-0.085, Math.min(0.085, -displacement.x * 0.018 + forward.x * speedRatio * 0.035));
    this.cameraRoll += (desiredRoll - this.cameraRoll) * Math.min(1, delta * 7);
    this.camera.rotation.z = this.cameraRoll + (this.reducedMotion ? 0 : Math.sin(performance.now() * 0.033) * this.impact * 0.018);
    const desiredFov = this.showcase ? this.photoFov : this.baseFov - 0.12 + Math.min(0.12, speed / 320) + (dramatic ? 0.014 : 0) + this.traversalEnergy * 0.022;
    this.camera.fov += (desiredFov - this.camera.fov) * Math.min(1, delta * 6);
  }
}
