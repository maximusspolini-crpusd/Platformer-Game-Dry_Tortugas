// Procedural level generator — momentum platformer
//
// Layout (13 rows):
//   Row  0      ceiling (P)
//   Rows 1–8    open sky — optional stepping stones
//   Row  9      spawn row (S at col 3)
//   Row  10     main floor (P=solid, ' '=gap)
//   Row  11     lava row  (P under floor, K under gaps)
//   Row  12     base wall (P)
//   Right edge  goal wall (G tiles, rows 1–11)
//
// Difficulty and LENGTH scale with levelIndex.
// Variance: gap distribution, sky platform density and layout all vary per seed.

function mkRng(seed: number) {
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
  const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];

  const ROWS = 13;
  const FLOOR = 10;
  const LAVA = 11;
  const GOAL_W = 4;

  // Cap difficulty curve at level 8
  const diff = Math.min(levelIndex, 8);

  // ── Gap count: 3 at level 0, up to 7 at level 8+ ────────────────────
  const gapCount = 3 + Math.floor(diff * 0.55);

  // ── Gap size range grows with difficulty; cap is modest ──────────────
  const minGap = 3 + diff;
  const maxGap = Math.min(6 + diff * 2, 20); // hard cap at 20

  // ── Variance mode: each seed randomly picks a "flavour" ──────────────
  // small-heavy: lots of small gaps | big-heavy: fewer but larger gaps | mixed
  const flavour = pick(["small", "small", "mixed", "mixed", "big"] as const);

  // ── Stepping stone probability decreases with level ───────────────────
  const stoneProbBase = Math.max(0.1, 0.8 - diff * 0.09);

  // ── Progressive length — grows noticeably each level ─────────────────
  // At level 0: startLen ~12-20, endLen ~8-15
  // At level 7: startLen ~33-50, endLen ~22-36
  const startLen = rand(12 + levelIndex * 3, 20 + levelIndex * 4);
  const endLen   = rand(8  + levelIndex * 2, 15 + levelIndex * 3);

  const gapSizes: number[] = [];
  const sepSizes: number[] = [];

  for (let i = 0; i < gapCount; i++) {
    let gMin = minGap + Math.floor(i * 0.5);
    let gMax = maxGap;

    // Apply flavour bias
    if (flavour === "small") { gMax = Math.max(gMin, Math.floor(maxGap * 0.65)); }
    if (flavour === "big")   { gMin = Math.max(gMin, Math.floor(maxGap * 0.60)); }

    gapSizes.push(rand(Math.min(gMin, gMax), gMax));

    if (i < gapCount - 1) {
      // Separators also scale with level
      sepSizes.push(rand(8 + levelIndex, 16 + levelIndex * 2));
    }
  }

  // ── Total width calculation ───────────────────────────────────────────
  const playWidth =
    startLen +
    gapSizes.reduce((a, b) => a + b, 0) +
    sepSizes.reduce((a, b) => a + b, 0) +
    endLen;
  const totalWidth = 1 + playWidth + GOAL_W;
  const goalStart  = 1 + playWidth;

  // ── Initialise blank grid ─────────────────────────────────────────────
  const grid: string[][] = [];
  for (let r = 0; r < ROWS; r++) {
    grid.push(new Array(totalWidth).fill(" "));
  }

  // Ceiling and base
  for (let c = 0; c < totalWidth; c++) {
    grid[0][c] = "P";
    grid[ROWS - 1][c] = "P";
  }
  // Left wall
  for (let r = 0; r < ROWS; r++) grid[r][0] = "P";

  // ── Goal wall (rows 1–11) ─────────────────────────────────────────────
  for (let r = 1; r < ROWS - 1; r++) {
    for (let c = goalStart; c < totalWidth; c++) grid[r][c] = "G";
  }
  // Solid floor/lava approach under goal wall
  for (let c = goalStart; c < totalWidth; c++) {
    grid[FLOOR][c] = "P";
    grid[LAVA][c]  = "P";
  }

  // ── Floor layout ──────────────────────────────────────────────────────
  let col = 1;

  // Start section
  for (let c = col; c < col + startLen; c++) {
    grid[FLOOR][c] = "P";
    grid[LAVA][c]  = "P";
  }
  col += startLen;

  // Spawn marker
  grid[9][3] = "S";

  // ── Gaps + separators ────────────────────────────────────────────────
  for (let i = 0; i < gapCount; i++) {
    const gapLen = gapSizes[i];
    const gapStartCol = col;

    // Lava under gap
    for (let c = col; c < col + gapLen; c++) grid[LAVA][c] = "K";

    // ── Stepping stone(s) above gap ───────────────────────────────────
    // Decide how many stones to place: 0, 1 (common), or 2 (rare)
    const stoneCount =
      maybe(stoneProbBase)
        ? maybe(0.25) ? 2 : 1
        : 0;

    if (stoneCount >= 1) {
      const stoneRow = rand(4, 7);
      const stoneLen = rand(2, Math.max(2, Math.min(5, gapLen - 2)));
      const stoneCol = gapStartCol + Math.floor((gapLen - stoneLen) / 2);
      for (let c = stoneCol; c < stoneCol + stoneLen && c < goalStart; c++) {
        grid[stoneRow][c] = "P";
      }

      if (stoneCount === 2) {
        // Second stone at a different height, offset to one side
        const stone2Row = stoneRow <= 5 ? rand(stoneRow + 1, 7) : rand(4, stoneRow - 1);
        const stone2Len = rand(2, 3);
        const offset = maybe(0.5) ? -Math.floor(gapLen / 3) : Math.floor(gapLen / 3);
        const stone2Col = Math.max(gapStartCol, Math.min(
          goalStart - stone2Len,
          gapStartCol + Math.floor((gapLen - stone2Len) / 2) + offset
        ));
        for (let c = stone2Col; c < stone2Col + stone2Len && c < goalStart; c++) {
          grid[stone2Row][c] = "P";
        }
      }
    }

    col += gapLen;

    // Separator floor
    if (i < gapCount - 1) {
      const sepLen = sepSizes[i];
      for (let c = col; c < col + sepLen; c++) {
        grid[FLOOR][c] = "P";
        grid[LAVA][c]  = "P";
      }

      // Random "bonus" sky platform over the separator — adds visual variety
      if (maybe(0.35)) {
        const bonusRow = rand(3, 6);
        const bonusLen = rand(3, 6);
        const bonusCol = col + rand(2, Math.max(2, sepLen - bonusLen - 2));
        for (let c = bonusCol; c < bonusCol + bonusLen && c < goalStart; c++) {
          grid[bonusRow][c] = "P";
        }
      }

      col += sepLen;
    }
  }

  // End section
  for (let c = col; c < col + endLen; c++) {
    grid[FLOOR][c] = "P";
    grid[LAVA][c]  = "P";
  }

  return grid.map((row) => row.join("")).join("\n");
}
