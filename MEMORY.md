# Production Memory

- The game uses a lifecycle-safe React canvas host. Rendering and gameplay remain framework independent under `client/src/game/`.
- Generated imagery is externally hosted and resolved via the asset configuration recorded in `ASSETS.md`; no large media belongs in the deploy tree.
- Required visual language: Signal Cyan means actionable player navigation; amber is city warmth/mission progress; ink blue retains contrast and depth.
- The main reliability constraint is strict phase protection. Game actions must not leak into selection, pause, loading, or recovery.
- The highest-risk pieces are city collision/anchors, momentum handoff, pointer lock, and camera obstruction. Verification needs both interactive controls and the deterministic `?demo` route.

