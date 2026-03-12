"use client";

import { getLevel } from "@/utils/uv";

export default function UVRing({ uv, color, size = 200 }) {
  const r = (size - 28) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(uv / 13, 1);

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
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
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={12}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={`${circ * pct} ${circ - circ * pct}`}
          style={{
            transition:
              "stroke-dasharray 1.4s cubic-bezier(0.4,0,0.2,1), stroke 0.8s",
            filter: `drop-shadow(0 0 12px ${color}99)`,
          }}
        />
      </svg>
      <div style={{ textAlign: "center", zIndex: 1 }}>
        <div className="uv-num" style={{ color }}>
          {uv.toFixed(1)}
        </div>
        <div className="uv-tag" style={{ color }}>
          {getLevel(uv).name}
        </div>
      </div>
    </div>
  );
}
