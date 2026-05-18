import { GameState, Particle } from "./types";
import { TILE_SIZE, getTile } from "./engine";

const COLORS = {
  bg: "#0d1117",
  bgGrad1: "#0d1117",
  bgGrad2: "#161b22",
  platform: "#6a6a88",
  platformTop: "#8888aa",
  platformShadow: "#3a3a55",
  hazard: "#ff3030",
  hazardGlow: "#ff6030",
  hazardDark: "#aa1010",
  checkpoint: "#ffd740",
  checkpointActive: "#40ffaa",
  goal: "#40ff70",
  goalGlow: "#a0ffb0",
  player: "#32c896",
  playerDark: "#1a8060",
  playerHighlight: "#60ffcc",
  text: "#e0e0ff",
  textDim: "#8080aa",
};

function drawTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  type: string,
  visitedCheckpoints: Set<string>,
  col: number,
  row: number,
  time: number
) {
  const ts = TILE_SIZE;
  if (type === "P" || type === "L") {
    ctx.fillStyle = COLORS.platform;
    ctx.fillRect(x, y, ts, ts);
    ctx.fillStyle = COLORS.platformTop;
    ctx.fillRect(x, y, ts, 4);
    ctx.fillStyle = COLORS.platformShadow;
    ctx.fillRect(x, y + ts - 3, ts, 3);
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x + 0.5, y + 0.5, ts - 1, ts - 1);
  } else if (type === "K" || type === "k") {
    const pulse = Math.sin(time * 0.08 + col * 0.5) * 0.15 + 0.85;
    ctx.fillStyle = COLORS.hazardDark;
    ctx.fillRect(x, y, ts, ts);
    ctx.fillStyle = `rgba(255, 48, 48, ${pulse})`;
    ctx.fillRect(x, y, ts, ts);
    ctx.fillStyle = `rgba(255, 96, 48, ${pulse * 0.6})`;
    ctx.fillRect(x + 4, y + 4, ts - 8, ts - 8);
    const grd = ctx.createLinearGradient(x, y, x, y + ts);
    grd.addColorStop(0, `rgba(255,180,100,${pulse * 0.4})`);
    grd.addColorStop(1, `rgba(200,20,20,0)`);
    ctx.fillStyle = grd;
    ctx.fillRect(x, y, ts, ts);
  } else if (type === "C") {
    const active = visitedCheckpoints.has(`${col},${row}`);
    const color = active ? COLORS.checkpointActive : COLORS.checkpoint;
    const pulse = Math.sin(time * 0.06) * 0.2 + 0.8;
    ctx.fillStyle = `rgba(0,0,0,0.3)`;
    ctx.fillRect(x + 6, y + 4, ts - 12, ts - 4);
    ctx.fillStyle = color;
    ctx.fillRect(x + 8, y + 2, ts - 16, ts - 8);
    ctx.fillStyle = `rgba(255,255,255,${pulse * 0.4})`;
    ctx.fillRect(x + 10, y + 4, ts - 20, 4);
    if (!active) {
      ctx.shadowColor = COLORS.checkpoint;
      ctx.shadowBlur = 8 * pulse;
      ctx.fillStyle = COLORS.checkpoint;
      ctx.fillRect(x + 8, y + 2, ts - 16, ts - 8);
      ctx.shadowBlur = 0;
    } else {
      ctx.shadowColor = COLORS.checkpointActive;
      ctx.shadowBlur = 10;
      ctx.fillStyle = COLORS.checkpointActive;
      ctx.fillRect(x + 8, y + 2, ts - 16, ts - 8);
      ctx.shadowBlur = 0;
    }
  } else if (type === "G") {
    const pulse = Math.sin(time * 0.07 + row * 0.3) * 0.25 + 0.75;
    ctx.fillStyle = `rgba(64, 255, 112, ${pulse * 0.3})`;
    ctx.fillRect(x - 4, y - 4, ts + 8, ts + 8);
    ctx.fillStyle = `rgba(64, 255, 112, ${pulse * 0.7})`;
    ctx.fillRect(x + 2, y + 2, ts - 4, ts - 4);
    ctx.shadowColor = COLORS.goal;
    ctx.shadowBlur = 12 * pulse;
    ctx.fillStyle = COLORS.goal;
    ctx.fillRect(x + 4, y + 4, ts - 8, ts - 8);
    ctx.shadowBlur = 0;
  }
}

