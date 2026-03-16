"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { FITZPATRICK_TYPES, uvAtHour } from "./data";

const SLIP_ICONS = ["🧢", "👕", "🕶️", "🧴"];

export default function RiskGauge({ hourSlider, peakUVI = 12 }) {
  const svgRef = useRef(null);
  const [skinType, setSkinType] = useState(1);

  const uv = uvAtHour(peakUVI, hourSlider);
  const fitz = FITZPATRICK_TYPES.find((f) => f.type === skinType);
  const burnTime = uv > 0 ? Math.round((200 / uv) * fitz.factor) : null;

  useEffect(() => {
    if (!svgRef.current) return;

    const size = 200;
    const r = 80;
    const cx = size / 2;
    const cy = size / 2 + 10;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", size).attr("height", size);

    // Background arc (grey track)
    const bgArc = d3.arc()
      .innerRadius(r - 18)
      .outerRadius(r)
      .startAngle(-Math.PI * 0.75)
      .endAngle(Math.PI * 0.75);

    svg.append("path")
      .attr("d", bgArc())
      .attr("transform", `translate(${cx},${cy})`)
      .attr("fill", "var(--bg-3, #f3f4f6)");

    // Colored arc based on UV
    const fraction = Math.min(uv / 14, 1);
    const colorScale = d3.scaleSequential().domain([0, 14]).interpolator(d3.interpolateYlOrRd);
    const fgArc = d3.arc()
      .innerRadius(r - 18)
      .outerRadius(r)
      .startAngle(-Math.PI * 0.75)
      .endAngle(-Math.PI * 0.75 + fraction * Math.PI * 1.5)
      .cornerRadius(6);

    svg.append("path")
      .attr("d", fgArc())
      .attr("transform", `translate(${cx},${cy})`)
      .attr("fill", colorScale(uv));

    // Center text
    svg.append("text")
      .attr("x", cx).attr("y", cy + 4)
      .attr("text-anchor", "middle")
      .attr("font-size", 28)
      .attr("font-weight", 900)
      .attr("fill", "var(--fg, #111)")
      .text(uv.toFixed(1));

    svg.append("text")
      .attr("x", cx).attr("y", cy + 22)
      .attr("text-anchor", "middle")
      .attr("font-size", 11)
      .attr("fill", "var(--fg-3, #9ca3af)")
      .attr("font-weight", 600)
      .text("UVI Now");
  }, [uv]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <svg ref={svgRef} />

      {/* Burn time result */}
      <div style={{
        textAlign: "center",
        background: uv >= 3 ? "linear-gradient(135deg, #fef2f2, #fee2e2)" : "var(--bg-3)",
        border: uv >= 3 ? "1.5px solid #fca5a5" : "1.5px solid var(--border)",
        borderRadius: 14, padding: "12px 20px",
      }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: uv >= 8 ? "#dc2626" : uv >= 3 ? "#f97316" : "#16a34a" }}>
          {burnTime ? `${burnTime} min` : "—"}
        </div>
        <div style={{ fontSize: 11, color: "var(--fg-3)", fontWeight: 600, marginTop: 2 }}>
          Time to burn — {fitz.label}
        </div>
      </div>

      {/* Slip Slop Slap icons */}
      {uv >= 3 && (
        <div style={{ display: "flex", gap: 10, padding: "10px 16px", background: "#fffbeb", borderRadius: 12, border: "1.5px solid #fcd34d" }}>
          {SLIP_ICONS.map((icon, i) => (
            <span key={i} style={{ fontSize: 22 }}>{icon}</span>
          ))}
          <span style={{ fontSize: 11, fontWeight: 700, color: "#92400e", alignSelf: "center" }}>Slip · Slop · Slap · Seek</span>
        </div>
      )}

      {/* Fitzpatrick skin type selector */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--fg-3)", marginBottom: 8, textAlign: "center" }}>
          SKIN TYPE (FITZPATRICK)
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {FITZPATRICK_TYPES.map((f) => (
            <button
              key={f.type}
              onClick={() => setSkinType(f.type)}
              title={f.description}
              style={{
                width: 32, height: 32, borderRadius: "50%",
                background: f.color,
                border: skinType === f.type ? "3px solid var(--fg, #111)" : "2px solid transparent",
                cursor: "pointer", boxShadow: skinType === f.type ? "0 0 0 2px rgba(0,0,0,0.3)" : "none",
                transition: "all 0.2s",
              }}
            />
          ))}
        </div>
        <div style={{ fontSize: 10, color: "var(--fg-3)", textAlign: "center", marginTop: 6 }}>
          {fitz.label} — {fitz.description}
        </div>
      </div>
    </div>
  );
}
