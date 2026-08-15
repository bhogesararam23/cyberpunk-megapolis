# Runtime Structure

## Ownership

```text
GameCanvas (React lifecycle only)
  └── createGameScene
       └── GameWorld
            ├── PhaseMachine
            ├── InputManager
            ├── CityBuilder
            │    ├── collision catalogue
            │    ├── anchor catalogue
            │    └── instanced facades / rails / landmarks
            ├── PlayerController
            │    ├── articulated avatar
            │    ├── traversal state
            │    └── swing web visual
            ├── CameraRig
            ├── QualityManager
            └── GameHUD (DOM bridge)
```

## Modules

| Module | Responsibility |
|---|---|
| `scene.ts` | Browser-engine initialization, scene composition, lifecycle cleanup, loading-to-selection handoff. |
| `GameWorld.ts` | Owns update order, game phases, UI events, demo driver, restart and recovery. |
| `CityBuilder.ts` | Generates mesh blocks, collision boxes, structural anchors, road/rail loops, windows, and city markers from data. |
| `PlayerController.ts` | Owns the selected avatar, body velocity, anti-tunnel collision, five-probe ground test, travel states, web/zip visuals, and pose blending. |
| `InputManager.ts` | Converts browser events into semantic movement, jump, swing, zip, wall-run, dive, pause, restart, and menu actions. |
| `CameraRig.ts` | Pointer look, velocity-aware orbit, damping, obstacle avoidance, and traversal framing. |
| `QualityManager.ts` | Preset application, detected device fallback, and sustained frame-time downgrade policy. |
| `GameHUD.ts` | React-rendered menus and HUD subscribing to a small world status bridge; never owns gameplay. |
| `types.ts` | State, collision, anchor, quality, and status vocabulary shared by the game modules. |

## Asset Hints

| Asset | Runtime usage | Target scale |
|---|---|---:|
| Facade atlas | Optional emissive procedural building skin, with authored material fallback | 1m facade module |
| Neon sign atlas | Cyan/amber sign planes mounted to building faces | 2m x 3m |
| Skyline panorama | Distant city layer behind geometry | 2560px wide, 560 world units wide |
| Megapolis emblem | Selection screen and HUD insignia | 128px DOM icon |

## Update Order

1. Sample input only if phase permits it.
2. Update target selection from actual city anchors.
3. Integrate player traversal with bounded substeps and collision resolution.
4. Update camera from post-physics player pose and obstacle line test.
5. Update city materials, environment effects, and HUD bridge.
6. Render.
