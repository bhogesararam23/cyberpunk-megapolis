// Aerial Transit Noir — local preferences make each return to the city feel like the player’s own flight deck.
export interface GameplaySettings {
  masterVolume: number;
  sfxVolume: number;
  ambienceVolume: number;
  sensitivity: number;
  fov: number;
  invertY: boolean;
  screenShake: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
}

const KEY = "cyberpunk-megapolis.settings.v1";
export const DEFAULT_SETTINGS: GameplaySettings = { masterVolume: 0.7, sfxVolume: 0.82, ambienceVolume: 0.34, sensitivity: 1, fov: 0.96, invertY: false, screenShake: true, reducedMotion: false, highContrast: false };

export function loadSettings(): GameplaySettings {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? "null") as Partial<GameplaySettings> | null;
    const number = (key: keyof Pick<GameplaySettings, "masterVolume" | "sfxVolume" | "ambienceVolume" | "sensitivity" | "fov">, min: number, max: number) => Number.isFinite(parsed?.[key]) ? Math.min(max, Math.max(min, Number(parsed![key]))) : DEFAULT_SETTINGS[key];
    return { masterVolume: number("masterVolume", 0, 1), sfxVolume: number("sfxVolume", 0, 1), ambienceVolume: number("ambienceVolume", 0, 1), sensitivity: number("sensitivity", 0.45, 1.8), fov: number("fov", 0.72, 1.12), invertY: typeof parsed?.invertY === "boolean" ? parsed.invertY : DEFAULT_SETTINGS.invertY, screenShake: typeof parsed?.screenShake === "boolean" ? parsed.screenShake : DEFAULT_SETTINGS.screenShake, reducedMotion: typeof parsed?.reducedMotion === "boolean" ? parsed.reducedMotion : DEFAULT_SETTINGS.reducedMotion, highContrast: typeof parsed?.highContrast === "boolean" ? parsed.highContrast : DEFAULT_SETTINGS.highContrast };
  } catch { return { ...DEFAULT_SETTINGS }; }
}

export function saveSettings(settings: GameplaySettings): void { try { window.localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* storage is optional */ } }
