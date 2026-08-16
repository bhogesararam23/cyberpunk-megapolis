// Aerial Transit Noir — procedural city meshes, collision boxes, and anchors share a single data-driven map.
import {
  Color3, Matrix, Mesh, MeshBuilder, Quaternion, StandardMaterial, Texture, TransformNode, Vector3,
} from "@babylonjs/core";
import { megapolisAsset } from "./megapolisAssets";
import type { Aabb, Anchor, CityNavigationNode, DistrictId } from "./types";

const CYAN = Color3.FromHexString("#43f6e8");
const AMBER = Color3.FromHexString("#f6a84d");
const INK = Color3.FromHexString("#091324");

/** Canonical city coordinates for the tactical atlas, objective starts, and guided traversal. */
const NAVIGATION_NODES: CityNavigationNode[] = [
  { id: "civic-core", label: "CIVIC TRANSFER CORE", district: "civic-core", kind: "district", position: new Vector3(-32, 20, -38) },
  { id: "commercial-arcade", label: "COMMERCIAL ARCADE", district: "commercial-arcade", kind: "district", position: new Vector3(57, 12, -59) },
  { id: "foundry", label: "INDUSTRIAL FOUNDRY", district: "foundry", kind: "district", position: new Vector3(-84, 14, 77) },
  { id: "vertical-market", label: "VERTICAL MARKET", district: "vertical-market", kind: "district", position: new Vector3(37, 16, 98) },
  { id: "arcade-portal", label: "SPECTRUM PORTAL", district: "commercial-arcade", kind: "landmark", position: new Vector3(57, 12, -59) },
  { id: "foundry-breath", label: "FOUNDRY BREATH", district: "foundry", kind: "landmark", position: new Vector3(-84, 16, 77) },
  { id: "market-spine", label: "MARKET SPINE", district: "vertical-market", kind: "landmark", position: new Vector3(34, 20, 98) },
  { id: "civic-crown", label: "CIVIC CROWN", district: "civic-core", kind: "landmark", position: new Vector3(-32, 52, -38) },
  { id: "north-rail", label: "NORTH RAIL", district: "vertical-market", kind: "landmark", position: new Vector3(-38, 23, 82) },
  { id: "waterline", label: "WATERLINE DECK", district: "commercial-arcade", kind: "landmark", position: new Vector3(88, 11, 18) },
  { id: "route-skyrail", label: "SKYRAIL CIRCUIT START", district: "civic-core", kind: "route", position: new Vector3(0, 5, 22) },
  { id: "route-market", label: "MARKET DROP START", district: "vertical-market", kind: "route", position: new Vector3(32, 12, 94) },
  { id: "route-foundry", label: "FOUNDRY ELEVATION START", district: "foundry", kind: "route", position: new Vector3(-85, 7, 76) },
  { id: "market-ascent", label: "MARKET ASCENT", district: "vertical-market", kind: "vertical", position: new Vector3(37, 26, 97) },
];

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
  private readonly facade: StandardMaterial;
  private readonly signDecal: StandardMaterial;
  private readonly transitDecal: StandardMaterial;
  private readonly transitMovers: Array<{ mesh: Mesh; start: Vector3; end: Vector3; speed: number; phase: number }> = [];
  private readonly signalBeacons: Mesh[] = [];
  private readonly districtActuators: Array<{ mesh: Mesh; district: DistrictId; baseScale: number }> = [];
  private elapsed = 0;

  public constructor(private readonly scene: import("@babylonjs/core").Scene) {
    this.root = new TransformNode("megapolis-root", scene);
    this.dark = this.material("city-ink", INK, Color3.FromHexString("#101d31"));
    this.concrete = this.material("city-concrete", Color3.FromHexString("#18243a"), Color3.FromHexString("#172c40"));
    this.slate = this.material("city-slate", Color3.FromHexString("#243148"), Color3.FromHexString("#1d293e"));
    this.warmWindow = this.material("window-amber", Color3.FromHexString("#4a2f18"), AMBER.scale(0.62));
    this.coolWindow = this.material("window-cyan", Color3.FromHexString("#0f3640"), CYAN.scale(0.3));
    this.cyanLight = this.material("signal-cyan", Color3.FromHexString("#103b43"), CYAN.scale(0.72));
    this.amberLight = this.material("signal-amber", Color3.FromHexString("#4b2d12"), AMBER.scale(0.74));
    this.facade = this.material("facade-atlas", Color3.FromHexString("#1d2c42"), Color3.FromHexString("#172940"));
    const facadeAtlas = new Texture(megapolisAsset("facade"), scene);
    facadeAtlas.uScale = 1.5;
    facadeAtlas.vScale = 2.4;
    this.facade.diffuseTexture = facadeAtlas;
    this.facade.emissiveTexture = facadeAtlas;
    this.facade.emissiveColor = Color3.FromHexString("#142235");
    this.signDecal = this.material("sign-atlas", Color3.FromHexString("#16414c"), CYAN.scale(0.62));
    const signAtlas = new Texture(megapolisAsset("sign"), scene);
    this.signDecal.diffuseTexture = signAtlas;
    this.signDecal.emissiveTexture = signAtlas;
    this.signDecal.emissiveColor = Color3.FromHexString("#23656e");
    this.transitDecal = this.material("vnext-transit-wayfinding", Color3.FromHexString("#163947"), CYAN.scale(0.68));
    const transitAtlas = new Texture(megapolisAsset("transit"), scene);
    this.transitDecal.diffuseTexture = transitAtlas;
    this.transitDecal.emissiveTexture = transitAtlas;
    this.transitDecal.emissiveColor = Color3.FromHexString("#185c67");
  }

  public build(): void {
    this.createGroundAndRoads();
    this.createCityBlocks();
    this.createDistrictRoutes();
    this.createTransitNetwork();
    this.createDistantLandmarks();
    this.createCivicLandmarks();
    this.createVNextWayfinding();
    this.createSkylinePerimeter();
  }

  public update(delta: number): void {
    this.elapsed += delta;
    for (const mover of this.transitMovers) {
      const progress = (this.elapsed * mover.speed + mover.phase) % 1;
      const eased = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
      mover.mesh.position.copyFrom(Vector3.Lerp(mover.start, mover.end, eased));
      const heading = mover.end.subtract(mover.start);
      mover.mesh.rotation.y = -Math.atan2(heading.z, heading.x);
      mover.mesh.visibility = progress < 0.47 || progress > 0.53 ? 1 : 0.55;
    }
    for (const beacon of this.signalBeacons) {
      const pulse = 0.9 + Math.sin(this.elapsed * 3.5 + beacon.position.x * 0.06) * 0.1;
      beacon.scaling.y = pulse;
    }
  }

  public setDistrictEvent(district: DistrictId | null, intensity: number): void {
    for (const actuator of this.districtActuators) {
      const target = actuator.district === district ? actuator.baseScale * (1 + intensity * 0.3) : actuator.baseScale;
      actuator.mesh.scaling.y += (target - actuator.mesh.scaling.y) * 0.15;
      actuator.mesh.visibility = actuator.district === district ? 0.72 + intensity * 0.28 : 0.5;
    }
  }

  /** Cloned read-only descriptors prevent UI and objective code from mutating city geometry coordinates. */
  public getNavigationNodes(): CityNavigationNode[] {
    return NAVIGATION_NODES.map((node) => ({ ...node, position: node.position.clone() }));
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

  public findBestAnchor(origin: Vector3, forward: Vector3, velocity = Vector3.Zero()): Anchor | null {
    let best: Anchor | null = null;
    let bestScore = -Infinity;
    const planarVelocity = new Vector3(velocity.x, 0, velocity.z);
    const speed = planarVelocity.length();
    const expectedReach = Math.min(86, 28 + speed * 1.25);
    for (const anchor of this.anchors) {
      const offset = anchor.position.subtract(origin);
      const distance = offset.length();
      if (distance < 7 || distance > 124) continue;
      const direction = offset.scale(1 / distance);
      const visibility = Vector3.Dot(direction, forward);
      if (visibility < 0.04 || this.segmentBlocked(origin, anchor.position)) continue;
      const momentum = speed > 0.5 ? Math.max(-0.25, Vector3.Dot(direction, planarVelocity.scale(1 / speed))) : 0;
      const height = Math.max(-12, Math.min(34, anchor.position.y - origin.y));
      const distanceScore = 74 - Math.abs(distance - expectedReach) * 0.9;
      const score = visibility * 150 + momentum * 72 + distanceScore + height * 0.82;
      if (score > bestScore) {
        bestScore = score;
        best = anchor;
      }
    }
    return best;
  }

  public findSecondaryAnchor(origin: Vector3, forward: Vector3, primaryId: string, velocity = Vector3.Zero()): Anchor | null {
    let best: Anchor | null = null;
    let bestScore = -Infinity;
    const primary = this.anchors.find((anchor) => anchor.id === primaryId);
    for (const anchor of this.anchors) {
      if (anchor.id === primaryId) continue;
      const offset = anchor.position.subtract(origin);
      const distance = offset.length();
      if (distance < 14 || distance > 92 || this.segmentBlocked(origin, anchor.position)) continue;
      const direction = offset.scale(1 / distance);
      const visibility = Vector3.Dot(direction, forward);
      if (visibility < 0.12) continue;
      const separation = primary ? Vector3.Distance(anchor.position, primary.position) : 28;
      if (separation < 14 || separation > 74) continue;
      const momentum = velocity.lengthSquared() > 1 ? Vector3.Dot(direction, velocity.normalizeToNew()) : 0;
      const score = visibility * 94 + Math.min(48, separation) + momentum * 28 - distance * 0.18;
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
        const material = seed > 0.8 ? this.facade : seed > 0.56 ? this.slate : seed > 0.32 ? this.concrete : this.dark;
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
    const railMaterial = this.material("rail-steel", Color3.FromHexString("#264256"), Color3.FromHexString("#0c2a36"));
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
    this.createTransitMover("northbound-train", points[0], points[4], 0.054, 0.12);
    this.createTransitMover("southbound-train", points[9], points[5], 0.048, 0.57);
  }

  private createDistrictRoutes(): void {
    this.createCommercialArcade();
    this.createFoundryTerraces();
    this.createVerticalMarket();
    const corridorMaterial = this.material("route-catwalk", Color3.FromHexString("#203a4d"), Color3.FromHexString("#174c55"));
    const corridors: Array<[string, number, number, number, number, number]> = [
      ["arcade-span", 58, 19, -45, 45, 5.8],
      ["foundry-span", -76, 17, 44, 58, 5.4],
      ["market-span", 30, 14, 85, 64, 4.8],
      ["crosswind-link", 6, 22, 18, 98, 4.4],
    ];
    for (const [name, x, y, z, width, depth] of corridors) {
      const deck = MeshBuilder.CreateBox(name, { width, height: 0.75, depth }, this.scene);
      deck.position.set(x, y, z);
      deck.material = corridorMaterial;
      deck.parent = this.root;
      this.collisions.push({ min: deck.position.subtract(new Vector3(width / 2, 0.38, depth / 2)), max: deck.position.add(new Vector3(width / 2, 0.38, depth / 2)) });
      this.anchors.push({ id: `route-${name}`, position: deck.position.add(new Vector3(0, 4.5, 0)), kind: "bridge" });
      const beacon = MeshBuilder.CreateBox(`${name}-beacon`, { width: 0.34, height: 2.6, depth: 0.34 }, this.scene);
      beacon.position.copyFrom(deck.position.add(new Vector3(-width * 0.32, 1.65, 0)));
      beacon.material = this.cyanLight;
      beacon.parent = this.root;
      this.signalBeacons.push(beacon);
    }
  }

  private createCommercialArcade(): void {
    const canopyMaterial = this.material("arcade-canopy", Color3.FromHexString("#25324a"), Color3.FromHexString("#163f58"));
    for (let index = 0; index < 7; index += 1) {
      const x = 32 + index * 8;
      const canopy = MeshBuilder.CreateBox(`commercial-canopy-${index}`, { width: 6.3, height: 0.54, depth: 11 }, this.scene);
      canopy.position.set(x, 7.3 + (index % 2) * 1.4, -58);
      canopy.material = canopyMaterial;
      canopy.parent = this.root;
      const holo = MeshBuilder.CreatePlane(`commercial-holo-${index}`, { width: 4.8, height: 2.4 }, this.scene);
      holo.position.set(x, canopy.position.y + 2.1, -63.54);
      holo.material = index % 3 === 0 ? this.amberLight : this.signDecal;
      holo.parent = this.root;
      if (index % 2 === 0) this.anchors.push({ id: `arcade-${index}`, position: canopy.position.add(new Vector3(0, 5.5, 0)), kind: "roof" });
    }
  }

  private createFoundryTerraces(): void {
    const steel = this.material("foundry-steel", Color3.FromHexString("#273039"), Color3.FromHexString("#392e21"));
    for (let index = 0; index < 6; index += 1) {
      const x = -105 + index * 11;
      const y = 5 + index * 3.2;
      const terrace = MeshBuilder.CreateBox(`foundry-terrace-${index}`, { width: 9.5, height: 0.9, depth: 17 }, this.scene);
      terrace.position.set(x, y, 73);
      terrace.material = steel;
      terrace.parent = this.root;
      this.collisions.push({ min: terrace.position.subtract(new Vector3(4.75, 0.45, 8.5)), max: terrace.position.add(new Vector3(4.75, 0.45, 8.5)) });
      const vent = MeshBuilder.CreateCylinder(`foundry-vent-${index}`, { height: 6 + (index % 3) * 2, diameter: 2.8, tessellation: 8 }, this.scene);
      vent.position.set(x + 2.3, y + 3.1, 78);
      vent.material = index % 2 ? this.amberLight : this.slate;
      vent.parent = this.root;
      this.anchors.push({ id: `foundry-${index}`, position: terrace.position.add(new Vector3(0, 5, 0)), kind: "roof" });
    }
  }

  private createVerticalMarket(): void {
    const scaffoldMaterial = this.material("market-scaffold", Color3.FromHexString("#1c3345"), Color3.FromHexString("#134253"));
    for (let level = 0; level < 5; level += 1) {
      const y = 5 + level * 5.2;
      const deck = MeshBuilder.CreateBox(`market-walkway-${level}`, { width: 42 - level * 3, height: 0.7, depth: 6.2 }, this.scene);
      deck.position.set(37 + (level % 2 ? 3 : -3), y, 101 - level * 4);
      deck.material = scaffoldMaterial;
      deck.parent = this.root;
      this.collisions.push({ min: deck.position.subtract(new Vector3((42 - level * 3) / 2, 0.35, 3.1)), max: deck.position.add(new Vector3((42 - level * 3) / 2, 0.35, 3.1)) });
      this.anchors.push({ id: `market-walkway-${level}`, position: deck.position.add(new Vector3(0, 4.3, 0)), kind: "bridge" });
      for (const side of [-1, 1]) {
        const stall = MeshBuilder.CreateBox(`market-stall-${level}-${side}`, { width: 5.5, height: 4.4, depth: 5.2 }, this.scene);
        stall.position.set(deck.position.x + side * (14 - level), y + 2.5, deck.position.z + side * 1.8);
        stall.material = (level + side) % 2 === 0 ? this.facade : this.concrete;
        stall.parent = this.root;
        this.createSign(stall.position.x, stall.position.y + 1.1, stall.position.z - 2.7, 3.8, side > 0);
      }
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

  private createCivicLandmarks(): void {
    const hub = MeshBuilder.CreateBox("civic-transfer-hub", { width: 30, height: 20, depth: 22 }, this.scene);
    hub.position.set(-32, 10, -38);
    hub.material = this.slate;
    hub.parent = this.root;
    this.collisions.push({ min: hub.position.subtract(new Vector3(15, 10, 11)), max: hub.position.add(new Vector3(15, 10, 11)) });
    for (let tier = 0; tier < 4; tier += 1) {
      const ring = MeshBuilder.CreateTorus(`hub-ring-${tier}`, { diameter: 18 + tier * 3.8, thickness: 0.46, tessellation: 20 }, this.scene);
      ring.position.set(-32, 23 + tier * 4.2, -38);
      ring.rotation.x = Math.PI / 2;
      ring.rotation.z = tier % 2 === 0 ? 0.24 : -0.24;
      ring.material = tier === 3 ? this.amberLight : this.cyanLight;
      ring.parent = this.root;
    }
    const crown = MeshBuilder.CreateCylinder("hub-crown", { height: 17, diameterTop: 1.1, diameterBottom: 4.6, tessellation: 8 }, this.scene);
    crown.position.set(-32, 39, -38);
    crown.material = this.cyanLight;
    crown.parent = this.root;
    this.anchors.push({ id: "civic-crown", position: new Vector3(-32, 49, -38), kind: "spire" });
    const pads: Array<[number, number, number]> = [[35, 20, -18], [47, 28, 20], [-12, 24, 40]];
    for (let index = 0; index < pads.length; index += 1) {
      const [x, height, z] = pads[index];
      const landing = MeshBuilder.CreateCylinder(`helipad-${index}`, { height: 0.8, diameter: 13, tessellation: 12 }, this.scene);
      landing.position.set(x, height, z);
      landing.material = this.concrete;
      landing.parent = this.root;
      const marker = MeshBuilder.CreateTorus(`helipad-marker-${index}`, { diameter: 8.5, thickness: 0.26, tessellation: 16 }, this.scene);
      marker.position.set(x, height + 0.48, z);
      marker.rotation.x = Math.PI / 2;
      marker.material = index === 1 ? this.amberLight : this.cyanLight;
      marker.parent = this.root;
      this.anchors.push({ id: `helipad-${index}`, position: new Vector3(x, height + 5, z), kind: "roof" });
    }
    for (const [x, z] of [[-74, 14], [14, -78], [78, 74]]) {
      const mast = MeshBuilder.CreateCylinder(`signal-mast-${x}-${z}`, { height: 28, diameter: 0.42, tessellation: 6 }, this.scene);
      mast.position.set(x, 14, z);
      mast.material = this.slate;
      mast.parent = this.root;
      const beacon = MeshBuilder.CreateSphere(`signal-beacon-${x}-${z}`, { diameter: 2.4, segments: 8 }, this.scene);
      beacon.position.set(x, 29, z);
      beacon.material = this.cyanLight;
      beacon.parent = this.root;
      this.signalBeacons.push(beacon);
      this.anchors.push({ id: `signal-${x}-${z}`, position: beacon.position.add(new Vector3(0, 3.5, 0)), kind: "spire" });
    }
  }

  private createVNextWayfinding(): void {
    const districts: Array<[DistrictId, Vector3, number]> = [
      ["commercial-arcade", new Vector3(53, 13.8, -63.7), 0],
      ["foundry", new Vector3(-84, 16.3, 80.7), Math.PI],
      ["vertical-market", new Vector3(37, 20.5, 93.7), 0],
      ["civic-core", new Vector3(-31.5, 26, -49.4), 0],
    ];
    for (const [district, position, rotation] of districts) {
      const sign = MeshBuilder.CreatePlane(`vnext-wayfinding-${district}`, { width: 6.2, height: 3.5 }, this.scene);
      sign.position.copyFrom(position);
      sign.rotation.y = rotation;
      sign.material = this.transitDecal;
      sign.parent = this.root;
      this.districtActuators.push({ mesh: sign, district, baseScale: 1 });
      const mast = MeshBuilder.CreateBox(`vnext-district-beacon-${district}`, { width: 0.44, height: 4.6, depth: 0.44 }, this.scene);
      mast.position = position.add(new Vector3(0, -3.8, 0));
      mast.material = district === "foundry" ? this.amberLight : this.cyanLight;
      mast.parent = this.root;
      this.districtActuators.push({ mesh: mast, district, baseScale: 1 });
    }
  }

  private createSkylinePerimeter(): void {
    const panoramaMaterial = this.material("distant-panorama", Color3.FromHexString("#172640"), Color3.FromHexString("#0a2137"));
    const panorama = new Texture(megapolisAsset("skyline"), this.scene);
    panoramaMaterial.diffuseTexture = panorama;
    panoramaMaterial.emissiveTexture = panorama;
    panoramaMaterial.emissiveColor = Color3.FromHexString("#214c65");
    panoramaMaterial.specularColor = Color3.Black();
    const north = MeshBuilder.CreatePlane("northern-panorama", { width: 540, height: 145 }, this.scene);
    north.position.set(0, 66, 238);
    north.rotation.y = Math.PI;
    north.material = panoramaMaterial;
    north.parent = this.root;
    const south = north.clone("southern-panorama");
    if (south) {
      south.position.z = -238;
      south.rotation.y = 0;
      south.parent = this.root;
    }
    const outerMaterial = this.material("outer-city", Color3.FromHexString("#111d31"), Color3.FromHexString("#112a42"));
    for (let index = 0; index < 34; index += 1) {
      const angle = (index / 34) * Math.PI * 2;
      const radius = 176 + this.hash(index * 5.1) * 62;
      const height = 32 + this.hash(index * 9.7) * 105;
      const tower = MeshBuilder.CreateBox(`outer-skyline-${index}`, { width: 12 + this.hash(index) * 15, height, depth: 12 + this.hash(index * 3.1) * 15 }, this.scene);
      tower.position.set(Math.cos(angle) * radius, height / 2, Math.sin(angle) * radius);
      tower.material = outerMaterial;
      tower.parent = this.root;
      tower.isPickable = false;
    }
  }

  private createTransitMover(name: string, start: Vector3, end: Vector3, speed: number, phase: number): void {
    const carriage = MeshBuilder.CreateBox(name, { width: 11, height: 2.9, depth: 3.3 }, this.scene);
    carriage.material = this.cyanLight;
    carriage.parent = this.root;
    carriage.isPickable = false;
    this.transitMovers.push({ mesh: carriage, start: start.add(new Vector3(0, 2.8, 0)), end: end.add(new Vector3(0, 2.8, 0)), speed, phase });
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
    sign.material = cyan ? this.signDecal : this.amberLight;
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
