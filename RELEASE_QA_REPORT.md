# CYBERPUNK MEGAPOLIS VNext — Release QA Report

## Release Decision

**Approved for the validated static preview runtime.** The repaired build has no remaining reproducible P0 or P1 issue in the traversal-first scope. The release matrix is fully marked pass in [`RELEASE_QA_MATRIX.md`](./RELEASE_QA_MATRIX.md), and the detailed evidence is retained in [`VALIDATION.md`](./VALIDATION.md).

| Category | Evidence | Result |
|---|---|---|
| Static integrity | `pnpm check` after every repair and final regression | Pass |
| Automated regression | 19 assertions in 9 Babylon NullEngine/Vitest files | Pass |
| Assets and live runtime | Managed-asset resolution scan; clean preview restart; current browser/server/network inspection | Pass |
| Desktop and mobile presentation | 1280×720 and 375×812 live screenshots | Pass |
| Persistence and accessibility | Corrupt-storage fallback test; focus-visible controls; semantic settings state; mobile-safe close | Pass |
| Performance safeguards | Quality budgets, pooled weather, sector activation, and telemetry audit | Pass |

## Defects Found and Repaired

| Severity | Defect | Repair | Regression evidence |
|---|---|---|---|
| P1 | Environment and ambience could continue through a pause boundary. | Paused world updates now freeze weather/time activity, while ambient audio mutes without node churn. | Lifecycle review and clean runtime restart. |
| P1 | Focus or pointer loss could leave a movement/traversal action pressed. | Input now clears transient state at focus, visibility, and pointer-loss boundaries. | `InputManager.test.ts`. |
| P1 | Bright rail adjacency flattened signal hierarchy and reduced player readability. | Time-of-day glow response was recalibrated for restrained cyan bloom. | Live traversal presentation check. |
| P2 | Settings displayed radian-derived FOV as an incorrect percentage-scaled degree. | HUD converts FOV to actual display degrees. | Static check and live control audit. |
| P2 | Settings lacked an explicit touch close affordance and expanded-state linkage. | Added visible close action, `aria-expanded`, `aria-controls`, and focused-control treatment. | Static check and mobile presentation check. |

## Release Limitation

The isolated sandbox cannot reliably complete a production `pnpm build` when Vite transforms the full Babylon dependency graph, because that operation reaches the environment memory ceiling. This does not affect the validated development runtime, current TypeScript check, automated NullEngine suite, or managed asset resolution. It remains an environment-only packaging limitation to recheck in a less constrained CI runner before an external production deployment.
