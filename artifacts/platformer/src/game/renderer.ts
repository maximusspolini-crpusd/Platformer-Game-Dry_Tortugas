import { GameState, Particle } from "./types";
import { TILE_SIZE, getTile } from "./engine";

const COLORS = {
  bg: "#0d1117",
  bgGrad2: "#161b22",
  platform: "#6a6a88",
  platformTop: "#8888aa",
  platformShadow: "#3a3a55",
  hazardDark: "#aa1010",
  goal: "#40ff70",
  goalDim: "#1a6632",
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
  time: number,
  col: number,
  row: number
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

  } else if (type === "G") {
    const wave = Math.sin(time * 0.06 + row * 0.4) * 0.2 + 0.8;
    const flicker = Math.sin(time * 0.13 + col * 1.7) * 0.1 + 0.9;
    const alpha = wave * flicker;
    ctx.fillStyle = COLORS.goalDim;
    ctx.fillRect(x, y, ts, ts);
    ctx.fillStyle = `rgba(64, 255, 112, ${alpha * 0.55})`;
    ctx.fillRect(x, y, ts, ts);
    ctx.fillStyle = `rgba(180, 255, 210, ${alpha * 0.35})`;
    ctx.fillRect(x + 3, y + 3, ts - 6, ts - 6);
    ctx.shadowColor = COLORS.goal;
    ctx.shadowBlur = 14 * alpha;
    ctx.fillStyle = `rgba(64, 255, 112, ${alpha * 0.25})`;
    ctx.fillRect(x, y, ts, ts);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = `rgba(0, 80, 30, 0.5)`;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, ts - 1, ts - 1);
  }
}

function drawPlayer(ctx: CanvasRenderingContext2D, state: GameState) {
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

  const eyeX =
    player.facing === 1 ? drawX + drawW * 0.65 : drawX + drawW * 0.15;
  ctx.fillStyle = "#0a0a1a";
  ctx.fillRect(eyeX, drawY + drawH * 0.25, 5, 5);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(eyeX + 1, drawY + drawH * 0.25, 2, 2);
  ctx.shadowBlur = 0;

  const speed = Math.abs(player.vx);
  if (speed > 1 && player.onGround) {
    const trailAlpha = Math.min(speed / 12, 0.45);
    ctx.fillStyle = `rgba(50, 200, 150, ${trailAlpha})`;
    ctx.fillRect(drawX - player.vx * 3, drawY + drawH * 0.3, drawW * 0.55, drawH * 0.4);
  }
  if (speed > 8 && !player.onGround) {
    const dir = player.facing;
    ctx.strokeStyle = `rgba(100,220,255,${Math.min((speed - 8) / 10, 0.5)})`;
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const lineLen = (speed - 8) * 3;
      const oy = drawY + drawH * (0.25 + i * 0.25);
      ctx.beginPath();
      ctx.moveTo(drawX - dir * 4, oy);
      ctx.lineTo(drawX - dir * (4 + lineLen), oy);
      ctx.stroke();
    }
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
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(8, 8, 220, 26);
  ctx.fillStyle = COLORS.text;
  ctx.fillText(`LEVEL ${state.level + 1}   DEATHS: ${state.deaths}`, 14, 26);

  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(canvasW - 140, 8, 132, 26);
  const totalFrames = state.time;
  const secs = Math.floor(totalFrames / 60);
  const ms = Math.floor(((totalFrames % 60) * (1000 / 60)) / 10);
  const mins = Math.floor(secs / 60);
  const ss = secs % 60;
  ctx.fillStyle = COLORS.textDim;
  ctx.fillText(
    `${String(mins).padStart(2, "0")}:${String(ss).padStart(2, "0")}.${ms}`,
    canvasW - 12,
    26
  );

  // Speed meter
  const speed = Math.abs(state.player.vx);
  const pct = Math.min(speed / 14, 1);
  const meterW = 160;
  const meterH = 10;
  const meterX = canvasW / 2 - meterW / 2;
  const meterY = 11;
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(meterX - 2, meterY - 2, meterW + 4, meterH + 4);
  const r = Math.round(pct * 255);
  const g = Math.round((1 - pct * 0.6) * 220);
  const barColor = `rgb(${r},${g},50)`;
  ctx.fillStyle = "rgba(255,255,255,0.07)";
  ctx.fillRect(meterX, meterY, meterW, meterH);
  ctx.fillStyle = barColor;
  ctx.fillRect(meterX, meterY, meterW * pct, meterH);
  if (pct >= 0.99) {
    ctx.shadowColor = barColor;
    ctx.shadowBlur = 10;
    ctx.fillStyle = barColor;
    ctx.fillRect(meterX, meterY, meterW, meterH);
    ctx.shadowBlur = 0;
  }
  ctx.textAlign = "center";
  ctx.font = "9px 'Courier New', monospace";
  ctx.fillStyle = pct >= 0.99 ? "#fff" : COLORS.textDim;
  ctx.fillText(pct >= 0.99 ? "MAX SPEED!" : "SPEED", canvasW / 2, meterY + meterH + 10);

  // Level-clear overlay
  if (state.goalFlash > 0) {
    const alpha = Math.min(state.goalFlash * 2, 1);
    ctx.globalAlpha = alpha;
    ctx.font = "bold 36px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = COLORS.goal;
    ctx.shadowColor = COLORS.goal;
    ctx.shadowBlur = 20;
    ctx.fillText("LEVEL CLEAR!", canvasW / 2, canvasH / 2 - 20);
    ctx.font = "16px 'Courier New', monospace";
    ctx.fillStyle = COLORS.text;
    ctx.shadowBlur = 0;
    ctx.fillText(`Deaths: ${state.deaths}`, canvasW / 2, canvasH / 2 + 16);
    ctx.globalAlpha = 1;
  }

  ctx.textAlign = "center";
  ctx.fillStyle = COLORS.textDim;
  ctx.font = "11px 'Courier New', monospace";
  ctx.fillText(
    "[A/D] Move  [Hold Space] Jump  [R] New Layout",
    canvasW / 2,
    canvasH - 10
  );
}

