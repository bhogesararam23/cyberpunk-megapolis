// Aerial Transit Noir — district sectors let distant simulation scale independently from safe global collision queries.
import { Vector3 } from "@babylonjs/core";
import type { DistrictId, SectorReadout } from "./types";

interface DistrictBounds {
  id: DistrictId;
  label: string;
  center: Vector3;
  halfExtent: Vector3;
}

const districts: DistrictBounds[] = [
  { id: "commercial-arcade", label: "COMMERCIAL ARCADE", center: new Vector3(55, 0, -58), halfExtent: new Vector3(52, 120, 44) },
  { id: "foundry", label: "FOUNDRY TERRACES", center: new Vector3(-84, 0, 73), halfExtent: new Vector3(48, 120, 50) },
  { id: "vertical-market", label: "VERTICAL MARKET", center: new Vector3(37, 0, 98), halfExtent: new Vector3(52, 120, 44) },
  { id: "civic-core", label: "CIVIC TRANSFER CORE", center: new Vector3(-16, 0, -16), halfExtent: new Vector3(72, 120, 72) },
];

export class WorldSectors {
  private current: DistrictBounds = districts[3];
  private readout: SectorReadout = { district: "civic-core", districtLabel: "CIVIC TRANSFER CORE", active: ["civic-core"], predicted: [] };

  public update(position: Vector3, velocity: Vector3): SectorReadout {
    this.current = this.closestDistrict(position);
    const forward = new Vector3(velocity.x, 0, velocity.z);
    const predictedPosition = forward.lengthSquared() > 1 ? position.add(forward.normalize().scale(Math.min(58, 18 + forward.length() * 1.35))) : position;
    const active = districts.filter((district) => this.distanceToBounds(position, district) < 76).map((district) => district.id);
    const predicted = districts
      .filter((district) => district.id !== this.current.id && this.distanceToBounds(predictedPosition, district) < 58)
      .map((district) => district.id);
    this.readout = { district: this.current.id, districtLabel: this.current.label, active: active.length ? active : [this.current.id], predicted };
    return this.readout;
  }

  public get currentDistrict(): DistrictId {
    return this.readout.district;
  }

  private closestDistrict(position: Vector3): DistrictBounds {
    return districts.reduce((best, district) => this.distanceToBounds(position, district) < this.distanceToBounds(position, best) ? district : best, districts[0]);
  }

  private distanceToBounds(position: Vector3, district: DistrictBounds): number {
    const dx = Math.max(0, Math.abs(position.x - district.center.x) - district.halfExtent.x);
    const dz = Math.max(0, Math.abs(position.z - district.center.z) - district.halfExtent.z);
    return Math.hypot(dx, dz);
  }
}
