export type TileType = 'P' | 'L' | 'K' | 'k' | 'C' | 'G' | 'S' | ' ';

export interface Tile {
  type: TileType;
  col: number;
  row: number;
}

export interface Vec2 {
  x: number;
  y: number;
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  onGround: boolean;
  coyoteFrames: number;
  jumpBufferFrames: number;
  facing: 1 | -1;
  squishY: number;
  stretchY: number;
}

export interface Camera {
  x: number;
  y: number;
}

export interface LevelData {
  grid: TileType[][];
  rows: number;
  cols: number;
  startCol: number;
  startRow: number;
  width: number;
  height: number;
}

export interface GameState {
  level: number;
  player: Player;
  camera: Camera;
  levelData: LevelData;
  checkpointX: number;
  checkpointY: number;
  visitedCheckpoints: Set<string>;
  deathFlash: number;
  goalReached: boolean;
  goalFlash: number;
  deaths: number;
  time: number;
  paused: boolean;
  showControls: boolean;
  gameOver: boolean;
  won: boolean;
  particles: Particle[];
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
  jumpPressed: boolean;
  restart: boolean;
}
