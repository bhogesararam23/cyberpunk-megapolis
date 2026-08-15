// Aerial Transit Noir — procedural city meshes, collision boxes, and anchors share a single data-driven map.
import {
  Color3, Matrix, Mesh, MeshBuilder, Quaternion, StandardMaterial, TransformNode, Vector3,
} from "@babylonjs/core";
import type { Aabb, Anchor } from "./types";

const CYAN = Color3.FromHexString("#43f6e8");
const AMBER = Color3.FromHexString("#f6a84d");
const INK = Color3.FromHexString("#091324");

export class CityBuilder {
  public readonly collisions: Aabb[] = [];
  public readonly anchors: Anchor[] = [];
  public readonly root: TransformNode;
  private readonly dark: StandardMaterial;
  private readonly concrete: StandardMaterial;
  private readonly slate: StandardMaterial;
  private readonly warmWindow: StandardMaterial;
  private readonly coolWindow: StandardMaterial;
  private readonly cyanLight: StandardMaterial;
  private readonly amberLight: StandardMaterial;

  public constructor(private readonly scene: import("@babylonjs/core").Scene) {
    this.root = new TransformNode("megapolis-root", scene);
    this.dark = this.material("city-ink", INK, Color3.FromHexString("#101d31"));
    this.concrete = this.material("city-concrete", Color3.FromHexString("#18243a"), Color3.FromHexString("#172c40"));
    this.slate = this.material("city-slate", Color3.FromHexString("#243148"), Color3.FromHexString("#1d293e"));
    this.warmWindow = this.material("window-amber", Color3.FromHexString("#4a2f18"), AMBER.scale(0.85));
    this.coolWindow = this.material("window-cyan", Color3.FromHexString("#0f3640"), CYAN.scale(0.45));
    this.cyanLight = this.material("signal-cyan", Color3.FromHexString("#103b43"), CYAN);
    this.amberLight = this.material("signal-amber", Color3.FromHexString("#4b2d12"), AMBER);
  }

  public build(): void {
    this.createGroundAndRoads();
    this.createCityBlocks();
    this.createTransitNetwork();
    this.createDistantLandmarks();
  }

  public getSurfaceHeight(x: number, z: number): number {
    let floor = 0;
    for (const box of this.collisions) {
      if (x >= box.min.x && x <= box.max.x && z >= box.min.z && z <= box.max.z) floor = Math.max(floor, box.max.y);
    }
    return floor;
  }

  public resolveMove(previous: Vector3, candidate: Vector3, radius = 0.55): Vector3 {
    const result = candidate.clone();
    result.x = Math.max(-138, Math.min(138, result.x));
    result.z = Math.max(-138, Math.min(138, result.z));
    for (const box of this.collisions) {
      if (result.y > box.max.y + 1.65 || result.y < box.min.y - 0.1) continue;
      const insideX = result.x + radius > box.min.x && result.x - radius < box.max.x;
      const insideZ = result.z + radius > box.min.z && result.z - radius < box.max.z;
      if (!insideX || !insideZ) continue;
      const left = Math.abs((box.min.x - radius) - previous.x);
      const right = Math.abs((box.max.x + radius) - previous.x);
      const near = Math.min(left, right);
      const front = Math.abs((box.min.z - radius) - previous.z);
      const back = Math.abs((box.max.z + radius) - previous.z);
      if (near < Math.min(front, back)) result.x = left < right ? box.min.x - radius : box.max.x + radius;
      else result.z = front < back ? box.min.z - radius : box.max.z + radius;
    }
    return result;
  }

  public findBestAnchor(origin: Vector3, forward: Vector3): Anchor | null {
    let best: Anchor | null = null;
    let bestScore = -Infinity;
    for (const anchor of this.anchors) {
      const offset = anchor.position.subtract(origin);
      const distance = offset.length();
      if (distance < 7 || distance > 124) continue;
      const direction = offset.scale(1 / distance);
      const visibility = Vector3.Dot(direction, forward);
      if (visibility < -0.12 || this.segmentBlocked(origin, anchor.position)) continue;
      const score = visibility * 120 - distance + Math.min(28, Math.max(0, anchor.position.y - origin.y));
      if (score > bestScore) {
        bestScore = score;
        best = anchor;
      }
    }
    return best;
  }

