import { Color3, Matrix, Mesh, MeshBuilder, Quaternion, StandardMaterial, Vector3 } from "@babylonjs/core";

export type WeatherMode = "clear" | "rain" | "storm";

interface RainDrop {
  x: number;
  y: number;
  z: number;
  speed: number;
  drift: number;
}

export class WeatherSystem {
  private readonly drops: RainDrop[] = [];
  private readonly rain: Mesh;
  private readonly material: StandardMaterial;
  private mode: WeatherMode = "rain";
  private elapsed = 0;
  private density = 1;

  public constructor(private readonly scene: import("@babylonjs/core").Scene, count = 120) {
    this.material = new StandardMaterial("rain-material", scene);
    this.material.diffuseColor = Color3.FromHexString("#6bc7dd");
    this.material.emissiveColor = Color3.FromHexString("#15485d");
    this.material.alpha = 0.36;
    this.material.disableLighting = true;
    this.rain = MeshBuilder.CreatePlane("rain-streaks", { width: 0.035, height: 1.45 }, scene);
    this.rain.material = this.material;
    this.rain.isPickable = false;
    for (let index = 0; index < count; index += 1) {
      this.drops.push({
        x: ((index * 17.3) % 1 - 0.5) * 74,
        y: 3 + ((index * 29.7) % 1) * 42,
        z: ((index * 41.1) % 1 - 0.5) * 74,
        speed: 23 + (index % 7) * 3.6,
        drift: ((index % 5) - 2) * 0.13,
      });
    }
    this.writeInstances(Vector3.Zero());
  }

  public setMode(mode: WeatherMode): void {
    this.mode = mode;
    this.rain.setEnabled(mode !== "clear");
  }

  public setDensity(density: number): void {
    this.density = Math.min(1, Math.max(0.1, density));
  }

  public get activeDropCount(): number {
    return Math.max(1, Math.floor(this.drops.length * this.density));
  }

  public update(playerPosition: Vector3, delta: number): void {
    if (this.mode === "clear") return;
    this.elapsed += delta;
    const stormFactor = this.mode === "storm" ? 1.35 : 1;
    const activeCount = Math.max(1, Math.floor(this.drops.length * this.density));
    for (let index = 0; index < activeCount; index += 1) {
      const drop = this.drops[index];
      drop.y -= drop.speed * stormFactor * delta;
      drop.x += drop.drift * stormFactor * delta;
      if (drop.y < -2) {
        drop.y = 42 + ((drop.x * 13 + drop.z * 7 + this.elapsed * 3) % 12);
        drop.x = ((drop.x * 1.7 + 17) % 74) - 37;
        drop.z = ((drop.z * 1.3 + 23) % 74) - 37;
      }
    }
    this.writeInstances(playerPosition);
  }

  public dispose(): void {
    this.rain.dispose();
    this.material.dispose();
  }

  private writeInstances(origin: Vector3): void {
    const data: number[] = [];
    const rainAngle = this.mode === "storm" ? 0.42 : 0.24;
    const activeCount = Math.max(1, Math.floor(this.drops.length * this.density));
    for (let index = 0; index < activeCount; index += 1) {
      const drop = this.drops[index];
      const matrix = Matrix.Compose(new Vector3(1, 1, 1), Quaternion.FromEulerAngles(0, 0, rainAngle), new Vector3(origin.x + drop.x + drop.drift * 9, origin.y + drop.y, origin.z + drop.z));
      data.push(...matrix.m);
    }
    this.rain.thinInstanceSetBuffer("matrix", new Float32Array(data), 16, true);
  }
}
