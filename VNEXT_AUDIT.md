# CYBERPUNK MEGAPOLIS — VNext Architecture Audit

## Current Runtime Shape

The existing game is a lifecycle-safe React frame around a Babylon.js scene. `GameWorld` owns phase transitions and update order, while `PlayerController`, `CityBuilder`, `CameraRig`, `WeatherSystem`, `AmbientCitySystem`, `AudioManager`, `QualityManager`, `ChallengeManager`, and `ProgressionManager` remain plain TypeScript modules. The React HUD is event-driven and does not own gameplay state.

| Area | Current strength to preserve | VNext constraint to resolve |
|---|---|---|
| Traversal | Deterministic jump, swing, zip, wall-run, dive, anti-tunnelling, and character traits are already playable. | `PlayerController` currently couples input response, web routing, physics, pose output, and VFX-facing data. |
| Web mechanics | Anchor selection accounts for visibility, camera direction, momentum, range, and optional dual-line support. | Routing has no explicit forecast, target switch intent, or reusable traversal-event surface. |
| World | Procedural roads, tower lattice, named districts, rails, bridges, landmarks, collisions, and anchors share one reliable data source. | City generation, collision queries, visuals, and all active map data are held in one always-live builder. |
| Simulation | Pooled traffic, drones, pedestrians, signals, and reactive props are quality-aware. | Ambient activity has no district/event ownership or velocity-predictive activation contract. |
| Presentation | Cinematic follow camera, responsive FOV, dusk-cycle, glow, weather particles, generated facade/sign/skyline art, and flight-deck HUD are coherent. | Weather, time, audio, camera, and world materials expose only narrow cross-system state. |
| Persistence | Settings, profile discoveries, distance records, and rotating local route records fail safely to defaults. | State lives in multiple versioned local keys without a single release/profile migration boundary. |
| Performance | Window thin instances, pooled weather, adaptive density, and automated quality fallback protect the main traversal loop. | Diagnostics, world activation ranges, and adaptive budgets are not reported as a unified runtime profile. |

## VNext Contract

VNext keeps the reliable phase machine, collision catalogue, procedural-city base, generated art, pointer-lock gesture boundary, local persistence, and deterministic demo route. The upgrade will introduce small interfaces rather than replace those stable systems.

1. **Signal contracts.** Traversal will publish typed intent and outcome events—target acquired, web attached, chain transition, wall contact, landing, district crossing, and performance state—so camera, audio, VFX, UI, simulation, and diagnostics can react without reaching into controller internals.
2. **Traversal prediction.** The city will expose forecast-ready anchor candidates and district metadata. The player will select and retain intent-aware anchors while preserving current physical substeps and collision reliability.
3. **Sector-aware world activity.** World descriptors will separate named districts and lightweight sector activation from static construction. Predictive velocity direction will pre-activate ambience, events, audio, and route signals before arrival, while collision safety remains available across the playable city.
4. **Atmosphere profiles.** Time of day and weather will produce a shared environmental profile for lighting, fog, materials, audio intensity, and ambient simulation rather than isolated visual updates.
5. **Presentation layers.** Character pose output, camera framing, speed feedback, and contextual effects will remain independent responses to gameplay state. The player remains fully readable and camera shake stays optional.
6. **Release observability.** A developer-only overlay will report frame budget, active simulation, district, traversal state, target, and streaming sector. It must never intrude on normal play and will be disabled by default.

## Risk Slices and Evidence

| Risk slice | Implementation boundary | Required proof |
|---|---|---|
| Traversal continuity | `PlayerController` + city anchor query + typed events | A live demo visibly chains swing, zip, wall-run, and controlled recovery without breaking collision. |
| Sector activation | City district descriptors + ambient/event budgets | Debug telemetry shows nearby and predicted sectors activate without obvious high-speed pop-in. |
| Browser resilience | `GameWorld` + `InputManager` lifecycle boundary | Pointer loss, tab visibility, resize, pause, restart, and return-to-menu remain safe. |
| Atmosphere/audio | Shared environment profile with weather/time owners | Weather changes visibly and audibly alter the same city traversal route. |
| VNext presentation | HUD, character pose, camera, and procedural city art | Desktop and mobile screenshots show city density, movement agency, and readable controls. |

## Explicit Scope Guard

The VNext release remains a self-contained, traversal-first browser game. It will not introduce multiplayer, accounts, real-world brands, weapon combat, an open-ended RPG economy, paid assets, or a backend service. High-fidelity effects use scalable approximations so player responsiveness, collision correctness, and world readability remain protected.