  public findWall(position: Vector3): Vector3 | null {
    for (const box of this.collisions) {
      if (position.y > box.max.y + 1 || position.y < box.min.y + 1) continue;
      const withinZ = position.z > box.min.z - 1 && position.z < box.max.z + 1;
      const withinX = position.x > box.min.x - 1 && position.x < box.max.x + 1;
      if (withinZ && Math.abs(position.x - box.min.x) < 1.25) return new Vector3(-1, 0, 0);
      if (withinZ && Math.abs(position.x - box.max.x) < 1.25) return new Vector3(1, 0, 0);
      if (withinX && Math.abs(position.z - box.min.z) < 1.25) return new Vector3(0, 0, -1);
      if (withinX && Math.abs(position.z - box.max.z) < 1.25) return new Vector3(0, 0, 1);
    }
    return null;
  }

  public resolveCameraPath(target: Vector3, desired: Vector3): Vector3 {
    for (let step = 2; step < 10; step += 1) {
      const test = Vector3.Lerp(target, desired, step / 10);
      if (this.pointInSolid(test)) return Vector3.Lerp(target, desired, Math.max(0.24, (step - 2) / 10));
    }
    return desired;
  }

  public dispose(): void {
    this.root.dispose(false, true);
  }

  private material(name: string, diffuse: Color3, emissive: Color3): StandardMaterial {
    const material = new StandardMaterial(name, this.scene);
    material.diffuseColor = diffuse;
    material.emissiveColor = emissive;
    material.specularColor = Color3.Black();
    return material;
  }

  private createGroundAndRoads(): void {
    const ground = MeshBuilder.CreateGround("ground", { width: 310, height: 310, subdivisions: 2 }, this.scene);
    ground.material = this.dark;
    ground.parent = this.root;
    const roadMaterial = this.material("wet-road", Color3.FromHexString("#0d1827"), Color3.FromHexString("#071321"));
    for (let index = -120; index <= 120; index += 24) {
      const northSouth = MeshBuilder.CreateBox(`avenue-ns-${index}`, { width: 10.5, height: 0.12, depth: 300 }, this.scene);
      northSouth.position.set(index, 0.05, 0);
      northSouth.material = roadMaterial;
      northSouth.parent = this.root;
      const eastWest = MeshBuilder.CreateBox(`avenue-ew-${index}`, { width: 300, height: 0.13, depth: 10.5 }, this.scene);
      eastWest.position.set(0, 0.06, index);
      eastWest.material = roadMaterial;
      eastWest.parent = this.root;
      this.createLaneSignals(index, true);
      this.createLaneSignals(index, false);
    }
  }

