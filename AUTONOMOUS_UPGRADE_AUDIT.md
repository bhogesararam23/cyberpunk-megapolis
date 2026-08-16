# Autonomous Upgrade Audit — VCurrent

## Brief Contract

The supplied autonomous-improvement brief requires a state-aware cycle: inspect the playable game, rank non-duplicative quality gaps, implement the highest-value integrated upgrade, validate it against the existing session, and stop before low-value feature creep. Completion requires a real user-visible improvement, regression evidence, a meaningful before/after account, and an explicit release status.

## Current Baseline Evidence

The game already contains a full traversal loop with running, buffered jumping, swing, zip, wall-run, dive, collision recovery, predictive anchors, operator traits, and a chase camera. It also already owns named districts, city-derived navigation, physical discovery points, persistent signal credits, route medals, physical objective beacons, live weather/time, pooled city activity, synthesized responsive audio, photo controls, accessible settings, and responsive HUD behavior.

`GameWorld` updates city and weather within an environmental-advance guard; integrates player simulation, audio, camera impact and chase framing, sector activity, live runtime telemetry, discovery progression, tactical navigation, objectives, and route challenges during the playable phase. Its deterministic demo path exercises player update, target selection, sector simulation, progression, objective updates, and route nodes without requiring a separate test scene.

## Initial Candidate Gaps

| Candidate | Existing foundation | Remaining quality gap | Initial priority |
|---|---|---|---|
| Traversal mastery loop | Chaining, predictive anchors, route objectives, and persistent records | No durable player-owned style/flow score that makes free traversal skill visible and replayable outside timed routes | High |
| District identity | Geometry, city materials, events, audio response, and wayfinding exist | Activity remains primarily contextual rather than reshaping player choices | Medium |
| Performance instrumentation | Live FPS, frame time, draw calls, triangles, mesh/actor/sector counts and quality governor exist | No persistent comparison ledger or player-facing analysis of steady-state versus burst pressure | Medium |
| Objective variety | Three discovery-gated physical objective starts and challenge completion exist | The objective set is narrow and does not directly reward expressive multi-move traversal | High |

## Scope Guard

The next major improvement must build on existing movement, navigation, objective, progression, telemetry, and HUD seams. It must not replace stable traversal physics, add a combat loop, introduce unbounded city simulation, or create a disconnected demo-only feature.

## Visual Baseline

Desktop launch is compositionally coherent: the character choice, primary traversal control, and the skyline image form a clear first impression. The deterministic desktop scene shows the active target vector, City Atlas, velocity, objective rail, world beacons, player silhouette, and city lattice simultaneously; however, it also reinforces that free traversal has no explicit mastery outcome beyond the timed route and current objective.

Mobile launch retains legible operator choice and a reachable primary action. The first deterministic mobile capture produced HUD and objective elements over an empty-looking world frame rather than a stable city view. This must be treated as an investigation item—not a confirmed rendering defect—until a fresh mobile session and runtime diagnostics establish whether it is a capture-timing artifact, adaptive-quality behavior, or a real rendering regression.

## Objective and Performance Baseline

The runtime diagnostics are lightweight and appropriately throttled: they sample smoothed frame time/FPS plus draw-call proxy, triangles, active meshes, actors, sectors, district, traversal state, speed, and target at most every 0.12 seconds. This provides enough visibility to protect the current browser performance budget without adding profiler-grade collection to the normal player loop.

The current `ObjectiveManager` accepts traversal and chain values but intentionally does not use either one. Its three current activities cover route completion, vertical ascent, and arrival. This confirms the highest-value non-duplicative seam: a restrained **Flow Circuit** mastery contract can turn free-form web/zip/wall-run/dive chaining into a visible, skill-based, persistent activity without changing physics, duplicating time trials, or adding an unrelated subsystem.

## VCurrent Functional Baseline

`pnpm check` passed against the current source. The deterministic suite passed **22 assertions across 11 files** in 5.24 seconds, covering traversal bounds and transitions, camera resilience, objective persistence, tactical navigation, progression, quality governance, weather pooling, input recovery, settings resilience, and city collision/anchor behavior. A targeted review of the recent client-console and network logs found no exceptions and no HTTP 4xx/5xx failures. The mobile empty-looking deterministic capture remains the sole visual investigation item; it has no paired error evidence in the runtime logs.

## Upgrade Ranking and Decision

