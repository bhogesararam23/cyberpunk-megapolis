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
  private secondarySwingAnchor: Anchor | null = null;
  private swingLength = 0;
  private swingTension = 0;
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
  private readonly pulseCore: Mesh;
  private trimBase = Color3.FromHexString("#f6a84d");
  private webLine: LinesMesh | null = null;
  private secondaryWebLine: LinesMesh | null = null;
  private elapsed = 0;
  private lastMove = new Vector3(0, 0, 1);
  private jumpBuffer = 0;
  private coyoteTime = 0;
  private landingImpact = 0;

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
    this.pulseCore = MeshBuilder.CreateBox("avatar-pulse-core", { width: 0.28, height: 0.38, depth: 0.08 }, scene);
    this.pulseCore.parent = this.root;
    this.pulseCore.position.set(0, 1.42, 0.23);
    this.pulseCore.material = this.trimMaterial;
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
    for (const [x, name] of [[-0.25, "left-boot-signal"], [0.25, "right-boot-signal"]] as const) {
      const bootSignal = MeshBuilder.CreateBox(name, { width: 0.17, height: 0.08, depth: 0.34 }, scene);
      bootSignal.parent = this.root;
      bootSignal.position.set(x, -0.78, 0.1);
      bootSignal.material = this.trimMaterial;
    }
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
    this.trimBase = Color3.FromHexString(vanta ? "#f6a84d" : "#43f6e8");
    this.trimMaterial.emissiveColor = this.trimBase.clone();
  }

  public reset(position = new Vector3(0, 2, 0)): void {
    this.root.position.copyFrom(position);
    this.velocity.set(0, 0, 0);
    this.traversal = "idle";
    this.swingAnchor = null;
    this.secondarySwingAnchor = null;
    this.swingTension = 0;
    this.zipAnchor = null;
    this.target = null;
    this.webLine?.dispose();
    this.secondaryWebLine?.dispose();
    this.webLine = null;
    this.secondaryWebLine = null;
  }

  public update(input: InputSnapshot, camera: CameraRig, city: CityBuilder, delta: number, allowInput: boolean): void {
    this.elapsed += delta;
    this.target = city.findBestAnchor(this.root.position.add(new Vector3(0, 1.1, 0)), camera.getForward(), this.velocity);
    if (!allowInput) {
      this.animatePose(delta);
      this.updateWebVisual();
      return;
    }
    this.jumpBuffer = Math.max(0, this.jumpBuffer - delta);
    this.coyoteTime = Math.max(0, this.coyoteTime - delta);
    this.landingImpact = Math.max(0, this.landingImpact - delta * 2.8);
    if (input.jumpPressed) this.jumpBuffer = 0.14;
    if (this.jumpBuffer > 0 && (this.grounded || this.coyoteTime > 0)) {
      this.velocity.y = 11.2;
      this.grounded = false;
      this.traversal = "jump";
      this.jumpBuffer = 0;
      this.coyoteTime = 0;
    }
    if (input.swingPressed && this.target) this.startSwing(this.target, city, camera);
    if (input.zipPressed && this.target) this.startZip(this.target);
    if (!input.swingHeld && this.swingAnchor) {
      this.releaseSwing();
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

  public consumeImpact(): number {
    const impact = this.landingImpact;
    this.landingImpact = 0;
    return impact;
  }

  public getHandPosition(): Vector3 {
    return this.rightHand.getAbsolutePosition();
  }

  public dispose(): void {
    this.webLine?.dispose();
    this.secondaryWebLine?.dispose();
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
      const stretch = Math.max(0, distance - this.swingLength);
      const outwardVelocity = Math.max(0, -Vector3.Dot(this.velocity, direction));
      this.swingTension = Math.min(1, stretch / Math.max(1, this.swingLength * 0.16) + Math.min(0.46, this.getSpeed() / 82));
      if (stretch > 0) {
        this.velocity.addInPlace(direction.scale((stretch * 42 + outwardVelocity * 1.18) * delta));
        if (outwardVelocity > 0.1) this.velocity.addInPlace(direction.scale(outwardVelocity * 0.7));
      }
      this.velocity.y -= (9.3 - this.swingTension * 2.1) * delta;
      if (desired.lengthSquared() > 0) this.velocity.addInPlace(desired.scale((11 + this.swingTension * 8) * delta));
      if (this.secondarySwingAnchor) {
        const secondDirection = this.secondarySwingAnchor.position.subtract(this.getHandPosition()).normalize();
        this.velocity.addInPlace(secondDirection.scale(3.4 * this.swingTension * delta));
      }
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
        const targetSpeed = Math.min(58, 26 + distance * 0.46);
        const brake = distance < 16 ? Math.max(0.38, distance / 16) : 1;
        const desiredVelocity = toAnchor.scale(1 / distance).scale(targetSpeed * brake);
        this.velocity = Vector3.Lerp(this.velocity, desiredVelocity, Math.min(1, delta * (8.4 - brake * 2.2)));
        this.traversal = "zip";
        return;
      }
    }
    this.wallNormal = !this.grounded && input.wallRunHeld ? city.findWall(this.root.position) : null;
    if (this.wallNormal) {
      const tangent = Vector3.Cross(UP, this.wallNormal).normalize();
      const direction = desired.lengthSquared() > 0.01 && Vector3.Dot(tangent, desired) < 0 ? tangent.scale(-1) : tangent;
      if (this.jumpBuffer > 0) {
        this.velocity = direction.scale(17.5).add(this.wallNormal.scale(8.8)).add(UP.scale(12.4));
        this.wallNormal = null;
        this.jumpBuffer = 0;
        this.traversal = "jump";
        return;
      }
      this.velocity = Vector3.Lerp(this.velocity, direction.scale(18.2), Math.min(1, delta * 7.2));
      this.velocity.y = Math.max(-1.15, this.velocity.y - 1.5 * delta);
      this.traversal = "wall-run";
      return;
    }
    if (input.diveHeld && !this.grounded) {
      this.velocity.y = Math.max(-46, this.velocity.y - 31 * delta);
      if (desired.lengthSquared() > 0) this.velocity.addInPlace(desired.scale(7.2 * delta));
      this.traversal = "dive";
      return;
    }
    if (this.grounded) {
      const pace = input.sprint ? 21 : 13.5;
      const desiredVelocity = desired.scale(pace);
      const response = input.sprint ? 15.5 : 12.5;
      this.velocity.x += (desiredVelocity.x - this.velocity.x) * Math.min(1, delta * response);
      this.velocity.z += (desiredVelocity.z - this.velocity.z) * Math.min(1, delta * response);
      if (desired.lengthSquared() < 0.01) {
        this.velocity.x *= Math.exp(-delta * 7.2);
        this.velocity.z *= Math.exp(-delta * 7.2);
      }
      this.traversal = this.getSpeed() > 4 ? (input.sprint ? "sprint" : "run") : "idle";
      return;
    }
    this.velocity.y -= 23 * delta;
    if (desired.lengthSquared() > 0) this.velocity.addInPlace(desired.scale(16.5 * delta));
    this.velocity.x *= Math.exp(-delta * 0.22);
    this.velocity.z *= Math.exp(-delta * 0.22);
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
      if (wasAirborne && this.velocity.y < -7) {
        this.landingImpact = Math.min(1, Math.abs(this.velocity.y) / 28);
        this.traversal = "landing";
      }
      this.velocity.y = 0;
      this.coyoteTime = 0.12;
    } else if (!wasAirborne) {
      this.coyoteTime = 0.12;
    }
    if (this.root.position.y < -24) this.reset(new Vector3(0, 2, 0));
  }

  private startSwing(anchor: Anchor, city: CityBuilder, camera: CameraRig): void {
    this.swingAnchor = anchor;
    this.secondarySwingAnchor = this.getSpeed() > 16 ? city.findSecondaryAnchor(this.root.position, camera.getForward(), anchor.id, this.velocity) : null;
    this.zipAnchor = null;
    const distance = Vector3.Distance(this.getHandPosition(), anchor.position);
    this.swingLength = Math.max(10, distance * (this.getSpeed() > 20 ? 0.94 : 0.88));
    this.swingTension = 0.18;
    this.traversal = "swing";
  }

  private releaseSwing(): void {
    if (!this.swingAnchor) return;
    const fromAnchor = this.getHandPosition().subtract(this.swingAnchor.position).normalize();
    const outward = Math.max(0, Vector3.Dot(this.velocity, fromAnchor));
    if (outward > 0) this.velocity.subtractInPlace(fromAnchor.scale(outward * 0.5));
    const forwardBoost = new Vector3(this.lastMove.x, 0, this.lastMove.z).normalize().scale(3.5 + Math.min(9, this.getSpeed() * 0.16));
    this.velocity.addInPlace(forwardBoost);
    this.swingAnchor = null;
    this.secondarySwingAnchor = null;
    this.swingTension = 0;
    this.traversal = "fall";
  }

  private startZip(anchor: Anchor): void {
    this.zipAnchor = anchor;
    this.swingAnchor = null;
    this.secondarySwingAnchor = null;
    this.swingTension = 0;
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
      arm = -1.35 - this.swingTension * 0.18;
      leg = 0.44 + Math.sin(this.elapsed * 8) * 0.12;
      lean = 0.55 + this.swingTension * 0.22;
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
    const kinetic = Math.min(1, this.getSpeed() / 32) + this.swingTension * 0.8 + (this.traversal === "zip" ? 0.5 : 0) + this.landingImpact * 0.65;
    const pulse = 0.8 + kinetic * 0.5 + Math.sin(this.elapsed * 9) * 0.08;
    this.pulseCore.scaling.set(1, pulse, 1);
    this.trimMaterial.emissiveColor = this.trimBase.scale(0.68 + kinetic * 0.46);
  }

  private updateWebVisual(): void {
    const anchor = this.swingAnchor ?? this.zipAnchor;
    if (!anchor) {
      this.webLine?.dispose();
      this.secondaryWebLine?.dispose();
      this.webLine = null;
      this.secondaryWebLine = null;
      return;
    }
    const start = this.getHandPosition();
    const end = anchor.position;
    const distance = Vector3.Distance(start, end);
    const sag = Math.max(0.38, distance * (0.055 + (1 - this.swingTension) * 0.055));
    const middle = Vector3.Lerp(start, end, 0.5).add(new Vector3(0, -sag, 0));
    const pulse = Math.sin(this.elapsed * (10 + this.getSpeed() * 0.16)) * Math.min(0.35, this.getSpeed() * 0.008);
    const points = [start, Vector3.Lerp(start, middle, 0.42).add(new Vector3(0, pulse, 0)), middle, Vector3.Lerp(middle, end, 0.58).add(new Vector3(0, -pulse, 0)), end];
    const line = MeshBuilder.CreateLines("active-web", { points, instance: this.webLine ?? undefined, updatable: true }, this.scene);
    line.color = Color3.FromHexString(this.zipAnchor ? "#f6a84d" : "#43f6e8");
    this.webLine = line;
    if (this.secondarySwingAnchor) {
      const secondStart = this.leftHand.getAbsolutePosition();
      const secondEnd = this.secondarySwingAnchor.position;
      const secondaryMid = Vector3.Lerp(secondStart, secondEnd, 0.5).add(new Vector3(0, -sag * 0.72, 0));
      const secondary = MeshBuilder.CreateLines("secondary-web", { points: [secondStart, secondaryMid, secondEnd], instance: this.secondaryWebLine ?? undefined, updatable: true }, this.scene);
      secondary.color = Color3.FromHexString("#77fff5");
      this.secondaryWebLine = secondary;
    } else {
      this.secondaryWebLine?.dispose();
      this.secondaryWebLine = null;
    }
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
