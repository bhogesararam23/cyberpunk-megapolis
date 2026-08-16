// Aerial Transit Noir — edge-aligned flight instrumentation preserves the city’s central traversal field.
import { useEffect, useState } from "react";
import { Compass, Gauge, Map, MousePointer2, Pause, Play, RotateCcw, Settings2, Zap } from "lucide-react";
import type { CharacterId, GameStatus, QualityPreset, WeatherMode } from "@/game/types";

const reference = "/manus-storage/cyberpunk-megapolis-reference_708450ea.png";
const emblem = "/manus-storage/megapolis-emblem_cdc84c90.png";

const initial: GameStatus = {
  phase: "loading", character: "vanta", characterTrait: "KINETIC WEAVE // longer line tolerance and stronger release momentum", traversal: "idle", speed: 0, momentum: 0, chain: 0,
  target: "SCANNING", targetDistance: 0, anchorCue: "scanning", quality: "high", fps: 0,
  notification: "Booting city lattice…", menuHint: "WASD move · Space jump · LMB swing · RMB zip · Q wall-run · E dive",
  weather: "rain", showcase: false,
  photo: { active: false, hudHidden: false, orbitDistance: 10.5, orbitSpeed: 0.15, fov: 0.9, environment: "DUSK // RAIN" },
  challenge: { route: "SKYRAIL CIRCUIT", state: "idle", node: 1, total: 5, target: "STREET LAUNCH", elapsed: 0, best: null, medal: null },
  progression: { discoveries: 0, discoveryTotal: 6, credits: 0, distance: 0, record: 0, nextLandmark: "SPECTRUM PORTAL", district: "COMMERCIAL ARCADE" },
  settings: { masterVolume: 0.7, sfxVolume: 0.82, ambienceVolume: 0.34, sensitivity: 1, fov: 0.96, invertY: false, screenShake: true, reducedMotion: false, highContrast: false },
  sectors: { district: "civic-core", districtLabel: "CIVIC TRANSFER CORE", active: ["civic-core"], predicted: [] },
  diagnostics: { fps: 60, frameMs: 16.7, drawCalls: 0, triangles: 0, activeMeshes: 0, activeActors: 0, activeSectors: 1, district: "civic-core", traversal: "idle", speed: 0, target: "SCANNING" },
  diagnosticsVisible: false,
  navigation: { visible: false, player: { x: 0, z: 0 }, waypoint: null, markers: [] },
  objective: { id: "skyrail-relay", label: "SKYRAIL RELAY", state: "idle", instruction: "ENTER THE SKYRAIL CIRCUIT", unlockLabel: null, progress: 0, reward: 180, elapsed: 0, limit: 58, best: null, completed: 0, total: 3 },
  flow: { state: "idle", steps: 0, target: 4, window: 0, lastAction: "STANDBY", best: 0, completed: 0 },
};

function emit<T>(name: string, detail?: T): void {
  window.dispatchEvent(new CustomEvent<T>(name, { detail }));
}

