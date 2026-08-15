# Game Plan: CYBERPUNK MEGAPOLIS — Web-Swing Edition

## Risk Tasks

### 1. Procedural dense-city generation
- **Why isolated:** Repetition, framerate, reliable collision representation, and readable traversal geometry compete with one another in a browser renderer.
- **Approach:** Build a seeded block layout from grouped procedural modular buildings. Maintain a small axis-aligned collision catalogue and a separate anchor catalogue. Use thin instanced window meshes and a bounded active city radius rather than one expensive custom building per facade.
- **Verify:** The visible scene has multiple city layers (street, rooftops, elevated rails, landmarks); no large empty horizon gaps occur from the normal camera path; anchors resolve only to known structural points.

### 2. Momentum traversal and high-speed collision
- **Why isolated:** Swing constraints, zip acceleration, air steering, and anti-tunneling must hand off velocity safely while resolving against static city bounds.
- **Approach:** Use a deterministic explicit player state machine, a swept axis-aligned player capsule approximation, five downward surface samples, and clamped substeps at high speed. Preserve the tangential component when a web constraint releases.
- **Verify:** Run → jump → swing → release retains forward velocity; zip ends near an actual anchor; a fast player never passes through a registered building box; five-probe landing detects road, roof, and platform surfaces.

### 3. Damped third-person camera and pointer lock
- **Why isolated:** Pointer lock can fail without a user gesture, while a fast camera can push into scenery or leave the player outside the frame.
- **Approach:** Enable pointer lock from an explicit Begin Traversal gesture. Apply yaw/pitch deltas only in the playing phase, then solve camera position against the city collision list and damp toward an unobstructed target.
- **Verify:** Pointer lock failure leaves keyboard controls usable with a visible prompt; rapid turns remain stable; camera ray shortening keeps it out of buildings on the built-in demo route.

### 4. Two-character motion presentation
- **Why isolated:** The brief expects distinct characters and smooth-looking animation states without importing an unpredictable external rig pipeline.
- **Approach:** Compose two original articulated procedural avatars from a shared skeleton-like hierarchy, then apply state-weighted limb pose blending for idle, run, jump, fall, swing, zip, wall-run, dive, landing, and recovery.
- **Verify:** Character selection visibly changes silhouette and palette; states crossfade through pose weights without visible snapping; hands are the origin of swing web lines.

## Main Build

- A strict phase machine: loading → selection → transition → playing → paused → recovery, with all actions ignored outside valid phases.
- A dusk city menu scene with two selectable avatars, a short in-world character preview, quality selector, control legend, and error fallback.
- A procedural megacity with commercial towers, residential stacks, industrial service yards, narrow streets, rooftop clusters, elevated roads, bridges, monorail segments, window instancing, billboard decals, fog, glow, and long skyline depth.
- Responsive keyboard/mouse play: WASD move, mouse camera, Space jump, left click swing, right click zip, Q wall-run, Shift dive, Escape pause, R re-entry.
- A compact HUD with phase, speed, momentum, target feedback, notifications, mission route, pause/settings layers, quality controls, and accessibility motion toggle.
- Quality presets and performance governor that adapt resolution, shadows, view detail, bloom-like glow density, and procedural visual density.
- Built-in `?demo` autoplay sequence for repeatable visual verification.

### Assets

- In-engine art-direction reference, 16:9.
- Tiled four-panel facade atlas, 1m facade module.
- Square neon decal atlas, 2m x 3m sign planes.
- Panoramic distant skyline, full width backplate.
- Transparent brand emblem, 128px HUD/menu use.

### Verify

- Beginning traversal moves the player into gameplay with no invalid action triggers during loading, selection, transition, pause, or recovery.
- Movement direction, camera direction, character heading, state label, and articulated motion remain aligned.
- Jump, swing, zip, wall-run, dive, landing, restart, and quality switching are visibly reachable through actual controls.
- Missing generated art does not prevent the city or game from starting; materials fall back to authored colors.
- HUD is readable at desktop widths and does not cover the central traversal field.
- No unhandled console errors occur during the menu or 90-second demo run.
- Reference consistency: ink-blue dusk, dense multi-height silhouette, cyan/amber hierarchy, cinematic third-person camera, and visibly curved web line.
