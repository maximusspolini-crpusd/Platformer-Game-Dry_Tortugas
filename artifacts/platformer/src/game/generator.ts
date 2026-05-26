// Procedural level generator
// Each level is deterministically generated from its index (same seed = same level)

const ROWS = 13;
const FLOOR_ROW = 10;
const LAVA_ROW = 11;
const BASE_ROW = 12;
const GOAL_WALL_WIDTH = 3;

// Simple seeded LCG random number generator
function makeLCG(seed: number) {
  let s = (seed ^ 0xdeadbeef) >>> 0;
  return () => {
    s = Math.imul(s, 1664525) + 1013904223;
    s >>>= 0;
    return s / 0x100000000;
  };
}

// Difficulty config per level
const DIFFICULTY = [
  // lvl  gaps  gapMin  gapMax  secMin  secMax  stoneThreshold
  { gaps: 3, gapMin: 4,  gapMax: 6,  secMin: 20, secMax: 26, stoneThreshold: 0  }, // 0
  { gaps: 3, gapMin: 5,  gapMax: 8,  secMin: 18, secMax: 24, stoneThreshold: 5  }, // 1
  { gaps: 4, gapMin: 6,  gapMax: 11, secMin: 16, secMax: 22, stoneThreshold: 8  }, // 2
  { gaps: 4, gapMin: 8,  gapMax: 14, secMin: 14, secMax: 20, stoneThreshold: 11 }, // 3
  { gaps: 4, gapMin: 9,  gapMax: 16, secMin: 12, secMax: 18, stoneThreshold: 13 }, // 4
  { gaps: 5, gapMin: 12, gapMax: 18, secMin: 10, secMax: 16, stoneThreshold: 99 }, // 5 — no stones
];

export function generateLevel(levelIndex: number): string {
  const cfg = DIFFICULTY[Math.min(levelIndex, DIFFICULTY.length - 1)];
  const rand = makeLCG(levelIndex * 2654435761 + 98765);

  // --- Generate gaps (harder ones come later in the level) ---
  const gaps: number[] = [];
  for (let i = 0; i < cfg.gaps; i++) {
    const progress = cfg.gaps === 1 ? 0.5 : i / (cfg.gaps - 1);
    const lo = Math.round(cfg.gapMin + progress * 2);
    const hi = Math.round(cfg.gapMax - (1 - progress) * 2);
    const size = lo + Math.floor(rand() * Math.max(hi - lo + 1, 1));
    gaps.push(Math.min(Math.max(size, cfg.gapMin), cfg.gapMax));
  }

  // --- Generate runway sections between gaps ---
  const sections: number[] = [];
  // First section: long runway to build up speed
  sections.push(cfg.secMax + 4 + Math.floor(rand() * 6));
  // Middle sections
  for (let i = 0; i < cfg.gaps - 1; i++) {
    sections.push(cfg.secMin + Math.floor(rand() * (cfg.secMax - cfg.secMin + 1)));
  }
  // Final landing pad before goal wall
  sections.push(10 + Math.floor(rand() * 5));

  // --- Total width ---
  const contentWidth =
    sections.reduce((a, b) => a + b, 0) + gaps.reduce((a, b) => a + b, 0);
  const totalWidth = contentWidth + GOAL_WALL_WIDTH;

  // --- Build empty grid ---
  const grid: string[][] = Array.from({ length: ROWS }, () =>
    new Array(totalWidth).fill(" ")
  );

  // --- Top wall ---
  for (let c = 0; c < totalWidth - GOAL_WALL_WIDTH; c++) grid[0][c] = "P";
  for (let c = totalWidth - GOAL_WALL_WIDTH; c < totalWidth; c++) grid[0][c] = "G";

  // --- Bottom base ---
  for (let c = 0; c < totalWidth - GOAL_WALL_WIDTH; c++) grid[BASE_ROW][c] = "P";
  for (let c = totalWidth - GOAL_WALL_WIDTH; c < totalWidth; c++) grid[BASE_ROW][c] = "G";

  // --- Left wall ---
  for (let r = 0; r < ROWS; r++) grid[r][0] = "P";

  // --- Goal wall (last GOAL_WALL_WIDTH columns, full height) ---
  for (let r = 0; r < ROWS; r++) {
    for (let gc = totalWidth - GOAL_WALL_WIDTH; gc < totalWidth; gc++) {
      grid[r][gc] = "G";
    }
  }

  // --- Default lava row to solid (gaps will override) ---
  for (let c = 0; c < totalWidth - GOAL_WALL_WIDTH; c++) {
    grid[LAVA_ROW][c] = "P";
  }

  // --- Build floor + gaps ---
  let col = 0;
  for (let si = 0; si < sections.length; si++) {
    const sec = sections[si];

    // Floor tiles for this section
    for (let c = col; c < col + sec && c < totalWidth - GOAL_WALL_WIDTH; c++) {
      grid[FLOOR_ROW][c] = "P";
      grid[LAVA_ROW][c] = "P";
    }

    // Player spawn position (in first section, column 3, one row above floor)
    if (si === 0) {
      grid[FLOOR_ROW - 1][3] = "S";
    }

    col += sec;

    // Gap
    if (si < gaps.length) {
      const gap = gaps[si];
      for (let c = col; c < col + gap && c < totalWidth - GOAL_WALL_WIDTH; c++) {
        // floor stays ' ' (empty)
        grid[LAVA_ROW][c] = "K";
      }

      // Stepping stone above gap (if gap is below threshold)
      if (gap >= 6 && gap < cfg.stoneThreshold) {
        const stoneRow = FLOOR_ROW - 4;
        // Centre the stone over the gap
        const stoneLen = Math.min(4, gap - 2);
        const stoneStart = col + Math.floor((gap - stoneLen) / 2);
        for (
          let c = stoneStart;
          c < stoneStart + stoneLen && c < col + gap - 1 && c < totalWidth - GOAL_WALL_WIDTH;
          c++
        ) {
          if (c > 0) grid[stoneRow][c] = "P";
        }
      }

      col += gap;
    }
  }

  // --- Random decorative sky platforms (seeded, so deterministic) ---
  const numSky = 2 + Math.floor(rand() * 3);
  for (let i = 0; i < numSky; i++) {
    const skyRow = 2 + Math.floor(rand() * 5); // rows 2-6
    const skyCol = 14 + Math.floor(rand() * Math.max(contentWidth - 28, 1));
    const skyLen = 3 + Math.floor(rand() * 5);
    for (
      let c = skyCol;
      c < skyCol + skyLen && c < totalWidth - GOAL_WALL_WIDTH;
      c++
    ) {
      if (c > 1 && grid[skyRow][c] === " ") grid[skyRow][c] = "P";
    }
  }

  // --- Ensure left wall isn't overwritten by floor loop ---
  for (let r = 0; r < ROWS; r++) grid[r][0] = "P";

  return grid.map((row) => row.join("")).join("\n");
}

// Pre-generate all 6 levels (can increase this for more levels)
export const TOTAL_GENERATED_LEVELS = 6;
