// ─── HANDMADE LEVELS ───────────────────────────────────────────────────────────
//
// HOW TO ADD A NEW LEVEL
// ──────────────────────
// 1. Call buildLevel({ width, gaps, platforms }) and push it into HANDMADE_LEVELS.
// 2. width        — total tile columns (the level scrolls horizontally)
// 3. gaps         — array of { col, len } gaps cut into the floor
//      col: leftmost column of the gap (start after the spawn runway, ≥ 20)
//      len: gap width in tiles  (4=easy · 6=medium · 9=hard · 12=extreme)
// 4. platforms    — optional sky platforms { col, row, len }
//      row 1–4 = high sky  ·  row 5–7 = mid sky (good for stepping stones)
//      col: leftmost tile, len: width in tiles
// 5. spawnCol     — column of the S spawn marker (default 3)
//
// TILE KEY
// ────────
//   P  solid wall / platform      K  lava (kills on touch)
//   G  goal tile (finish wall)    S  spawn point
//   ' ' empty / gap
//
// LEVEL LAYOUT  (13 rows, index 0–12)
//   Row 0       ceiling (P)
//   Rows 1–8    open sky + optional platforms
//   Row 9       spawn row (S marker, sky otherwise)
//   Row 10      main floor  (P = solid  |  ' ' = gap)
//   Row 11      lava row    (P under floor  |  K under gaps)
//   Row 12      base wall (P)
//   Last GOAL_W cols  →  goal wall (G rows 1–9, P rows 10–12)
//
// ─────────────────────────────────────────────────────────────────────────────

interface GapSpec {
  col: number;  // first column of the gap
  len: number;  // width in tiles
}

interface PlatformSpec {
  col: number;  // leftmost column
  row: number;  // row index (1–8)
  len: number;  // width in tiles
}

interface LevelSpec {
  width: number;
  goalWidth?: number;   // default 4
  spawnCol?: number;    // default 3
  gaps: GapSpec[];
  platforms?: PlatformSpec[];
}

function buildLevel({
  width,
  goalWidth = 4,
  spawnCol = 3,
  gaps,
  platforms = [],
}: LevelSpec): string {
  const W = width;
  const GOAL_W = goalWidth;
  const GOAL_START = W - GOAL_W;
  const ROWS = 13;
  const FLOOR = 10;
  const LAVA = 11;

  const grid: string[][] = [];
  for (let r = 0; r < ROWS; r++) grid.push(new Array(W).fill(" "));

  // Ceiling + base
  for (let c = 0; c < W; c++) {
    grid[0][c] = "P";
    grid[ROWS - 1][c] = "P";
  }
  // Left wall
  for (let r = 0; r < ROWS; r++) grid[r][0] = "P";

  // Goal wall (G in sky rows, P in floor/lava rows)
  for (let r = 1; r < ROWS - 1; r++) {
    for (let c = GOAL_START; c < W; c++) grid[r][c] = "G";
  }

  // Solid floor + lava everywhere to start, then punch gaps
  for (let c = 1; c < W; c++) {
    grid[FLOOR][c] = "P";
    grid[LAVA][c] = "P";
  }

  for (const { col, len } of gaps) {
    for (let c = col; c < col + len && c < GOAL_START; c++) {
      grid[FLOOR][c] = " ";
      grid[LAVA][c] = "K";
    }
  }

  // Spawn marker
  grid[9][spawnCol] = "S";

  // Sky platforms
  for (const { col, row, len } of platforms) {
    for (let c = col; c < col + len && c < GOAL_START; c++) {
      grid[row][c] = "P";
    }
  }

  return grid.map((r) => r.join("")).join("\n");
}

// ─── HANDMADE LEVEL DEFINITIONS ───────────────────────────────────────────────

export const HANDMADE_LEVELS: string[] = [

  // ── LEVEL 1 ── "The Basics"  width: 120
  // Teaches the core loop: run → build speed → jump farther
  // Three gaps of increasing size; stepping stones above each as a slow-path option
  // The bonus high platform over the third gap rewards players who take the leap of faith
  buildLevel({
    width: 120,
    gaps: [
      { col: 35, len: 4 },  // easy   — any speed clears this
      { col: 56, len: 6 },  // medium — needs a short run-up
      { col: 78, len: 9 },  // hard   — requires real momentum
    ],
    platforms: [
      // Stepping stones (slow-path safety nets)
      { col: 36, row: 6, len: 2 },  // above gap 1
      { col: 58, row: 5, len: 3 },  // above gap 2
      { col: 80, row: 5, len: 3 },  // above gap 3
      // Bonus shortcut platform in the high sky — brave players skip gap 3 from here
      { col: 65, row: 3, len: 5 },
    ],
  }),

];

// Export total count so UI can display "LEVEL X / N"
export const HANDMADE_LEVEL_COUNT = HANDMADE_LEVELS.length;
