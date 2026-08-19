# Assets

**Art direction:** An in-engine third-person traversal shot at dusk: ink-blue atmospheric depth; procedurally dense tower canyon; warm windows and restricted amber city-light; **Signal Cyan** for valid player agency; elevated rails, bridges, roof equipment, and antennas that read as usable physical infrastructure. Bloom is restrained and fog softens only the distant city.

| Asset | Description | Size | Runtime Path | Role |
|---|---|---:|---|---|
| `cyberpunk-megapolis-reference` | Third-person in-engine visual target | 16:9 | `/assets/cyberpunk-megapolis-reference_708450ea.png` | Design QA reference and optional menu backdrop. |
| `city-facade-atlas` | Repeatable modular building facade atlas | 1m facade module | `/assets/city-facade-atlas_ad18a2d6.png` | Optional building material texture, with procedural color fallback. |
| `neon-sign-atlas` | Abstract sign and circuit decal atlas | 2m x 3m panels | `/assets/neon-sign-atlas_fe673f95.png` | Billboard and facade sign planes. |
| `skyline-panorama` | Distant dusk city panorama | 2560x720 visual, 560m world width | `/assets/skyline-panorama_27c9972a.png` | Far city depth layer. |
| `megapolis-emblem` | Angular moth-spider brand insignia | 128px HUD/menu icon | `/assets/megapolis-emblem_cdc84c90.png` | Selection and HUD motif. |

## Procedural 3D Asset Strategy

Procedural geometric avatars, box-based buildings, instanced windows, rails, and markers are deliberately used as runtime geometry. They are not image placeholders: each uses authored proportions, an articulated state machine, collision data, and reusable materials in support of traversal reliability.
