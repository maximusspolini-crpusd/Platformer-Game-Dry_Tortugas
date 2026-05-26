import { generateLevel, TOTAL_GENERATED_LEVELS } from "./generator";

// Procedurally generate all levels at startup.
// Same level index always produces the same layout (seeded RNG).
export const LEVELS: string[] = Array.from(
  { length: TOTAL_GENERATED_LEVELS },
  (_, i) => generateLevel(i)
);
