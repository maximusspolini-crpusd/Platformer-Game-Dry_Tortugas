import { LevelData, Player, TileType, GameState, Particle } from "./types";
import { generateLevelString } from "./levels";

export const TILE_SIZE = 32;
export const TOTAL_LEVELS = 99; // effectively infinite

const GRAVITY = 0.48;
const JUMP_FORCE = -11;
const ACCELERATION = 0.52;
const FRICTION_GROUND = 0.96;
const FRICTION_AIR = 0.997;
const MAX_FALL_SPEED = 40;
const COYOTE_FRAMES = 7;
const PLAYER_W = 26;
const PLAYER_H = 28;

export function parseLevel(levelString: string): LevelData {
  const allLines = levelString.split("\n");
  const lines = allLines.filter((l) => !l.trimStart().startsWith("#"));

  let startCol = 2;
  let startRow = 2;
  const grid: TileType[][] = [];

  for (let r = 0; r < lines.length; r++) {
    const row: TileType[] = [];
    for (let c = 0; c < lines[r].length; c++) {
      const ch = lines[r][c];
      if (ch === "S") {
        startCol = c;
        startRow = r;
        row.push(" ");
      } else {
        row.push(ch === "k" ? "K" : (ch as TileType));
      }
    }
    grid.push(row);
  }

  const rows = grid.length;
  const cols = Math.max(...grid.map((r) => r.length));

  for (let r = 0; r < rows; r++) {
    while (grid[r].length < cols) grid[r].push(" ");
  }

  return {
    grid,
    rows,
    cols,
    startCol,
    startRow,
    width: cols * TILE_SIZE,
    height: rows * TILE_SIZE,
  };
}

export function getTile(level: LevelData, col: number, row: number): TileType {
  if (row < 0 || row >= level.rows || col < 0 || col >= level.cols)
    return " ";
  return level.grid[row]?.[col] ?? " ";
}

function isSolid(t: TileType) {
  return t === "P" || t === "L";
}

function isHazard(t: TileType) {
  return t === "K" || t === "k";
}

export function createPlayer(level: LevelData): Player {
  return {
    x: level.startCol * TILE_SIZE + (TILE_SIZE - PLAYER_W) / 2,
    y: level.startRow * TILE_SIZE - PLAYER_H,
    vx: 0,
    vy: 0,
    width: PLAYER_W,
    height: PLAYER_H,
    onGround: false,
    coyoteFrames: 0,
    jumpBufferFrames: 0,
    facing: 1,
    squishY: 1,
    stretchY: 1,
  };
}

export function spawnParticles(
  particles: Particle[],
  x: number,
  y: number,
  color: string,
  count: number,
  speed: number
) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const s = speed * (0.5 + Math.random() * 0.5);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * s,
      vy: Math.sin(angle) * s,
      life: 1,
      maxLife: 1,
      color,
      size: 3 + Math.random() * 4,
    });
  }
}

export function updateParticles(particles: Particle[]) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.15;
    p.vx *= 0.95;
    p.life -= 0.03;
    p.size *= 0.97;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

export function updatePlayer(
  state: GameState,
  input: { left: boolean; right: boolean; jumpHeld: boolean }
): { died: boolean; reachedGoal: boolean } {
  const { player, levelData } = state;
  let died = false;
  let reachedGoal = false;

  if (input.left) {
    player.vx -= ACCELERATION;
    player.facing = -1;
  }
  if (input.right) {
    player.vx += ACCELERATION;
    player.facing = 1;
  }

  const friction = player.onGround ? FRICTION_GROUND : FRICTION_AIR;
  player.vx *= friction;
  if (Math.abs(player.vx) < 0.05) player.vx = 0;

  player.vy += GRAVITY;
  if (player.vy > MAX_FALL_SPEED) player.vy = MAX_FALL_SPEED;

  // Hold-to-jump: refill buffer while space held
  if (input.jumpHeld) {
    player.jumpBufferFrames = 12;
  } else if (player.jumpBufferFrames > 0) {
    player.jumpBufferFrames--;
  }

  const canJump = player.onGround || player.coyoteFrames > 0;
  if (player.jumpBufferFrames > 0 && canJump) {
    const speedBonus = Math.min(Math.abs(player.vx) * 0.04, 1.2);
    player.vy = JUMP_FORCE - speedBonus;
    player.jumpBufferFrames = 0;
    player.coyoteFrames = 0;
    player.squishY = 0.6;
    player.stretchY = 1.4;
    spawnParticles(
      state.particles,
      player.x + player.width / 2,
      player.y + player.height,
      "#64c8ff",
      6,
      3
    );
  }

  const wasOnGround = player.onGround;
  player.onGround = false;

  player.x += player.vx;
  resolveAxis(player, levelData, "x");

  player.y += player.vy;
  const landed = resolveAxis(player, levelData, "y");

  if (landed && !wasOnGround && player.vy > 2) {
    player.squishY = 0.65;
    player.stretchY = 0.8;
    spawnParticles(
      state.particles,
      player.x + player.width / 2,
      player.y + player.height,
      "rgba(100,100,120,0.7)",
      4,
      1.5
    );
  }

  player.squishY += (1 - player.squishY) * 0.2;
  player.stretchY += (1 - player.stretchY) * 0.2;

  if (wasOnGround && !player.onGround && player.vy > 0) {
    player.coyoteFrames = COYOTE_FRAMES;
  } else if (player.onGround) {
    player.coyoteFrames = 0;
  } else if (player.coyoteFrames > 0) {
    player.coyoteFrames--;
  }

  // Tile interaction
  const margin = 2;
  const left = Math.floor((player.x + margin) / TILE_SIZE);
  const right = Math.floor((player.x + player.width - margin) / TILE_SIZE);
  const top = Math.floor((player.y + margin) / TILE_SIZE);
  const bottom = Math.floor((player.y + player.height - margin) / TILE_SIZE);

  outer: for (let r = top; r <= bottom; r++) {
    for (let c = left; c <= right; c++) {
      const t = getTile(levelData, c, r);
      if (isHazard(t)) {
        died = true;
        break outer;
      }
      if (t === "G") reachedGoal = true;
    }
  }

  // World bounds
  if (player.x < 0) {
    player.x = 0;
    player.vx = 0;
  }
  if (player.x + player.width > levelData.width) {
    player.x = levelData.width - player.width;
    player.vx = 0;
  }
  if (player.y < 0) {
    player.y = 0;
    player.vy = 0;
  }
  if (player.y > levelData.height + 200) died = true;

  return { died, reachedGoal };
}

