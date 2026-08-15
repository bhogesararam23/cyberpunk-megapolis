// Aerial Transit Noir — React is only the HUD frame; Babylon owns the full-screen playable city canvas.
import { useEffect, useRef } from "react";
import { Engine } from "@babylonjs/core";
import GameHUD from "@/components/GameHUD";
import { createGameScene, type GameHandle } from "@/game/scene";

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || startedRef.current) return;
    startedRef.current = true;
    const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, adaptToDeviceRatio: true });
    let handle: GameHandle | null = null;
    let disposed = false;
    createGameScene(engine, canvas)
      .then((game) => {
        if (disposed) {
          game.dispose();
          return;
        }
        handle = game;
        engine.runRenderLoop(() => game.scene.render());
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Unable to initialize traversal city.";
        window.dispatchEvent(new CustomEvent("megapolis:status", { detail: { phase: "error", notification: message } }));
        console.error("Megapolis scene initialization failed", error);
      });
    const onResize = () => engine.resize();
    window.addEventListener("resize", onResize);
    return () => {
      disposed = true;
      window.removeEventListener("resize", onResize);
      handle?.dispose();
      engine.dispose();
      startedRef.current = false;
    };
  }, []);

  return <div className="game-shell"><canvas ref={canvasRef} className="game-canvas" tabIndex={0} /><GameHUD /></div>;
}
