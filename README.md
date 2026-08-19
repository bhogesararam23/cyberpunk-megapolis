# Cyberpunk Megapolis

A high-velocity 3D urban traversal game built for the web. Swing, zip, wall-run, and dive across a rain-slicked neo-noir metropolis directly in your browser.

Powered by **Babylon.js**, **React 19**, **Vite**, and **TypeScript**.

---

## What is this?

I wanted to build a fast, fluid web-based movement game inspired by superhero web swinging and cyberpunk transit infrastructure (what I ended up calling the *Aerial Transit Noir* aesthetic). 

Instead of an empty tech demo with a couple of cubes, this generates a dense multi-district city with physical anchors, skybridges, monorail loops, elevated highways, ambient traffic, dynamic weather, and route challenges. Everything runs in real time with custom collision handling, velocity-aware cameras, and zero bulky asset downloads (most structural geometry, materials, and audio effects are generated procedurally on the fly).

---

## Traversal Mechanics

The movement system is designed around conservation of momentum and readable anchor states:

* **Web Swinging (Left Click)**: Fires a kinetic line to the nearest valid roof edge, bridge beam, or spire anchor. You can pump swing arcs and release at the apex to convert vertical velocity into massive forward momentum.
* **Point Zip (Right Click)**: Pulls you directly toward an anchor point with an instantaneous vector impulse. Great for quickly clearing gaps or redirecting in mid-air.
* **Wall Running (Q / Near Walls)**: Stick to vertical building facades and sprint along the glass. Kicking off the wall gives a directional boost.
* **Dive (E / Air)**: Rapidly pull downward to gain descent speed, which converts into extreme forward velocity if you chain it straight into a swing or slide.
* **Momentum Chaining**: Chaining swings, wall kicks, and dives builds up your combo meter and top speed.

### Playable Avatars

You can pick between two character loadouts with distinct physics tunings:
* **Vanta (Kinetic Weave)**: Features longer line tolerance, heavier swing gravity, and maximum release momentum. Perfect if you like soaring high above the spires.
* **Kite (Vector Pulse)**: Shorter zip cooldowns, snappier reticle targeting, and much stronger wall-kick impulses. Ideal for low-altitude street canyon weaving.

---

## Controls

| Action | Key / Input | Notes |
|---|---|---|
| **Move** | `W`, `A`, `S`, `D` | Ground strafe and mid-air directional bias |
| **Look / Aim** | `Mouse` | Pointer locked first/third person camera control |
| **Swing** | `Left Click` (Hold) | Attach to highlighted cyan anchor |
| **Point Zip** | `Right Click` | Quick leap directly to aimed anchor |
| **Jump / Kick** | `Space` | Jump on ground, wall-kick when near facades |
| **Sprint** | `Shift` (Hold) | Boost ground run speed |
| **Wall Run** | `Q` (Hold) | Stick to flat building faces while moving |
| **Dive** | `E` (Hold) | Fast drop to build dive momentum |
| **Tactical Map** | `M` | Open district overview and waypoint navigator |
| **Restart / Reset** | `R` | Quick-respawn back onto the nearest district rooftop |
| **Pause Menu** | `Esc` | Access graphics presets, audio sliders, and settings |

*(Note: If you click outside the window and lose camera control, just click anywhere on the canvas to re-lock the pointer).*

---

## City Districts & World Features

* **4 Distinct Sectors**:
  * **Civic Core**: Towering mega-spires, high altitude skybridges, and long swing drops.
  * **Commercial Arcade**: Dense mid-rise canyons covered in neon billboards and tight alleys.
  * **Foundry**: Industrial infrastructure, exposed pipelines, cooling vents, and heavy rail beams.
  * **Vertical Market**: Multi-tiered walkways and suspended platforms.
* **Dynamic Weather & Time of Day**: Rain storms, lightning flashes, dusk fog, and deep midnight neon reflections.
* **Live Route Trials**: Checkpoint races scattered across the city with bronze, silver, and gold signal medals.
* **Procedural Sound Engine**: Audio is synthesized dynamically using Web Audio API nodes so there is no need to wait for multi-megabyte sound files to buffer.
* **Performance Quality Manager**: Automatically scales mesh render distance, bloom passes, and shadow resolution if your framerate dips below 45 fps.

---

## Tech Stack

* **3D Engine**: Babylon.js v9
* **UI & HUD**: React 19, Tailwind CSS v4, Radix UI, Framer Motion, Lucide Icons
* **Build Tool**: Vite 7
* **Language**: TypeScript 5.6
* **State & Data**: React hooks with custom lightweight event bus for zero-latency 60fps bridge updates

---

## Getting Started

### Prerequisites

Make sure you have **Node.js 20+** installed on your system. pnpm is recommended, but standard npm works fine too.

### Installation

1. Clone the repository:
```bash
git clone https://github.com/bhogesararam23/cyberpunk-megapolis.git
cd cyberpunk-megapolis
```

2. Install dependencies:
```bash
pnpm install
# or: npm install
```

3. Start the local dev server:
```bash
pnpm dev
# or: npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`.

### Production Build

To test or generate a production bundle:

```bash
pnpm build
# or: npm run build
```

---

## Project Structure

A quick overview of how the codebase is organized:

```text
cyberpunk-megapolis/
├── client/
│   ├── src/
│   │   ├── components/       # React HUD, Tactical Map, and Canvas overlays
│   │   ├── game/             # Pure Babylon.js core engine & physics
│   │   │   ├── GameWorld.ts         # Main game loop and update orchestration
│   │   │   ├── PlayerController.ts  # Kinematic physics, web lines, wall detection
│   │   │   ├── CityBuilder.ts       # Procedural building generator and anchors
│   │   │   ├── CameraRig.ts         # Velocity framing and occlusion avoidance
│   │   │   ├── AudioManager.ts      # Web Audio sound synthesis
│   │   │   ├── WeatherSystem.ts     # Rain, clouds, lightning, and skybox shaders
│   │   │   ├── InputManager.ts      # Pointer lock, keyboard, and mouse binding
│   │   │   └── QualityManager.ts    # Auto-adjusts draw calls and post-processing
│   │   ├── pages/            # App routes (Home / Game viewport)
│   │   └── index.css         # Tailwind and custom cyberpunk HUD styling
├── server/                   # Lightweight Express static server
└── package.json
```

---

## Performance Tips & Known Quirks

* **Hardware Acceleration**: Make sure hardware acceleration is enabled in your browser settings (especially on Chrome or Brave), otherwise Babylon will fall back to software rendering and drop frames.
* **Laptop GPUs**: If you are on an integrated Intel or low-end GPU, press `Esc`, go to Settings, and switch the Quality preset to `Medium` or `Low`. This disables the heavy bloom and depth-of-field shaders.
* **Pointer Lock on Firefox**: Firefox sometimes shows a little permission prompt when requesting pointer lock for the first time. Just hit allow and click back into the game canvas.
* **Window Resizing**: Toggling in and out of browser fullscreen might occasionally throw off the HUD aspect ratio for a split second until the resize observer catches up.

---

## Roadmap / Things I Want to Add

- [ ] Gamepad / controller support (Xbox and DualSense mappings)
- [ ] More acrobatic air tricks while holding shift during high dives
- [ ] Sound effect toggle for retro synthwave background track
- [ ] Custom community time-trial course creator with shareable URL hashes
- [ ] Traffic collision hazards on lower street levels

---

## License

This project is open source and available under the [MIT License](LICENSE).
