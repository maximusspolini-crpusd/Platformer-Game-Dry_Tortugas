import { useEffect, useRef, useCallback } from "react";
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
import { GameState, GhostFrame } from "../game/types";

const CANVAS_W = 900;
const CANVAS_H = 560;

// Per-level ghost storage: fastest run recorded this session
const levelGhosts: Record<number, GhostFrame[]> = {};

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(
    initGameState(0, makeLevelString(0))
  );
  const keysRef = useRef<Set<string>>(new Set());
  const rafRef = useRef<number>(0);
  const timeRef = useRef(0);

  // Ghost recording
  const recordingRef = useRef<GhostFrame[]>([]);
  const ghostFrameIdxRef = useRef(0);

  // The level string for the current level (kept across deaths, regenerated on level change)
  const levelStringRef = useRef<string>("");
  const spawnRef = useRef({
    x: stateRef.current.player.x,
    y: stateRef.current.player.y,
  });

  const startLevel = useCallback(
    (levelIndex: number, preserveDeaths = false, preserveTime = false, reuseString = false) => {
      const prev = stateRef.current;

      // Only generate a new layout when actually changing to a different level
      const levelStr = reuseString && levelStringRef.current
        ? levelStringRef.current
        : makeLevelString(levelIndex);
      levelStringRef.current = levelStr;

      const next = initGameState(levelIndex, levelStr);
      if (preserveDeaths) next.deaths = prev.deaths;
      if (preserveTime) next.time = prev.time;
      stateRef.current = next;
      spawnRef.current = { x: next.player.x, y: next.player.y };
      recordingRef.current = [];
      ghostFrameIdxRef.current = 0;
    },
    []
  );

  // Initialise level string on first mount
  useEffect(() => {
    levelStringRef.current = makeLevelString(0);
    const next = initGameState(0, levelStringRef.current);
    stateRef.current = next;
    spawnRef.current = { x: next.player.x, y: next.player.y };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.type === "keydown") {
        keysRef.current.add(e.code);

        if (e.code === "KeyR") {
          // R restarts the current level with a brand-new random layout
          startLevel(stateRef.current.level, false, false, false);
        }
        if (e.code === "Tab") {
          e.preventDefault();
          stateRef.current.showControls = !stateRef.current.showControls;
        }
        if (
          e.code === "Space" ||
          e.code === "ArrowUp" ||
          e.code === "KeyW"
        ) {
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
  }, [startLevel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loop = () => {
      timeRef.current++;
      const state = stateRef.current;

      // Ghost playback
      const ghost = levelGhosts[state.level] ?? null;
      const ghostIdx = ghostFrameIdxRef.current;
      const ghostFrame: GhostFrame | null = ghost
        ? ghost[Math.min(ghostIdx, ghost.length - 1)]
        : null;
      const ghostIsWinning = ghost ? ghostIdx < ghost.length - 1 : false;

      if (state.showControls) {
        render(ctx, state, CANVAS_W, CANVAS_H, timeRef.current, ghostFrame, !!ghost, ghostIsWinning);
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      state.time++;

      if (state.deathFlash > 0) state.deathFlash -= 0.05;

      // Goal flash countdown → then advance level
      if (state.goalFlash > 0) {
        state.goalFlash -= 0.025;
        if (state.goalFlash <= 0) {
          const nextLevel = state.level + 1;
          startLevel(nextLevel, true, true, false);
          render(ctx, stateRef.current, CANVAS_W, CANVAS_H, timeRef.current, null, false, false);
          rafRef.current = requestAnimationFrame(loop);
          return;
        }
        render(ctx, state, CANVAS_W, CANVAS_H, timeRef.current, null, !!ghost, ghostIsWinning);
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const keys = keysRef.current;
      const left = keys.has("KeyA") || keys.has("ArrowLeft");
      const right = keys.has("KeyD") || keys.has("ArrowRight");
      const jumpHeld =
        keys.has("Space") || keys.has("ArrowUp") || keys.has("KeyW");

      updateParticles(state.particles);

      const result = updatePlayer(state, { left, right, jumpHeld });

      // Record position every 2 frames for ghost
      if (timeRef.current % 2 === 0) {
        recordingRef.current.push({
          x: state.player.x,
          y: state.player.y,
          facing: state.player.facing,
        });
      }
      ghostFrameIdxRef.current++;

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
        // Reset ghost playback; keep recording fresh
        recordingRef.current = [];
        ghostFrameIdxRef.current = 0;
      }

      if (result.reachedGoal && state.goalFlash <= 0) {
        state.goalFlash = 1;

        // Save ghost if this run is the fastest for this level
        const prevGhost = levelGhosts[state.level];
        if (!prevGhost || recordingRef.current.length < prevGhost.length) {
          levelGhosts[state.level] = [...recordingRef.current];
        }

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
      render(
        ctx,
        state,
        CANVAS_W,
        CANVAS_H,
        timeRef.current,
        ghostFrame,
        !!ghost,
        ghostIsWinning
      );
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [startLevel]);

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
      <div
        style={{
          position: "relative",
          boxShadow:
            "0 0 40px rgba(50,200,150,0.12), 0 0 80px rgba(0,0,0,0.8)",
          border: "1px solid rgba(100,100,160,0.25)",
        }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{
            display: "block",
            maxWidth: "100vw",
            maxHeight: "calc(100vh - 20px)",
          }}
          tabIndex={0}
          onClick={(e) => (e.target as HTMLCanvasElement).focus()}
        />
        <MobileControls keysRef={keysRef} />
      </div>
    </div>
  );
}

function MobileControls({
  keysRef,
}: {
  keysRef: React.MutableRefObject<Set<string>>;
}) {
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
        <Btn
          label="◄"
          onDown={() => press("ArrowLeft")}
          onUp={() => release("ArrowLeft")}
        />
        <Btn
          label="►"
          onDown={() => press("ArrowRight")}
          onUp={() => release("ArrowRight")}
        />
      </div>
      <div style={{ pointerEvents: "all" }}>
        <Btn
          label="JUMP"
          onDown={() => press("Space")}
          onUp={() => release("Space")}
          wide
        />
      </div>
    </div>
  );
}

function Btn({
  label,
  onDown,
  onUp,
  wide,
}: {
  label: string;
  onDown: () => void;
  onUp: () => void;
  wide?: boolean;
}) {
  return (
    <button
      onPointerDown={(e) => {
        e.preventDefault();
        onDown();
      }}
      onPointerUp={(e) => {
        e.preventDefault();
        onUp();
      }}
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
