// Aerial Transit Noir — an original articulated avatar makes every traversal state physically readable.
import {
  Color3, LinesMesh, Mesh, MeshBuilder, StandardMaterial, TransformNode, Vector3,
} from "@babylonjs/core";
import type { CameraRig } from "./CameraRig";
import type { CityBuilder } from "./CityBuilder";
import type { Anchor, CharacterId, InputSnapshot, TraversalState } from "./types";

const UP = new Vector3(0, 1, 0);

export class PlayerController {
  public readonly root: TransformNode;
  public traversal: TraversalState = "idle";
  public velocity = Vector3.Zero();
  public target: Anchor | null = null;
  public selected: CharacterId = "vanta";
  public grounded = true;
  private swingAnchor: Anchor | null = null;
  private swingLength = 0;
  private zipAnchor: Anchor | null = null;
  private wallNormal: Vector3 | null = null;
  private readonly body: Mesh;
  private readonly head: Mesh;
  private readonly torso: Mesh;
  private readonly hip: Mesh;
  private readonly leftUpperArm: Mesh;
  private readonly rightUpperArm: Mesh;
  private readonly leftLowerArm: Mesh;
  private readonly rightLowerArm: Mesh;
  private readonly leftLeg: Mesh;
  private readonly rightLeg: Mesh;
  private readonly leftHand: TransformNode;
  private readonly rightHand: TransformNode;
  private readonly bodyMaterial: StandardMaterial;
  private readonly trimMaterial: StandardMaterial;
  private readonly webMaterial: StandardMaterial;
  private webLine: LinesMesh | null = null;
  private elapsed = 0;
  private lastMove = new Vector3(0, 0, 1);

  public constructor(private readonly scene: import("@babylonjs/core").Scene) {
    this.root = new TransformNode("player-root", scene);
    this.root.position.set(0, 2, 0);
    this.bodyMaterial = new StandardMaterial("player-body", scene);
    this.trimMaterial = new StandardMaterial("player-trim", scene);
    this.webMaterial = new StandardMaterial("web-emissive", scene);
    this.webMaterial.diffuseColor = Color3.FromHexString("#084551");
    this.webMaterial.emissiveColor = Color3.FromHexString("#43f6e8");
    this.webMaterial.specularColor = Color3.Black();
    this.body = MeshBuilder.CreateCapsule("avatar-body", { height: 2.2, radius: 0.42, tessellation: 8 }, scene);
    this.body.parent = this.root;
    this.body.position.y = 1.23;
    this.body.material = this.bodyMaterial;
    this.torso = MeshBuilder.CreateBox("avatar-torso", { width: 0.72, height: 0.9, depth: 0.35 }, scene);
    this.torso.parent = this.root;
    this.torso.position.y = 1.38;
    this.torso.material = this.trimMaterial;
    this.hip = MeshBuilder.CreateBox("avatar-hip", { width: 0.55, height: 0.28, depth: 0.34 }, scene);
    this.hip.parent = this.root;
    this.hip.position.y = 0.4;
    this.hip.material = this.bodyMaterial;
    this.head = MeshBuilder.CreateSphere("avatar-head", { diameter: 0.72, segments: 10 }, scene);
    this.head.parent = this.root;
    this.head.position.y = 2.32;
    this.head.material = this.bodyMaterial;
    this.leftUpperArm = this.limb("left-upper-arm", new Vector3(-0.57, 1.78, 0), new Vector3(0.25, 0.74, 0.25));
    this.rightUpperArm = this.limb("right-upper-arm", new Vector3(0.57, 1.78, 0), new Vector3(0.25, 0.74, 0.25));
    this.leftLowerArm = this.limb("left-lower-arm", new Vector3(-0.66, 1.22, 0), new Vector3(0.2, 0.62, 0.2));
    this.rightLowerArm = this.limb("right-lower-arm", new Vector3(0.66, 1.22, 0), new Vector3(0.2, 0.62, 0.2));
    this.leftLeg = this.limb("left-leg", new Vector3(-0.25, -0.25, 0), new Vector3(0.3, 0.96, 0.3));
    this.rightLeg = this.limb("right-leg", new Vector3(0.25, -0.25, 0), new Vector3(0.3, 0.96, 0.3));
    this.leftHand = this.hand("left-hand", new Vector3(-0.69, 0.85, 0));
    this.rightHand = this.hand("right-hand", new Vector3(0.69, 0.85, 0));
    this.setCharacter("vanta");
  }