export default function GameHUD() {
  const [status, setStatus] = useState<GameStatus>(initial);
  const [settings, setSettings] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    const update = (event: Event) => setStatus((event as CustomEvent<GameStatus>).detail);
    window.addEventListener("megapolis:status", update);
    return () => window.removeEventListener("megapolis:status", update);
  }, []);

  useEffect(() => {
    setReducedMotion(status.settings.reducedMotion);
    setHighContrast(status.settings.highContrast);
  }, [status.settings.reducedMotion, status.settings.highContrast]);

  useEffect(() => {
    const closeSettings = (event: KeyboardEvent) => {
      if (settings && event.key === "Escape") setSettings(false);
    };
    window.addEventListener("keydown", closeSettings);
    return () => window.removeEventListener("keydown", closeSettings);
  }, [settings]);

  const inMenu = status.phase === "loading" || status.phase === "selection" || status.phase === "transition";
  const paused = status.phase === "paused";

  return (
    <div className={`game-hud ${highContrast ? "high-contrast" : ""} ${status.photo.hudHidden ? "photo-hud-hidden" : ""}`}>
      <div className="hud-noise" />
      <div className="flight-cartography" aria-hidden="true">
        <span className="flight-line primary" />
        <span className="flight-line secondary" />
        <span className="anchor-beacon"><i /><i /><i /><i /></span>
        <span className="route-label">CIVIC AIRSPACE // L-07</span>
        <span className="route-label lower">CLEARANCE // ACTIVE</span>
      </div>
      <header className="signal-header">
        <div className="brand-lockup">
          <img src={emblem} alt="Megapolis emblem" className="brand-emblem" />
          <div>
            <p>MEGAPOLIS // WEB-SWING EDITION</p>
            <h1>CYBERPUNK <strong>MEGAPOLIS</strong></h1>
          </div>
        </div>
        {!inMenu && (
          <button className="icon-button" aria-label="Pause traversal" onClick={() => emit("megapolis:pause")}>
            <Pause size={18} />
          </button>
        )}
      </header>

      {!inMenu && (
        <>
          <section className="target-readout">
            <span className="eyebrow"><MousePointer2 size={13} /> TARGET VECTOR</span>
            <strong className={status.target === "SCANNING" ? "scanning" : "locked"}>{status.target}</strong>
            <span className="anchor-cue">{status.anchorCue === "boost" ? "MOMENTUM WINDOW // HOT" : status.anchorCue === "ready" ? "ANCHOR WINDOW // READY" : "ANCHOR WINDOW // SWEEP"}</span>
            <span>{status.targetDistance ? `${status.targetDistance}m // unblocked path` : "sweep city geometry"}</span>
          </section>
          <button className="map-trigger" aria-expanded={status.navigation.visible} aria-controls="tactical-atlas" aria-keyshortcuts="M" title="Open City Atlas (M)" onClick={() => emit<boolean>("megapolis:map", !status.navigation.visible)}><Map size={14} /> CITY ATLAS <kbd>M</kbd></button>
          <section className="velocity-panel">
            <span className="eyebrow"><Gauge size={13} /> VELOCITY</span>
            <div className="velocity-row"><strong>{status.speed}</strong><small>KM/H</small></div>
            <div className="meter"><i style={{ width: `${Math.min(100, status.momentum)}%` }} /></div>
            <span className="state-chip">{status.traversal.toUpperCase()} {status.chain > 1 ? `// CHAIN ${status.chain}` : ""}</span>
          </section>
          <section className={`mission-rail ${status.challenge.state}`} aria-label="Route contract status">
            <span>{status.challenge.route} // {status.challenge.state.toUpperCase()}</span>
            <div className="route-line"><i /><i /><i /><i /></div>
            <span className="route-state"><Zap size={13} /> NODE {status.challenge.node}/{status.challenge.total} // {status.challenge.target}</span>
            <span className="challenge-time">{status.challenge.elapsed.toFixed(1)}s {status.challenge.best === null ? "// NO BEST" : `// BEST ${status.challenge.best.toFixed(1)}s // ${status.challenge.medal?.toUpperCase() ?? "SIGNAL"}`}</span>
            <span className="discovery-state">{status.progression.discoveries}/{status.progression.discoveryTotal} CHARTED // {status.progression.credits} SIG // NEXT {status.progression.nextLandmark}</span>
          </section>
          <section className={`objective-rail ${status.objective.state}`} aria-label="Current traversal objective"><span>LOCAL OBJECTIVE // {status.objective.completed}/{status.objective.total}</span><strong>{status.objective.label} // {status.objective.state.toUpperCase()}</strong><small>{status.objective.instruction}{status.objective.unlockLabel ? ` // REQUIRED: ${status.objective.unlockLabel.replace(/-/g, " ").toUpperCase()}` : ""}</small><div><i style={{ width: `${status.objective.progress}%` }} /></div><em>{status.objective.elapsed.toFixed(1)}/{status.objective.limit}s // +{status.objective.reward} SIG {status.objective.best === null ? "" : `// BEST ${status.objective.best.toFixed(1)}`}</em></section>
          {status.flow.state !== "idle" && <section className={`flow-rail ${status.flow.state}`} aria-label="Flow Circuit mastery status"><span>FLOW CIRCUIT // {status.flow.state.toUpperCase()}</span><strong>{status.flow.steps}/{status.flow.target} VARIED MOVES</strong><small>{status.flow.lastAction} // {status.flow.window.toFixed(1)}s WINDOW</small><div><i style={{ width: `${Math.min(100, (status.flow.steps / status.flow.target) * 100)}%` }} /></div><em>BEST {status.flow.best}/{status.flow.target} // {status.flow.completed} CHARTED</em></section>}
          <p className="system-note" role="status" aria-live="polite">{status.notification}</p>
          {status.diagnosticsVisible && <DiagnosticsOverlay status={status} />}
          {status.navigation.visible && <TacticalAtlas status={status} />}
          {status.photo.active && <PhotoDeck status={status} />}
          <div className="reticle" aria-hidden="true"><i /><i /><i /><i /></div>
        </>
      )}

      {inMenu && <MenuPanel status={status} onSettings={() => setSettings(!settings)} settings={settings} reducedMotion={reducedMotion} highContrast={highContrast} onMotion={(value) => { setReducedMotion(value); emit("megapolis:motion", value); }} onContrast={setHighContrast} />}
      {paused && <PausePanel status={status} onSettings={() => setSettings(!settings)} settings={settings} reducedMotion={reducedMotion} highContrast={highContrast} onMotion={(value) => { setReducedMotion(value); emit("megapolis:motion", value); }} onContrast={setHighContrast} />}
    </div>
  );
}

