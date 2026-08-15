# Post-Upgrade Audit and Repair Checklist

- [x] Inventory source files, runtime entry points, assets, configurations, test coverage, and current warnings. Historical hot-reload errors were separated from the clean current console; the active runtime has no current console or network failures.
- [x] Verify each managed asset URL and remove or repair every broken reference. All five managed PNG references resolved after storage redirect as successful image responses.
- [x] Exercise the loading, selection, start, play, pause, resume, restart, and disposal state flows. The active lifecycle repair prevents stale initialization transitions after disposal.
- [x] Stress-test grounded traversal, aerial traversal, targeting, swing/zip/wall/dive transitions, collision, and camera responses. Jump, target/swing/release, tower collision, and live chase framing now have direct coverage.
- [x] Validate city rendering, weather modes, quality presets, accessibility controls, HUD layout, and responsive states. Desktop gameplay and a 375px mobile menu were visually checked; pooled weather and quality fallback have deterministic tests.
- [x] Add critical-path automated smoke coverage for state flow and traversal transitions. `PlayerController.test.ts` now covers jump, target acquisition, swing entry, and release momentum against the real city lattice.
- [x] Execute clean checks, headless tests, runtime/console inspection, and visual review; diagnose and repair failures. Type checks and all 10 headless checks pass; the live runtime is clean. The default build is environment-blocked by the sandbox memory ceiling and is documented in `QA_RELEASE_AUDIT.md`.
- [x] Save the final verified checkpoint and prepare the release audit report.
