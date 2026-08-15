# CYBERPUNK MEGAPOLIS Upgrade Audit

## Current Architecture

The project already has a healthy separation between the React shell and the real-time runtime. `GameCanvas` owns the lifecycle-safe Babylon `Engine` and `Scene`; `scene.ts` composes the procedural `CityBuilder`, `PlayerController`, `CameraRig`, `InputManager`, `QualityManager`, and phase-owning `GameWorld`. `GameHUD` is intentionally a DOM overlay connected by custom status events. This boundary must be preserved: new systems should be small TypeScript managers wired through `scene.ts` and updated by `GameWorld`, never reimplemented as React gameplay state.

| Area | Existing implementation | Upgrade implication |
|---|---|---|
| Rendering | Babylon scene with EXP2 fog, hemispheric/directional lighting, restrained glow, and fixed canvas lifecycle. | Add lightweight managers and feature-scaled effects rather than a costly post-processing stack. |
| City | One 310m procedural district of box towers, thin-instanced windows, collision AABBs, rails, bridges, signs, and four landmark spires. | Extend the same generated vocabulary with moving infrastructure, landmark kits, distant impostors, and activation tiers. |
| Character | Two articulated procedural avatars share a capsule/box silhouette with palette swaps and pose blending. | Improve materials, reactive secondary motion, and state anticipation without adding fragile model imports. |
| Traversal | Input → state logic → sub-stepped movement → AABB collision; states cover running, jumping, swing, zip, wall-run, dive, and landing. | Preserve this stable loop while adding buffered transitions, tension forces, release boosts, and impact recovery. |
| Web system | One selected anchor, a four-point visual line, distance tether force, and direct zip velocity. | Replace the single visual line with pooled dual strands and tension-aware sag while retaining existing anchor data. |
| Camera | Damped chase rig with speed FOV, look clamps, and simple obstruction path resolution. | Add banking, impact impulse, dynamic framing, vertical composition, and controls through the existing rig. |
| HUD | A strong flight-instrument frame with reticle, target, speed, character selection, pause, quality, and reduced-motion controls. | Extend the status contract and settings panel; do not add a second HUD framework. |
| Assets | Generated city reference, facade atlas, sign atlas, skyline panorama, and emblem are available via managed URLs. | The city currently underuses facade/sign/skyline imagery; these can be safely integrated as materials and distant layers. |

## Priority Findings

Traversal is mechanically complete but currently responds as a set of discrete branches. Swing forces are one-sided, release velocity is implicit, wall-run requires a held modifier without a buffered jump response, and landing only changes a state label. The most important uplift is therefore to make the existing physics continuous: preserve tangential momentum, constrain ropes only under tension, use soft release boosts, and introduce short coyote/buffer windows for chained moves.

The city is visually coherent in static presentation but is bounded to a compact grid and appears frozen during play. Its instanced window strategy is a good foundation, although collision checks currently scan the full AABB list and quality fallback only changes resolution, fog, and glow. The next city pass should add inexpensive pooled motion, landmark-specific structures, background skyline geometry, and distance-aware collision/visual activity rather than multiplying unique meshes.

The camera and HUD are already readable and retain the project’s **Aerial Transit Noir** direction. Camera framing lacks impact and velocity nuance, while settings omit FOV, sensitivity, high contrast, weather, and photo controls. These additions should remain optional and state-driven so motion-sensitive players retain a stable experience.

## Known Weaknesses and Risks

| Finding | Root cause | In-place response |
|---|---|---|
| City travel ends at a hard `±138` boundary. | All city geometry and collision data is built as one static district. | Add low-cost outer skyline/impostor rings and sector-aware anchor routing before any true streaming rewrite. |
| Web curves bow upward regardless of physics. | The web visual uses a fixed middle lift and one line mesh. | Derive sag from distance, velocity, and tension; pool a second strand only during active high-speed traversal. |
| Collision and visibility checks grow linearly with every building. | `CityBuilder` owns flat AABB and anchor arrays. | Introduce spatial buckets for near collision and anchor candidate filtering. |
| Lighting can wash the close city during traversal. | Single glow layer and a broad directional source drive the entire environment. | Use emissive variance, fog/weather adjustments, and sparse local lamps instead of increasing global bloom. |
| Browser audio cannot start automatically. | Web audio requires a user gesture. | Build the audio layer lazily when traversal starts and degrade silently when unavailable. |
| Previous production build was memory-constrained in the sandbox. | Vite build ran alongside browser/runtime processes under pressure. | Validate with `pnpm check`, focused headless tests, and runtime screenshots first; retry full build only when memory permits. |

## Upgrade Decision

The existing systems are worth extending. The work will add bounded, pooled, and quality-aware managers for weather, ambience, challenges, and city activity; improve the current controller and camera; broaden `GameStatus` and the settings/event contract; and preserve the original procedural-first pipeline, custom canvas lifecycle, visual language, and already-verified collision/anchor tests.
