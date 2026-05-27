import { useRef, useEffect, useState, useCallback } from "react";
import { TileType } from "../game/types";

const ROWS = 13;
const DEFAULT_COLS = 100;
const GOAL_W = 4;
const MIN_ZOOM = 6;
const MAX_ZOOM = 48;
const DEFAULT_ZOOM = 22;

const TILE_BG: Record<string, string> = {
  P: "#6a6a88", L: "#6a6a88",
  K: "#aa1010", k: "#aa1010",
  G: "#1a6632", C: "#8a8000",
  S: "#0a3060", " ": "#0d1117",
};

const PALETTE: { tile: TileType; label: string; color: string; border: string }[] = [
  { tile: " ", label: "Empty", color: "#0d1117", border: "#2a3a4a" },
  { tile: "P", label: "Platform", color: "#6a6a88", border: "#8888aa" },
  { tile: "K", label: "Lava", color: "#aa1010", border: "#ff3030" },
  { tile: "G", label: "Goal", color: "#1a6632", border: "#40ff70" },
  { tile: "S", label: "Spawn", color: "#0a3060", border: "#40a0ff" },
];

function createDefaultGrid(cols: number): TileType[][] {
  const grid: TileType[][] = Array.from({ length: ROWS }, () =>
    new Array<TileType>(cols).fill(" ")
  );
  for (let c = 0; c < cols; c++) { grid[0][c] = "P"; grid[ROWS - 1][c] = "P"; }
  for (let r = 0; r < ROWS; r++) grid[r][0] = "P";
  for (let c = 1; c < cols; c++) { grid[10][c] = "P"; grid[11][c] = "P"; }
  grid[9][3] = "S";
  const gs = cols - GOAL_W;
  for (let r = 1; r < ROWS - 1; r++)
    for (let c = gs; c < cols; c++) grid[r][c] = "G";
  for (let c = gs; c < cols; c++) { grid[10][c] = "P"; grid[11][c] = "P"; }
  return grid;
}

function gridToString(grid: TileType[][]): string {
  return grid.map((row) => row.join("")).join("\n");
}

function stringToGrid(s: string): TileType[][] | null {
  try {
    const lines = s.replace(/\r/g, "").split("\n");
    if (lines.length === 0) return null;
    const cols = Math.max(...lines.map((l) => l.length));
    return lines.map((line) =>
      Array.from({ length: cols }, (_, c) => (line[c] ?? " ") as TileType)
    );
  } catch { return null; }
}

function cloneGrid(g: TileType[][]): TileType[][] {
  return g.map((row) => [...row]);
}

function resizeGrid(grid: TileType[][], newCols: number): TileType[][] {
  const rows = grid.length;
  const next = cloneGrid(grid);

  // Remove old goal wall
  const oldGoalStart = next[0].length - GOAL_W;
  for (let r = 0; r < rows; r++)
    for (let c = oldGoalStart; c < next[r].length; c++)
      if (next[r][c] === "G") next[r][c] = " ";

  // Resize
  if (newCols > next[0].length) {
    for (let r = 0; r < rows; r++)
      while (next[r].length < newCols) next[r].push(" ");
  } else {
    for (let r = 0; r < rows; r++) next[r] = next[r].slice(0, newCols);
  }

  // Ceiling + base + left wall
  for (let c = 0; c < newCols; c++) { next[0][c] = "P"; next[rows - 1][c] = "P"; }
  for (let r = 0; r < rows; r++) next[r][0] = "P";

  // New goal wall
  const gs = newCols - GOAL_W;
  for (let r = 1; r < rows - 1; r++)
    for (let c = gs; c < newCols; c++) next[r][c] = "G";
  for (let c = gs; c < newCols; c++) { next[10][c] = "P"; next[11][c] = "P"; }

  return next;
}

interface LevelEditorProps {
  onPlayTest: (levelString: string) => void;
  onBack: () => void;
}

