// Aerial Transit Noir — world simulation coordinates scalable activity around districts without owning player physics.
import type { Vector3 } from "@babylonjs/core";
import type { AmbientCitySystem } from "./AmbientCitySystem";
import { CityEvents } from "./CityEvents";
import type { CityBuilder } from "./CityBuilder";
import type { GameSignalBus } from "./GameSignals";
import type { SectorReadout } from "./types";
import { WorldSectors } from "./WorldSectors";

export class SimulationDirector {
  private readonly sectors = new WorldSectors();
  private readonly events = new CityEvents();
  private lastDistrict: SectorReadout["district"] | null = null;
  private lastEvent: string | null = null;

  public constructor(private readonly ambient: AmbientCitySystem, private readonly signals: GameSignalBus, private readonly city: CityBuilder) {}

  public update(position: Vector3, velocity: Vector3, density: number, delta: number): { notification: string | null; sectors: SectorReadout; activeActors: number } {
    const sectors = this.sectors.update(position, velocity);
    if (this.lastDistrict !== sectors.district) {
      this.signals.emit({ type: "district", district: sectors.district, entering: this.lastDistrict !== null });
      this.lastDistrict = sectors.district;
    }
    this.ambient.setDensity(density);
    this.ambient.setSectorContext(sectors);
    const event = this.events.update(delta, sectors);
    this.ambient.setEventContext(event.district, event.intensity);
    this.city.setDistrictEvent(event.district, event.intensity);
    if (event.id !== this.lastEvent) {
      this.signals.emit({ type: "world-event", ...event });
      this.lastEvent = event.id;
    }
    return { notification: this.ambient.update(position, velocity.length(), delta), sectors, activeActors: this.ambient.activeActors };
  }
}