function drawPlayer(ctx: CanvasRenderingContext2D, state: GameState, time: number) {
  const { player } = state;
  const cx = player.x + player.width / 2;
  const cy = player.y + player.height / 2;

  const sy = player.squishY < 1 ? player.squishY : player.stretchY;
  const sx = sy < 1 ? 2 - sy : 1 / sy;

  const drawW = player.width * sx;
  const drawH = player.height * sy;
  const drawX = cx - drawW / 2;
  const drawY = cy - drawH / 2;

  ctx.shadowColor = COLORS.playerHighlight;
  ctx.shadowBlur = 12;

  ctx.fillStyle = COLORS.playerDark;
  ctx.fillRect(drawX + 2, drawY + 2, drawW, drawH);

  ctx.fillStyle = COLORS.player;
  ctx.fillRect(drawX, drawY, drawW, drawH);

  ctx.fillStyle = COLORS.playerHighlight;
  ctx.fillRect(drawX + 4, drawY + 3, drawW * 0.35, 4);

  const eyeX = player.facing === 1
    ? drawX + drawW * 0.65
    : drawX + drawW * 0.15;
  ctx.fillStyle = "#0a0a1a";
  ctx.fillRect(eyeX, drawY + drawH * 0.25, 5, 5);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(eyeX + 1, drawY + drawH * 0.25, 2, 2);

  ctx.shadowBlur = 0;

  if (Math.abs(player.vx) > 1 && player.onGround) {
    const trailAlpha = Math.min(Math.abs(player.vx) / 5, 0.4);
    ctx.fillStyle = `rgba(50, 200, 150, ${trailAlpha})`;
    ctx.fillRect(
      drawX - player.vx * 3,
      drawY + drawH * 0.3,
      drawW * 0.6,
      drawH * 0.4
    );
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const p of particles) {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

function drawHUD(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  canvasW: number,
  canvasH: number
) {
  ctx.font = "bold 14px 'Courier New', monospace";
  ctx.textAlign = "left";

  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(8, 8, 200, 26);
  ctx.fillStyle = COLORS.text;
  ctx.fillText(
    `LEVEL ${state.level + 1}/${6}   DEATHS: ${state.deaths}`,
    14,
    26
  );

  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(canvasW - 140, 8, 132, 26);
  ctx.fillStyle = COLORS.textDim;
  const secs = Math.floor(state.time / 60);
  const mins = Math.floor(secs / 60);
  const ss = secs % 60;
  ctx.fillText(
    `${String(mins).padStart(2, "0")}:${String(ss).padStart(2, "0")}`,
    canvasW - 12,
    26
  );

  ctx.textAlign = "center";
  ctx.fillStyle = COLORS.textDim;
  ctx.font = "11px 'Courier New', monospace";
  ctx.fillText("[A/D] Move  [Space] Jump  [R] Restart  [Tab] Controls", canvasW / 2, canvasH - 10);
}

function drawDeathFlash(
  ctx: CanvasRenderingContext2D,
  alpha: number,
  canvasW: number,
  canvasH: number
) {
  ctx.fillStyle = `rgba(255, 30, 30, ${alpha * 0.5})`;
  ctx.fillRect(0, 0, canvasW, canvasH);
}

function drawGoalFlash(
  ctx: CanvasRenderingContext2D,
  alpha: number,
  canvasW: number,
  canvasH: number
) {
  ctx.fillStyle = `rgba(64, 255, 112, ${alpha * 0.5})`;
  ctx.fillRect(0, 0, canvasW, canvasH);
}

function drawControlsOverlay(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number
) {
  ctx.fillStyle = "rgba(0,0,0,0.75)";
  ctx.fillRect(0, 0, canvasW, canvasH);

  ctx.fillStyle = COLORS.text;
  ctx.font = "bold 24px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.fillText("CONTROLS", canvasW / 2, canvasH / 2 - 80);

  const lines = [
    "A / Arrow Left   — Move Left",
    "D / Arrow Right  — Move Right",
    "Space            — Jump",
    "R                — Restart Level",
    "Tab              — Toggle This Screen",
  ];
  ctx.font = "16px 'Courier New', monospace";
  ctx.fillStyle = COLORS.textDim;
  lines.forEach((l, i) => {
    ctx.fillText(l, canvasW / 2, canvasH / 2 - 30 + i * 28);
  });
}

function drawWinScreen(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  canvasW: number,
  canvasH: number,
  time: number
) {
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(0, 0, canvasW, canvasH);

  const pulse = Math.sin(time * 0.05) * 0.15 + 0.85;
  ctx.shadowColor = COLORS.goal;
  ctx.shadowBlur = 30 * pulse;
  ctx.fillStyle = COLORS.goal;
  ctx.font = "bold 48px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.fillText("YOU WIN!", canvasW / 2, canvasH / 2 - 40);
  ctx.shadowBlur = 0;

  ctx.fillStyle = COLORS.textDim;
  ctx.font = "18px 'Courier New', monospace";
  const secs = Math.floor(state.time / 60);
  const mins = Math.floor(secs / 60);
  const ss = secs % 60;
  ctx.fillText(
    `Deaths: ${state.deaths}   Time: ${String(mins).padStart(2, "0")}:${String(ss).padStart(2, "0")}`,
    canvasW / 2,
    canvasH / 2 + 20
  );
  ctx.fillStyle = COLORS.text;
  ctx.font = "14px 'Courier New', monospace";
  ctx.fillText("Press R to play again", canvasW / 2, canvasH / 2 + 60);
}

export function render(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  canvasW: number,
  canvasH: number,
  time: number
) {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, canvasW, canvasH);

  const grd = ctx.createLinearGradient(0, 0, 0, canvasH);
  grd.addColorStop(0, COLORS.bgGrad1);
  grd.addColorStop(1, COLORS.bgGrad2);
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, canvasW, canvasH);

  ctx.save();
  ctx.translate(-Math.round(state.camera.x), -Math.round(state.camera.y));

  const camL = state.camera.x;
  const camR = camL + canvasW;
  const camT = state.camera.y;
  const camB = camT + canvasH;
  const startCol = Math.max(0, Math.floor(camL / TILE_SIZE) - 1);
  const endCol = Math.min(state.levelData.cols, Math.ceil(camR / TILE_SIZE) + 1);
  const startRow = Math.max(0, Math.floor(camT / TILE_SIZE) - 1);
  const endRow = Math.min(state.levelData.rows, Math.ceil(camB / TILE_SIZE) + 1);

  for (let r = startRow; r < endRow; r++) {
    for (let c = startCol; c < endCol; c++) {
      const t = getTile(state.levelData, c, r);
      if (t === " ") continue;
      drawTile(
        ctx,
        c * TILE_SIZE,
        r * TILE_SIZE,
        t,
        state.visitedCheckpoints,
        c,
        r,
        time
      );
    }
  }

  drawParticles(ctx, state.particles);

  if (!state.won) {
    drawPlayer(ctx, state, time);
  }

  ctx.restore();

  if (state.deathFlash > 0) {
    drawDeathFlash(ctx, state.deathFlash, canvasW, canvasH);
  }
  if (state.goalFlash > 0) {
    drawGoalFlash(ctx, state.goalFlash, canvasW, canvasH);
  }

  if (!state.won) {
    drawHUD(ctx, state, canvasW, canvasH);
  }

  if (state.showControls && !state.won) {
    drawControlsOverlay(ctx, canvasW, canvasH);
  }

  if (state.won) {
    drawWinScreen(ctx, state, canvasW, canvasH, time);
  }
}
