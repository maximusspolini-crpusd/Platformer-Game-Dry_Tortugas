import { useEffect, useRef, useCallback } from "react";
import {
  initGameState,
  updatePlayer,
  updateCamera,
  updateParticles,
  spawnParticles,
  resetToCheckpoint,
  TOTAL_LEVELS,
  parseLevel,
  createPlayer,
} from "../game/engine";
import { render } from "../game/renderer";
import { GameState } from "../game/types";

const CANVAS_W = 900;
const CANVAS_H = 560;

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(initGameState(0));
  const keysRef = useRef<Set<string>>(new Set());
  const rafRef = useRef<number>(0);
  const timeRef = useRef(0);

  const resetGame = useCallback((levelIndex = 0) => {
    stateRef.current = initGameState(levelIndex);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.type === "keydown") {
        keysRef.current.add(e.code);
        if (e.code === "KeyR") {
          const s = stateRef.current;
          if (s.won) {
            resetGame(0);
          } else {
            stateRef.current = initGameState(s.level);
          }
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
  }, [resetGame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loop = () => {
      timeRef.current++;
      const state = stateRef.current;

      if (state.won) {
        render(ctx, state, CANVAS_W, CANVAS_H, timeRef.current);
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      if (state.showControls) {
        render(ctx, state, CANVAS_W, CANVAS_H, timeRef.current);
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      state.time++;

      if (state.deathFlash > 0) state.deathFlash -= 0.04;
      if (state.goalFlash > 0) {
        state.goalFlash -= 0.025;
        if (state.goalFlash <= 0) {
          const nextLevel = state.level + 1;
          if (nextLevel >= TOTAL_LEVELS) {
            state.won = true;
          } else {
            stateRef.current = {
              ...initGameState(nextLevel),
              deaths: state.deaths,
              time: state.time,
            };
          }
          render(ctx, stateRef.current, CANVAS_W, CANVAS_H, timeRef.current);
          rafRef.current = requestAnimationFrame(loop);
          return;
        }
      }

      const keys = keysRef.current;
      const left = keys.has("KeyA") || keys.has("ArrowLeft");
      const right = keys.has("KeyD") || keys.has("ArrowRight");
      const jumpHeld =
        keys.has("Space") ||
        keys.has("ArrowUp") ||
        keys.has("KeyW");

      updateParticles(state.particles);

      if (state.goalFlash <= 0) {
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
          resetToCheckpoint(state);
        }

        if (result.hitCheckpoint) {
          if (!state.visitedCheckpoints.has(result.hitCheckpoint)) {
            state.visitedCheckpoints.add(result.hitCheckpoint);
            const [col, row] = result.hitCheckpoint.split(",").map(Number);
            state.checkpointX = col * 32 + (32 - state.player.width) / 2;
            state.checkpointY = row * 32 - state.player.height;
            spawnParticles(
              state.particles,
              state.player.x + state.player.width / 2,
              state.player.y + state.player.height / 2,
              "#ffd740",
              10,
              3
            );
          }
        }

        if (result.reachedGoal && state.goalFlash <= 0) {
          state.goalFlash = 1;
          spawnParticles(
            state.particles,
            state.player.x + state.player.width / 2,
            state.player.y + state.player.height / 2,
            "#40ff70",
            20,
            6
          );
        }
      }

      updateCamera(state, CANVAS_W, CANVAS_H);
      render(ctx, state, CANVAS_W, CANVAS_H, timeRef.current);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

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
            "0 0 40px rgba(50,200,150,0.15), 0 0 80px rgba(0,0,0,0.8)",
          border: "1px solid rgba(100,100,160,0.3)",
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
            imageRendering: "pixelated",
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
        background: "rgba(50,200,150,0.15)",
        border: "1px solid rgba(50,200,150,0.4)",
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