  private createCityBlocks(): void {
    const windowMatrices: number[] = [];
    const coolWindowMatrices: number[] = [];
    const mat = new Matrix();
    for (let gx = -108; gx <= 108; gx += 24) {
      for (let gz = -108; gz <= 108; gz += 24) {
        if (Math.abs(gx) < 14 || Math.abs(gz) < 14) continue;
        const seed = this.hash(gx * 13.3 + gz * 4.7);
        const tallness = (1 - Math.min(1, Math.hypot(gx, gz) / 180)) * 44;
        const height = 23 + tallness + seed * 45;
        const width = 14.5 + this.hash(gx + gz) * 4.8;
        const depth = 14.5 + this.hash(gx - gz) * 4.8;
        const material = seed > 0.72 ? this.slate : seed > 0.4 ? this.concrete : this.dark;
        const building = MeshBuilder.CreateBox(`tower-${gx}-${gz}`, { width, height, depth }, this.scene);
        building.position.set(gx + (seed - 0.5) * 3, height / 2, gz + (this.hash(gz) - 0.5) * 3);
        building.material = material;
        building.parent = this.root;
        this.collisions.push({
          min: new Vector3(building.position.x - width / 2, 0, building.position.z - depth / 2),
          max: new Vector3(building.position.x + width / 2, height, building.position.z + depth / 2),
        });
        this.createRoofCluster(building.position.x, building.position.z, height, seed);
        for (let row = 4; row < height - 4; row += 4.2) {
          for (let column = -width / 2 + 1.4; column < width / 2 - 0.6; column += 2.4) {
            mat.copyFrom(Matrix.Translation(building.position.x + column, row, building.position.z - depth / 2 - 0.03));
            (this.hash(row + column + gx) > 0.23 ? windowMatrices : coolWindowMatrices).push(...mat.m);
            mat.copyFrom(Matrix.Translation(building.position.x + column, row, building.position.z + depth / 2 + 0.03));
            (this.hash(row - column + gz) > 0.35 ? windowMatrices : coolWindowMatrices).push(...mat.m);
            mat.copyFrom(Matrix.Compose(new Vector3(1, 1, 1), Quaternion.FromEulerAngles(0, Math.PI / 2, 0), new Vector3(building.position.x - width / 2 - 0.03, row, building.position.z + column)));
            (this.hash(row + column + gz * 0.7) > 0.31 ? windowMatrices : coolWindowMatrices).push(...mat.m);
            mat.copyFrom(Matrix.Compose(new Vector3(1, 1, 1), Quaternion.FromEulerAngles(0, Math.PI / 2, 0), new Vector3(building.position.x + width / 2 + 0.03, row, building.position.z + column)));
            (this.hash(row - column + gx * 0.4) > 0.38 ? windowMatrices : coolWindowMatrices).push(...mat.m);
          }
        }
        if (seed < 0.38) this.createServiceBuilding(building.position.x + (width * 0.72), building.position.z - (depth * 0.66), 8 + seed * 9);
        if (seed > 0.52) this.createSign(building.position.x, height * (0.42 + seed * 0.2), building.position.z - depth / 2 - 0.12, width * 0.58, seed > 0.77);
      }
    }
    this.createThinWindows("warm-window-instances", windowMatrices, this.warmWindow);
    this.createThinWindows("cool-window-instances", coolWindowMatrices, this.coolWindow);
  }

  private createTransitNetwork(): void {
    const railMaterial = this.material("rail-steel", Color3.FromHexString("#264256"), Color3.FromHexString("#113746"));
    const points = [
      new Vector3(-144, 22, -52), new Vector3(-72, 25, -52), new Vector3(0, 29, -52), new Vector3(72, 24, -52), new Vector3(144, 22, -52),
      new Vector3(-144, 22, 52), new Vector3(-72, 27, 52), new Vector3(0, 31, 52), new Vector3(72, 26, 52), new Vector3(144, 22, 52),
    ];
    for (let line = 0; line < 2; line += 1) {
      for (let part = 0; part < 4; part += 1) {
        const start = points[line * 5 + part];
        const end = points[line * 5 + part + 1];
        const delta = end.subtract(start);
        const length = delta.length();
        const beam = MeshBuilder.CreateBox(`skyrail-${line}-${part}`, { width: length, height: 1.4, depth: 4.5 }, this.scene);
        beam.position = start.add(end).scale(0.5);
        beam.rotation.y = -Math.atan2(delta.z, delta.x);
        beam.rotation.z = -Math.asin(delta.y / length);
        beam.material = railMaterial;
        beam.parent = this.root;
        this.collisions.push({ min: beam.position.subtract(new Vector3(length / 2, 0.7, 2.25)), max: beam.position.add(new Vector3(length / 2, 0.7, 2.25)) });
        this.anchors.push({ id: `rail-${line}-${part}`, position: beam.position.add(new Vector3(0, 4.5, 0)), kind: "rail" });
      }
    }
    for (const x of [-96, -48, 48, 96]) {
      const bridge = MeshBuilder.CreateBox(`bridge-${x}`, { width: 6.5, height: 1.1, depth: 176 }, this.scene);
      bridge.position.set(x, 16 + (Math.abs(x) / 20), 0);
      bridge.material = railMaterial;
      bridge.parent = this.root;
      this.collisions.push({ min: bridge.position.subtract(new Vector3(3.25, 0.55, 88)), max: bridge.position.add(new Vector3(3.25, 0.55, 88)) });
      this.anchors.push({ id: `bridge-${x}`, position: bridge.position.add(new Vector3(0, 4, 0)), kind: "bridge" });
    }
  }

