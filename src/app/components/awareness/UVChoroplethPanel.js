"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { STATE_KPIS, uvAtHour, getWHOLevel } from "./data";

// Reliable AU states GeoJSON (8 states/territories, STATE_NAME property)
const AU_GEOJSON_URL =
  "https://raw.githubusercontent.com/tonywr71/GeoJson-Data/master/australian-states.json";

export default function UVChoroplethPanel({ hourSlider, skinCancerMode = false }) {
  const svgRef = useRef(null);
  const [geoData, setGeoData] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const [insightVisible, setInsightVisible] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Fetch GeoJSON once
  useEffect(() => {
    fetch(AU_GEOJSON_URL)
      .then((r) => r.json())
      .then((geo) => setGeoData(geo))
      .catch(() => setLoadError(true));
  }, []);

  // Solar noon insight popup
  useEffect(() => {
    if (hourSlider >= 12 && hourSlider <= 13) {
      setInsightVisible(true);
      const t = setTimeout(() => setInsightVisible(false), 6000);
      return () => clearTimeout(t);
    }
  }, [Math.round(hourSlider)]);

  // Draw / redraw whenever data or slider changes
  useEffect(() => {
    if (!geoData || !svgRef.current) return;

    const container = svgRef.current.parentElement;
    const W = container.clientWidth || 480;
    const H = Math.round(W * 0.72);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", W).attr("height", H);

    const projection = d3
      .geoMercator()
      .fitSize([W, H], geoData);

    const path = d3.geoPath().projection(projection);

    // Cancer incidence color scale
    const cancerScale = d3
      .scaleSequential()
      .domain([50, 95])
      .interpolator(d3.interpolateReds);

    // State lookup by STATE_NAME
    const findKPI = (feature) => {
      const stateName = feature.properties?.STATE_NAME ?? "";
      return STATE_KPIS.find(
        (s) => stateName.includes(s.name) || s.name.includes(stateName) || stateName.includes(s.abbr)
      );
    };

    const getStateColor = (feature) => {
      const kpi = findKPI(feature);
      if (!kpi) return "#e5e7eb";
      if (skinCancerMode) {
        return cancerScale(kpi.skinCancerIncidence);
      }
      const uv = uvAtHour(kpi.peakUVI, hourSlider);
      return getWHOLevel(uv).cbColor;
    };

    svg
      .append("g")
      .selectAll("path")
      .data(geoData.features)
      .join("path")
      .attr("d", path)
      .attr("fill", getStateColor)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.8)
      .attr("stroke-linejoin", "round")
      .style("cursor", "pointer")
      .on("mousemove", (event, d) => {
        const kpi = findKPI(d);
        if (!kpi) return;
        const uv = uvAtHour(kpi.peakUVI, hourSlider);
        const level = getWHOLevel(uv);
        setTooltip({
          x: event.clientX,
          y: event.clientY,
          kpi,
          uv: uv.toFixed(1),
          level: level.label,
          color: level.cbColor,
        });
      })
      .on("mouseleave", () => setTooltip(null));

    // State name labels
    svg.append("g").selectAll("text")
      .data(geoData.features)
      .join("text")
      .attr("transform", (d) => `translate(${path.centroid(d)})`)
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .style("font-size", (d) => {
        const kpi = findKPI(d);
        return kpi?.abbr === "NT" || kpi?.abbr === "WA" ? "12px" : "10px";
      })
      .style("font-weight", "800")
      .style("fill", "#fff")
      .style("text-shadow", "0 1px 3px rgba(0,0,0,0.6)")
      .style("pointer-events", "none")
      .text((d) => findKPI(d)?.abbr ?? "");

    // Legend
    const legendData = skinCancerMode
      ? [
          { label: "55/100k (TAS)", color: d3.interpolateReds(0.1) },
          { label: "65/100k (ACT)", color: d3.interpolateReds(0.33) },
          { label: "72/100k (SA)", color: d3.interpolateReds(0.5) },
          { label: "78/100k (WA)", color: d3.interpolateReds(0.7) },
          { label: "89/100k (QLD)", color: d3.interpolateReds(0.95) },
        ]
      : [
          { label: "Low  0–2",      color: "#1a9850" },
          { label: "Moderate  3–5", color: "#fee08b" },
          { label: "High  6–7",     color: "#f46d43" },
          { label: "Very High 8–10",color: "#d73027" },
          { label: "Extreme 11+",   color: "#762a83" },
        ];

    const leg = svg.append("g").attr("transform", `translate(10, ${H - legendData.length * 18 - 8})`);
    legendData.forEach((item, i) => {
      leg.append("rect").attr("x", 0).attr("y", i * 18).attr("width", 12).attr("height", 12).attr("fill", item.color).attr("rx", 2);
      leg.append("text").attr("x", 17).attr("y", i * 18 + 10).text(item.label).attr("font-size", 10).attr("font-weight", 700).attr("fill", "var(--fg-2, #555)");
    });
  }, [geoData, hourSlider, skinCancerMode]);

  return (
    <div style={{ position: "relative" }}>
      {loadError && (
        <div style={{ padding: "24px", textAlign: "center", color: "#dc2626", fontSize: 13, fontWeight: 600 }}>
          ⚠️ Could not load map data. Check your internet connection.
        </div>
      )}
      {!geoData && !loadError && (
        <div style={{ padding: "48px", textAlign: "center", color: "var(--fg-3)", fontSize: 13, fontWeight: 600 }}>
          Loading Australian map…
        </div>
      )}

      <svg ref={svgRef} style={{ width: "100%", display: "block" }} />

      {/* Hover Tooltip */}
      {tooltip && (
        <div
          style={{
            position: "fixed",
            top: tooltip.y + 16,
            left: Math.min(tooltip.x + 16, (typeof window !== "undefined" ? window.innerWidth : 800) - 270),
            zIndex: 9999,
            background: "rgba(255,255,255,0.97)",
            backdropFilter: "blur(12px)",
            border: `2px solid ${tooltip.color}`,
            borderRadius: 16,
            padding: "14px 18px",
            boxShadow: "0 12px 32px rgba(0,0,0,0.15)",
            minWidth: 230,
            pointerEvents: "none",
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 15, marginBottom: 8 }}>{tooltip.kpi.name}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px 14px", fontSize: 12, color: "#555" }}>
            <span>Peak UVI</span>       <span style={{ fontWeight: 800, color: tooltip.color }}>{tooltip.kpi.peakUVI}</span>
            <span>Current UVI</span>    <span style={{ fontWeight: 800 }}>{tooltip.uv}</span>
            <span>Risk Level</span>     <span style={{ fontWeight: 800, color: tooltip.color }}>{tooltip.level}</span>
            <span>Min Burn (noon)</span><span style={{ fontWeight: 800 }}>{tooltip.kpi.burnTimeMin} min</span>
            <span>Cancer Rate</span>    <span style={{ fontWeight: 800 }}>{tooltip.kpi.skinCancerIncidence}/100k</span>
            <span>vs. World</span>      <span style={{ fontWeight: 800, color: "#7c3aed", fontSize: 11 }}>{tooltip.kpi.benchmarkLabel}</span>
          </div>
        </div>
      )}

      {/* Solar Noon Popup */}
      {insightVisible && (
        <div style={{
          position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
          background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff",
          borderRadius: 14, padding: "12px 20px", fontSize: 12, fontWeight: 600,
          maxWidth: 300, textAlign: "center", boxShadow: "0 8px 24px rgba(124,58,237,0.4)",
          zIndex: 10,
        }}>
          ☀️ <strong>Solar Noon Insight</strong><br />
          The Southern Hemisphere sits 3.4% closer to the sun during summer, producing a 7–10% UV intensity spike vs. the Northern Hemisphere at its peak.
        </div>
      )}
    </div>
  );
}