function resolveAxis(
  player: Player,
  level: LevelData,
  axis: "x" | "y"
): boolean {
  let landed = false;
  const left = Math.floor(player.x / TILE_SIZE);
  const right = Math.floor((player.x + player.width - 0.01) / TILE_SIZE);
  const top = Math.floor(player.y / TILE_SIZE);
  const bottom = Math.floor((player.y + player.height - 0.01) / TILE_SIZE);

  for (let r = top; r <= bottom; r++) {
    for (let c = left; c <= right; c++) {
      const t = getTile(level, c, r);
      if (!isSolid(t)) continue;

      const tileL = c * TILE_SIZE;
      const tileR = tileL + TILE_SIZE;
      const tileT = r * TILE_SIZE;
      const tileB = tileT + TILE_SIZE;

      const overlapL = player.x + player.width - tileL;
      const overlapR = tileR - player.x;
      const overlapT = player.y + player.height - tileT;
      const overlapB = tileB - player.y;

      if (overlapL <= 0 || overlapR <= 0 || overlapT <= 0 || overlapB <= 0)
        continue;

      if (axis === "x") {
        if (overlapL < overlapR) {
          player.x = tileL - player.width;
          player.vx = 0;
        } else {
          player.x = tileR;
          player.vx = 0;
        }
      } else {
        if (overlapT < overlapB) {
          player.y = tileT - player.height;
          player.vy = 0;
          player.onGround = true;
          landed = true;
        } else {
          player.y = tileB;
          player.vy = Math.abs(player.vy) * 0.1;
        }
      }
    }
  }
  return landed;
}

export function updateCamera(
  state: GameState,
  canvasW: number,
  canvasH: number
) {
  const { player, camera } = state;
  const speed = Math.abs(player.vx);
  const lookAhead = player.facing * speed * 3;

  const targetX = player.x + player.width / 2 + lookAhead - canvasW / 2;
  const targetY = player.y + player.height / 2 - canvasH * 0.45;

  const maxX = Math.max(0, state.levelData.width - canvasW);
  const maxY = Math.max(0, state.levelData.height - canvasH);

  const clampedX = Math.max(0, Math.min(maxX, targetX));
  const clampedY = Math.max(0, Math.min(maxY, targetY));

  const lerpSpeed = Math.min(0.12 + speed * 0.005, 0.22);
  camera.x += (clampedX - camera.x) * lerpSpeed;
  camera.y += (clampedY - camera.y) * 0.1;
}

export function initGameState(
  levelIndex: number,
  levelString: string
): GameState {
  const levelData = parseLevel(levelString);
  const player = createPlayer(levelData);
  return {
    level: levelIndex,
    player,
    camera: { x: player.x - 120, y: player.y - 300 },
    levelData,
    deathFlash: 0,
    goalReached: false,
    goalFlash: 0,
    deaths: 0,
    time: 0,
    paused: false,
    showControls: false,
    gameOver: false,
    won: false,
    particles: [],
  };
}

export function resetPlayer(state: GameState, x: number, y: number) {
  state.player.x = x;
  state.player.y = y;
  state.player.vx = 0;
  state.player.vy = 0;
  state.player.onGround = false;
  state.player.coyoteFrames = 0;
  state.player.jumpBufferFrames = 0;
  state.deathFlash = 1;
  state.deaths++;
}

/** Generate a fresh random level string for the given index. */
export function makeLevelString(levelIndex: number): string {
  return generateLevelString(levelIndex, Date.now() ^ (Math.random() * 0xffffffff));
}
