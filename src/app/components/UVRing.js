"use client";

import { getLevel } from "@/utils/uv";

export default function UVRing({ uv, color, size = 220, loading = false }) {
  const r = (size - 24) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(uv / 13, 1);
  const lv = getLevel(uv);

  if (loading) {
    return (
      <div
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div className="spinner" style={{ width: 36, height: 36 }} />
        <div
          style={{
            fontSize: 10,
            fontFamily: "var(--font-mono)",
            color: "var(--fg-3)",
            letterSpacing: 1,
          }}
        >
          FETCHING UV
        </div>
      </div>
    );
  }

  return (
    <div
      className="uv-ring-container"
      style={{ width: size, height: size, overflow: "visible" }}
    >
      <div
        className="uv-ring-glow"
        style={{ background: color, opacity: 0.08 }}
      />
      <svg
        width={size}
        height={size}
        style={{ position: "absolute", transform: "rotate(-90deg)" }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--border-2)"
          strokeWidth={10}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${circ * pct} ${circ - circ * pct}`}
          style={{
            transition:
              "stroke-dasharray 1.4s cubic-bezier(0.22,1,0.36,1), stroke 0.8s",
            filter: `drop-shadow(0 0 10px ${color}88)`,
          }}
        />
      </svg>
      <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
        <div className="uv-ring-value" style={{ color }}>
          {uv.toFixed(1)}
        </div>
        <div className="uv-ring-level" style={{ color }}>
          {lv.name}
        </div>
      </div>
    </div>
  );
}
