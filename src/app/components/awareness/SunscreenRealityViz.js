"use client";

import { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import { FITZPATRICK_TYPES } from "./data";

// SPF effectiveness data: actual protection vs labeled SPF at various thicknesses
// Standard test thickness = 2mg/cm². Most people apply ~0.5–1mg/cm²
const SPF_THICKNESS = [
  { thickness: 0.5, spf15: 2.4, spf30: 3.7, spf50: 4.2 },
  { thickness: 0.75, spf15: 4, spf30: 7, spf50: 8 },
  { thickness: 1.0, spf15: 6, spf30: 10, spf50: 14 },
  { thickness: 1.25, spf15: 8, spf30: 16, spf50: 22 },
  { thickness: 1.5, spf15: 10, spf30: 21, spf50: 32 },
  { thickness: 2.0, spf15: 15, spf30: 30, spf50: 50 },
];

// How much product covers the whole body in grams
const BODY_COVERAGE = [
  { area: "Face & neck", grams: 1.5, icon: "😊" },
  { area: "Each arm", grams: 0.5, icon: "💪" },
  { area: "Front torso", grams: 1.5, icon: "👕" },
  { area: "Back torso", grams: 1.5, icon: "👕" },
  { area: "Each leg", grams: 0.75, icon: "🦵" },
  { area: "Total body", grams: 7, icon: "✅", total: true },
];

const PROTECTION_SHOTS = [
  { spf: 50, apply: "Full dose (2mg/cm²)", color: "#22c55e", protection: 98, burnExtra: "50min → 2,500 min" },
  { spf: 50, apply: "75% dose (1.5mg/cm²)", color: "#eab308", protection: 64, burnExtra: "50min → 89 min" },
  { spf: 50, apply: "50% dose (1mg/cm²)", color: "#f97316", protection: 28, burnExtra: "50min → 14 min" },
  { spf: 50, apply: "25% dose (0.5mg/cm²)", color: "#ef4444", protection: 8, burnExtra: "50min → 2.5 min" },
];

export default function SunscreenRealityViz() {
  const chartRef = useRef(null);
  const [skinType, setSkinType] = useState(2);
  const [spfLabel, setSpfLabel] = useState(50);
  const [thickness, setThickness] = useState(1.0);

  const fitz = FITZPATRICK_TYPES.find((f) => f.type === skinType);
  const baseBurnTime = Math.round((200 / 12) * fitz.factor); // at UVI 12 (AU summer)

  const getActualSpf = (labeledSpf, t) => {
    const row = SPF_THICKNESS.find((r) => Math.abs(r.thickness - t) < 0.01) ||
      SPF_THICKNESS.reduce((a, b) => Math.abs(b.thickness - t) < Math.abs(a.thickness - t) ? b : a);
    return labeledSpf === 15 ? row.spf15 : labeledSpf === 30 ? row.spf30 : row.spf50;
  };

  const actualSpf = getActualSpf(spfLabel, Math.round(thickness * 4) / 4 * 0.25 + 0.5);
  const protectedTime = Math.min(baseBurnTime * actualSpf, 999);

  // SPF thickness curve chart
  useEffect(() => {
    if (!chartRef.current) return;
    const container = chartRef.current.parentElement;
    const W = container.clientWidth || 400;
    const H = 200;
    const margin = { top: 16, right: 20, bottom: 40, left: 50 };
    const iW = W - margin.left - margin.right;
    const iH = H - margin.top - margin.bottom;

    const svg = d3.select(chartRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", W).attr("height", H);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([0.5, 2]).range([0, iW]);
    const y = d3.scaleLinear().domain([0, 55]).range([iH, 0]);

    // Ideal protection zone
    g.append("rect").attr("x", 0).attr("y", 0).attr("width", iW).attr("height", y(50))
      .attr("fill", "rgba(34,197,94,0.06)");
    g.append("text").attr("x", iW - 4).attr("y", y(50) + 12)
      .attr("text-anchor", "end").style("font-size", "9px").attr("fill", "#22c55e").attr("font-weight", 700)
      .text("Labeled SPF achieved →");

    // Lines
    const lines = [
      { key: "spf50", label: "SPF 50", color: "#22c55e" },
      { key: "spf30", label: "SPF 30", color: "#3b82f6" },
      { key: "spf15", label: "SPF 15", color: "#a855f7" },
    ];

    lines.forEach(({ key, label, color }) => {
      const line = d3.line().x((d) => x(d.thickness)).y((d) => y(d[key])).curve(d3.curveCatmullRom);
      g.append("path").datum(SPF_THICKNESS).attr("fill", "none").attr("stroke", color)
        .attr("stroke-width", 2.5).attr("stroke-linejoin", "round").attr("d", line);
      // End label
      const last = SPF_THICKNESS[SPF_THICKNESS.length - 1];
      g.append("text").attr("x", x(last.thickness) + 4).attr("y", y(last[key]))
        .attr("dominant-baseline", "middle").style("font-size", "10px").style("font-weight", "700")
        .attr("fill", color).text(label);
    });

    // Current thickness marker
    const markerX = x(thickness);
    g.append("line").attr("x1", markerX).attr("x2", markerX).attr("y1", 0).attr("y2", iH)
      .attr("stroke", "#f97316").attr("stroke-width", 2).attr("stroke-dasharray", "4,3");
    g.append("text").attr("x", markerX).attr("y", -4)
      .attr("text-anchor", "middle").style("font-size", "9px").attr("fill", "#f97316").attr("font-weight", 700)
      .text("You");

    // X axis
    g.append("g").attr("transform", `translate(0,${iH})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat((d) => `${d}mg`))
      .call((a) => a.select(".domain").remove())
      .call((a) => a.selectAll("text").style("font-size", "10px").attr("fill", "var(--fg-3)"));

    g.append("text").attr("x", iW / 2).attr("y", iH + 35)
      .attr("text-anchor", "middle").style("font-size", "10px").attr("fill", "var(--fg-3)").attr("font-weight", 600)
      .text("Application thickness (mg/cm²) — standard = 2mg");

    // Y axis
    g.append("g").call(d3.axisLeft(y).ticks(5))
      .call((a) => a.select(".domain").remove())
      .call((a) => a.selectAll("text").style("font-size", "10px").attr("fill", "var(--fg-3)"));
  }, [thickness]);

  const thicknessPct = ((thickness - 0.5) / 1.5) * 100;
  const realPct = Math.round((actualSpf / spfLabel) * 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Interactive calculator */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--fg-3)", marginBottom: 8 }}>YOUR SKIN TYPE</div>
            <div style={{ display: "flex", gap: 6 }}>
              {FITZPATRICK_TYPES.map((f) => (
                <button
                  key={f.type}
                  onClick={() => setSkinType(f.type)}
                  title={f.description}
                  style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: f.color,
                    border: skinType === f.type ? "3px solid var(--fg)" : "2px solid transparent",
                    cursor: "pointer", transition: "all 0.15s",
                    boxShadow: skinType === f.type ? "0 0 0 2px rgba(0,0,0,0.3)" : "none",
                  }}
                />
              ))}
            </div>
            <div style={{ fontSize: 10, color: "var(--fg-3)", marginTop: 4 }}>
              {fitz.label} — {fitz.description}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--fg-3)", marginBottom: 8 }}>SPF LABEL</div>
            <div style={{ display: "flex", gap: 6 }}>
              {[15, 30, 50].map((s) => (
                <button key={s} onClick={() => setSpfLabel(s)} style={{
                  padding: "6px 16px", borderRadius: 20, fontSize: 12, fontWeight: 800,
                  border: "1.5px solid var(--border)",
                  background: spfLabel === s ? "#7c3aed" : "var(--bg-3)",
                  color: spfLabel === s ? "#fff" : "var(--fg-2)",
                  cursor: "pointer", transition: "all 0.15s",
                }}>
                  SPF {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--fg-3)" }}>APPLICATION AMOUNT</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#f97316" }}>{thickness.toFixed(2)} mg/cm²</div>
            </div>
            <input
              type="range" min={0.5} max={2} step={0.05} value={thickness}
              onChange={(e) => setThickness(parseFloat(e.target.value))}
              style={{ width: "100%", accentColor: "#f97316" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--fg-3)", marginTop: 2 }}>
              <span>Thin (most people)</span><span>Standard (test dose)</span>
            </div>
          </div>
        </div>

        {/* Result panel */}
        <div style={{
          padding: "20px", borderRadius: 16,
          background: "var(--bg-3, #f3f4f6)",
          border: "1.5px solid var(--border)",
          display: "flex", flexDirection: "column", gap: 12, justifyContent: "center",
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--fg-3)", marginBottom: 4 }}>LABELED SPF</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: "#7c3aed" }}>{spfLabel}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1, height: 2, background: "var(--border)" }} />
            <div style={{ fontSize: 12, color: "var(--fg-3)", fontWeight: 600 }}>→ you actually get</div>
            <div style={{ flex: 1, height: 2, background: "var(--border)" }} />
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--fg-3)", marginBottom: 4 }}>ACTUAL SPF</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: realPct < 60 ? "#ef4444" : "#22c55e" }}>{actualSpf}</div>
            <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 2 }}>
              {realPct}% of labeled protection
            </div>
          </div>
          <div style={{
            padding: "10px 14px", borderRadius: 12, textAlign: "center",
            background: protectedTime > 120 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
            border: `1.5px solid ${protectedTime > 120 ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
          }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: protectedTime > 120 ? "#16a34a" : "#dc2626" }}>
              {protectedTime >= 999 ? "All day" : `${protectedTime} min`}
            </div>
            <div style={{ fontSize: 10, color: "var(--fg-3)", marginTop: 2 }}>
              Protected time before sunburn ({fitz.label}, UVI 12)
            </div>
          </div>
        </div>
      </div>

      {/* Thickness chart */}
      <div>
        <div style={{ fontSize: 11, color: "var(--fg-3)", marginBottom: 8, fontWeight: 600 }}>
          REAL SPF vs APPLICATION THICKNESS — WHY MORE IS MORE
        </div>
        <svg ref={chartRef} style={{ width: "100%", display: "block" }} />
      </div>

      {/* Shot glass visual */}
      <div>
        <div style={{ fontSize: 11, color: "var(--fg-3)", marginBottom: 12, fontWeight: 600 }}>
          THE SHOT GLASS RULE — HOW MUCH SUNSCREEN FOR YOUR WHOLE BODY?
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
          {BODY_COVERAGE.map((b) => (
            <div key={b.area} style={{
              padding: "10px 12px", borderRadius: 12,
              background: b.total ? "linear-gradient(135deg, rgba(124,58,237,0.12), rgba(168,85,247,0.08))" : "var(--bg-3)",
              border: `1.5px solid ${b.total ? "rgba(124,58,237,0.25)" : "var(--border)"}`,
              textAlign: "center",
            }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{b.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: b.total ? "#7c3aed" : "var(--fg-2)" }}>{b.grams}g</div>
              <div style={{ fontSize: 10, color: "var(--fg-3)", marginTop: 2 }}>{b.area}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 8, fontWeight: 500, textAlign: "center" }}>
          🥃 <strong>The 7-teaspoon rule</strong> — 1 teaspoon for face/neck, 1 for each arm, 2 for torso, 2 for legs.
          Most people use only <strong>20–50%</strong> of the recommended amount.
        </div>
      </div>

      {/* Protection bars */}
      <div>
        <div style={{ fontSize: 11, color: "var(--fg-3)", marginBottom: 10, fontWeight: 600 }}>
          SPF 50 — HOW APPLICATION AMOUNT KILLS YOUR PROTECTION
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {PROTECTION_SHOTS.map((p) => (
            <div key={p.apply} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 150, fontSize: 11, fontWeight: 600, color: "var(--fg-2)", flexShrink: 0 }}>{p.apply}</div>
              <div style={{ flex: 1, background: "var(--bg-3)", borderRadius: 8, height: 28, position: "relative", overflow: "hidden" }}>
                <div style={{
                  position: "absolute", left: 0, top: 0, bottom: 0,
                  width: `${p.protection}%`, background: p.color, borderRadius: 8,
                }} />
                <div style={{
                  position: "absolute", left: 8, top: 0, bottom: 0, display: "flex",
                  alignItems: "center", fontSize: 11, fontWeight: 700,
                  color: p.protection > 30 ? "#fff" : "var(--fg-2)",
                }}>
                  {p.protection}% UV blocked
                </div>
              </div>
              <div style={{ width: 90, fontSize: 10, color: "var(--fg-3)", fontWeight: 500, textAlign: "right", flexShrink: 0 }}>
                {p.burnExtra}
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10, color: "var(--fg-3)", marginTop: 6 }}>
          Burn times based on UVI 12 (AU summer peak), Skin Type II (Fitzpatrick). Source: Photodermatology Journal 2012.
        </div>
      </div>
    </div>
  );
}
