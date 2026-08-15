import { afterEach, describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from "./SettingsStore";

const originalWindow = globalThis.window;

function installStorage(value: string | null, throwsOnSave = false) {
  const calls: string[] = [];
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: {
        getItem: () => value,
        setItem: (_key: string, serialized: string) => {
          if (throwsOnSave) throw new Error("storage unavailable");
          calls.push(serialized);
        },
      },
    },
  });
  return calls;
}

afterEach(() => {
  Object.defineProperty(globalThis, "window", { configurable: true, value: originalWindow });
});

describe("flight-deck settings persistence", () => {
  it("falls back safely when persisted data is malformed", () => {
    installStorage("{not-json");
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("clamps numeric preferences while retaining valid boolean choices", () => {
    installStorage(JSON.stringify({ masterVolume: 8, sfxVolume: -4, ambienceVolume: 0.2, sensitivity: 99, fov: 0.1, invertY: true, screenShake: false, reducedMotion: true, highContrast: true }));
    expect(loadSettings()).toEqual({ ...DEFAULT_SETTINGS, masterVolume: 1, sfxVolume: 0, ambienceVolume: 0.2, sensitivity: 1.8, fov: 0.72, invertY: true, screenShake: false, reducedMotion: true, highContrast: true });
  });

  it("treats failed optional storage writes as non-fatal", () => {
    const calls = installStorage(null, true);
    expect(() => saveSettings(DEFAULT_SETTINGS)).not.toThrow();
    expect(calls).toEqual([]);
  });
});
