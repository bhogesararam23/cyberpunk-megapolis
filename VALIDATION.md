# Upgrade Validation Notes

## Traversal and Camera Pass — 2026-08-15

The selection screen remains visually stable after the controller and camera changes. The deterministic demo enters the live scene and produces an active target readout, high speed, a `SWING` state, and visible paired web trajectories. The current camera exposes a close tower facade and a large amount of unpopulated ground at the opening of the demo; this is expected to be addressed in the city-and-atmosphere phase by adding foreground infrastructure, animated elevated traffic, distant skyline massing, and a more legible depth gradient.

The new controller changes compile in the running project. Final automated checks remain pending until the city, HUD, challenge, and quality work are integrated.

## City and Atmosphere Pass — 2026-08-15

The live demo now renders the expanded city with generated facade texture treatment, active target links, paired tension-driven web strands, dense window fields, and the retained transit-cartography HUD. The closer chase rig improved the route read, though the deterministic scene still begins at ground-level among large local blocks. This is a framing limitation of the scripted showcase route rather than a runtime failure; the upcoming photo/showcase controls and route challenges will make alternate landmark views directly accessible.

## Character and Interface Pass — 2026-08-15

The title screen maintains a clear dark-to-city composition with the generated reference image as a focused selection backdrop. The revised live scene confirms the new chest-core and boot-marker silhouette remains visible beneath the active web strands and unobtrusive flight instrumentation. The player is intentionally compact at demo speed to preserve route context; the new showcase camera control is available from System Settings for a closer composed view without modifying the traversal loop.

## Challenge, Quality, and Runtime Stress Pass — 2026-08-15

The restarted `/?demo` route rendered successfully at 1280×720 with the player, target vector, Skyrail Circuit telemetry, speed panel, and cyan traversal lines present in a stable composition. The lower-right route readout remained legible without competing with the target panel or velocity card.

The complete headless suite passed with eight assertions across city collision and anchors, Skyrail Circuit progression, quality fallback, and weather-density budgeting. A production `pnpm build` attempt reached Vite transformation but was terminated by the sandbox under elevated memory pressure (exit 143) while transforming the dependency graph. This is an environment-limited packaging check rather than a known application compile failure: the incremental type checker remained clean and the restarted live runtime rendered correctly afterward.

## Feature-Gap Completion Pass — 2026-08-15

The deterministic `/?demo` route rendered at 1280×720 after the final feature pass, with a visible swinging operator, traversal target, Skyrail Circuit instrumentation, character silhouette markers, route lines, and dynamic atmosphere. The new time-of-day cycle deliberately starts at a legible blue-dusk keyframe and gradually moves through night and dawn while rain and storm profiles dim the scene lights and lift the neon glow response.

The mobile launch menu rendered at 375×812 with the generated city backdrop, operator cards, launch control, and System Settings trigger all visible and reachable. The settings flight deck persists audio mix, FOV, look sensitivity, inverted vertical look, impact shake, reduced motion, and high contrast; its range inputs have explicit accessible labels, grouped selectors expose pressed state, and Escape closes the panel.

The final static check passed. The full Vitest suite passed all 12 assertions across CityBuilder, ChallengeManager, PlayerController, ProgressionManager, QualityManager, and WeatherSystem. The final gap review found no remaining P0 or P1 obligations in the agreed traversal-first scope; retained limitations are deliberate non-goals rather than visible placeholder systems.

## VNext Integration Pass — 2026-08-15

The completed VNext live route rendered after a clean preview restart at 1280×720. It showed the operator moving through the procedural city with the Signal Cyan flight corridor, target-vector instrumentation, velocity/chain state, active route contract, city-scale neon infrastructure, and the updated speed-responsive operator silhouette. The entry screen retains the generated aerial city composition and has clear operator differentiation without obscuring its start action.

The mobile launch composition rendered at 375×812 with readable hierarchy, two selectable operator cards, compact traversal instructions, and a reachable System Settings control. Mobile correctly hides peripheral mission and diagnostics panels so the launch path remains dominant; desktop can optionally expose VNext telemetry showing frame budget, sector state, actor budget, and traversal state.

The full headless suite passed **12 tests in 6 files**, including deterministic traversal, collision, weather density, quality fallback, progression, and the new per-route kinetic-medal classification. `pnpm check` passed after all VNext changes. A preview-server restart cleared the earlier transient development import message and the currently running preview has no TypeScript or live-render errors. Production bundling remains intentionally excluded from the release gate because the known sandbox memory ceiling terminates Babylon dependency transformation; the responsive dev runtime and static validation are the applicable evidence for this browser-first static project.

## Release QA and Repair Pass — 2026-08-15

The release-QA audit resolved five reproducible quality risks. Environment simulation now freezes while paused; pointer, blur, and visibility boundaries clear pressed traversal input; the synthesized ambient bed mutes and resumes without allocating new nodes; the time-of-day glow curve preserves rail, HUD, and operator contrast; and the settings flight deck now provides correct angular FOV feedback, expanded-state semantics, visible focus treatment, and a touch-safe close control.

All six managed visual assets resolved successfully. A clean preview restart produced no current application console, resource, or network failures; the only server notice is an upstream baseline-browser-mapping freshness advisory, not an application fault. The desktop launch image at 1280×720 and the mobile launch image at 375×812 remain legible, with the city art, operator selection, launch action, and settings entry point intact.

The post-repair regression run passed `pnpm check` and **19 Vitest assertions across 9 test files**. The expanded set includes focus-loss input reset, malformed or unavailable settings storage, extreme airborne recovery, bounded long zip, and rapid chase-camera resilience. The release decision is **approved for the validated static preview runtime**. As in earlier passes, a production bundle remains outside the executable sandbox gate because its Babylon dependency transform exceeds the sandbox memory ceiling; this is an environment limitation, not a current runtime or type-check failure.

## Completeness Pass — Integrated Gameplay Loop — 2026-08-15

The highest-value player-loop gaps are now represented by real world data and durable game state rather than presentation-only placeholders. The tactical atlas uses actual `CityBuilder` positions for districts, landmarks, activity starts, elevated routes, the live player marker, current waypoint bearing, and charted/unmapped state. The map opens through the visible City Atlas control or `M` key, while route and vertical activities begin at physical beacons in the world.

`ObjectiveManager` was validated with deterministic start, route-completion, reward, record, and one-time payout coverage. The Market Spine and Foundry Breath discoveries gate their respective vertical and foundry objectives, creating a complete local loop: navigate, chart landmark, unlock beacon, traverse, earn signal, and retain a local record. The legacy contract rotation test was updated to enforce the intentional new rule that a rotated contract remains idle until started at its physical beacon.

The full regression passed `pnpm check` and **22 Vitest assertions across 11 test files**. The photo camera regression verifies finite orbit framing, bounded camera distance, and lens response. Desktop live capture confirms city traversal, target guidance, objective rail, mission state, and atlas availability. The initial phone demo capture occurred before WebGL scene presentation settled; a follow-up capture confirmed the running city, operator, active HUD, roof target, and readable compact objective rail at 375×812.
