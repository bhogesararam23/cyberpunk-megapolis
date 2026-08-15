// Aerial Transit Noir — edge-aligned flight instrumentation preserves the city’s central traversal field.
import { useEffect, useState } from "react";
import { Gauge, MousePointer2, Pause, Play, RotateCcw, Settings2, Zap } from "lucide-react";
import type { CharacterId, GameStatus, QualityPreset, WeatherMode } from "@/game/types";

const reference = "/manus-storage/cyberpunk-megapolis-reference_708450ea.png";
const emblem = "/manus-storage/megapolis-emblem_cdc84c90.png";

const initial: GameStatus = {
  phase: "loading", character: "vanta", traversal: "idle", speed: 0, momentum: 0,
  target: "SCANNING", targetDistance: 0, quality: "high", fps: 0,
  notification: "Booting city lattice…", menuHint: "WASD move · Space jump · LMB swing · RMB zip · Q wall-run · E dive",
  weather: "rain", showcase: false,
  challenge: { route: "SKYRAIL CIRCUIT", state: "idle", node: 1, total: 5, target: "STREET LAUNCH", elapsed: 0, best: null },
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

  const inMenu = status.phase === "loading" || status.phase === "selection" || status.phase === "transition";
  const paused = status.phase === "paused";

  return (
    <div className={`game-hud ${highContrast ? "high-contrast" : ""}`} aria-live="polite">
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
            <span>{status.targetDistance ? `${status.targetDistance}m // unblocked path` : "sweep city geometry"}</span>
          </section>
          <section className="velocity-panel">
            <span className="eyebrow"><Gauge size={13} /> VELOCITY</span>
            <div className="velocity-row"><strong>{status.speed}</strong><small>KM/H</small></div>
            <div className="meter"><i style={{ width: `${Math.min(100, status.momentum)}%` }} /></div>
            <span className="state-chip">{status.traversal.toUpperCase()}</span>
          </section>
          <section className="mission-rail">
            <span>{status.challenge.route} // {status.challenge.state.toUpperCase()}</span>
            <div className="route-line"><i /><i /><i /><i /></div>
            <span className="route-state"><Zap size={13} /> NODE {status.challenge.node}/{status.challenge.total} // {status.challenge.target}</span>
            <span className="challenge-time">{status.challenge.elapsed.toFixed(1)}s {status.challenge.best === null ? "// NO BEST" : `// BEST ${status.challenge.best.toFixed(1)}s`}</span>
          </section>
          <p className="system-note">{status.notification}</p>
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
              <CharacterCard id="vanta" active={status.character === "vanta"} name="VANTA" label="KINETIC WEAVE" description="Graphite silhouette. Amber tension core." />
              <CharacterCard id="kite" active={status.character === "kite"} name="KITE" label="VECTOR PULSE" description="Pale signal shell. Cyan response trim." />
            </div>
            <button className="launch-button" onClick={() => emit("megapolis:start")}><Play size={17} fill="currentColor" /> BEGIN TRAVERSAL</button>
            <p className="control-strip">{status.menuHint}</p>
          </>
        )}
        {status.phase === "transition" && <p className="transition-copy">{status.notification}</p>}
      </div>
      <div className="menu-meta">
        <button className="settings-trigger" onClick={onSettings}><Settings2 size={15} /> SYSTEM SETTINGS</button>
        <span>QUALITY // {status.quality.toUpperCase()}</span>
      </div>
      {settings && <SettingsPanel status={status} reducedMotion={reducedMotion} highContrast={highContrast} onMotion={onMotion} onContrast={onContrast} />}
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
        <button className="settings-trigger" onClick={onSettings}><Settings2 size={15} /> SETTINGS</button>
      </div>
      {settings && <SettingsPanel status={status} reducedMotion={reducedMotion} highContrast={highContrast} onMotion={onMotion} onContrast={onContrast} />}
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

function SettingsPanel({ status, reducedMotion, highContrast, onMotion, onContrast }: { status: GameStatus; reducedMotion: boolean; highContrast: boolean; onMotion: (value: boolean) => void; onContrast: (value: boolean) => void }) {
  const presets: QualityPreset[] = ["high", "medium", "low"];
  const weather: WeatherMode[] = ["clear", "rain", "storm"];
  return <aside className="settings-card">
    <span className="eyebrow">SYSTEM LATTICE</span>
    <div className="quality-switch" role="group" aria-label="Quality preset">
      {presets.map((preset) => <button key={preset} className={status.quality === preset ? "active" : ""} onClick={() => emit<QualityPreset>("megapolis:quality", preset)}>{preset}</button>)}
    </div>
    <span className="setting-label">WEATHER LATTICE</span>
    <div className="quality-switch weather-switch" role="group" aria-label="Weather profile">
      {weather.map((mode) => <button key={mode} className={status.weather === mode ? "active" : ""} onClick={() => emit<WeatherMode>("megapolis:weather", mode)}>{mode}</button>)}
    </div>
    <label className="motion-toggle"><span>REDUCED MOTION</span><input type="checkbox" checked={reducedMotion} onChange={(event) => onMotion(event.target.checked)} /></label>
    <label className="motion-toggle"><span>HIGH CONTRAST</span><input type="checkbox" checked={highContrast} onChange={(event) => onContrast(event.target.checked)} /></label>
    <label className="motion-toggle"><span>SHOWCASE CAMERA</span><input type="checkbox" checked={status.showcase} onChange={(event) => emit<boolean>("megapolis:showcase", event.target.checked)} /></label>
    <small>Auto fallback protects frame time during dense traversal.</small>
  </aside>;
}
