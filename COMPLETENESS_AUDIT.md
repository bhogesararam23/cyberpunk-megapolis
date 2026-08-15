# CYBERPUNK MEGAPOLIS — Completeness Audit

## Player-Perspective Classification

| System | Classification | Player-facing evidence | Completion decision |
|---|---|---|---|
| Core movement, collision, recovery, camera chase | **Complete** | Running, jump buffering, swing, zip, wall-run, dive, collision safeguards, recovery, traits, and predictive chase framing work in the real loop. | Retain; do not rework. |
| Smart world web targeting | **Complete** | The anchor query already scores real scene geometry for range, visibility, direction, momentum, and obstruction. | Surface target intent through objectives; do not replace scoring. |
| Advanced traversal chains | **Partial** | Individual moves and predictive reattachment work, but there is no player-owned combo objective or reward for mastering sequences. | Connect chains to missions, records, and vertical route goals. |
| District city and landmarks | **Partial** | Commercial Arcade, Foundry, Vertical Market, civic spires, rail corridors, and discovery markers exist. Their coordinates are real, but they are not a navigable activity layer. | Export the real city data to navigation, activity starts, and objectives. |
| Living simulation and city events | **Partial** | Pooled traffic, drones, pedestrians, signs, weather, and sector incidents are real and budgeted, but mostly contextual. | Use district events and route locations as mission context; do not add unbounded actor counts. |
| Challenges | **Partial** | Three timed routes, physical node markers, medals, and local bests are functional. Routes auto-start and only express a narrow time-trial rule. | Add world starts, objective states, success/failure rules, rewards, and mission selection. |
| Discovery and progression | **Partial** | Six physical landmark discoveries, credits, distance, and run record persist locally. Discoveries do not unlock purposeful activities or guide exploration. | Add route unlocks, activity rewards, objective/landmark markers, and persisted completion records. |
| World map and orientation | **Missing** | No map, player position, route guidance, district atlas, or landmark-navigation UI is published from world data. | Build a compact city-derived tactical map and waypoint contract. |
| Objective framework | **Missing** | `GameWorld` publishes only challenge and progression state; no start/progress/failure/reward model exists. | Introduce a reusable, local-only traversal objective manager. |
| Photo/cinematic experience | **Partial** | The current showcase toggle produces an orbit but has no HUD hide, free/orbit choice, distance, weather/time, or framing controls. | Build practical photo controls on the existing camera/time/weather seams. |
| Audio depth | **Partial** | Gesture-safe traversal and ambience synthesis reacts to weather, speed, and incidents but does not expose district/height identity. | Add restrained district and altitude mixing alongside objective completion feedback. |
| Accessibility, persistence, browser resilience | **Complete** | Persisted audio/camera/motion/contrast settings, corrupt-storage fallback, pointer/focus reset, pause safety, responsive launch, and recovery tests are present. | Preserve the release-QA baseline. |

## Highest-Value Gaps to Implement

The current playable loop is still predominantly **launch → move → auto-running route → discover proximity marker**. The two P0 additions below turn its existing city, traversal, and persistence into a cohesive game without inventing unrelated systems.

1. **Tactical navigation and waypoint guidance.** The city will export genuine district, landmark, route-start, and elevated-corridor coordinates. A tactical map will show the player, objective, discovered state, landmarks, and current route against that real data.
2. **Traversal objective framework.** Objectives will have explicit world start, state, progress, completion/failure rules, reward, and local record. The first objective set will use actual traversal affordances: district arrival, landmark charting, sustained chain, rooftop ascent, and route completion.
3. **Discovery-led activity loop.** Landmark discoveries will unlock district objective starts and special vertical routes. Route starts become physical beacons in the city instead of an invisible auto-start condition.
4. **Practical photo controls.** A focused photo deck will extend the existing showcase camera with HUD visibility, orbit distance, FOV, weather, and time-of-day controls.

## Integration Contract

`CityBuilder` becomes the canonical source for lightweight navigation descriptors; it does not duplicate geometry or maintain a second map. `NavigationManager` will derive map points and waypoint heading/distance from these descriptors. `ObjectiveManager` will consume player traversal signals, city positions, challenge events, and discovery records, then publish a small readout to `GameWorld` for HUD/map rendering. `ProgressionManager` remains the durable local profile owner and will store objective completions, unlocks, and earned signal.

All new activity beacons, map state, and objective updates respect pause, restart, quality budgets, and the existing event bridge. No backend, combat loop, dialogue tree, or simulated content is added: every destination, marker, timer, and reward must be connected to an actual city coordinate and a concrete traversal condition.