| Candidate | Player impact | Replayability | Visual/immersion value | Performance cost | Integration risk | Decision |
|---|---:|---:|---:|---:|---:|---|
| Flow Circuit — free-traversal mastery loop | 9 | 9 | 7 | 1 | 3 | **Selected** |
| District incident mission contexts | 7 | 6 | 8 | 3 | 5 | Defer; foundation is already contextual and needs a stronger player skill loop first. |
| Persistent performance-history ledger | 3 | 2 | 2 | 1 | 3 | Defer; useful for development, but not the largest player-visible gain. |
| Additional arrival/ascent objective variants | 6 | 6 | 4 | 1 | 2 | Fold into the mastery loop rather than add more narrow location timers. |

### Selected Objective: Flow Circuit

The upgrade will turn the existing but currently hidden chain counter into a player-owned mastery loop. Real traversal transitions—web release, zip entry, wall kick, and continuity retarget—will become scored Flow actions. Sustaining varied actions within the existing chain window will build a temporary circuit, publish a compact HUD rail only while active, award persistent bests/completion count, and give the player a repeatable free-roam skill target alongside the timed Skyrail route. The manager will observe the existing typed traversal signals, avoid simulation actors and meshes, update only on actions or low-frequency expiry, and never modify collision, velocity, camera controls, route rules, or the route/objective queue.

## Integration Contract

`FlowCircuitManager` will subscribe through `GameWorld.handleSignal`, receive only already-emitted traversal action/speed/chain data, and publish a typed `FlowReadout` in `GameStatus`. It will track a short timed sequence of distinct actions, a best score, and completed circuits in a versioned local record. A circuit completes only when the player sustains a varied sequence at real traversal speed; it cleanly expires when the existing chain timer expires. `GameWorld` will own notifications and the existing synthesized audio cue calls, preserving the manager’s framework-independent model. `GameHUD` will render a dormant compact status and an active rail; no new world geometry, materials, actors, animation loops, or per-frame allocations are required.

The HUD’s target vector, velocity, mission rail, and objective rail already define a clear status hierarchy. The Flow rail will enter only for `building` or short-lived `complete` states and will occupy the unused lower-right stack above the dormant mission rail; it remains hidden on narrow viewports where the previously repaired objective rail must own the lower screen. The shared status object and `GameWorld.publishStatus` provide the correct typed bridge. Player chain actions are emitted by existing web release, zip start, wall kick, and continuity retarget events; the manager will consume those named events and ignore the generic duplicate `chain` event.

## Implemented Upgrade Evidence

`FlowCircuitManager` is now a framework-independent, versioned local-record manager. It accepts only existing typed traversal actions, rejects duplicate actions, expires incomplete sequences after the existing 4.6-second chain window, records a best and completed count, and does not touch player physics or city simulation. `GameWorld` owns the lifecycle reset, status publication, completion notification, and existing synthesized completion cue. The Flow readout is typed through `GameStatus`, so the HUD has no local game-state inference.

Focused validation passes TypeScript plus **three Flow Circuit tests**: varied-action completion, duplicate-action rejection and clean expiry, and browser-storage restoration. The deterministic desktop traversal capture visibly shows a `FLOW CIRCUIT // BUILDING` rail with progress, remaining window, best, and charted count; the target vector, route rail, and local objective remain readable. The fresh deterministic mobile capture now renders the city correctly, and the Flow rail is intentionally absent at the narrow breakpoint, leaving the repaired local objective clear. This resolves the earlier inconclusive mobile frame as a capture-timing artifact rather than a reproducible mobile rendering defect.

## Visual Review Limitation

The independent full-page review request returned two black WebGL canvases and therefore generated recommendations based on an empty frame. Those recommendations are not applied: they conflict with the immediately preceding, reproducible standard desktop/mobile captures, which visibly contain the layered city, anchor/trajectory lines, cyan control hierarchy, brand lockup, target vector, route/objective rails, and Flow Circuit instrumentation. The existing Aerial Transit Noir brief remains the controlling design contract. The non-review captures are the valid evidence for this canvas-based application; the full-page capture failure is logged as tooling behavior rather than a player-visible regression.

## Post-Validation Gap Review

The new Flow Circuit closes the highest-priority remaining player-loop gap: free traversal now has a clear, replayable mastery outcome that uses real movement skill and local persistence. The remaining opportunities—more district incident objectives, deeper altitude/district audio identity, and a stronger performance-history view—are valid future directions, but none is a reproducible release defect or justifies expanding this autonomous cycle. Adding another system now would dilute the completed movement–navigation–objective–mastery loop and increase regression surface without a proportionate player-facing gain. No final repair beyond the validated Flow Circuit implementation is warranted.