  public setCharacter(character: CharacterId): void {
    this.selected = character;
    const vanta = character === "vanta";
    this.bodyMaterial.diffuseColor = Color3.FromHexString(vanta ? "#172131" : "#e0e5e8");
    this.bodyMaterial.emissiveColor = Color3.FromHexString(vanta ? "#0d1728" : "#20334a");
    this.trimMaterial.diffuseColor = Color3.FromHexString(vanta ? "#4f2d18" : "#183e49");
    this.trimMaterial.emissiveColor = Color3.FromHexString(vanta ? "#f6a84d" : "#43f6e8");
  }

  public reset(position = new Vector3(0, 2, 0)): void {
    this.root.position.copyFrom(position);
    this.velocity.set(0, 0, 0);
    this.traversal = "idle";
    this.swingAnchor = null;
    this.zipAnchor = null;
    this.target = null;
    this.webLine?.dispose();
    this.webLine = null;
  }

  public update(input: InputSnapshot, camera: CameraRig, city: CityBuilder, delta: number, allowInput: boolean): void {
    this.elapsed += delta;
    this.target = city.findBestAnchor(this.root.position.add(new Vector3(0, 1.1, 0)), camera.getForward());
    if (!allowInput) {
      this.animatePose(delta);
      this.updateWebVisual();
      return;
    }
    if (input.jumpPressed && this.grounded) {
      this.velocity.y = 11.2;
      this.grounded = false;
      this.traversal = "jump";
    }
    if (input.swingPressed && this.target) this.startSwing(this.target);
    if (input.zipPressed && this.target) this.startZip(this.target);
    if (!input.swingHeld && this.swingAnchor) {
      this.swingAnchor = null;
      this.traversal = "fall";
    }
    this.applyTraversal(input, camera, city, delta);
    this.integrate(city, delta);
    this.updateFacing();
    this.animatePose(delta);
    this.updateWebVisual();
  }

  public getSpeed(): number {
    return Math.hypot(this.velocity.x, this.velocity.z);
  }

  public getMomentum(): number {
    return Math.min(100, Math.round(this.velocity.length() * 2.5));
  }

  public getHandPosition(): Vector3 {
    return this.rightHand.getAbsolutePosition();
  }

  public dispose(): void {
    this.webLine?.dispose();
    this.root.dispose(false, true);
    this.bodyMaterial.dispose();
    this.trimMaterial.dispose();
    this.webMaterial.dispose();
  }

