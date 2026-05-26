import { useEffect, useRef, useCallback, useState } from "react";
import {
  initGameState,
  updatePlayer,
  updateCamera,
  updateParticles,
  spawnParticles,
  resetPlayer,
  makeLevelString,
} from "../game/engine";
import { render } from "../game/renderer";
import { GameState } from "../game/types";
import { HANDMADE_LEVELS, HANDMADE_LEVEL_COUNT } from "../game/handmadeLevels";

const CANVAS_W = 900;
const CANVAS_H = 560;

type GameMode = "handmade" | "procedural";

interface GameProps {
  mode: GameMode;
  onBackToMenu: () => void;
  onPlayEndless: () => void;
}

function getLevelString(mode: GameMode, levelIndex: number, existingStr?: string): string {
  if (mode === "handmade") {
    return HANDMADE_LEVELS[levelIndex] ?? HANDMADE_LEVELS[HANDMADE_LEVELS.length - 1];
  }
  return existingStr || makeLevelString(levelIndex);
}

export default function Game({ mode, onBackToMenu, onPlayEndless }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const levelStringRef = useRef<string>(getLevelString(mode, 0));
  const stateRef = useRef<GameState>(initGameState(0, levelStringRef.current));
  const keysRef = useRef<Set<string>>(new Set());
  const rafRef = useRef<number>(0);
  const timeRef = useRef(0);
  const spawnRef = useRef({ x: stateRef.current.player.x, y: stateRef.current.player.y });
  const pausedRef = useRef(false);

  const [paused, setPaused] = useState(false);
  const [handmadeComplete, setHandmadeComplete] = useState(false);
  const [completeStats, setCompleteStats] = useState({ deaths: 0, time: 0 });

  const startLevel = useCallback(
    (levelIndex: number, opts: { preserveDeaths?: boolean; preserveTime?: boolean; reuseString?: boolean } = {}) => {
      const { preserveDeaths = false, preserveTime = false, reuseString = false } = opts;
      const prev = stateRef.current;

      const levelStr = reuseString && levelStringRef.current
        ? levelStringRef.current
        : getLevelString(mode, levelIndex);
      levelStringRef.current = levelStr;

      const next = initGameState(levelIndex, levelStr);
      if (preserveDeaths) next.deaths = prev.deaths;
      if (preserveTime) next.time = prev.time;
      stateRef.current = next;
      spawnRef.current = { x: next.player.x, y: next.player.y };
    },
    [mode]
  );

  const togglePause = useCallback(() => {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
  }, []);

  const resume = useCallback(() => {
    pausedRef.current = false;
    setPaused(false);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.type === "keydown") {
        // Pause toggle
        if (e.code === "Escape" || e.code === "KeyP") {
          togglePause();
          return;
        }
        keysRef.current.add(e.code);
        if (e.code === "KeyR") {
          // R: restart current level with a new random layout (procedural) or same (handmade)
          const isHandmade = mode === "handmade";
          levelStringRef.current = getLevelString(
            mode,
            stateRef.current.level,
            isHandmade ? levelStringRef.current : undefined
          );
          startLevel(stateRef.current.level, { reuseString: isHandmade });
          pausedRef.current = false;
          setPaused(false);
          setHandmadeComplete(false);
        }
        if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
          e.preventDefault();
        }
      } else {
        keysRef.current.delete(e.code);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
    };
  }, [mode, startLevel, togglePause]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const levelLabel =
      mode === "handmade"
        ? `LEVEL ${stateRef.current.level + 1} / ${HANDMADE_LEVEL_COUNT}`
        : `LEVEL ${stateRef.current.level + 1}`;

    const loop = () => {
      timeRef.current++;
      const state = stateRef.current;

      // Update label in case level changed
      const label =
        mode === "handmade"
          ? `LEVEL ${state.level + 1} / ${HANDMADE_LEVEL_COUNT}`
          : `LEVEL ${state.level + 1}`;

      if (pausedRef.current) {
        render(ctx, state, CANVAS_W, CANVAS_H, timeRef.current, label);
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      state.time++;
      if (state.deathFlash > 0) state.deathFlash -= 0.05;

      // Goal flash → level transition
      if (state.goalFlash > 0) {
        state.goalFlash -= 0.025;
        if (state.goalFlash <= 0) {
          const nextLevel = state.level + 1;
          if (mode === "handmade" && nextLevel >= HANDMADE_LEVELS.length) {
            setHandmadeComplete(true);
            setCompleteStats({ deaths: state.deaths, time: state.time });
          } else {
            startLevel(nextLevel, { preserveDeaths: true, preserveTime: true });
          }
        }
        render(ctx, stateRef.current, CANVAS_W, CANVAS_H, timeRef.current, label);
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const keys = keysRef.current;
      const left = keys.has("KeyA") || keys.has("ArrowLeft");
      const right = keys.has("KeyD") || keys.has("ArrowRight");
      const jumpHeld = keys.has("Space") || keys.has("ArrowUp") || keys.has("KeyW");

      updateParticles(state.particles);
      const result = updatePlayer(state, { left, right, jumpHeld });

      if (result.died) {
        spawnParticles(
          state.particles,
          state.player.x + state.player.width / 2,
          state.player.y + state.player.height / 2,
          "#32c896",
          16,
          5
        );
        resetPlayer(state, spawnRef.current.x, spawnRef.current.y);
      }

      if (result.reachedGoal && state.goalFlash <= 0) {
        state.goalFlash = 1;
        spawnParticles(
          state.particles,
          state.player.x + state.player.width / 2,
          state.player.y + state.player.height / 2,
          "#40ff70",
          24,
          6
        );
      }

      updateCamera(state, CANVAS_W, CANVAS_H);
      render(ctx, state, CANVAS_W, CANVAS_H, timeRef.current, label);
      rafRef.current = requestAnimationFrame(loop);
    };

    void levelLabel; // used by inner label closure
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [mode, startLevel]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#0d1117",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      <div style={{ position: "relative", boxShadow: "0 0 40px rgba(50,200,150,0.12), 0 0 80px rgba(0,0,0,0.8)", border: "1px solid rgba(100,100,160,0.25)" }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{ display: "block", maxWidth: "100vw", maxHeight: "calc(100vh - 20px)" }}
          tabIndex={0}
          onClick={(e) => (e.target as HTMLCanvasElement).focus()}
        />
        <MobileControls keysRef={keysRef} />

        {/* Pause overlay */}
        {paused && !handmadeComplete && (
          <Overlay>
            <OverlayTitle>PAUSED</OverlayTitle>
            <OverlayBtn primary onClick={resume}>▶  RESUME</OverlayBtn>
            {mode === "handmade" && (
              <OverlayBtn onClick={onPlayEndless}>∞  PLAY ENDLESS</OverlayBtn>
            )}
            <OverlayBtn onClick={onBackToMenu}>⌂  BACK TO MENU</OverlayBtn>
            <OverlayHint>
              A/D — Move &nbsp;·&nbsp; Hold Space — Jump<br />
              R — New layout &nbsp;·&nbsp; Esc — Pause
            </OverlayHint>
          </Overlay>
        )}

        {/* Handmade complete overlay */}
        {handmadeComplete && (
          <Overlay>
            <OverlayTitle glow>ALL LEVELS CLEAR!</OverlayTitle>
            <CompleteStat deaths={completeStats.deaths} time={completeStats.time} />
            <OverlayBtn primary onClick={onPlayEndless}>∞  PLAY ENDLESS</OverlayBtn>
            <OverlayBtn onClick={onBackToMenu}>⌂  BACK TO MENU</OverlayBtn>
          </Overlay>
        )}
      </div>
    </div>
  );
}

