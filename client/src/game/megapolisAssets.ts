// Aerial Transit Noir — asset URLs remain host-neutral: local development uses the existing proxy, Vercel uses one public asset base.
type MegapolisAsset = "reference" | "emblem" | "facade" | "sign" | "transit" | "skyline";

const portableNames: Record<MegapolisAsset, string> = {
  reference: "cyberpunk-megapolis-reference.png",
  emblem: "megapolis-emblem.png",
  facade: "city-facade-atlas.png",
  sign: "neon-sign-atlas.png",
  transit: "vnext-transit-signage-atlas.png",
  skyline: "skyline-panorama.png",
};

const developmentPaths: Record<MegapolisAsset, string> = {
  reference: "/manus-storage/cyberpunk-megapolis-reference_708450ea.png",
  emblem: "/manus-storage/megapolis-emblem_cdc84c90.png",
  facade: "/manus-storage/city-facade-atlas_ad18a2d6.png",
  sign: "/manus-storage/neon-sign-atlas_fe673f95.png",
  transit: "/manus-storage/vnext-transit-signage-atlas_414d8bd0.png",
  skyline: "/manus-storage/skyline-panorama_27c9972a.png",
};

export function megapolisAsset(asset: MegapolisAsset): string {
  const configuredBase = import.meta.env.VITE_MEGAPOLIS_ASSET_BASE_URL?.trim().replace(/\/+$/, "");
  return configuredBase ? `${configuredBase}/${portableNames[asset]}` : developmentPaths[asset];
}
