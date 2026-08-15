// Aerial Transit Noir — pooled transit, drone, and reactive city motion stays lightweight at any quality preset.
import { Color3, Mesh, MeshBuilder, StandardMaterial, TransformNode, Vector3 } from "@babylonjs/core";
import type { Scene } from "@babylonjs/core";

interface TransitActor {
  node: TransformNode;
  path: Vector3[];
  offset: number;
  speed: number;
  activeAt: number;
}

interface ReactiveProp {
  node: Mesh;
  homeScale: number;
  range: number;
  cooldown: number;
  label: string;
}

export class AmbientCitySystem {
  private readonly root: TransformNode;
  private readonly traffic: TransitActor[] = [];
  private readonly drones: TransitActor[] = [];
  private readonly pedestrians: TransitActor[] = [];
  private readonly pulses: Mesh[] = [];
  private readonly reactive: ReactiveProp[] = [];
  private time = 0;
  private density = 1;
  private enabledTraffic = -1;
  private enabledDrones = -1;
  private enabledPedestrians = -1;
  private enabledPulses = -1;

  public constructor(private readonly scene: Scene) {
    this.root = new TransformNode("ambient-city-root", scene);
    this.createTraffic();
    this.createDrones();
    this.createPedestrians();
    this.createPulses();
    this.createReactiveProps();
  }

  public setDensity(value: number): void {
    this.density = Math.max(0.2, Math.min(1, value));
  }

  public update(playerPosition: Vector3, speed: number, delta: number): string | null {
    this.time += delta;
    const activeTraffic = Math.max(3, Math.round(this.traffic.length * this.density));
    this.enabledTraffic = this.applyActivation(this.traffic, activeTraffic, this.enabledTraffic);
    for (let index = 0; index < activeTraffic; index += 1) {
      const actor = this.traffic[index];
      this.advance(actor, delta, false);
    }
    const activeDrones = Math.max(2, Math.round(this.drones.length * this.density));
    this.enabledDrones = this.applyActivation(this.drones, activeDrones, this.enabledDrones);
    for (let index = 0; index < activeDrones; index += 1) {
      const actor = this.drones[index];
      this.advance(actor, delta, true);
    }
    const activePedestrians = Math.max(4, Math.round(this.pedestrians.length * this.density));
    this.enabledPedestrians = this.applyActivation(this.pedestrians, activePedestrians, this.enabledPedestrians);
    for (let index = 0; index < activePedestrians; index += 1) {
      const actor = this.pedestrians[index];
      this.advance(actor, delta, true);
    }
    const activePulses = Math.max(1, Math.round(this.pulses.length * this.density));
    if (activePulses !== this.enabledPulses) {
      this.pulses.forEach((pulse, index) => pulse.setEnabled(index < activePulses));
      this.enabledPulses = activePulses;
    }
    for (let index = 0; index < activePulses; index += 1) {
      const pulse = this.pulses[index];
      const wave = 0.55 + 0.45 * Math.sin(this.time * (0.8 + index * 0.13) + index);
      pulse.scaling.y = 0.72 + wave * 0.44;
      pulse.visibility = 0.28 + wave * 0.52;
    }
    for (const prop of this.reactive) {
      prop.cooldown = Math.max(0, prop.cooldown - delta);
      const energized = Vector3.DistanceSquared(playerPosition, prop.node.absolutePosition) < prop.range * prop.range && speed > 7;
      const target = energized ? prop.homeScale * 1.55 : prop.homeScale;
      prop.node.scaling.y += (target - prop.node.scaling.y) * Math.min(1, delta * 9);
      prop.node.visibility = energized ? 1 : 0.58;
      if (energized && prop.cooldown <= 0) {
        prop.cooldown = 4.5;
        return `${prop.label} relayed.`;
      }
    }
    return null;
  }

  public dispose(): void {
    this.root.dispose(false, true);
  }

  private advance(actor: TransitActor, delta: number, hover: boolean): void {
    const progress = (this.time * actor.speed + actor.offset) % actor.path.length;
    const index = Math.floor(progress);
    const next = (index + 1) % actor.path.length;
    const blend = progress - index;
    const from = actor.path[index];
    const to = actor.path[next];
    actor.node.position.copyFrom(Vector3.Lerp(from, to, blend));
    if (hover) actor.node.position.y += Math.sin(this.time * 2.1 + actor.offset) * 0.42;
    actor.node.rotation.y = Math.atan2(to.x - from.x, to.z - from.z);
  }

  private applyActivation(actors: TransitActor[], count: number, lastCount: number): number {
    if (count === lastCount) return lastCount;
    actors.forEach((actor, index) => actor.node.setEnabled(index < count));
    return count;
  }

  private createTraffic(): void {
    const carMaterial = this.emissive("ambient-car", "#173548", "#00e7f2");
    const tailMaterial = this.emissive("ambient-car-tail", "#260d17", "#ff5d82");
    const loops = [
      [new Vector3(-118, 1.2, -74), new Vector3(118, 1.2, -74), new Vector3(118, 1.2, 46), new Vector3(-118, 1.2, 46)],
      [new Vector3(-90, 1.3, 91), new Vector3(90, 1.3, 91), new Vector3(90, 1.3, 118), new Vector3(-90, 1.3, 118)],
    ];
    for (let index = 0; index < 14; index += 1) {
      const node = new TransformNode(`ambient-car-${index}`, this.scene);
      node.parent = this.root;
      const chassis = MeshBuilder.CreateBox(`ambient-car-body-${index}`, { width: 1.5, height: 0.65, depth: 3.6 }, this.scene);
      chassis.parent = node;
      chassis.material = carMaterial;
      const trail = MeshBuilder.CreateBox(`ambient-car-trail-${index}`, { width: 0.18, height: 0.12, depth: 1.1 }, this.scene);
      trail.position.z = 2.1;
      trail.parent = node;
      trail.material = tailMaterial;
      this.traffic.push({ node, path: loops[index % loops.length], offset: index * 0.28, speed: 0.45 + (index % 4) * 0.07, activeAt: index });
    }
  }