// ── Overlay UI primitives ──────────────────────────────────────────────────────

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(5,8,14,0.82)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        backdropFilter: "blur(2px)",
      }}
    >
      {children}
    </div>
  );
}

function OverlayTitle({ children, glow }: { children: React.ReactNode; glow?: boolean }) {
  return (
    <div
      style={{
        fontFamily: "'Courier New', monospace",
        fontSize: 32,
        fontWeight: "bold",
        letterSpacing: 4,
        color: glow ? "#40ff70" : "#e0e0ff",
        textShadow: glow ? "0 0 24px rgba(64,255,112,0.7)" : "none",
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

function OverlayBtn({
  children,
  onClick,
  primary,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 220,
        padding: "12px 0",
        fontFamily: "'Courier New', monospace",
        fontSize: 14,
        letterSpacing: 2,
        fontWeight: "bold",
        color: primary ? "#0d1117" : hov ? "#e0e0ff" : "#8090a0",
        background: primary
          ? hov ? "#50ffaa" : "#32c896"
          : hov ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)",
        border: primary
          ? "none"
          : `1px solid ${hov ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)"}`,
        borderRadius: 8,
        cursor: "pointer",
        transition: "all 0.15s",
        boxShadow: primary && hov ? "0 0 20px rgba(50,200,150,0.4)" : "none",
      }}
    >
      {children}
    </button>
  );
}

function OverlayHint({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        marginTop: 8,
        fontFamily: "'Courier New', monospace",
        fontSize: 11,
        color: "#3a4a5a",
        textAlign: "center",
        lineHeight: 1.8,
      }}
    >
      {children}
    </div>
  );
}