function drawControlsOverlay(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number
) {
  ctx.fillStyle = "rgba(0,0,0,0.78)";
  ctx.fillRect(0, 0, canvasW, canvasH);
  ctx.fillStyle = COLORS.text;
  ctx.font = "bold 24px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.fillText("CONTROLS", canvasW / 2, canvasH / 2 - 90);
  const lines = [
    "A / ← Arrow      — Move Left",
    "D / → Arrow      — Move Right",
    "Hold Space / ↑   — Jump (hold to auto-bounce)",
    "R                — New random layout",
  ];
  ctx.font = "15px 'Courier New', monospace";
  ctx.fillStyle = COLORS.textDim;
  lines.forEach((l, i) => {
    ctx.fillText(l, canvasW / 2, canvasH / 2 - 35 + i * 30);
  });
  ctx.fillStyle = COLORS.textDim;
  ctx.font = "12px 'Courier New', monospace";
  ctx.fillText("Press Tab to close", canvasW / 2, canvasH / 2 + 90);
}

export function render(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  canvasW: number,
  canvasH: number,
  time: number
) {
  const grd = ctx.createLinearGradient(0, 0, 0, canvasH);
  grd.addColorStop(0, COLORS.bg);
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
      drawTile(ctx, c * TILE_SIZE, r * TILE_SIZE, t, time, c, r);
    }
  }

  drawParticles(ctx, state.particles);
  drawPlayer(ctx, state);
  ctx.restore();

  if (state.deathFlash > 0) {
    ctx.fillStyle = `rgba(255, 30, 30, ${state.deathFlash * 0.45})`;
    ctx.fillRect(0, 0, canvasW, canvasH);
  }
  if (state.goalFlash > 0) {
    ctx.fillStyle = `rgba(64, 255, 112, ${state.goalFlash * 0.3})`;
    ctx.fillRect(0, 0, canvasW, canvasH);
  }

  drawHUD(ctx, state, canvasW, canvasH);

  if (state.showControls) {
    drawControlsOverlay(ctx, canvasW, canvasH);
  }
}
