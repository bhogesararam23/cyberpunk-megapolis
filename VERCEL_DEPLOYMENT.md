# Deploying Cyberpunk Megapolis on Vercel

This project is configured as a **static Vite application**. The Vercel build excludes development-only Manus runtime, diagnostics, and storage-proxy plugins. The game resolves launch art and Babylon texture atlases through one public asset-base setting, so the Vercel deployment has no dependency on Manus-only `/manus-storage` routing.

## Project Settings

| Setting | Value |
|---|---|
| Framework preset | Vite (or Other) |
| Root directory | `.` |
| Install command | `pnpm install --frozen-lockfile` |
| Build command | `pnpm run build:vercel` |
| Output directory | `dist/public` |
| Node.js | 20.19 or newer; use Node 22 when available |
| Required environment variable | `VITE_MEGAPOLIS_ASSET_BASE_URL` |

The root `vercel.json` provides the build/output configuration and the Vite single-page-application rewrite required for direct links such as `/demo` to resolve to `index.html`.[^vercel-vite]

## Deployment Procedure

Import the connected Git repository in the Vercel dashboard, leave the root directory at the repository root, and use the settings above. Vercel will build the static client and serve the contents of `dist/public`; the Express compatibility placeholder in `server/` is deliberately not deployed. Before promoting a production deployment, use Vercel’s preview URL to launch a traversal session and confirm that the city textures load from the configured external origin.

Create a **public** object store or Vercel Blob folder containing the six files listed below, then set `VITE_MEGAPOLIS_ASSET_BASE_URL` to its directory URL for **Production**, **Preview**, and **Development**. The URL must not end with a slash. The bucket must permit anonymous `GET` and cross-origin texture fetches from your Vercel domain.

| Required filename |
|---|
| `cyberpunk-megapolis-reference.png` |
| `megapolis-emblem.png` |
| `city-facade-atlas.png` |
| `neon-sign-atlas.png` |
| `vnext-transit-signage-atlas.png` |
| `skyline-panorama.png` |

Do not add the Manus Forge keys: the Vercel client does not use the development storage proxy, and browser-exposed credentials would be inappropriate.

## Platform Notes

The local sandbox previously hit a memory ceiling during the full `pnpm build` package step. Vercel uses the smaller static `build:vercel` command instead, which excludes the unused server bundle and development-only integrations. If the provider reports an out-of-memory build, increase its build-memory setting or deploy from a Vercel environment with more memory; no runtime fallback can make a failed provider build deployable.

## Local Verification Record

The Vercel configuration parses as valid JSON and `pnpm check` passes. The existing Manus preview still renders launch and deterministic traversal through its development-only fallback paths. For Vercel, the same paths resolve from `VITE_MEGAPOLIS_ASSET_BASE_URL` and therefore require the six filenames above. This sandbox terminated `pnpm run build:vercel` with exit 143 while Vite was transforming the large Babylon dependency graph, even after a higher Node heap allowance. That is an environment-memory limitation, not a TypeScript or routing failure; run the configured build on a Vercel preview before promoting production.

[^vercel-vite]: [Vercel, “Vite on Vercel”](https://vercel.com/docs/frameworks/frontend/vite)
