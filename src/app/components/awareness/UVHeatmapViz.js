"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { STATE_KPIS, uvAtHour, getWHOLevel } from "./data";

const AU_GEOJSON_URL =
  "https://raw.githubusercontent.com/tonywr71/GeoJson-Data/master/australian-states.json";

const UVI_LEVELS = [
  { label: "Low 0–2", color: "#22c55e" },
  { label: "Moderate 3–5", color: "#eab308" },
  { label: "High 6–7", color: "#f97316" },
  { label: "Very High 8–10", color: "#ef4444" },
  { label: "Extreme 11+", color: "#a855f7" },
];

export default function UVHeatmapViz() {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [geoData, setGeoData] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const [hour, setHour] = useState(12);
  const [loadError, setLoadError] = useState(false);
  const [insightVisible, setInsightVisible] = useState(false);

  useEffect(() => {
    fetch(AU_GEOJSON_URL)
      .then((r) => r.json())
      .then(setGeoData)
      .catch(() => setLoadError(true));
  }, []);

  useEffect(() => {
    if (Math.round(hour) === 12) {
      setInsightVisible(true);
      const t = setTimeout(() => setInsightVisible(false), 5000);
      return () => clearTimeout(t);
    }
  }, [Math.round(hour)]);

  useEffect(() => {
    if (!geoData || !svgRef.current || !containerRef.current) return;
    const W = containerRef.current.clientWidth || 480;
    const H = Math.round(W * 0.68);
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", W).attr("height", H);

    const projection = d3.geoMercator().fitSize([W, H], geoData);
    const path = d3.geoPath().projection(projection);

    const uvColorScale = d3
      .scaleThreshold()
      .domain([3, 6, 8, 11])
      .range(["#22c55e", "#eab308", "#f97316", "#ef4444", "#a855f7"]);

    const findKPI = (feature) => {
      const stateName = feature.properties?.STATE_NAME ?? "";
      return STATE_KPIS.find(
        (s) =>
          stateName.includes(s.name) ||
          s.name.includes(stateName) ||
          stateName.includes(s.abbr)
      );
    };

    const g = svg.append("g");

    g.selectAll("path")
      .data(geoData.features)
      .join("path")
      .attr("d", path)
      .attr("fill", (d) => {
        const kpi = findKPI(d);
        if (!kpi) return "#e5e7eb";
        const uv = uvAtHour(kpi.peakUVI, hour);
        return uvColorScale(uv);
      })
      .attr("stroke", "var(--bg-2, #fff)")
      .attr("stroke-width", 2)
      .attr("stroke-linejoin", "round")
      .style("cursor", "pointer")
      .style("transition", "opacity 0.2s")
      .on("mousemove", (event, d) => {
        const kpi = findKPI(d);
        if (!kpi) return;
        const uv = uvAtHour(kpi.peakUVI, hour);
        const level = getWHOLevel(uv);
        setTooltip({ x: event.clientX, y: event.clientY, kpi, uv: uv.toFixed(1), level, color: uvColorScale(uv) });
      })
      .on("touchstart", (event, d) => {
        event.preventDefault();
        const touch = event.touches[0];
        const kpi = findKPI(d);
        if (!kpi) return;
        const uv = uvAtHour(kpi.peakUVI, hour);
        const level = getWHOLevel(uv);
        setTooltip({ x: touch.clientX, y: touch.clientY, kpi, uv: uv.toFixed(1), level, color: uvColorScale(uv) });
      })
      .on("mouseleave", () => setTooltip(null))
      .on("touchend", () => setTimeout(() => setTooltip(null), 2000));

    // State abbreviation labels
    g.selectAll("text")
      .data(geoData.features)
      .join("text")
      .attr("transform", (d) => `translate(${path.centroid(d)})`)
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .style("font-size", "11px")
      .style("font-weight", "800")
      .style("fill", "#fff")
      .style("text-shadow", "0 1px 4px rgba(0,0,0,0.7)")
      .style("pointer-events", "none")
      .text((d) => findKPI(d)?.abbr ?? "");
  }, [geoData, hour]);

  const timeLabel = `${String(Math.floor(hour)).padStart(2, "0")}:${hour % 1 >= 0.5 ? "30" : "00"}`;
  const isRisky = hour >= 10 && hour <= 15;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Time slider */}
      <div style={{ padding: "16px 20px", background: "var(--bg-3, #f3f4f6)", borderRadius: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--fg)" }}>
              🕐 {timeLabel} {isRisky ? "⚠️ UV Danger Zone" : "✅ Safer Period"}
            </div>
            <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 2, fontWeight: 500 }}>
              Drag to see how UV risk changes throughout the day
            </div>
          </div>
          <div style={{
            padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700,
            background: isRisky ? "#fef2f2" : "#f0fdf4",
            color: isRisky ? "#dc2626" : "#16a34a",
            border: `1.5px solid ${isRisky ? "#fca5a5" : "#86efac"}`,
          }}>
            {isRisky ? "🧴 Apply SPF!" : "👍 Low Risk"}
          </div>
        </div>
        <input
          type="range" min={6} max={18} step={0.5} value={hour}
          onChange={(e) => setHour(parseFloat(e.target.value))}
          style={{ width: "100%", accentColor: "#7c3aed", cursor: "pointer" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--fg-3)", marginTop: 4, fontWeight: 600 }}>
          <span>6am 🌅</span><span>9am</span><span>12pm ☀️</span><span>3pm</span><span>6pm 🌆</span>
        </div>
      </div>

      {/* Map */}
      <div ref={containerRef} style={{ position: "relative", background: "var(--bg-3, #f3f4f6)", borderRadius: 16, overflow: "hidden", minHeight: 240 }}>
        {loadError && (
          <div style={{ padding: 32, textAlign: "center", color: "#dc2626", fontSize: 13, fontWeight: 600 }}>
            ⚠️ Could not load map data.
          </div>
        )}
        {!geoData && !loadError && (
          <div style={{ padding: 48, textAlign: "center", color: "var(--fg-3)", fontSize: 13, fontWeight: 600 }}>
            Loading Australian map…
          </div>
        )}
        <svg ref={svgRef} style={{ width: "100%", display: "block" }} />

        {insightVisible && (
          <div style={{
            position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
            background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff",
            borderRadius: 12, padding: "10px 18px", fontSize: 11, fontWeight: 600,
            maxWidth: 280, textAlign: "center", boxShadow: "0 8px 24px rgba(124,58,237,0.4)",
            zIndex: 10, whiteSpace: "nowrap",
          }}>
            ☀️ <strong>Solar Noon Alert</strong> — Peak UV in all states!
          </div>
        )}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: "fixed", top: tooltip.y + 16,
          left: Math.min(tooltip.x + 16, (typeof window !== "undefined" ? window.innerWidth : 800) - 260),
          zIndex: 9999, background: "var(--bg-2, rgba(255,255,255,0.97))",
          backdropFilter: "blur(16px)", border: `2px solid ${tooltip.color}`,
          borderRadius: 14, padding: "14px 18px", boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
          minWidth: 220, pointerEvents: "none",
        }}>
          <div style={{ fontWeight: 900, fontSize: 15, color: "var(--fg)", marginBottom: 8 }}>{tooltip.kpi.name}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px 12px", fontSize: 12, color: "var(--fg-2)" }}>
            <span>UVI Now</span><span style={{ fontWeight: 800, color: tooltip.color }}>{tooltip.uv}</span>
            <span>Peak UVI</span><span style={{ fontWeight: 800 }}>{tooltip.kpi.peakUVI}</span>
            <span>Risk Level</span><span style={{ fontWeight: 800, color: tooltip.color }}>{tooltip.level.label}</span>
            <span>Burn at noon</span><span style={{ fontWeight: 800, color: "#dc2626" }}>{tooltip.kpi.burnTimeMin} min</span>
            <span>Cancer /100k</span><span style={{ fontWeight: 800 }}>{tooltip.kpi.skinCancerIncidence}</span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {UVI_LEVELS.map((l) => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: "var(--fg-2)" }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: l.color, display: "inline-block", flexShrink: 0 }} />
            {l.label}
          </div>
        ))}
      </div>

      {/* Key insight callout */}
      <div style={{
        padding: "12px 16px", borderRadius: 14,
        background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(168,85,247,0.05))",
        border: "1.5px solid rgba(124,58,237,0.2)", fontSize: 12, color: "var(--fg-2)",
      }}>
        🇦🇺 <strong>Australia has the world's highest melanoma rate</strong> — driven by a thin ozone layer and a predominantly fair-skinned population. The danger window is <strong>10am–3pm AEST</strong> when 75% of your daily UV dose accumulates.
      </div>
    </div>
  );
}