  private applyTraversal(input: InputSnapshot, camera: CameraRig, city: CityBuilder, delta: number): void {
    const forward = camera.getForward();
    forward.y = 0;
    forward.normalize();
    const right = Vector3.Cross(forward, UP).normalize();
    const desired = forward.scale(input.moveY).add(right.scale(input.moveX));
    if (desired.lengthSquared() > 0.01) desired.normalize();
    if (this.swingAnchor) {
      const hand = this.getHandPosition();
      const rope = this.swingAnchor.position.subtract(hand);
      const distance = rope.length();
      const direction = rope.scale(1 / Math.max(0.001, distance));
      if (distance > this.swingLength) this.velocity.addInPlace(direction.scale((distance - this.swingLength) * 18 * delta));
      this.velocity.y -= 8.4 * delta;
      if (desired.lengthSquared() > 0) this.velocity.addInPlace(desired.scale(10 * delta));
      this.traversal = "swing";
      return;
    }
    if (this.zipAnchor) {
      const toAnchor = this.zipAnchor.position.subtract(this.root.position);
      const distance = toAnchor.length();
      if (distance < 3.2) {
        this.zipAnchor = null;
        this.traversal = "fall";
      } else {
        const desiredVelocity = toAnchor.scale(1 / distance).scale(42);
        this.velocity = Vector3.Lerp(this.velocity, desiredVelocity, Math.min(1, delta * 5.4));
        this.traversal = "zip";
        return;
      }
    }
    this.wallNormal = !this.grounded && input.wallRunHeld ? city.findWall(this.root.position) : null;
    if (this.wallNormal) {
      const tangent = Vector3.Cross(UP, this.wallNormal).normalize();
      const direction = desired.lengthSquared() > 0.01 && Vector3.Dot(tangent, desired) < 0 ? tangent.scale(-1) : tangent;
      this.velocity = Vector3.Lerp(this.velocity, direction.scale(16), Math.min(1, delta * 5.5));
      this.velocity.y = Math.max(-1.7, this.velocity.y - 2.2 * delta);
      this.traversal = "wall-run";
      return;
    }
    if (input.diveHeld && !this.grounded) {
      this.velocity.y -= 26 * delta;
      if (desired.lengthSquared() > 0) this.velocity.addInPlace(desired.scale(4.5 * delta));
      this.traversal = "dive";
      return;
    }
    if (this.grounded) {
      const pace = input.sprint ? 21 : 13.5;
      const desiredVelocity = desired.scale(pace);
      this.velocity.x += (desiredVelocity.x - this.velocity.x) * Math.min(1, delta * 12);
      this.velocity.z += (desiredVelocity.z - this.velocity.z) * Math.min(1, delta * 12);
      if (desired.lengthSquared() < 0.01) {
        this.velocity.x *= Math.exp(-delta * 10);
        this.velocity.z *= Math.exp(-delta * 10);
      }
      this.traversal = this.getSpeed() > 4 ? (input.sprint ? "sprint" : "run") : "idle";
      return;
    }
    this.velocity.y -= 23 * delta;
    if (desired.lengthSquared() > 0) this.velocity.addInPlace(desired.scale(14 * delta));
    const horizontal = new Vector3(this.velocity.x, 0, this.velocity.z);
    if (horizontal.length() > 32) {
      horizontal.normalize().scaleInPlace(32);
      this.velocity.x = horizontal.x;
      this.velocity.z = horizontal.z;
    }
    this.traversal = this.velocity.y > 1.2 ? "jump" : "fall";
  }

  private integrate(city: CityBuilder, delta: number): void {
    const steps = Math.max(1, Math.ceil(this.velocity.length() * delta / 1.4));
    const stepDelta = delta / steps;
    for (let step = 0; step < steps; step += 1) {
      const previous = this.root.position.clone();
      const candidate = previous.add(this.velocity.scale(stepDelta));
      const solved = city.resolveMove(previous, candidate);
      if (Math.abs(solved.x - candidate.x) > 0.03) this.velocity.x = 0;
      if (Math.abs(solved.z - candidate.z) > 0.03) this.velocity.z = 0;
      this.root.position.copyFrom(solved);
    }
    const probes = [[0, 0], [0.34, 0], [-0.34, 0], [0, 0.34], [0, -0.34]];
    const floor = Math.max(...probes.map(([x, z]) => city.getSurfaceHeight(this.root.position.x + x, this.root.position.z + z)));
    const wasAirborne = !this.grounded;
    this.grounded = this.root.position.y <= floor + 0.08 && this.velocity.y <= 0;
    if (this.grounded) {
      this.root.position.y = floor;
      if (wasAirborne && this.velocity.y < -7) this.traversal = "landing";
      this.velocity.y = 0;
    }
    if (this.root.position.y < -24) this.reset(new Vector3(0, 2, 0));
  }

  private startSwing(anchor: Anchor): void {
    this.swingAnchor = anchor;
    this.zipAnchor = null;
    const distance = Vector3.Distance(this.getHandPosition(), anchor.position);
    this.swingLength = Math.max(11, distance * 0.9);
    this.traversal = "swing";
  }

