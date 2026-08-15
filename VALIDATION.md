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
