import { useState } from "react";
import { HANDMADE_LEVEL_COUNT } from "../game/handmadeLevels";

type GameMode = "handmade" | "procedural";

interface MenuProps {
  onStart: (mode: GameMode) => void;
}

export default function Menu({ onStart }: MenuProps) {
  const [hovered, setHovered] = useState<GameMode | null>(null);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "linear-gradient(160deg, #0d1117 60%, #111820 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Courier New', monospace",
        color: "#e0e0ff",
        userSelect: "none",
        gap: 0,
      }}
    >
      {/* Title */}
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <div
          style={{
            fontSize: 56,
            fontWeight: "bold",
            letterSpacing: 6,
            color: "#32c896",
            textShadow: "0 0 30px rgba(50,200,150,0.6), 0 0 60px rgba(50,200,150,0.2)",
            lineHeight: 1.1,
          }}
        >
          MOMENTUM
        </div>
        <div
          style={{
            fontSize: 56,
            fontWeight: "bold",
            letterSpacing: 6,
            color: "#e0e0ff",
            textShadow: "0 0 20px rgba(200,200,255,0.15)",
            lineHeight: 1.1,
          }}
        >
          RUNNER
        </div>
      </div>

      <div
        style={{
          fontSize: 13,
          color: "#6080a0",
          letterSpacing: 3,
          marginBottom: 52,
          textTransform: "uppercase",
        }}
      >
        hold space · build speed · never stop
      </div>

      {/* Mode cards */}
      <div style={{ display: "flex", gap: 24, marginBottom: 48 }}>
        <ModeCard
          title="HANDMADE"
          subtitle={`${HANDMADE_LEVEL_COUNT} crafted ${HANDMADE_LEVEL_COUNT === 1 ? "level" : "levels"}`}
          badge="CURATED"
          badgeColor="#6080ff"
          active={hovered === "handmade"}
          onHover={() => setHovered("handmade")}
          onLeave={() => setHovered(null)}
          onClick={() => onStart("handmade")}
        />
        <ModeCard
          title="ENDLESS"
          subtitle="Infinite procedural levels"
          badge="∞ RANDOM"
          badgeColor="#32c896"
          active={hovered === "procedural"}
          onHover={() => setHovered("procedural")}
          onLeave={() => setHovered(null)}
          onClick={() => onStart("procedural")}
        />
      </div>

      {/* Controls hint */}
      <div
        style={{
          fontSize: 12,
          color: "#4a5568",
          letterSpacing: 1,
          textAlign: "center",
          lineHeight: 2,
        }}
      >
        A / D — Move &nbsp;·&nbsp; Hold Space — Jump &nbsp;·&nbsp; R — New layout &nbsp;·&nbsp; Esc — Pause
      </div>
    </div>
  );
}

function ModeCard({
  title,
  subtitle,
  badge,
  badgeColor,
  active,
  onHover,
  onLeave,
  onClick,
}: {
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  active: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
}) {
  return (
    <button
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
      style={{
        width: 200,
        padding: "28px 20px",
        background: active
          ? "rgba(50,200,150,0.08)"
          : "rgba(255,255,255,0.03)",
        border: `1px solid ${active ? "rgba(50,200,150,0.5)" : "rgba(255,255,255,0.08)"}`,
        borderRadius: 12,
        cursor: "pointer",
        transition: "all 0.18s ease",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        boxShadow: active
          ? "0 0 30px rgba(50,200,150,0.12), inset 0 0 20px rgba(50,200,150,0.04)"
          : "none",
        transform: active ? "translateY(-2px)" : "none",
      }}
    >
      {/* Badge */}
      <div
        style={{
          fontSize: 10,
          fontFamily: "'Courier New', monospace",
          letterSpacing: 2,
          color: badgeColor,
          border: `1px solid ${badgeColor}`,
          borderRadius: 4,
          padding: "2px 8px",
          opacity: active ? 1 : 0.6,
        }}
      >
        {badge}
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: 22,
          fontWeight: "bold",
          fontFamily: "'Courier New', monospace",
          color: active ? "#e0e0ff" : "#9090b0",
          letterSpacing: 3,
          transition: "color 0.18s",
        }}
      >
        {title}
      </div>

      {/* Subtitle */}
      <div
        style={{
          fontSize: 12,
          fontFamily: "'Courier New', monospace",
          color: active ? "#6080a0" : "#3a4a5a",
          letterSpacing: 1,
          transition: "color 0.18s",
        }}
      >
        {subtitle}
      </div>

      {/* Play arrow */}
      <div
        style={{
          marginTop: 4,
          fontSize: 20,
          color: active ? "#32c896" : "#2a3a3a",
          transition: "color 0.18s, transform 0.18s",
          transform: active ? "translateX(4px)" : "none",
        }}
      >
        ▶
      </div>
    </button>
  );
}
