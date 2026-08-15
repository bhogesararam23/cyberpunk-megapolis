# CYBERPUNK MEGAPOLIS Feature-Gap Map

## Classification Key

| Classification | Meaning |
|---|---|
| **IMPLEMENTED** | Playable, integrated, and already validated. |
| **PARTIAL** | Present but visibly narrow, disconnected, or incomplete from a player perspective. |
| **MISSING** | Not represented by a playable system. |
| **PLACEHOLDER / FAKE** | A prototype-facing stand-in where player-facing functionality is expected. |
| **NOT APPLICABLE** | Outside the deliberate scope of this traversal game. |

## Core Game Systems

| Requirement | Current classification | Player-facing gap | Priority | Implementation decision |
|---|---|---|---|---|
| Rendering | IMPLEMENTED | Babylon scene, glow, fog, materials, and procedural forms render cleanly. | — | Retain. |
| World generation and city density | PARTIAL | One dense procedural kit produces a readable but uniform district. | P1 | Add named district kits, route corridors, props, and activity zones. |
| Buildings, streets, rooftops | PARTIAL | Towers, road grid, and roofs exist, but streets lack experiential variation and deliberate route identity. | P1 | Add commercial, industrial, and vertical-market district generators with roof paths and shortcuts. |
| Slums, service alleys, shafts, accessible gaps | MISSING | No low-income vertical zone or compact ground-level traversal texture. | P1 | Add a pooled vertical-market/slum district with stacked walkways, alleys, vents, and route anchors. |
| Metro, elevated roads, bridges | PARTIAL | Skyrail and bridges exist only as scenic rails and two carriages. | P1 | Extend the network with station approach corridors, road traffic, and traversal-supporting under-rail zones. |
| Landmarks | PARTIAL | Civic spires and signal beacons exist but are not discovery goals. | P2 | Add landmark discovery markers, reward cards, and persistent records. |
| Characters and character selection | PARTIAL | Two selectable colorways use the same silhouette and stats. | P0 | Add differentiated traversal traits, persistent selection, and more state-aware pose accents. |
| Ground movement, jump, air control | IMPLEMENTED | Responsive movement with buffers and coyote time. | — | Retain and expose feedback. |
| Web targeting, swinging, zip | PARTIAL | Real anchor scoring, dual-web visuals, tension, and release exist; player receives little predictive/attachment feedback. | P0 | Add anchor candidate indicators, attach/release prediction, and character-specific traversal tuning. |
| Wall-run, wall-jump, dive, landing, recovery | PARTIAL | Mechanics work, but recoveries and connection feedback are minimal. | P0 | Add buffered combo messaging, landing dust, and controlled recovery feedback. |
| Collision and ground detection | IMPLEMENTED | AABB resolution and multi-probe grounding have test coverage. | — | Retain. |
| Camera | PARTIAL | Damped chase camera and showcase orbit exist, but photo controls and player-adjustable FOV are absent. | P2 | Add persisted FOV/sensitivity and practical photo control. |
| Lighting, dusk/night | PARTIAL | Single dusk/night presentation only. | P1 | Add clear/dusk/night state controller connected to lights, fog, glow, signage, and HUD. |
| Weather | PARTIAL | Rain/storm particles are pooled, but weather does not substantially alter world atmosphere or player feedback. | P1 | Connect world states to lighting/fog/neon, wind, ambience, and surface interaction. |
| Audio | MISSING | No player-facing sound feedback or ambience. | P1 | Add gesture-safe synthesized SFX/ambient engine with persisted volume. |
| HUD, pause, settings | PARTIAL | Core HUD, pause, weather, quality, high contrast, and reduced motion work. | P1 | Add persistence, FOV, sensitivity, invert-Y, shake, audio controls, and progression readouts. |
| Accessibility and quality | PARTIAL | Motion/contrast/quality exist, but no broader persisted control profile. | P1 | Expand and persist settings; retain adaptive effect budget. |
| Performance, LOD, streaming | PARTIAL | Instancing, pooled rain, outer skyline, and adaptive quality exist; there is no sector activation or world activity budget. | P1 | Add distance-aware ambient activity and district visibility budgets. |
| Environmental activity | PARTIAL | Animated train carriages, beacons, signs, and rain exist; city otherwise feels static. | P1 | Add pooled traffic, drones, signal/hologram pulses, vents, and route-reactive effects. |
| Interaction | MISSING | The player cannot affect the city beyond traversal. | P1 | Add lightweight breakable/recharge props, landing reactions, and triggered signs. |
| Challenges and progression | PARTIAL | One Skyrail Circuit has a persisted best time. | P0 | Add a route board, discovery progression, district objectives, distance record, and unlockable routes. |
| Exploration | PARTIAL | Geography can be crossed but has no persistent reason to be explored. | P0 | Add landmark scans, rooftop caches, hidden route nodes, and discovery rewards. |
| Persistence | PARTIAL | Only a single best time persists. | P0 | Introduce a versioned local profile for character, settings, discoveries, and records. |
| Photo/showcase mode | PARTIAL | Orbit camera toggle only. | P2 | Add FOV, weather/time state, character, and motion framing controls. |
| Error handling and testing | IMPLEMENTED | Canvas boundary, lifecycle cleanup, current console checks, and 10 headless checks are in place. | — | Extend tests alongside new systems. |
| Destructive combat, fake AI, RPG economy | NOT APPLICABLE | These do not support the requested traversal-first experience. | — | Explicitly omit. |

## Prioritized Build Contract

**P0 — traversal purpose and character identity.** The current mechanics are real, but the experience after landing in the city is too narrow. The implementation pass will add a persistent profile, multiple route/discovery objectives, character-specific traversal behavior, and readable targeting/landing feedback.

**P1 — city presence and player ownership.** The city needs distinct districts, compact ground texture, atmospheric state changes, lightweight ambient activity, reactive props, functional audio, and settings that survive a return visit. These systems must be pooled or instanced, respect quality budgets, and share the existing update lifecycle.

**P2 — showcase depth.** The camera, discoveries, and world-state controls will be expanded into a useful demonstration surface after the core loop is established.

## Explicit Non-Goals

This pass will not introduce a backend, multiplayer, account system, paid assets, real-world brands, weapon combat, or an open-ended RPG. The intended result is a self-contained browser traversal game whose exploration, time trials, ambience, and discovery systems reinforce the movement language already in place.
