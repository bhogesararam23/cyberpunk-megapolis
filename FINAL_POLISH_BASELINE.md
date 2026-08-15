# CYBERPUNK MEGAPOLIS — Final Polish Baseline

## Live Visual Findings

The relaunched menu is already a strong first impression: its generated skyline, cyan flight line, warm municipal windows, character cards, action copy, and settings entry read as a single authored Aerial Transit Noir product. The earlier blank full-page captures were an unsettled WebGL capture state; a clean preview restart restored the actual launch composition and deterministic scene.

The settled traversal capture confirms that the player, world geometry, target vector, mission rail, city atlas, and local objective state are all present. The remaining visual issues are **calibration issues**, not missing systems:

| Priority | Observation | Constrained polish response |
|---|---|---|
| High | Cyan rails and near-field window emissives flatten the scene around the player in the deterministic route. | Reduce high-end emissive/bloom response, preserve cyan only for traversal infrastructure and valid target signaling, and keep amber windows warm but less dominant. |
| High | The camera’s high, close view can make the operator appear pasted against the rail and reduce forward route readability. | Ease the close/high framing under low speed, settle FOV and bank more gradually, and add a restrained character rim/separation response. |
| Medium | The objective rail is functional but its simultaneous velocity, local objective, clearance, circuit, target, and atlas labels feel dense on the first active frame. | Quiet secondary labels at rest and retain only the route, objective, and valid target as full-strength priorities. |
| Medium | Attachment and release feedback could better explain how a line connects to the city without adding particles. | Refine line thickness/tension fade, target bracket intensity, and micro camera/audio response from existing signals. |
| Medium | Existing atmosphere has depth but needs a clearer foreground/midground/background hierarchy around bright rails. | Calibrate fog, glow, and local material response rather than increasing prop count or fog density. |

## Deliberate Non-Changes

The pass will not add mission types, geometry kits, networking, combat, new art, a new HUD model, or a new camera architecture. It retains the proven city, objective, atlas, photo, weather, and local persistence systems and only tunes their visible hierarchy, motion, and feedback.

## Verified Implementation Seams

`CameraRig` already exposes the correct constrained controls: speed-derived distance, target anticipation, finite collision-safe camera resolution, traversal energy, optional impact shake, reduced-motion handling, and bounded photo parameters. The polish should soften low-speed close framing and reduce abrupt FOV/bank changes without modifying input or collision behavior.

`PlayerController` already creates the flight ring, jet signals, trim material, web material, per-character silhouette additions, and active web lines. The polish should use these existing meshes to improve operator separation and line tension cues rather than create another avatar or particle system.

`TimeOfDaySystem` drives a single shared clear, fog, directional, hemispheric, and glow profile. Its mid-cycle clear/horizon values and glow intensity are the correct non-invasive seam for repairing rail-adjacent washout; no district geometry or post-process needs to change.

`AudioManager` already maintains a minimal two-oscillator ambience bed with weather, atmosphere, incident, speed, pause, and traversal-cue inputs. The final mix should leave the gesture-safe sound model intact and improve only the relative headroom between movement cues and the low ambient bed.
