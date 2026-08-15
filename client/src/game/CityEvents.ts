// Aerial Transit Noir — deterministic district incidents add readable city rhythm without timers or network dependencies.
import type { DistrictId, SectorReadout } from "./types";

export type CityEventKind = "signal-surge" | "freight-window" | "market-cascade" | "transfer-priority";

export interface CityEventReadout {
  id: CityEventKind | null;
  district: DistrictId | null;
  label: string;
  intensity: number;
}

const EVENTS: Array<{ id: CityEventKind; district: DistrictId; label: string }> = [
  { id: "signal-surge", district: "commercial-arcade", label: "ARCADE SIGNAL SURGE" },
  { id: "freight-window", district: "foundry", label: "FOUNDRY FREIGHT WINDOW" },
  { id: "market-cascade", district: "vertical-market", label: "MARKET RELAY CASCADE" },
  { id: "transfer-priority", district: "civic-core", label: "CIVIC TRANSFER PRIORITY" },
];

export class CityEvents {
  private clock = 0;
  private activeId: CityEventKind | null = null;

  public update(delta: number, sectors: SectorReadout): CityEventReadout {
    this.clock += delta;
    const window = 24;
    const cycle = this.clock % (window * EVENTS.length);
    const index = Math.floor(cycle / window);
    const progress = (cycle % window) / window;
    const candidate = EVENTS[index];
    const nearby = sectors.active.includes(candidate.district) || sectors.predicted.includes(candidate.district);
    const active = nearby && progress > 0.16 && progress < 0.78;
    const intensity = active ? 0.38 + Math.sin(((progress - 0.16) / 0.62) * Math.PI) * 0.62 : 0;
    this.activeId = active ? candidate.id : null;
    return active
      ? { id: candidate.id, district: candidate.district, label: candidate.label, intensity }
      : { id: null, district: null, label: "", intensity: 0 };
  }

  public get active(): CityEventKind | null { return this.activeId; }
}