function CompleteStat({ deaths, time }: { deaths: number; time: number }) {
  const secs = Math.floor(time / 60);
  const ms = Math.floor(((time % 60) * (1000 / 60)) / 10);
  const mins = Math.floor(secs / 60);
  const ss = secs % 60;
  const timeStr = `${String(mins).padStart(2, "0")}:${String(ss).padStart(2, "0")}.${ms}`;
  return (
    <div
      style={{
        fontFamily: "'Courier New', monospace",
        fontSize: 13,
        color: "#6080a0",
        marginBottom: 8,
        textAlign: "center",
        lineHeight: 1.8,
      }}
    >
      Deaths: {deaths} &nbsp;·&nbsp; Time: {timeStr}
    </div>
  );
}

// ── Mobile controls ────────────────────────────────────────────────────────────

function MobileControls({ keysRef }: { keysRef: React.MutableRefObject<Set<string>> }) {
  const press = (code: string) => keysRef.current.add(code);
  const release = (code: string) => keysRef.current.delete(code);
  return (
    <div
      style={{
        position: "absolute",
        bottom: 8,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "space-between",
        padding: "0 12px",
        pointerEvents: "none",
      }}
    >
      <div style={{ display: "flex", gap: 8, pointerEvents: "all" }}>
        <Btn label="◄" onDown={() => press("ArrowLeft")} onUp={() => release("ArrowLeft")} />
        <Btn label="►" onDown={() => press("ArrowRight")} onUp={() => release("ArrowRight")} />
      </div>
      <div style={{ pointerEvents: "all" }}>
        <Btn label="JUMP" onDown={() => press("Space")} onUp={() => release("Space")} wide />
      </div>
    </div>
  );
}

function Btn({ label, onDown, onUp, wide }: { label: string; onDown: () => void; onUp: () => void; wide?: boolean }) {
  return (
    <button
      onPointerDown={(e) => { e.preventDefault(); onDown(); }}
      onPointerUp={(e) => { e.preventDefault(); onUp(); }}
      onPointerLeave={onUp}
      style={{
        background: "rgba(50,200,150,0.12)",
        border: "1px solid rgba(50,200,150,0.35)",
        color: "#32c896",
        borderRadius: 6,
        padding: wide ? "10px 20px" : "10px 16px",
        fontSize: 16,
        fontFamily: "monospace",
        cursor: "pointer",
        touchAction: "none",
        minWidth: wide ? 80 : 44,
      }}
    >
      {label}
    </button>
  );
}