  private createDistantLandmarks(): void {
    const landmarks = [[-128, 118], [126, -112], [124, 120], [-122, -120]];
    for (let index = 0; index < landmarks.length; index += 1) {
      const position = landmarks[index];
      const height = 138 + index * 13;
      const tower = MeshBuilder.CreateCylinder(`landmark-${index}`, { height, diameterTop: 5, diameterBottom: 16, tessellation: 6 }, this.scene);
      tower.position.set(position[0], height / 2, position[1]);
      tower.material = index % 2 === 0 ? this.slate : this.concrete;
      tower.parent = this.root;
      this.collisions.push({ min: new Vector3(position[0] - 8, 0, position[1] - 8), max: new Vector3(position[0] + 8, height, position[1] + 8) });
      this.anchors.push({ id: `spire-${index}`, position: new Vector3(position[0], height + 9, position[1]), kind: "spire" });
    }
  }

  private createServiceBuilding(x: number, z: number, height: number): void {
    const service = MeshBuilder.CreateBox(`service-${x}-${z}`, { width: 5.5, height, depth: 6.8 }, this.scene);
    service.position.set(x, height / 2, z);
    service.material = this.concrete;
    service.parent = this.root;
    this.collisions.push({ min: service.position.subtract(new Vector3(2.75, height / 2, 3.4)), max: service.position.add(new Vector3(2.75, height / 2, 3.4)) });
    this.createSign(x, height * 0.62, z - 3.5, 3.7, this.hash(x + z) > 0.45);
  }

  private createRoofCluster(x: number, z: number, height: number, seed: number): void {
    const tank = MeshBuilder.CreateCylinder(`roof-tank-${x}-${z}`, { height: 3.5, diameter: 3.2, tessellation: 8 }, this.scene);
    tank.position.set(x + 2.6, height + 1.75, z - 1.8);
    tank.material = this.slate;
    tank.parent = this.root;
    const mast = MeshBuilder.CreateCylinder(`roof-mast-${x}-${z}`, { height: 8 + seed * 6, diameter: 0.24, tessellation: 6 }, this.scene);
    mast.position.set(x - 2.4, height + 5, z + 1.2);
    mast.material = this.cyanLight;
    mast.parent = this.root;
    this.anchors.push({ id: `roof-${x}-${z}`, position: new Vector3(x - 2.4, mast.position.y + mast.scaling.y * 3.6, z + 1.2), kind: "roof" });
  }

  private createThinWindows(name: string, data: number[], material: StandardMaterial): void {
    const mesh = MeshBuilder.CreateBox(name, { width: 0.7, height: 1.15, depth: 0.08 }, this.scene);
    mesh.material = material;
    mesh.parent = this.root;
    mesh.thinInstanceSetBuffer("matrix", new Float32Array(data), 16, true);
  }

  private createSign(x: number, y: number, z: number, width: number, cyan: boolean): void {
    const sign = MeshBuilder.CreatePlane(`neon-sign-${x}-${z}-${y}`, { width, height: Math.max(3.6, width * 0.44) }, this.scene);
    sign.position.set(x, y, z);
    sign.material = cyan ? this.cyanLight : this.amberLight;
    sign.parent = this.root;
  }

  private createLaneSignals(position: number, horizontal: boolean): void {
    for (let segment = -120; segment <= 120; segment += 24) {
      const signal = MeshBuilder.CreateBox(`lane-signal-${position}-${segment}-${horizontal}`, { width: horizontal ? 0.45 : 3.2, height: 0.18, depth: horizontal ? 3.2 : 0.45 }, this.scene);
      signal.position.set(horizontal ? position + 4.8 : segment, 0.16, horizontal ? segment : position + 4.8);
      signal.material = (segment / 24 + position / 24) % 2 === 0 ? this.cyanLight : this.amberLight;
      signal.parent = this.root;
    }
  }

  private segmentBlocked(start: Vector3, end: Vector3): boolean {
    for (let step = 1; step < 18; step += 1) {
      const point = Vector3.Lerp(start, end, step / 18);
      if (this.pointInSolid(point)) return true;
    }
    return false;
  }

  private pointInSolid(point: Vector3): boolean {
    return this.collisions.some((box) => point.x > box.min.x && point.x < box.max.x && point.z > box.min.z && point.z < box.max.z && point.y > box.min.y && point.y < box.max.y);
  }

  private hash(value: number): number {
    const fraction = Math.sin(value * 12.9898) * 43758.5453;
    return fraction - Math.floor(fraction);
  }
}
