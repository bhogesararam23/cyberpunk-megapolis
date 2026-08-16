# CYBERPUNK MEGAPOLIS Upgrade Checklist

- [x] Audit the current rendering loop, world builder, controllers, HUD, assets, performance constraints, and known visual artifacts. See `UPGRADE_AUDIT.md`.
- [x] Improve chained traversal, web tension/curvature, target scoring, and camera response without replacing existing systems.
- [x] Add procedural environmental motion, landmarks, weather, atmospheric effects, and distance-aware city presentation.
- [x] Upgrade avatar materials/poses plus traversal feedback, settings, and photo/showcase controls.
- [x] Implement lightweight challenges, checkpoints, best-time persistence, and optional collectible routes.
- [ ] Add and run focused automated tests for traversal, scoring, and persistent challenge state.
- [x] Perform performance and robustness validation, including quality fallback and paused/resumed play.
- [ ] Save a verified upgraded checkpoint and report the completed experience.

## Vercel Deployment Readiness

- [x] Inspect the existing Vite build scripts, static asset paths, and deployment configuration. The prior runtime depended on development-only Manus storage proxy routes and had no Vercel configuration.
- [x] Add a Vercel configuration that builds the static client and serves the correct output directory with SPA fallbacks. `vercel.json` now uses the lightweight `build:vercel` command, `dist/public`, SPA rewrites, and immutable generated-art caching.
- [x] Document Vercel project settings, build command, output directory, and Babylon/WebGL deployment considerations. See `VERCEL_DEPLOYMENT.md`; it explicitly distinguishes the static output from the unused Express compatibility placeholder.
- [x] Validate the configuration without changing the validated runtime contract, then checkpoint the Vercel-ready release. `pnpm check`, JSON validation, portable-asset presence, and live launch/traversal renders pass. The provider build remains intentionally to be confirmed on its preview environment because the local sandbox terminates Vite compilation with exit 143 under memory pressure.