function MenuPanel({ status, onSettings, settings, reducedMotion, highContrast, onMotion, onContrast }: { status: GameStatus; onSettings: () => void; settings: boolean; reducedMotion: boolean; highContrast: boolean; onMotion: (value: boolean) => void; onContrast: (value: boolean) => void }) {
  const selecting = status.phase === "selection";
  return (
    <main className="menu-shell" style={{ backgroundImage: `linear-gradient(90deg, rgba(3,8,18,.94) 0%, rgba(3,8,18,.72) 42%, rgba(3,8,18,.1) 78%), url(${reference})` }}>
      <div className="menu-corner north" />
      <div className="menu-corner south" />
      <div className="menu-copy">
        <span className="eyebrow">// NIGHT SHIFT PROTOCOL</span>
        <h2>Borrow the <em>skyline.</em></h2>
        <p>Every rail, rooftop, and hard-lit antenna in Sector Zero is a route waiting to be stolen.</p>
        {status.phase === "loading" && <div className="loading-line"><i /></div>}
        {selecting && (
          <>
            <div className="operator-grid" role="radiogroup" aria-label="Select operator">
              <CharacterCard id="vanta" active={status.character === "vanta"} name="VANTA" label="KINETIC WEAVE" description="Longer line tolerance. Stronger release momentum." />
              <CharacterCard id="kite" active={status.character === "kite"} name="KITE" label="VECTOR PULSE" description="Faster zip response. Stronger wall kicks." />
            </div>
            <p className="operator-trait">{status.characterTrait}</p>
            <button className="launch-button" onClick={() => emit("megapolis:start")}><Play size={17} fill="currentColor" /> BEGIN TRAVERSAL</button>
            <p className="control-strip">{status.menuHint}</p>
          </>
        )}
        {status.phase === "transition" && <p className="transition-copy">{status.notification}</p>}
      </div>
      <div className="menu-meta">
        <button className="settings-trigger" aria-expanded={settings} aria-controls="flight-deck-settings" onClick={onSettings}><Settings2 size={15} /> SYSTEM SETTINGS</button>
        <span>QUALITY // {status.quality.toUpperCase()}</span>
      </div>
      {settings && <SettingsPanel status={status} reducedMotion={reducedMotion} highContrast={highContrast} onMotion={onMotion} onContrast={onContrast} onClose={onSettings} />}
    </main>
  );
}

function PausePanel({ status, onSettings, settings, reducedMotion, highContrast, onMotion, onContrast }: { status: GameStatus; onSettings: () => void; settings: boolean; reducedMotion: boolean; highContrast: boolean; onMotion: (value: boolean) => void; onContrast: (value: boolean) => void }) {
  return (
    <main className="pause-screen">
      <div className="pause-card">
        <span className="eyebrow">// SIGNAL HOLD</span>
        <h2>Traversal <em>paused.</em></h2>
        <p>{status.notification}</p>
        <div className="pause-actions">
          <button className="launch-button" onClick={() => emit("megapolis:pause")}><Play size={16} fill="currentColor" /> RESUME</button>
          <button className="secondary-button" onClick={() => emit("megapolis:restart")}><RotateCcw size={15} /> RE-ENTER</button>
        </div>
        <button className="settings-trigger" aria-expanded={settings} aria-controls="flight-deck-settings" onClick={onSettings}><Settings2 size={15} /> SETTINGS</button>
      </div>
      {settings && <SettingsPanel status={status} reducedMotion={reducedMotion} highContrast={highContrast} onMotion={onMotion} onContrast={onContrast} onClose={onSettings} />}
    </main>
  );
}