  private createDrones(): void {
    const droneMaterial = this.emissive("ambient-drone", "#111c29", "#7cf8ff");
    const paths = [
      [new Vector3(-72, 27, -28), new Vector3(5, 39, -5), new Vector3(85, 25, -36), new Vector3(34, 32, -81)],
      [new Vector3(-102, 42, 67), new Vector3(-16, 34, 92), new Vector3(72, 48, 68), new Vector3(11, 55, 25)],
    ];
    for (let index = 0; index < 9; index += 1) {
      const node = new TransformNode(`ambient-drone-${index}`, this.scene);
      node.parent = this.root;
      const body = MeshBuilder.CreateBox(`ambient-drone-body-${index}`, { width: 1.3, height: 0.35, depth: 2 }, this.scene);
      body.parent = node;
      body.material = droneMaterial;
      const lens = MeshBuilder.CreateSphere(`ambient-drone-lens-${index}`, { diameter: 0.38, segments: 6 }, this.scene);
      lens.position.z = -1.15;
      lens.parent = node;
      lens.material = droneMaterial;
      this.drones.push({ node, path: paths[index % paths.length], offset: index * 0.42, speed: 0.18 + (index % 3) * 0.035, activeAt: index });
    }
  }

  private createPedestrians(): void {
    const silhouettes = this.emissive("ambient-pedestrian", "#142431", "#2a9eac");
    const paths = [
      [new Vector3(24, 8.1, -58), new Vector3(78, 8.1, -58), new Vector3(78, 8.1, -49), new Vector3(24, 8.1, -49)],
      [new Vector3(17, 5.8, 101), new Vector3(55, 5.8, 101), new Vector3(55, 5.8, 95), new Vector3(17, 5.8, 95)],
      [new Vector3(-102, 5.8, 73), new Vector3(-62, 5.8, 73), new Vector3(-62, 8.9, 73), new Vector3(-102, 8.9, 73)],
    ];
    for (let index = 0; index < 16; index += 1) {
      const node = new TransformNode(`ambient-pedestrian-${index}`, this.scene);
      node.parent = this.root;
      const body = MeshBuilder.CreateCylinder(`ambient-pedestrian-body-${index}`, { height: 1.45, diameterTop: 0.32, diameterBottom: 0.48, tessellation: 5 }, this.scene);
      body.position.y = 0.73;
      body.parent = node;
      body.material = silhouettes;
      const head = MeshBuilder.CreateSphere(`ambient-pedestrian-head-${index}`, { diameter: 0.38, segments: 5 }, this.scene);
      head.position.y = 1.62;
      head.parent = node;
      head.material = silhouettes;
      this.pedestrians.push({ node, path: paths[index % paths.length], offset: index * 0.31, speed: 0.13 + (index % 4) * 0.016, activeAt: index });
    }
  }

  private createPulses(): void {
    const material = this.emissive("ambient-pulse", "#103040", "#26e7ff");
    const locations = [new Vector3(40, 12, -58), new Vector3(-87, 14, 70), new Vector3(33, 17, 100), new Vector3(0, 23, 18)];
    for (let index = 0; index < locations.length; index += 1) {
      const pulse = MeshBuilder.CreateCylinder(`ambient-signal-${index}`, { height: 5.5, diameterTop: 0.22, diameterBottom: 0.68, tessellation: 6 }, this.scene);
      pulse.position.copyFrom(locations[index]);
      pulse.material = material;
      pulse.parent = this.root;
      this.pulses.push(pulse);
    }
  }

  private createReactiveProps(): void {
    const material = this.emissive("ambient-reactive", "#183244", "#ffb45b");
    const props: Array<[string, Vector3, number]> = [
      ["Arcade sign", new Vector3(56, 9, -63), 13],
      ["Foundry vent", new Vector3(-83, 12, 78), 15],
      ["Market relay", new Vector3(35, 16, 95), 16],
      ["Skyrail pylon", new Vector3(8, 18, 18), 17],
    ];
    for (const [label, position, range] of props) {
      const node = MeshBuilder.CreateBox(`reactive-${label.replace(/\s/g, "-").toLowerCase()}`, { width: 1.1, height: 3.8, depth: 1.1 }, this.scene);
      node.position.copyFrom(position);
      node.material = material;
      node.parent = this.root;
      this.reactive.push({ node, homeScale: 1, range, cooldown: 0, label });
    }
  }

  private emissive(name: string, diffuse: string, emissive: string): StandardMaterial {
    const material = new StandardMaterial(name, this.scene);
    material.diffuseColor = Color3.FromHexString(diffuse);
    material.emissiveColor = Color3.FromHexString(emissive);
    material.specularColor = Color3.Black();
    return material;
  }
}
