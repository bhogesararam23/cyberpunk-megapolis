import { Vector3 } from "@babylonjs/core";
import { describe, expect, it } from "vitest";
import { NavigationManager } from "./NavigationManager";
import type { CityBuilder } from "./CityBuilder";
import type { CityNavigationNode } from "./types";

const nodes: CityNavigationNode[] = [
  { id: "civic-crown", label: "CIVIC CROWN", district: "civic-core", kind: "landmark", position: new Vector3(-32, 52, -38) },
  { id: "market-spine", label: "MARKET SPINE", district: "vertical-market", kind: "landmark", position: new Vector3(34, 20, 98) },
  { id: "route-market", label: "MARKET DROP START", district: "vertical-market", kind: "route", position: new Vector3(32, 12, 94) },
];

const city = { getNavigationNodes: () => nodes.map((node) => ({ ...node, position: node.position.clone() })) } as unknown as CityBuilder;

describe("tactical navigation", () => {
  it("publishes real player, waypoint, and map-marker coordinates", () => {
    const navigation = new NavigationManager(city);
    navigation.update(new Vector3(0, 10, 0), []);
    expect(navigation.select("route-market")).toBe(true);
    const readout = navigation.readout();
    expect(readout.visible).toBe(true);
    expect(readout.waypoint).toMatchObject({ id: "route-market", district: "vertical-market", kind: "route" });
    expect(readout.waypoint?.distance).toBeGreaterThan(90);
    expect(readout.markers).toHaveLength(3);
    expect(readout.markers.find((marker) => marker.id === "route-market")?.selected).toBe(true);
  });

  it("advances an already charted landmark target to the next uncharted city point", () => {
    const navigation = new NavigationManager(city);
    navigation.update(Vector3.Zero(), ["civic-crown"]);
    expect(navigation.readout().waypoint?.id).toBe("market-spine");
    expect(navigation.readout().markers.find((marker) => marker.id === "civic-crown")?.discovered).toBe(true);
  });
});