function CharacterCard({ id, active, name, label, description }: { id: CharacterId; active: boolean; name: string; label: string; description: string }) {
  return <button className={`operator-card ${active ? "active" : ""}`} role="radio" aria-checked={active} onClick={() => emit<CharacterId>("megapolis:character", id)}>
    <span className="operator-index">0{id === "vanta" ? 1 : 2}</span>
    <strong>{name}</strong>
    <span>{label}</span>
    <small>{description}</small>
  </button>;
}

function SettingsPanel({ status, reducedMotion, highContrast, onMotion, onContrast, onClose }: { status: GameStatus; reducedMotion: boolean; highContrast: boolean; onMotion: (value: boolean) => void; onContrast: (value: boolean) => void; onClose: () => void }) {
  const presets: QualityPreset[] = ["high", "medium", "low"];
  const weather: WeatherMode[] = ["clear", "rain", "storm"];
  const update = (value: Partial<GameStatus["settings"]>) => emit("megapolis:settings", { ...status.settings, ...value });
  return <aside id="flight-deck-settings" className="settings-card" role="dialog" aria-label="Flight deck settings" tabIndex={-1}>
    <button className="settings-close" aria-label="Close flight deck settings" onClick={onClose}>CLOSE</button>
    <span className="eyebrow">SYSTEM LATTICE</span>
    <div className="quality-switch" role="group" aria-label="Quality preset">
      {presets.map((preset) => <button key={preset} aria-pressed={status.quality === preset} className={status.quality === preset ? "active" : ""} onClick={() => emit<QualityPreset>("megapolis:quality", preset)}>{preset}</button>)}
    </div>
    <span className="setting-label">WEATHER LATTICE</span>
    <div className="quality-switch weather-switch" role="group" aria-label="Weather profile">
      {weather.map((mode) => <button key={mode} aria-pressed={status.weather === mode} className={status.weather === mode ? "active" : ""} onClick={() => emit<WeatherMode>("megapolis:weather", mode)}>{mode}</button>)}
    </div>
    <span className="setting-label">AUDIO MIX</span>
    <RangeControl label="MASTER" value={status.settings.masterVolume} min={0} max={1} step={0.05} onChange={(value) => update({ masterVolume: value })} />
    <RangeControl label="SFX" value={status.settings.sfxVolume} min={0} max={1} step={0.05} onChange={(value) => update({ sfxVolume: value })} />
    <RangeControl label="AMBIENCE" value={status.settings.ambienceVolume} min={0} max={1} step={0.05} onChange={(value) => update({ ambienceVolume: value })} />
    <span className="setting-label">FLIGHT CAMERA</span>
    <RangeControl label="FOV" value={status.settings.fov} min={0.72} max={1.12} step={0.02} onChange={(value) => update({ fov: value })} />
    <RangeControl label="LOOK" value={status.settings.sensitivity} min={0.45} max={1.8} step={0.05} onChange={(value) => update({ sensitivity: value })} />
    <label className="motion-toggle"><span>INVERT Y</span><input type="checkbox" checked={status.settings.invertY} onChange={(event) => update({ invertY: event.target.checked })} /></label>
    <label className="motion-toggle"><span>IMPACT SHAKE</span><input type="checkbox" checked={status.settings.screenShake} onChange={(event) => update({ screenShake: event.target.checked })} /></label>
    <label className="motion-toggle"><span>REDUCED MOTION</span><input type="checkbox" checked={reducedMotion} onChange={(event) => onMotion(event.target.checked)} /></label>
    <label className="motion-toggle"><span>HIGH CONTRAST</span><input type="checkbox" checked={highContrast} onChange={(event) => { onContrast(event.target.checked); emit("megapolis:contrast", event.target.checked); }} /></label>
    <label className="motion-toggle"><span>SHOWCASE CAMERA</span><input type="checkbox" checked={status.showcase} onChange={(event) => emit<boolean>("megapolis:showcase", event.target.checked)} /></label>
    <label className="motion-toggle"><span>DEV TELEMETRY</span><input type="checkbox" checked={status.diagnosticsVisible} onChange={(event) => emit<boolean>("megapolis:diagnostics", event.target.checked)} /></label>
    <small>Auto fallback protects frame time during dense traversal.</small>
  </aside>;
}

