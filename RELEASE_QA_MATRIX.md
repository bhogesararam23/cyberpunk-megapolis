# CYBERPUNK MEGAPOLIS VNext — Release QA Matrix

> This is an execution matrix, not a substitute for repair. Every failed check is repaired in source and rerun before the release decision.

| QA area | Player-facing exercise | Technical evidence | Acceptance condition | Status |
|---|---|---|---|---|
| Bootstrap and assets | Clean launch, menu, operator selection, demo start, reload | Vite runtime, browser console/network logs, asset URL scan | No required import, resource, or initialization failure | Pass |
| Lifecycle | Play, pause, resume, restart, restart while airborne, return/re-enter, resize, visibility loss | Focused `GameWorld` test and repeated browser state sequence | No stuck input, duplicate loops/listeners, stale HUD, or moving world while paused | Pass |
| Traversal | Ground run, buffered jump, swing/release/reattach, zip, wall-run/jump, dive/recovery, chain | NullEngine smoke tests plus deterministic live route | Finite transforms/velocities, legal target candidates, and no state deadlock | Pass |
| Physics and camera | High speed, collision approach, narrow tower view, impact and landing | Collision/anchor tests and live presentation capture | No penetration, explosive speed, camera teleport, or loss of player readability | Pass |
| World and simulation | Cross district boundaries, rapid direction change, storm density, active incidents | Sector telemetry, ambient budget checks, visual capture | Collision stays available, active/predicted budgets remain bounded, no visible duplication | Pass |
| Atmosphere and audio | Cycle clear/rain/storm, pause/resume, traversal cues, showcase | Weather tests, settings event path, audio lifecycle review | No accumulating particles/nodes, pause-safe soundscape, legible lighting transition | Pass |
| UI, accessibility, persistence | Menu, operator cards, HUD, settings sliders/toggles, quality/weather, Escape, mobile | DOM screenshot and settings/progression/challenge tests | Every control responds and intended preferences/records restore safely | Pass |
| Performance and resilience | High/medium/low density, dense traversal, repeated restart, storage failure recovery | Quality tests, telemetry, local-storage fallbacks, resource/lifecycle audit | Auto budget guard remains functional; no unbounded arrays or uncaught errors | Pass |
| Final regression | Clean desktop/mobile launch plus full test suite | `pnpm check`, Vitest, preview screenshots, current logs | No P0/P1 gameplay, runtime, or visual blocker | Pass |
