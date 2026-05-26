// Procedural level generator for momentum platformer
//
// Each call to generateLevelString() produces a unique 13-row level:
//   Row  0      — ceiling (solid P)
//   Rows 1–8    — open sky (optional stepping stones above gaps)
//   Row  9      — spawn row (S at col 3, otherwise open)
//   Row  10     — main floor (P = solid, ' ' = gap)
//   Row  11     — lava row  (P under floor, K under gaps)
//   Row  12     — base wall (solid P)
//   Right edge  — goal WALL (full column of G tiles, rows 1–11)
//
// Difficulty scales with levelIndex; gap count and size grow each level.
// Stepping stone probability decreases so later levels require more speed.

function mkRng(seed: number) {
  // xorshift-style hash — good enough for level generation
  let s = (seed ^ 0xdeadbeef) >>> 0;
  return (): number => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    s = s >>> 0;
    return s / 0x100000000;
  };
}

export function generateLevelString(levelIndex: number, seed: number): string {
  const rng = mkRng(seed ^ ((levelIndex * 0x9e3779b9) | 0));
  const rand = (min: number, max: number) =>
    Math.floor(rng() * (max - min + 1)) + min;
  const maybe = (p: number) => rng() < p;

  const ROWS = 13;
  const FLOOR = 10;
  const LAVA = 11;
  const GOAL_W = 4; // columns wide for the goal wall

  // Clamp difficulty so level 0 is gentle, maxes out around level 7
  const diff = Math.min(levelIndex, 7);

  // Gap count: 3 at level 0, up to 6 at level 6+
  const gapCount = 3 + Math.floor(diff * 0.5);

  // Gap sizes grow with difficulty
  const minGap = 4 + diff;
  const maxGap = Math.min(6 + diff * 2, 18);

  // Stepping stone above a gap: 75% at level 0, ~15% at level 7
  const stoneProbability = Math.max(0.15, 0.75 - diff * 0.085);

  // Structural lengths
  const startLen = rand(18, 28); // run-up to first gap
  const endLen = rand(12, 20);   // landing section before goal wall

  const gapSizes: number[] = [];
  const sepSizes: number[] = []; // floor sections between gaps

  for (let i = 0; i < gapCount; i++) {
    // Later gaps within a level skew larger
    const gMin = Math.min(minGap + Math.floor(i * 0.6), maxGap);
    gapSizes.push(rand(gMin, maxGap));
    if (i < gapCount - 1) {
      sepSizes.push(rand(8, 16));
    }
  }

  // Total playfield width (col 0 is left wall, cols playWidth..totalWidth-1 are goal wall)
  const playWidth =
    startLen +
    gapSizes.reduce((a, b) => a + b, 0) +
    sepSizes.reduce((a, b) => a + b, 0) +
    endLen;
  const totalWidth = 1 + playWidth + GOAL_W; // left-wall + playfield + goal-wall
  const goalStart = 1 + playWidth;           // first column of goal wall

  // Initialise blank grid
  const grid: string[][] = [];
  for (let r = 0; r < ROWS; r++) {
    grid.push(new Array(totalWidth).fill(" "));
  }

  // ── Ceiling (row 0) and base (row 12) ─────────────────────────────────
  for (let c = 0; c < totalWidth; c++) {
    grid[0][c] = "P";
    grid[ROWS - 1][c] = "P";
  }

  // ── Left wall (col 0) ─────────────────────────────────────────────────
  for (let r = 0; r < ROWS; r++) {
    grid[r][0] = "P";
  }

  // ── Goal wall: G tiles rows 1–11, plus solid floor/lava beneath ───────
  for (let r = 1; r < ROWS - 1; r++) {
    for (let c = goalStart; c < totalWidth; c++) {
      grid[r][c] = "G";
    }
  }
  // Floor and lava under goal wall stay solid so the player can run up to it
  for (let c = goalStart; c < totalWidth; c++) {
    grid[FLOOR][c] = "P";
    grid[LAVA][c] = "P";
  }

  // ── Floor layout ──────────────────────────────────────────────────────
  let col = 1;

  // Start section — solid floor, player spawns here
  for (let c = col; c < col + startLen; c++) {
    grid[FLOOR][c] = "P";
    grid[LAVA][c] = "P";
  }
  col += startLen;

  // Spawn marker (row 9 so player stands on floor at row 10)
  grid[9][3] = "S";

  // Gaps + separators
  for (let i = 0; i < gapCount; i++) {
    const gapLen = gapSizes[i];
    const gapStartCol = col;

    // Lava under gap; floor row stays blank (' ')
    for (let c = col; c < col + gapLen; c++) {
      grid[LAVA][c] = "K";
    }

    // Optional stepping stone hovering above the gap
    if (maybe(stoneProbability)) {
      const stoneRow = rand(4, 7);
      const stoneLen = rand(2, Math.max(2, Math.min(4, gapLen - 2)));
      const stoneColStart = gapStartCol + Math.floor((gapLen - stoneLen) / 2);
      for (
        let c = stoneColStart;
        c < stoneColStart + stoneLen && c < goalStart;
        c++
      ) {
        grid[stoneRow][c] = "P";
      }
    }

    col += gapLen;

    // Separator floor between gaps
    if (i < gapCount - 1) {
      const sepLen = sepSizes[i];
      for (let c = col; c < col + sepLen; c++) {
        grid[FLOOR][c] = "P";
        grid[LAVA][c] = "P";
      }
      col += sepLen;
    }
  }

  // End section — solid runway leading to the goal wall
  for (let c = col; c < col + endLen; c++) {
    grid[FLOOR][c] = "P";
    grid[LAVA][c] = "P";
  }

  return grid.map((row) => row.join("")).join("\n");
}