function RangeControl({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void }) {
  const formatted = label === "FOV" ? `${Math.round(value * 180 / Math.PI)}°` : `${Math.round(value * 100)}%`;
  return <label className="range-control"><span>{label} <b>{formatted}</b></span><input aria-label={`${label} setting`} type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>;
}

function PhotoDeck({ status }: { status: GameStatus }) {
  const photo = status.photo;
  const update = (value: Partial<GameStatus["photo"]>) => emit("megapolis:photo", value);
  return <aside className="photo-deck" aria-label="Photo composition controls">
    <header><span>PHOTO DECK // {photo.environment}</span><button onClick={() => emit<boolean>("megapolis:showcase", false)}>EXIT</button></header>
    <p>{photo.hudHidden ? "FRAME CLEAN // INSTRUMENTS HIDDEN" : "CINEMATIC ORBIT // TRAVERSAL HELD"}</p>
    <div className="photo-controls">
      <RangeControl label="ORBIT" value={photo.orbitDistance} min={5} max={18} step={0.5} onChange={(orbitDistance) => update({ orbitDistance })} />
      <RangeControl label="DRIFT" value={photo.orbitSpeed} min={0} max={0.75} step={0.05} onChange={(orbitSpeed) => update({ orbitSpeed })} />
      <RangeControl label="LENS" value={photo.fov} min={0.58} max={1.2} step={0.02} onChange={(fov) => update({ fov })} />
    </div>
    <button className="photo-hud-toggle" aria-pressed={photo.hudHidden} onClick={() => update({ hudHidden: !photo.hudHidden })}>{photo.hudHidden ? "RESTORE HUD" : "HIDE HUD"}</button>
  </aside>;
}

function TacticalAtlas({ status }: { status: GameStatus }) {
  const navigation = status.navigation;
  const project = (value: number) => `${Math.max(4, Math.min(96, ((value + 140) / 280) * 100))}%`;
  return <aside id="tactical-atlas" className="tactical-atlas" role="dialog" aria-label="City tactical atlas">
    <header><span><Compass size={15} /> SECTOR ZERO // TACTICAL ATLAS</span><button aria-label="Close city atlas" onClick={() => emit<boolean>("megapolis:map", false)}>CLOSE</button></header>
    <p className="atlas-waypoint">{navigation.waypoint ? `${navigation.waypoint.label} // ${navigation.waypoint.distance}M // ${String(navigation.waypoint.bearing).padStart(3, "0")}°` : "SELECT A CITY SIGNAL"}</p>
    <div className="atlas-grid" aria-label="City map">
      <span className="atlas-rail rail-a" /><span className="atlas-rail rail-b" /><span className="atlas-corridor corridor-a" /><span className="atlas-corridor corridor-b" />
      {navigation.markers.map((marker) => <button key={marker.id} className={`atlas-marker ${marker.kind} ${marker.selected ? "selected" : ""} ${marker.discovered ? "charted" : "unmapped"}`} style={{ left: project(marker.x), top: project(marker.z) }} onClick={() => emit<string>("megapolis:waypoint", marker.id)} aria-label={`Set waypoint: ${marker.label}${marker.discovered ? "" : ", uncharted"}`} title={marker.label}><i /></button>)}
      <span className="atlas-player" style={{ left: project(navigation.player.x), top: project(navigation.player.z) }} aria-label="Player position" />
    </div>
    <footer><span>CYAN // DISTRICT</span><span>AMBER // ROUTE</span><span>HOLLOW // UNCHARTED</span></footer>
    <div className="atlas-list" aria-label="City signals">{navigation.markers.filter((marker) => marker.kind !== "district").slice(0, 6).map((marker) => <button key={marker.id} className={marker.selected ? "active" : ""} onClick={() => emit<string>("megapolis:waypoint", marker.id)}>{marker.label}</button>)}</div>
  </aside>;
}

function DiagnosticsOverlay({ status }: { status: GameStatus }) {
  const telemetry = status.diagnostics;
  return <aside className="diagnostics-overlay" aria-label="Developer telemetry">
    <span>VNX // {status.sectors.districtLabel}</span>
    <b>{telemetry.fps} FPS // {telemetry.frameMs.toFixed(1)} MS</b>
    <small>SECTORS {telemetry.activeSectors} // ACTORS {telemetry.activeActors} // MESH {telemetry.activeMeshes}</small>
    <small>STATE {telemetry.traversal.toUpperCase()} // {telemetry.speed} KM/H</small>
  </aside>;
}
