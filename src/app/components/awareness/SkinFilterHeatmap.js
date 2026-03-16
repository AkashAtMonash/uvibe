"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { actualSpf } from "./data";

const ARM_BOXES = 36;

// 5-stop colorblind-friendly protection scale:
// Deep blue (100% protected) → cyan → green → amber → red (fully exposed)
const PROTECTION_COLOR = d3.scaleLinear()
  .domain([0, 0.25, 0.5, 0.75, 1])
  .range(["#1d4ed8", "#06b6d4", "#16a34a", "#f59e0b", "#dc2626"])
  .interpolate(d3.interpolateRgb.gamma(2.2));

export default function SkinFilterHeatmap() {
  const svgRef = useRef(null);
  const [thickness, setThickness] = useState(2.0);
  const labeledSpf = 50;
  const realSpf = actualSpf(labeledSpf, thickness);
  const protection = Math.min(99.9, ((realSpf - 1) / realSpf) * 100).toFixed(1);
  const exposureFraction = 1 - parseFloat(protection) / 100;

  useEffect(() => {
    if (!svgRef.current) return;

    const W = svgRef.current.parentElement?.clientWidth || 380;
    const cellW = Math.max(4, Math.floor(W / ARM_BOXES));
    const cellH = 64;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", cellW * ARM_BOXES).attr("height", cellH);

    // Each cell gets slightly varied exposure to simulate real-world patchy application
    const data = d3.range(ARM_BOXES).map((i) => {
      // Edges and creases get less sunscreen — simulate realistic variance
      const positionalNoise = 0.1 * Math.sin(i * 1.3);
      const edgeBoost = i < 3 || i > ARM_BOXES - 4 ? 0.15 : 0;
      const cellExposure = Math.min(1, Math.max(0, exposureFraction + positionalNoise + edgeBoost));
      return { i, cellExposure };
    });

    const rects = svg.selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", (d) => d.i * cellW)
      .attr("y", 0)
      .attr("width", cellW)
      .attr("height", cellH)
      .attr("fill", (d) => PROTECTION_COLOR(d.cellExposure));

    // Rounded corners on first/last
    svg.select("rect:first-child").attr("rx", 12).attr("ry", 12);
    svg.select("rect:last-child").attr("rx", 12).attr("ry", 12);

    // "COVERED" / "EXPOSED" labels overlaid
    svg.append("text").attr("x", 10).attr("y", cellH / 2 + 5)
      .attr("fill", "#fff").attr("font-size", 11).attr("font-weight", 900)
      .attr("text-shadow", "0 1px 4px rgba(0,0,0,0.5)")
      .text("✔ PROTECTED");

    svg.append("text").attr("x", cellW * ARM_BOXES - 10).attr("y", cellH / 2 + 5)
      .attr("fill", "#fff").attr("font-size", 11).attr("font-weight", 900)
      .attr("text-anchor", "end")
      .text("⚠ EXPOSED");
  }, [thickness, exposureFraction]);

  const spfCategory =
    realSpf >= 40 ? { label: "Strong protection", color: "#1d4ed8" } :
    realSpf >= 20 ? { label: "Moderate protection", color: "#16a34a" } :
    realSpf >= 10 ? { label: "Reduced protection", color: "#f59e0b" } :
                   { label: "Dangerously low", color: "#dc2626" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Color scale legend */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--fg-3)", whiteSpace: "nowrap" }}>Protected</span>
        <div style={{
          flex: 1, height: 10, borderRadius: 6,
          background: "linear-gradient(to right, #1d4ed8, #06b6d4, #16a34a, #f59e0b, #dc2626)",
        }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--fg-3)", whiteSpace: "nowrap" }}>Exposed</span>
      </div>

      {/* Heatmap arm */}
      <div style={{ borderRadius: 14, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}>
        <svg ref={svgRef} style={{ width: "100%", display: "block" }} />
      </div>

      {/* Current status banner */}
      <div style={{
        padding: "12px 18px",
        background: `${spfCategory.color}14`,
        border: `2px solid ${spfCategory.color}`,
        borderRadius: 14, display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{ width: 14, height: 14, borderRadius: "50%", background: spfCategory.color, flexShrink: 0 }} />
        <div>
          <span style={{ fontWeight: 900, fontSize: 14, color: spfCategory.color }}>{spfCategory.label}</span>
          <span style={{ fontSize: 13, color: "var(--fg-2)", marginLeft: 8 }}>at {thickness.toFixed(1)} mg/cm²</span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {[
          { label: "Applied", value: `${thickness.toFixed(1)} mg/cm²`, color: "var(--fg)", bg: "var(--bg-3)" },
          { label: "Actual SPF", value: realSpf, color: realSpf < 20 ? "#dc2626" : realSpf < 35 ? "#f59e0b" : "#16a34a", bg: realSpf < 20 ? "#fef2f2" : "var(--bg-3)" },
          { label: "UVB Blocked", value: `${protection}%`, color: parseFloat(protection) < 90 ? "#f59e0b" : "#16a34a", bg: "var(--bg-3)" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} style={{
            textAlign: "center", padding: "12px 8px", background: bg,
            borderRadius: 12, border: "1.5px solid var(--border)",
          }}>
            <div style={{ fontSize: 20, fontWeight: 900, color }}>{value}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--fg-3)", marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Slider */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, color: "var(--fg-3)", marginBottom: 8 }}>
          <span>🔴 Thin (0.5 mg/cm²)</span>
          <span>🔵 Standard (2.0 mg/cm²)</span>
        </div>
        <input
          type="range" min={0.5} max={2.0} step={0.05}
          value={thickness}
          onChange={(e) => setThickness(parseFloat(e.target.value))}
          style={{ width: "100%", accentColor: "#7c3aed" }}
        />
      </div>

      {/* Key insight */}
      <div style={{
        padding: "12px 16px", background: "#fef9c3",
        borderRadius: 12, border: "1.5px solid #fde047", fontSize: 12,
      }}>
        <strong>⚠️ The 2mg/cm² Rule:</strong> Applying only half the standard amount of SPF 50 doesn&apos;t give you SPF 25 — due to <em>logarithmic scaling</em>, your actual protection can drop to as low as <strong>SPF 4–8</strong>.
        Move the slider to see exactly how much protection you lose.
      </div>
    </div>
  );
}