  private startZip(anchor: Anchor): void {
    this.zipAnchor = anchor;
    this.swingAnchor = null;
    this.traversal = "zip";
  }

  private updateFacing(): void {
    const planar = new Vector3(this.velocity.x, 0, this.velocity.z);
    if (planar.lengthSquared() > 1.1) {
      planar.normalize();
      this.lastMove = Vector3.Lerp(this.lastMove, planar, 0.16).normalize();
      this.root.rotation.y = Math.atan2(this.lastMove.x, this.lastMove.z);
    }
  }

  private animatePose(delta: number): void {
    const runWave = Math.sin(this.elapsed * (this.traversal === "sprint" ? 15 : 10));
    const blend = Math.min(1, delta * 12);
    let arm = 0;
    let leg = 0;
    let lean = 0;
    if (this.traversal === "run" || this.traversal === "sprint") {
      arm = runWave * 0.75;
      leg = -runWave * 0.8;
      lean = this.traversal === "sprint" ? 0.24 : 0.11;
    } else if (this.traversal === "swing" || this.traversal === "zip") {
      arm = -1.35;
      leg = 0.44;
      lean = 0.55;
    } else if (this.traversal === "wall-run") {
      arm = 1.18;
      leg = -0.55;
      lean = 0.7;
    } else if (this.traversal === "dive") {
      arm = -1.52;
      leg = 0.75;
      lean = 1.15;
    } else if (this.traversal === "jump" || this.traversal === "fall") {
      arm = -0.62;
      leg = 0.32;
      lean = 0.28;
    } else if (this.traversal === "landing") {
      arm = 0.55;
      leg = -0.85;
      lean = -0.25;
    }
    this.root.rotation.x += (lean - this.root.rotation.x) * blend;
    this.leftUpperArm.rotation.x += (arm - this.leftUpperArm.rotation.x) * blend;
    this.rightUpperArm.rotation.x += ((-arm) - this.rightUpperArm.rotation.x) * blend;
    this.leftLowerArm.rotation.x += ((arm * 0.58) - this.leftLowerArm.rotation.x) * blend;
    this.rightLowerArm.rotation.x += ((-arm * 0.58) - this.rightLowerArm.rotation.x) * blend;
    this.leftLeg.rotation.x += (leg - this.leftLeg.rotation.x) * blend;
    this.rightLeg.rotation.x += ((-leg) - this.rightLeg.rotation.x) * blend;
  }

  private updateWebVisual(): void {
    const anchor = this.swingAnchor ?? this.zipAnchor;
    if (!anchor) {
      this.webLine?.dispose();
      this.webLine = null;
      return;
    }
    const start = this.getHandPosition();
    const end = anchor.position;
    const middle = Vector3.Lerp(start, end, 0.5).add(new Vector3(0, Math.max(1.5, Vector3.Distance(start, end) * 0.12), 0));
    const points = [start, Vector3.Lerp(start, middle, 0.55), Vector3.Lerp(middle, end, 0.55), end];
    const line = MeshBuilder.CreateLines("active-web", { points, instance: this.webLine ?? undefined, updatable: true }, this.scene);
    line.color = Color3.FromHexString(this.zipAnchor ? "#f6a84d" : "#43f6e8");
    this.webLine = line;
  }

  private limb(name: string, position: Vector3, size: Vector3): Mesh {
    const limb = MeshBuilder.CreateBox(name, { width: size.x, height: size.y, depth: size.z }, this.scene);
    limb.parent = this.root;
    limb.position.copyFrom(position);
    limb.material = this.bodyMaterial;
    return limb;
  }

  private hand(name: string, position: Vector3): TransformNode {
    const hand = new TransformNode(name, this.scene);
    hand.parent = this.root;
    hand.position.copyFrom(position);
    const mesh = MeshBuilder.CreateSphere(`${name}-mesh`, { diameter: 0.24, segments: 6 }, this.scene);
    mesh.parent = hand;
    mesh.material = this.trimMaterial;
    return hand;
  }
}