export default function LevelEditor({ onPlayTest, onBack }: LevelEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [grid, setGrid] = useState<TileType[][]>(() => createDefaultGrid(DEFAULT_COLS));
  const [selectedTile, setSelectedTile] = useState<TileType>("P");
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [offsetX, setOffsetX] = useState(0);
  const [hoverCell, setHoverCell] = useState<{ col: number; row: number } | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");
  const [colsInput, setColsInput] = useState(String(DEFAULT_COLS));

  const isPaintingRef = useRef(false);
  const isPanningRef = useRef(false);
  const paintTileRef = useRef<TileType>("P");
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const gridRef = useRef(grid);
  const offsetXRef = useRef(offsetX);
  const zoomRef = useRef(zoom);
  const selectedTileRef = useRef(selectedTile);
  const undoStack = useRef<TileType[][][]>([]);
  const redoStack = useRef<TileType[][][]>([]);
  const canvasSizeRef = useRef({ w: 0, h: 0 });

  useEffect(() => { gridRef.current = grid; }, [grid]);
  useEffect(() => { offsetXRef.current = offsetX; }, [offsetX]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { selectedTileRef.current = selectedTile; }, [selectedTile]);

  const pushUndo = useCallback(() => {
    undoStack.current.push(cloneGrid(gridRef.current));
    if (undoStack.current.length > 60) undoStack.current.shift();
    redoStack.current = [];
  }, []);

  const undo = useCallback(() => {
    const prev = undoStack.current.pop();
    if (!prev) return;
    redoStack.current.push(cloneGrid(gridRef.current));
    setGrid(prev);
  }, []);

  const redo = useCallback(() => {
    const next = redoStack.current.pop();
    if (!next) return;
    undoStack.current.push(cloneGrid(gridRef.current));
    setGrid(next);
  }, []);

  // ── Canvas draw ──────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const g = gridRef.current;
    const rows = g.length;
    const cols = g[0]?.length ?? 0;
    const z = zoomRef.current;
    const ox = offsetXRef.current;
    const cw = canvas.width;
    const ch = canvas.height;

    ctx.fillStyle = "#080c12";
    ctx.fillRect(0, 0, cw, ch);

    const startCol = Math.max(0, Math.floor(ox / z));
    const endCol = Math.min(cols, Math.ceil((ox + cw) / z) + 1);

    for (let r = 0; r < rows; r++) {
      for (let c = startCol; c < endCol; c++) {
        const tile = g[r]?.[c] ?? " ";
        const sx = Math.round(c * z - ox);
        const sy = Math.round(r * z);

        ctx.fillStyle = TILE_BG[tile] ?? "#0d1117";
        ctx.fillRect(sx, sy, z, z);

        if (tile === "P" || tile === "L") {
          ctx.fillStyle = "#8888aa";
          ctx.fillRect(sx, sy, z, Math.max(2, Math.floor(z * 0.12)));
          ctx.fillStyle = "#3a3a55";
          ctx.fillRect(sx, sy + z - Math.max(2, Math.floor(z * 0.09)), z, Math.max(2, Math.floor(z * 0.09)));
        } else if (tile === "K" || tile === "k") {
          ctx.fillStyle = "#ff3020";
          ctx.globalAlpha = 0.45;
          ctx.fillRect(sx + 2, sy + 2, z - 4, z - 4);
          ctx.globalAlpha = 1;
          if (z >= 10) {
            ctx.fillStyle = "#ffaa40";
            ctx.globalAlpha = 0.2;
            ctx.fillRect(sx + 4, sy + 4, z - 8, z - 8);
            ctx.globalAlpha = 1;
          }
        } else if (tile === "G") {
          ctx.fillStyle = "#40ff70";
          ctx.globalAlpha = 0.28;
          ctx.fillRect(sx + 2, sy + 2, z - 4, z - 4);
          ctx.globalAlpha = 1;
        } else if (tile === "S") {
          ctx.fillStyle = "#40a0ff";
          ctx.globalAlpha = 0.5;
          ctx.fillRect(sx + Math.floor(z * 0.2), sy + Math.floor(z * 0.2), Math.floor(z * 0.6), Math.floor(z * 0.6));
          ctx.globalAlpha = 1;
          if (z >= 14) {
            ctx.fillStyle = "#80c8ff";
            ctx.font = `bold ${Math.floor(z * 0.5)}px monospace`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("S", sx + z / 2, sy + z / 2);
          }
        }

        ctx.strokeStyle = "rgba(255,255,255,0.04)";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(sx + 0.5, sy + 0.5, z - 1, z - 1);
      }
    }

    // Row ruler (left edge)
    const rulerW = z >= 12 ? 20 : 0;
    if (rulerW > 0) {
      for (let r = 0; r < rows; r++) {
        const sy = Math.round(r * z);
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(0, sy, rulerW, z);
        ctx.fillStyle = "#3a5070";
        ctx.font = `${Math.min(Math.floor(z * 0.42), 10)}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(r), rulerW / 2, sy + z / 2);
      }
    }

    // Hover cell
    if (hoverCell) {
      const { col, row } = hoverCell;
      if (col >= 0 && col < cols && row >= 0 && row < rows) {
        const sx = Math.round(col * z - ox);
        const sy = Math.round(row * z);
        ctx.strokeStyle = "rgba(255,255,255,0.75)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(sx + 1, sy + 1, z - 2, z - 2);
        ctx.fillStyle = TILE_BG[selectedTileRef.current] ?? "#0d1117";
        ctx.globalAlpha = 0.3;
        ctx.fillRect(sx + 1, sy + 1, z - 2, z - 2);
        ctx.globalAlpha = 1;
      }
    }
  }, [hoverCell]);

  useEffect(() => { draw(); }, [draw, grid, zoom, offsetX, hoverCell]);

  // ── Canvas resize observer ───────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obs = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      canvasSizeRef.current = { w: canvas.width, h: canvas.height };
      draw();
    });
    obs.observe(canvas);
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    return () => obs.disconnect();
  }, [draw]);

  // ── Cell from mouse ──────────────────────────────────────────────────────────
  const getCell = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const col = Math.floor((x + offsetXRef.current) / zoomRef.current);
    const row = Math.floor(y / zoomRef.current);
    return { col, row };
  }, []);

  // ── Paint tile ───────────────────────────────────────────────────────────────
  const paintCell = useCallback((col: number, row: number, tile: TileType) => {
    setGrid((prev) => {
      if (row < 0 || row >= prev.length || col < 0 || col >= prev[0].length) return prev;
      if (prev[row][col] === tile) return prev;
      const next = cloneGrid(prev);
      if (tile === "S") {
        for (let r = 0; r < next.length; r++)
          for (let c = 0; c < next[r].length; c++)
            if (next[r][c] === "S") next[r][c] = " ";
      }
      next[row][col] = tile;
      return next;
    });
  }, []);

  // ── Mouse handlers ───────────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const cell = getCell(e.clientX, e.clientY);

    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      isPanningRef.current = true;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    } else if (e.button === 0 && cell) {
      isPaintingRef.current = true;
      paintTileRef.current = selectedTileRef.current;
      pushUndo();
      paintCell(cell.col, cell.row, paintTileRef.current);
    } else if (e.button === 2 && cell) {
      isPaintingRef.current = true;
      paintTileRef.current = " ";
      pushUndo();
      paintCell(cell.col, cell.row, " ");
    }
  }, [getCell, paintCell, pushUndo]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const cell = getCell(e.clientX, e.clientY);
    setHoverCell(cell);

    if (isPanningRef.current) {
      const dx = e.clientX - lastMouseRef.current.x;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
      setOffsetX((prev) => {
        const maxOff = Math.max(0, gridRef.current[0].length * zoomRef.current - 100);
        return Math.max(0, Math.min(maxOff, prev - dx));
      });
      return;
    }

    if (isPaintingRef.current && cell) {
      paintCell(cell.col, cell.row, paintTileRef.current);
    }
  }, [getCell, paintCell]);

  const handleMouseUp = useCallback(() => {
    isPaintingRef.current = false;
    isPanningRef.current = false;
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoverCell(null);
    isPaintingRef.current = false;
    isPanningRef.current = false;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      setZoom((prev) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev - Math.sign(e.deltaY) * 4)));
    } else {
      setOffsetX((prev) => {
        const maxOff = Math.max(0, gridRef.current[0].length * zoomRef.current - 100);
        return Math.max(0, Math.min(maxOff, prev + e.deltaY * 0.8));
      });
    }
  }, []);

  // ── Keyboard shortcuts ───────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if (e.ctrlKey && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); redo(); }
      // Tile shortcuts
      if (!e.ctrlKey && !e.altKey) {
        if (e.key === "e" || e.key === "E") setSelectedTile(" ");
        if (e.key === "p" || e.key === "P") setSelectedTile("P");
        if (e.key === "k" || e.key === "K") setSelectedTile("K");
        if (e.key === "g" || e.key === "G") setSelectedTile("G");
        if (e.key === "s" || e.key === "S") setSelectedTile("S");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  // ── Column resize ────────────────────────────────────────────────────────────
  const applyCols = (n: number) => {
    const clamped = Math.max(20, n);
    setColsInput(String(clamped));
    pushUndo();
    setGrid((prev) => resizeGrid(prev, clamped));
  };

  const cols = grid[0]?.length ?? DEFAULT_COLS;
  const exportStr = gridToString(grid);

  // ── Styles ───────────────────────────────────────────────────────────────────
  const mono = "'Courier New', monospace";
  const toolbarBtnBase: React.CSSProperties = {
    fontFamily: mono, fontSize: 12, letterSpacing: 1.5, fontWeight: "bold",
    padding: "6px 14px", borderRadius: 6, cursor: "pointer",
    border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)",
    color: "#8090a8", transition: "all 0.12s",
  };

  return (
    <div style={{
      width: "100vw", height: "100vh", background: "#060a0f",
      display: "flex", flexDirection: "column", fontFamily: mono,
      color: "#e0e0ff", overflow: "hidden",
    }}>
      {/* ── Top toolbar ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "8px 12px", background: "#0a0f18",
        borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0,
        flexWrap: "wrap",
      }}>
        <button onClick={onBack} style={{ ...toolbarBtnBase, color: "#6080a0" }}>
          ← BACK
        </button>
        <div style={{ fontSize: 13, letterSpacing: 3, color: "#32c896", fontWeight: "bold", marginRight: 4 }}>
          LEVEL EDITOR
        </div>

        <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.08)", margin: "0 4px" }} />

        {/* Palette */}
        {PALETTE.map(({ tile, label, color, border }) => (
          <button
            key={tile}
            title={`${label} [${tile === " " ? "E" : tile}]`}
            onClick={() => setSelectedTile(tile)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "5px 10px", borderRadius: 6, cursor: "pointer",
              fontFamily: mono, fontSize: 11, letterSpacing: 1,
              fontWeight: "bold", transition: "all 0.12s",
              border: `1px solid ${selectedTile === tile ? border : "rgba(255,255,255,0.08)"}`,
              background: selectedTile === tile ? `${color}55` : "rgba(255,255,255,0.03)",
              color: selectedTile === tile ? "#e0e0ff" : "#6070808",
              boxShadow: selectedTile === tile ? `0 0 10px ${border}55` : "none",
            }}
          >
            <div style={{
              width: 12, height: 12, borderRadius: 2,
              background: color, border: `1px solid ${border}`,
            }} />
            {label.toUpperCase()}
          </button>
        ))}

        <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.08)", margin: "0 4px" }} />

        {/* Zoom */}
        <span style={{ fontSize: 11, color: "#4a6080", marginRight: 2 }}>ZOOM</span>
        <button onClick={() => setZoom(z => Math.max(MIN_ZOOM, z - 4))} style={{ ...toolbarBtnBase, padding: "4px 10px" }}>−</button>
        <span style={{ fontSize: 12, color: "#8090a8", minWidth: 28, textAlign: "center" }}>{zoom}px</span>
        <button onClick={() => setZoom(z => Math.min(MAX_ZOOM, z + 4))} style={{ ...toolbarBtnBase, padding: "4px 10px" }}>+</button>

        <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.08)", margin: "0 4px" }} />

        {/* Column resize */}
        <span style={{ fontSize: 11, color: "#4a6080", marginRight: 2 }}>COLS</span>
        <button onClick={() => applyCols(cols - 10)} style={{ ...toolbarBtnBase, padding: "4px 10px" }}>−10</button>
        <input
          value={colsInput}
          onChange={e => setColsInput(e.target.value)}
          onBlur={() => { const n = parseInt(colsInput); if (!isNaN(n)) applyCols(n); }}
          onKeyDown={e => { if (e.key === "Enter") { const n = parseInt(colsInput); if (!isNaN(n)) applyCols(n); } }}
          style={{
            width: 48, textAlign: "center", background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4,
            color: "#8090a8", fontFamily: mono, fontSize: 12, padding: "4px 4px",
          }}
        />
        <button onClick={() => applyCols(cols + 10)} style={{ ...toolbarBtnBase, padding: "4px 10px" }}>+10</button>

        <div style={{ flex: 1 }} />

        {/* Actions */}
        <button onClick={undo} style={{ ...toolbarBtnBase }} title="Ctrl+Z">UNDO</button>
        <button onClick={redo} style={{ ...toolbarBtnBase }} title="Ctrl+Y">REDO</button>
        <button
          onClick={() => {
            pushUndo();
            setGrid(createDefaultGrid(DEFAULT_COLS));
            setColsInput(String(DEFAULT_COLS));
            setOffsetX(0);
          }}
          style={{ ...toolbarBtnBase, color: "#a05040" }}
        >NEW</button>
        <button onClick={() => setShowImport(true)} style={{ ...toolbarBtnBase }}>IMPORT</button>
        <button onClick={() => setShowExport(true)} style={{ ...toolbarBtnBase }}>EXPORT</button>
        <button
          onClick={() => onPlayTest(exportStr)}
          style={{
            ...toolbarBtnBase,
            background: "#1a4a30", border: "1px solid #32c896",
            color: "#32c896", padding: "6px 18px",
            boxShadow: "0 0 12px rgba(50,200,150,0.2)",
          }}
        >▶ PLAY TEST</button>
      </div>

      {/* ── Canvas area ── */}
      <div ref={containerRef} style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: "100%", display: "block", cursor: "crosshair" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
          onContextMenu={e => e.preventDefault()}
        />

        {/* Scroll hint */}
        <div style={{
          position: "absolute", bottom: 8, right: 12,
          fontSize: 10, color: "#2a3a4a", letterSpacing: 1,
          pointerEvents: "none",
        }}>
          Scroll — pan · Ctrl+Scroll — zoom · Alt+drag — pan · Right-click — erase
        </div>
      </div>

      {/* ── Status bar ── */}
      <div style={{
        padding: "4px 14px", background: "#090d14",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex", gap: 24, fontSize: 11, color: "#3a5070",
        flexShrink: 0,
      }}>
        <span>
          {hoverCell ? `Row ${hoverCell.row} · Col ${hoverCell.col}` : "—"}
        </span>
        <span>Grid: {ROWS} rows × {cols} cols</span>
        <span>Selected: {PALETTE.find(p => p.tile === selectedTile)?.label ?? "—"}</span>
        <span style={{ color: "#2a3a4a" }}>
          Shortcuts: E=Empty · P=Platform · K=Lava · G=Goal · S=Spawn
        </span>
      </div>

      {/* ── Export modal ── */}
      {showExport && (
        <Modal onClose={() => setShowExport(false)} title="EXPORT LEVEL STRING">
          <p style={{ fontSize: 11, color: "#4a6080", marginBottom: 8 }}>
            Copy this string and paste it into <code>handmadeLevels.ts</code> inside{" "}
            <code>buildLevel()</code>, or use it directly with <code>parseLevel()</code>.
          </p>
          <textarea
            readOnly
            value={exportStr}
            style={{
              width: "100%", height: 240, background: "#060a10",
              border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6,
              color: "#6aaa70", fontFamily: mono, fontSize: 11,
              padding: 10, resize: "vertical", boxSizing: "border-box",
            }}
            onClick={e => (e.target as HTMLTextAreaElement).select()}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
            <button
              onClick={() => { navigator.clipboard.writeText(exportStr); }}
              style={{ ...toolbarBtnBase, color: "#32c896", border: "1px solid #32c896" }}
            >COPY</button>
            <button onClick={() => setShowExport(false)} style={toolbarBtnBase}>CLOSE</button>
          </div>
        </Modal>
      )}

      {/* ── Import modal ── */}
      {showImport && (
        <Modal onClose={() => setShowImport(false)} title="IMPORT LEVEL STRING">
          <p style={{ fontSize: 11, color: "#4a6080", marginBottom: 8 }}>
            Paste a level string (as returned by <code>buildLevel()</code>) to load it into the editor.
          </p>
          <textarea
            value={importText}
            onChange={e => { setImportText(e.target.value); setImportError(""); }}
            placeholder={"PPPPPPPPP...\n P       P...\n..."}
            style={{
              width: "100%", height: 240, background: "#060a10",
              border: `1px solid ${importError ? "#aa3020" : "rgba(255,255,255,0.1)"}`,
              borderRadius: 6, color: "#e0e0ff", fontFamily: mono,
              fontSize: 11, padding: 10, resize: "vertical", boxSizing: "border-box",
            }}
          />
          {importError && <div style={{ color: "#aa4030", fontSize: 11, marginTop: 4 }}>{importError}</div>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
            <button
              onClick={() => {
                const g = stringToGrid(importText);
                if (!g) { setImportError("Invalid level string."); return; }
                pushUndo();
                setGrid(g);
                setColsInput(String(g[0]?.length ?? DEFAULT_COLS));
                setOffsetX(0);
                setShowImport(false);
                setImportText("");
              }}
              style={{ ...toolbarBtnBase, color: "#32c896", border: "1px solid #32c896" }}
            >LOAD</button>
            <button onClick={() => { setShowImport(false); setImportText(""); setImportError(""); }} style={toolbarBtnBase}>CANCEL</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  const mono = "'Courier New', monospace";
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 100, backdropFilter: "blur(2px)",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#0d1520", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 12, padding: 24, width: 560, maxWidth: "90vw",
        boxShadow: "0 0 40px rgba(0,0,0,0.8)",
        fontFamily: mono,
      }}>
        <div style={{
          fontSize: 14, letterSpacing: 3, fontWeight: "bold",
          color: "#32c896", marginBottom: 16,
        }}>{title}</div>
        {children}
      </div>
    </div>
  );
}
