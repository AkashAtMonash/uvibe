"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";
import {
  Globe, Layers, Brain, AlertTriangle, BookOpen,
  Thermometer, Wind, Droplets, Upload, Camera, X, ChevronDown,
  Sun, Shield, Info, Zap, Map, Activity
} from "lucide-react";
import { analyzeSkin, fetchARPANSAStations } from "@/utils/api";

// ─── Color + Risk Scales ──────────────────────────────────────────────────────

const UV_COLOR_SCALE = d3.scaleSequential()
  .domain([0, 12])
  .interpolator(d3.interpolateYlOrRd);

const WHO_COLORS = [
  { min: 0,  max: 2,  color: "#4CAF50", label: "Low" },
  { min: 3,  max: 5,  color: "#FFC107", label: "Moderate" },
  { min: 6,  max: 7,  color: "#FF9800", label: "High" },
  { min: 8,  max: 10, color: "#F44336", label: "Very High" },
  { min: 11, max: 99, color: "#9C27B0", label: "Extreme" },
];
const uvColor = (uv) => WHO_COLORS.find(l => uv >= l.min && uv <= l.max)?.color || "#4CAF50";

const FITZPATRICK_COLORS = {
  1: "#FFE0B2", 2: "#FFCC80", 3: "#FFB74D",
  4: "#FFA726", 5: "#EF6C00", 6: "#BF360C",
};

// ─── AIHW Melanoma Data (2023 state-level incidence/100k pop) ─────────────────
const MELANOMA_RATES = {
  "Queensland":           89,
  "Western Australia":    78,
  "South Australia":      72,
  "New South Wales":      68,
  "Australian Capital Territory": 65,
  "Northern Territory":   60,
  "Victoria":             58,
  "Tasmania":             55,
};

const MELANOMA_SCALE = d3.scaleSequential()
  .domain([50, 95])
  .interpolator(d3.interpolateReds);

// ─── Coastal / Alpine Hotspot Locations (Reflective surfaces)  ───────────────
const REFLECTIVE_HOTSPOTS = [
  { name: "Bondi Beach",       lat: -33.89, lon: 151.27, type: "coastal",  risk: "Sand reflects 15% UV" },
  { name: "Surfers Paradise",  lat: -28.00, lon: 153.43, type: "coastal",  risk: "Water reflects 25% UV" },
  { name: "Snowy Mountains",   lat: -36.45, lon: 148.26, type: "alpine",   risk: "Snow reflects 80% + altitude boost" },
  { name: "Falls Creek",       lat: -36.86, lon: 147.27, type: "alpine",   risk: "Alpine UV +20% above sea level" },
  { name: "Whitehaven Beach",  lat: -20.28, lon: 149.04, type: "coastal",  risk: "White sand reflects 35% UV" },
  { name: "Port Douglas",      lat: -16.48, lon: 145.46, type: "tropical", risk: "Near-equatorial UV intensity" },
];

// ─── Educational Articles ─────────────────────────────────────────────────────
const EDUCATIONAL_ARTICLES = [
  { title: "Understanding UV Index", url: "https://www.cancer.org.au/cancer-information/causes-and-prevention/sun-safety/uv-index", org: "Cancer Council AU" },
  { title: "Fitzpatrick Scale Guide", url: "https://www.aad.org/public/everyday-care/sun-protection/sunscreen-patients/skin-type", org: "AAD" },
  { title: "WHO: UV & Health", url: "https://www.who.int/news-room/fact-sheets/detail/ultraviolet-radiation", org: "WHO" },
  { title: "Slip Slop Slap Campaign", url: "https://www.cancer.org.au/cancer-information/causes-and-prevention/sun-safety", org: "Cancer Council AU" },
  { title: "AIHW Melanoma Statistics", url: "https://www.aihw.gov.au/reports/cancer/cancer-data-in-australia/contents/cancer-by-type/melanoma", org: "AIHW" },
];
const YOUTUBE_VIDEO_ID = "Bs0MkzWYBGI";

// ─── Tooltip Component ────────────────────────────────────────────────────────
function MapTooltip({ tooltip }) {
  if (!tooltip) return null;
  return (
    <div style={{
      position: "fixed", top: tooltip.y + 16, left: Math.min(tooltip.x + 16, window.innerWidth - 220),
      background: "var(--bg-3)", border: "1px solid var(--surface-border)",
      borderRadius: 14, padding: "12px 16px",
      zIndex: 9999, boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
      pointerEvents: "none", minWidth: 160, maxWidth: 220,
    }}>
      <div style={{ fontWeight: 800, color: "var(--text-1)", fontSize: 14, marginBottom: 4 }}>{tooltip.title}</div>
      {tooltip.sub  && <div style={{ fontSize: 11, color: tooltip.color || "var(--text-2)", fontWeight: 600, marginBottom: 2 }}>{tooltip.sub}</div>}
      {tooltip.body && <div style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.5 }}>{tooltip.body}</div>}
    </div>
  );
}

// ─── Layer Toggle Button ──────────────────────────────────────────────────────
function LayerToggle({ label, active, onClick, color = "var(--uv-color)", tooltipText }) {
  const [showTip, setShowTip] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={onClick}
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "6px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700,
          border: `1.5px solid ${active ? color : "var(--surface-border)"}`,
          background: active ? color + "22" : "var(--surface)",
          color: active ? color : "var(--text-3)", cursor: "pointer", transition: "all 0.2s",
        }}
      >
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: active ? color : "var(--text-3)" }} />
        {label}
        {tooltipText && <Info size={10} style={{ opacity: 0.5 }} />}
      </button>
      {showTip && tooltipText && (
        <div style={{
          position: "absolute", bottom: "110%", left: 0, zIndex: 100,
          background: "var(--bg-3)", border: "1px solid var(--surface-border)",
          borderRadius: 10, padding: "8px 12px", fontSize: 11,
          color: "var(--text-2)", width: 200, lineHeight: 1.5,
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
        }}>
          {tooltipText}
        </div>
      )}
    </div>
  );
}

// ─── MAP 1: AU Regional Risk Heatmap ─────────────────────────────────────────

function AURegionalMap({ stations }) {
  const svgRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const [timeHour, setTimeHour] = useState(new Date().getHours());
  const [showProtection, setShowProtection] = useState(false);
  const [showOzone, setShowOzone] = useState(false);
  const [showAltitude, setShowAltitude] = useState(true);

  // UV bell curve across the day (based on hour)
  const uvAtHour = (baseUV, hour) => {
    const peak = 12;
    const dist = Math.abs(hour - peak);
    if (dist > 6) return 0;
    return +(baseUV * Math.max(0, 1 - (dist / 6) ** 1.5)).toFixed(1);
  };

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth || 700;
    const height = 420;
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const g = svg.append("g");
    const zoom = d3.zoom().scaleExtent([1, 8]).on("zoom", (e) => g.attr("transform", e.transform));
    svg.call(zoom);

    const projection = d3.geoMercator().center([133, -27]).scale(width * 0.95).translate([width / 2, height / 2]);
    const path = d3.geoPath().projection(projection);

    const auUrl = "https://raw.githubusercontent.com/rowanhogan/australian-states/master/states.geojson";
    d3.json(auUrl).then((auData) => {
      // State fills — either desaturated (safe) or colored
      g.selectAll("path.state")
        .data(auData.features)
        .join("path")
        .attr("class", "state")
        .attr("d", path)
        .attr("fill", (d) => {
          const validStations = stations.filter(s => s.lat && s.lon && s.uv_index != null);
          if (!validStations.length) return "#E8F5E9";
          // Find nearest station for state color
          const center = d3.geoCentroid(d);
          let nearest = validStations[0];
          let minDist = Infinity;
          validStations.forEach(s => {
            const dist = Math.hypot(s.lon - center[0], s.lat - center[1]);
            if (dist < minDist) { minDist = dist; nearest = s; }
          });
          const adjUV = uvAtHour(nearest.uv_index, timeHour);
          if (showProtection && adjUV < 3) return "#ddd"; // desaturated
          return UV_COLOR_SCALE(adjUV);
        })
        .attr("stroke", "rgba(255,255,255,0.5)")
        .attr("stroke-width", 1)
        .style("cursor", "crosshair")
        .on("mouseenter", function(event, d) {
          d3.select(this).attr("stroke", "#333").attr("stroke-width", 2).raise();
          const center = d3.geoCentroid(d);
          const validStations = stations.filter(s => s.lat && s.lon && s.uv_index != null);
          let nearest = null;
          if (validStations.length) {
            let minDist = Infinity;
            validStations.forEach(s => {
              const dist = Math.hypot(s.lon - center[0], s.lat - center[1]);
              if (dist < minDist) { minDist = dist; nearest = s; }
            });
          }
          const adjUV = nearest ? uvAtHour(nearest.uv_index, timeHour) : "—";
          setTooltip({
            x: event.clientX, y: event.clientY,
            title: d.properties.STATE_NAME,
            sub: `UV Index: ${adjUV} at ${timeHour}:00`,
            body: showProtection && adjUV < 3 ? "✅ Safe — No protection needed" : "🧴 Apply SPF 30+ sunscreen",
          });
        })
        .on("mousemove", (e) => setTooltip(p => p ? { ...p, x: e.clientX, y: e.clientY } : null))
        .on("mouseleave", function() {
          d3.select(this).attr("stroke", "rgba(255,255,255,0.5)").attr("stroke-width", 1);
          setTooltip(null);
        });

      // Ozone contour overlay (simulated Dobson Unit bands)
      if (showOzone) {
        // Draw a semi-transparent arc representing ozone depletion zone over Antarctica
        const ozoneZone = g.append("ellipse")
          .attr("cx", projection([133, -62])[0])
          .attr("cy", projection([133, -62])[1])
          .attr("rx", 120)
          .attr("ry", 40)
          .attr("fill", "rgba(100, 50, 255, 0.12)")
          .attr("stroke", "rgba(100, 50, 255, 0.4)")
          .attr("stroke-width", 1.5)
          .attr("stroke-dasharray", "4,4");
        g.append("text")
          .attr("x", projection([133, -62])[0])
          .attr("y", projection([133, -62])[1] + 4)
          .attr("text-anchor", "middle")
          .attr("fill", "rgba(100,50,255,0.8)")
          .attr("font-size", 9)
          .attr("font-weight", 700)
          .text("Ozone Hole Zone (< 220 DU)");
      }

      // Altitude Snowy Mountains overlay
      if (showAltitude) {
        const snowyCoords = projection([148.26, -36.45]);
        if (snowyCoords) {
          const baseUV = 6;
          const adjAlt = +(baseUV * (1 + 0.10 * 2000 / 1000)).toFixed(1); // 2000m altitude
          const ac = g.append("g").attr("transform", `translate(${snowyCoords[0]}, ${snowyCoords[1]})`);
          ac.append("circle").attr("r", 14).attr("fill", "#E91E6333").attr("stroke", "#E91E63").attr("stroke-width", 1.5);
          ac.append("text").attr("y", 4).attr("text-anchor", "middle").attr("fill", "#E91E63").attr("font-size", 9).attr("font-weight", 800).text(`⛰ ${adjAlt}`);
          ac.on("mouseenter", (e) => setTooltip({ x: e.clientX, y: e.clientY, title: "Snowy Mountains", sub: `Altitude-adjusted UV: ${adjAlt}`, body: `UVIadj = ${baseUV} × (1 + 0.10 × 2.0) = ${adjAlt}` }))
            .on("mousemove", (e) => setTooltip(p => p ? { ...p, x: e.clientX, y: e.clientY } : null))
            .on("mouseleave", () => setTooltip(null));
        }
      }

      // ARPANSA pulsing station dots
      if (stations?.length > 0) {
        const valid = stations.filter(s => s.lat && s.lon && s.uv_index != null);
        const adjUVs = valid.map(s => uvAtHour(s.uv_index, timeHour));

        g.selectAll("circle.pulse")
          .data(valid).join("circle").attr("class", "pulse")
          .attr("cx", d => projection([d.lon, d.lat])?.[0])
          .attr("cy", d => projection([d.lon, d.lat])?.[1])
          .attr("r", 14).attr("opacity", 0.2)
          .attr("fill", (_, i) => showProtection && adjUVs[i] < 3 ? "#ddd" : UV_COLOR_SCALE(adjUVs[i]))
          .style("animation", "pulse 2s infinite");

        g.selectAll("circle.station")
          .data(valid).join("circle").attr("class", "station")
          .attr("cx", d => projection([d.lon, d.lat])?.[0])
          .attr("cy", d => projection([d.lon, d.lat])?.[1])
          .attr("r", 7).attr("stroke", "#fff").attr("stroke-width", 2).style("cursor", "pointer")
          .attr("fill", (_, i) => showProtection && adjUVs[i] < 3 ? "#aaa" : UV_COLOR_SCALE(adjUVs[i]))
          .on("mouseenter", function(e, d) {
            d3.select(this).attr("r", 10);
            const adj = uvAtHour(d.uv_index, timeHour);
            setTooltip({
              x: e.clientX, y: e.clientY, title: d.name,
              sub: `Live UV: ${d.uv_index} → Time adj: ${adj}`,
              color: UV_COLOR_SCALE(adj),
              body: showProtection && adj < 3 ? "✅ Safe Zone" : `🧴 ${adj >= 6 ? "High — essential protection" : "Apply SPF 30+"}`,
            });
          })
          .on("mousemove", (e) => setTooltip(p => p ? {...p, x: e.clientX, y: e.clientY} : null))
          .on("mouseleave", function() { d3.select(this).attr("r", 7); setTooltip(null); });
      }
    });
  }, [stations, timeHour, showProtection, showOzone, showAltitude]);

  const fmtHour = (h) => h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h-12}pm`;

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden", position: "relative" }}>
      <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid var(--surface-border)", background: "var(--bg-2)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text-1)" }}>🇦🇺 Regional Risk Heatmap</div>
            <div style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--mono)" }}>Live ARPANSA stations · Time-scrub enabled</div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, fontFamily: "var(--mono)", color: "var(--uv-color)" }}>{fmtHour(timeHour)}</div>
        </div>

        {/* Time Scrub Slider */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
            UV Progression — Scrub 24h ☀️
          </div>
          <input
            type="range" min={0} max={23} step={1} value={timeHour}
            onChange={(e) => setTimeHour(Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--uv-color)", cursor: "pointer", height: 6 }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--text-3)", fontFamily: "var(--mono)", marginTop: 2 }}>
            <span>12am</span><span>6am</span><span>12pm 🔆</span><span>6pm</span><span>11pm</span>
          </div>
        </div>

        {/* Layer Toggles */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <LayerToggle label="Protection Window" active={showProtection} onClick={() => setShowProtection(p => !p)} color="#4CAF50"
            tooltipText="Highlights safe zones where UVI < 3. Areas outside the protection window are desaturated." />
          <LayerToggle label="Ozone Layer" active={showOzone} onClick={() => setShowOzone(p => !p)} color="#7C3AED"
            tooltipText="Semi-transparent overlay showing the Antarctic ozone depletion zone (< 220 Dobson Units) which increases UV penetration." />
          <LayerToggle label="Altitude ⛰" active={showAltitude} onClick={() => setShowAltitude(p => !p)} color="#E91E63"
            tooltipText="Shows altitude-adjusted UV for the Snowy Mountains. Formula: UVIadj = UVI × (1 + 0.10 × altitude/1000m)." />
        </div>
      </div>

      <svg ref={svgRef} style={{ width: "100%", display: "block", background: "#E8F5FC", minHeight: 420 }} />
      <MapTooltip tooltip={tooltip} />

      {/* WHO Color Legend */}
      <div style={{ display: "flex", gap: 6, padding: "10px 16px", flexWrap: "wrap", borderTop: "1px solid var(--surface-border)" }}>
        {WHO_COLORS.map(w => (
          <div key={w.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: w.color }} />
            <span style={{ fontSize: 10, color: "var(--text-3)", fontWeight: 700 }}>{w.label}</span>
          </div>
        ))}
        <span style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "var(--mono)", marginLeft: "auto" }}>Source: ARPANSA</span>
      </div>
    </div>
  );
}

// ─── MAP 2: Equatorial & Atmospheric Globe (D3 Robinson Projection) ───────────

const AEROSOL_REGIONS = [
  { bounds: [[70, 15], [145, 45]], label: "East Asia", note: "High aerosol — shields 15–30% UV" },
  { bounds: [[-20, -5], [55, 25]], label: "Sahara", note: "Dust aerosols — moderate UV shielding" },
  { bounds: [[-80, -10], [-30, 10]], label: "Amazon", note: "Low aerosols — high UV penetration" },
];

// Simulated UV per country based on latitude (equatorial = high UV)
const countryBaseUV = (centroid) => {
  const [lon, lat] = centroid;
  const equatorialFactor = Math.max(0, 1 - Math.abs(lat) / 50);
  return Math.round(equatorialFactor * 12 * 10) / 10;
};

function GlobalAtmosphericGlobe() {
  const svgRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const [season, setSeason] = useState("JAN"); // JAN = Southern Summer, JUL = Northern Summer
  const [showAerosol, setShowAerosol] = useState(false);
  const [realSky, setRealSky] = useState(true); // true = cloud albedo ON (realistic)

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth || 700;
    const height = 460;
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const g = svg.append("g");
    const zoom = d3.zoom().scaleExtent([1, 6]).on("zoom", (e) => g.attr("transform", e.transform));
    svg.call(zoom);

    // Natural Earth projection — similar to Robinson, included in core d3
    const projection = d3.geoNaturalEarth1().scale(width / 5.8).translate([width / 2, height / 2]);
    const path = d3.geoPath().projection(projection);

    // Graticule (grid lines)
    const graticule = d3.geoGraticule()();
    g.append("path").datum(graticule).attr("d", path)
      .attr("fill", "none").attr("stroke", "rgba(255,255,255,0.12)").attr("stroke-width", 0.5);

    // Sphere (ocean background)
    g.append("path").datum({ type: "Sphere" }).attr("d", path)
      .attr("fill", "#C8E6FA");

    const worldUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
    d3.json(worldUrl).then((world) => {
      const countries = feature(world, world.objects.countries);

      // Season multiplier — Southern Summer (JAN) = Southern Hemisphere boosted
      const seasonMultiplier = (centroid) => {
        const lat = centroid[1];
        if (season === "JAN") return lat < 0 ? 1.07 : 0.93; // Southern summer
        return lat < 0 ? 0.93 : 1.07; // Northern summer
      };

      // Cloud albedo reduction (Real-Sky ON reduces UV ~20% in tropics)
      const cloudAlbedo = (centroid, uv) => {
        if (!realSky) return uv;
        const lat = Math.abs(centroid[1]);
        const reduction = lat < 20 ? 0.8 : lat < 40 ? 0.9 : 0.95;
        return uv * reduction;
      };

      g.selectAll("path.country")
        .data(countries.features)
        .join("path").attr("class", "country")
        .attr("d", path)
        .attr("fill", (d) => {
          const centroid = d3.geoCentroid(d);
          let uv = countryBaseUV(centroid);
          uv = uv * seasonMultiplier(centroid);
          uv = cloudAlbedo(centroid, uv);
          return UV_COLOR_SCALE(Math.min(12, uv));
        })
        .attr("stroke", "rgba(255,255,255,0.3)").attr("stroke-width", 0.5)
        .style("cursor", "crosshair")
        .on("mouseenter", function(event, d) {
          d3.select(this).attr("stroke", "#333").attr("stroke-width", 1.5).raise();
          const centroid = d3.geoCentroid(d);
          let uv = countryBaseUV(centroid);
          uv = uv * seasonMultiplier(centroid);
          uv = cloudAlbedo(centroid, uv);
          const cloudNote = realSky ? " (cloud-adjusted)" : " (clear-sky)";
          setTooltip({
            x: event.clientX, y: event.clientY,
            title: d.properties.name || "Country",
            sub: `Est. UV: ${uv.toFixed(1)}${cloudNote}`,
            color: UV_COLOR_SCALE(Math.min(12, uv)),
            body: `Season: ${season === "JAN" ? "Southern Summer" : "Northern Summer"} · ${centroid[1] > 0 ? "Northern" : "Southern"} Hemisphere`,
          });
        })
        .on("mousemove", (e) => setTooltip(p => p ? { ...p, x: e.clientX, y: e.clientY } : null))
        .on("mouseleave", function() {
          d3.select(this).attr("stroke", "rgba(255,255,255,0.3)").attr("stroke-width", 0.5);
          setTooltip(null);
        });

      // Sun position indicator (hemisphere summer band)
      const bandLat = season === "JAN" ? -23 : 23; // Tropic of Capricorn/Cancer
      const tropicLine = d3.geoPath().projection(projection)({ type: "LineString", coordinates: [[-180, bandLat], [180, bandLat]] });
      g.append("path").attr("d", tropicLine)
        .attr("fill", "none").attr("stroke", "#FFD700").attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "8,4").attr("opacity", 0.8);

      // Aerosol grayscale overlays
      if (showAerosol) {
        AEROSOL_REGIONS.forEach(region => {
          const [[x1, y1], [x2, y2]] = region.bounds;
          const rect = {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [[[x1,y1],[x2,y1],[x2,y2],[x1,y2],[x1,y1]]]
            }
          };
          g.append("path").datum(rect).attr("d", path)
            .attr("fill", "rgba(100,100,100,0.35)")
            .attr("stroke", "rgba(80,80,80,0.6)").attr("stroke-width", 0.8)
            .style("cursor", "pointer")
            .on("mouseenter", (e) => setTooltip({ x: e.clientX, y: e.clientY, title: `🌫 ${region.label}`, sub: "High Aerosol Zone", body: region.note }))
            .on("mousemove", (e) => setTooltip(p => p ? { ...p, x: e.clientX, y: e.clientY } : null))
            .on("mouseleave", () => setTooltip(null));
        });
      }

      // Australia highlight
      g.selectAll("path.country").filter(d => d.id === "36")
        .attr("stroke", "#FFD700").attr("stroke-width", 2);
    });
  }, [season, showAerosol, realSky]);

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden", position: "relative" }}>
      <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid var(--surface-border)", background: "var(--bg-2)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text-1)" }}>🌐 Equatorial & Atmospheric View</div>
            <div style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--mono)" }}>Robinson projection · Season comparison · Aerosol layers</div>
          </div>
          {/* Season Toggle */}
          <div style={{ display: "flex", gap: 4, background: "var(--surface)", padding: 3, borderRadius: 20, border: "1px solid var(--surface-border)" }}>
            {["JAN", "JUL"].map(s => (
              <button key={s} onClick={() => setSeason(s)} style={{
                padding: "5px 14px", borderRadius: 16, fontSize: 10, fontWeight: 800,
                border: "none", cursor: "pointer", transition: "all 0.2s",
                background: season === s ? "#FFD700" : "transparent",
                color: season === s ? "#333" : "var(--text-3)",
              }}>{s} {s === "JAN" ? "☀️🇦🇺" : "☀️🌍"}</button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <LayerToggle label="Aerosol Filter" active={showAerosol} onClick={() => setShowAerosol(p => !p)} color="#666"
            tooltipText="Grayscale overlay highlights high-aerosol regions (East Asia, Sahara). Aerosols scatter UV, reducing ground-level intensity by 15–30%." />
          <LayerToggle label={realSky ? "Real-Sky (Clouds ON)" : "Clear-Sky (No Clouds)"} active={realSky} onClick={() => setRealSky(p => !p)} color="#0EA5E9"
            tooltipText="Real-Sky includes cloud albedo (clouds reflect UV). Clear-Sky removes clouds to show maximum possible UV intensity — useful for days with no cloud cover." />
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 24, height: 3, background: "#FFD700" }} />
            <span style={{ fontSize: 10, color: "var(--text-3)", fontWeight: 700 }}>Peak Sun Band</span>
          </div>
        </div>
      </div>

      <svg ref={svgRef} style={{ width: "100%", display: "block", background: "#C8E6FA", minHeight: 460 }} />
      <MapTooltip tooltip={tooltip} />

      {/* Season Info Bar */}
      <div style={{ padding: "10px 16px", background: "var(--surface)", borderTop: "1px solid var(--surface-border)", display: "flex", gap: 16, fontSize: 11 }}>
        <span style={{ color: "var(--text-3)" }}>📐 <strong>7% intensity variance</strong> — Earth is ~7% closer to the sun in January (perihelion)</span>
        <span style={{ color: "var(--text-3)", marginLeft: "auto" }}>🇦🇺 highlighted in gold</span>
      </div>
    </div>
  );
}

// ─── MAP 3: Social & Behavioral Melanoma Awareness Map ───────────────────────

function MelanomaAwarenessMap() {
  const svgRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const [showHotspots, setShowHotspots] = useState(true);
  const [showUrban, setShowUrban] = useState(false);

  // Urban micro-data (Sun Traps vs Safe Zones)
  const URBAN_ZONES = [
    { city: "Melbourne CBD", lat: -37.81, lon: 144.96, type: "trap", note: "High concrete density — UV reflection trap" },
    { city: "Melbourne Botanic Gardens", lat: -37.83, lon: 144.98, type: "safe", note: "High canopy cover — natural UV shield" },
    { city: "Sydney CBD", lat: -33.87, lon: 151.21, type: "trap", note: "Harbour creates reflective UV hotspot" },
    { city: "Royal National Park", lat: -34.05, lon: 151.05, type: "safe", note: "Dense forest canopy — significant UV block" },
  ];

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth || 700;
    const height = 420;
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const g = svg.append("g");
    const zoom = d3.zoom().scaleExtent([1, 8]).on("zoom", (e) => g.attr("transform", e.transform));
    svg.call(zoom);

    const projection = d3.geoMercator().center([133, -27]).scale(width * 0.95).translate([width / 2, height / 2]);
    const path = d3.geoPath().projection(projection);

    const auUrl = "https://raw.githubusercontent.com/rowanhogan/australian-states/master/states.geojson";
    d3.json(auUrl).then((auData) => {
      // Melanoma choropleth
      g.selectAll("path.state").data(auData.features).join("path").attr("class", "state")
        .attr("d", path)
        .attr("fill", (d) => {
          const rate = MELANOMA_RATES[d.properties.STATE_NAME];
          return rate ? MELANOMA_SCALE(rate) : "#f5f5f5";
        })
        .attr("stroke", "rgba(255,255,255,0.5)").attr("stroke-width", 1)
        .style("cursor", "crosshair")
        .on("mouseenter", function(event, d) {
          d3.select(this).attr("stroke", "#333").attr("stroke-width", 2).raise();
          const rate = MELANOMA_RATES[d.properties.STATE_NAME];
          setTooltip({
            x: event.clientX, y: event.clientY,
            title: d.properties.STATE_NAME,
            sub: rate ? `Melanoma Rate: ${rate}/100k population` : "Data not available",
            color: rate ? MELANOMA_SCALE(rate) : "var(--text-3)",
            body: rate > 80 ? "⚠️ Highest risk state — regular skin checks essential" : rate > 65 ? "🧴 High risk — 6-monthly dermatologist visits recommended" : "ℹ️ Moderate risk — annual skin checks advised",
          });
        })
        .on("mousemove", (e) => setTooltip(p => p ? { ...p, x: e.clientX, y: e.clientY } : null))
        .on("mouseleave", function() {
          d3.select(this).attr("stroke", "rgba(255,255,255,0.5)").attr("stroke-width", 1);
          setTooltip(null);
        });

      // Reflective hotspot pulsing icons
      if (showHotspots) {
        REFLECTIVE_HOTSPOTS.forEach(h => {
          const coords = projection([h.lon, h.lat]);
          if (!coords) return;
          const hg = g.append("g").attr("transform", `translate(${coords[0]}, ${coords[1]})`).style("cursor", "pointer");
          const isAlpine = h.type === "alpine";
          const isTropical = h.type === "tropical";
          const hColor = isAlpine ? "#3B82F6" : isTropical ? "#9333EA" : "#F97316";

          hg.append("circle").attr("r", 14).attr("fill", hColor + "33").attr("stroke", hColor).attr("stroke-width", 1.5)
            .style("animation", "pulse 2s infinite");
          hg.append("text").attr("y", 5).attr("text-anchor", "middle").attr("font-size", 13)
            .text(isAlpine ? "⛰" : isTropical ? "🌴" : "🏖");
          hg.on("mouseenter", (e) => setTooltip({ x: e.clientX, y: e.clientY, title: h.name, sub: `${isAlpine ? "⛰ Alpine" : isTropical ? "🌴 Tropical" : "🏖 Coastal"} Reflective Zone`, body: h.risk, color: hColor }))
            .on("mousemove", (e) => setTooltip(p => p ? { ...p, x: e.clientX, y: e.clientY } : null))
            .on("mouseleave", () => setTooltip(null));
        });
      }

      // Urban micro zones
      if (showUrban) {
        URBAN_ZONES.forEach(z => {
          const coords = projection([z.lon, z.lat]);
          if (!coords) return;
          const zg = g.append("g").attr("transform", `translate(${coords[0]}, ${coords[1]})`).style("cursor", "pointer");
          const isTrap = z.type === "trap";
          const zColor = isTrap ? "#EF4444" : "#22C55E";
          zg.append("rect").attr("x", -8).attr("y", -8).attr("width", 16).attr("height", 16)
            .attr("rx", 4).attr("fill", zColor + "33").attr("stroke", zColor).attr("stroke-width", 1.5);
          zg.append("text").attr("y", 5).attr("text-anchor", "middle").attr("font-size", 11).text(isTrap ? "🏙" : "🌳");
          zg.on("mouseenter", (e) => setTooltip({ x: e.clientX, y: e.clientY, title: z.city, sub: isTrap ? "☀️ Sun Trap Zone" : "🌿 Safe Canopy Zone", body: z.note, color: zColor }))
            .on("mousemove", (e) => setTooltip(p => p ? { ...p, x: e.clientX, y: e.clientY } : null))
            .on("mouseleave", () => setTooltip(null));
        });
      }
    });
  }, [showHotspots, showUrban]);

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden", position: "relative" }}>
      <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid var(--surface-border)", background: "var(--bg-2)" }}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text-1)" }}>🎗️ Melanoma & Behavioral Awareness</div>
          <div style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--mono)" }}>AIHW melanoma incidence · Reflective hotspots · Urban analysis</div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <LayerToggle label="Reflective Hotspots" active={showHotspots} onClick={() => setShowHotspots(p => !p)} color="#F97316"
            tooltipText="Pulsing icons show coastal (sand/water), alpine (snow), and tropical zones where UV is amplified by reflective surfaces." />
          <LayerToggle label="Urban Sun Analysis" active={showUrban} onClick={() => setShowUrban(p => !p)} color="#8B5CF6"
            tooltipText="Micro-view for Sydney & Melbourne. Sun Traps (🏙) are concrete-heavy areas with UV reflection. Canopy Zones (🌳) have natural UV shade." />
        </div>
      </div>

      <svg ref={svgRef} style={{ width: "100%", display: "block", background: "#FFF8F8", minHeight: 420 }} />
      <MapTooltip tooltip={tooltip} />

      {/* Melanoma incidence legend */}
      <div style={{ padding: "10px 16px", borderTop: "1px solid var(--surface-border)", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)" }}>Low</span>
        <div style={{ flex: 1, height: 8, borderRadius: 4, background: "linear-gradient(to right, #fff5f0, #fee0d2, #fc9272, #de2d26)" }} />
        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)" }}>High</span>
        <span style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "var(--mono)" }}>Melanoma per 100k · AIHW 2023</span>
      </div>
    </div>
  );
}

// ─── ML Skin Lab Component ────────────────────────────────────────────────────

function SkinLab() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileRef = useRef(null);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setLoading(true); setError(null); setResult(null);
    try {
      const data = await analyzeSkin(file);
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const onDrop = (e) => { e.preventDefault(); const file = e.dataTransfer?.files?.[0]; if (file) handleFile(file); };

  return (
    <div className="card">
      <div className="card-head"><Brain size={13} /> AI Skin Lab</div>

      <div onClick={() => fileRef.current?.click()} onDrop={onDrop} onDragOver={(e) => e.preventDefault()}
        style={{ border: "2px dashed var(--surface-border-strong)", borderRadius: "var(--r-md)", padding: "32px 16px", textAlign: "center", cursor: "pointer", background: "var(--surface)", transition: "border-color 0.2s", position: "relative", overflow: "hidden" }}>
        {preview ? (
          <div style={{ position: "relative" }}>
            <img src={preview} alt="Preview" style={{ width: 120, height: 120, objectFit: "cover", borderRadius: "var(--r-md)" }} />
            <button style={{ position: "absolute", top: -6, right: "calc(50% - 66px)", background: "var(--bg-3)", borderRadius: "50%", padding: 2, border: "1px solid var(--surface-border)" }}
              onClick={(e) => { e.stopPropagation(); setPreview(null); setResult(null); }}><X size={12} /></button>
          </div>
        ) : (
          <>
            <Upload size={28} style={{ color: "var(--text-3)", marginBottom: 10 }} />
            <div style={{ fontSize: 13, color: "var(--text-2)", fontWeight: 600 }}>Upload a photo of your forearm or face</div>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>Drag & drop or click — PNG, JPG supported</div>
          </>
        )}
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files?.[0])} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 10, color: "var(--text-3)" }}>
        <span style={{ background: "var(--uv-dim)", color: "var(--uv-color)", borderRadius: 6, padding: "2px 8px", fontWeight: 700, fontSize: 10 }}>🔒 SECURITY ENCLAVE</span>
        Photos are analyzed locally — never stored or sent to the cloud.
      </div>

      {loading && <div style={{ marginTop: 18, textAlign: "center", color: "var(--text-2)" }}><div className="spinner" style={{ margin: "0 auto 10px" }} />Analyzing skin tone...</div>}
      {error && <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(239,68,68,0.08)", borderRadius: "var(--r-sm)", border: "1px solid rgba(239,68,68,0.2)", color: "#DC2626", fontSize: 13 }}>
        <AlertTriangle size={14} style={{ display: "inline", marginRight: 6 }} />{error} — make sure the Python backend is running on localhost:8000.
      </div>}
      {result && (
        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderRadius: "var(--r-md)", background: "var(--surface)", border: "1px solid var(--surface-border)" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: FITZPATRICK_COLORS[result.fitzpatrick_type], border: "2px solid var(--surface-border-strong)", flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text-1)" }}>{result.type_name}</div>
              <div style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--mono)", marginTop: 2 }}>{Math.round(result.confidence * 100)}% confidence · Aging multiplier ×{result.aging_multiplier}</div>
            </div>
          </div>
          <div style={{ padding: "14px 16px", borderRadius: "var(--r-sm)", background: "var(--uv-dim)", border: "1px solid rgba(245,158,11,0.2)", fontSize: 13, color: "var(--text-1)", lineHeight: 1.6 }}>{result.uv_vulnerability}</div>
          {result.detected_markers?.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {result.detected_markers.map((m) => (
                <span key={m} style={{ fontSize: 10, fontFamily: "var(--mono)", background: "rgba(239,68,68,0.08)", color: "#DC2626", padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(239,68,68,0.2)" }}>{m.replace(/_/g, " ")}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Educational Hub ──────────────────────────────────────────────────────────

function EducationalHub() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px 12px", display: "flex", alignItems: "center", gap: 8 }}>
          <BookOpen size={16} style={{ color: "var(--uv-color)" }} />
          <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-1)" }}>Skin Cancer Prevention</span>
        </div>
        <div style={{ position: "relative", width: "100%", paddingTop: "56.25%" }}>
          <iframe
            src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?rel=0&modestbranding=1`}
            title="Skin Cancer Prevention" frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
          />
        </div>
      </div>
      <div className="card">
        <div className="card-head"><BookOpen size={13} /> Resources</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {EDUCATIONAL_ARTICLES.map((a) => (
            <a key={a.url} href={a.url} target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: "var(--r-sm)", border: "1px solid var(--surface-border)", textDecoration: "none", transition: "background 0.2s", background: "var(--surface)" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{a.title}</span>
              <span style={{ fontSize: 10, fontFamily: "var(--mono)", color: "var(--uv-color)", fontWeight: 700 }}>{a.org}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Awareness Page ──────────────────────────────────────────────────────

export default function AwarenessPage() {
  const [stations, setStations] = useState([]);
  const [activeTab, setActiveTab] = useState("map1");

  useEffect(() => {
    fetchARPANSAStations()
      .then((d) => setStations(d.stations || []))
      .catch(() => {});
  }, []);

  const tabs = [
    { id: "map1",  label: "AU Regional",     icon: <Map size={14} /> },
    { id: "map2",  label: "Global View",     icon: <Globe size={14} /> },
    { id: "map3",  label: "Melanoma",        icon: <Activity size={14} /> },
    { id: "lab",   label: "AI Skin Lab",     icon: <Brain size={14} /> },
    { id: "learn", label: "Learn",           icon: <BookOpen size={14} /> },
  ];

  return (
    <div className="scroll">
      <div className="pad-desk">
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--text-1)", letterSpacing: -0.8 }}>UV Awareness Lab</h1>
          <p style={{ fontSize: 14, color: "var(--text-2)", marginTop: 6, lineHeight: 1.6 }}>
            Interactive UV maps, AI skin analysis, and melanoma awareness powered by live ARPANSA data.
          </p>
        </div>

        {/* Tab Bar */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "var(--surface)", padding: 4, borderRadius: "var(--r-md)", border: "1px solid var(--surface-border)", width: "fit-content", flexWrap: "wrap" }}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: "calc(var(--r-md) - 4px)",
              fontSize: 12, fontWeight: 700, cursor: "pointer",
              transition: "all 0.2s var(--ease)",
              background: activeTab === t.id ? "#FFFFFF" : "transparent",
              color: activeTab === t.id ? "var(--text-1)" : "var(--text-3)",
              boxShadow: activeTab === t.id ? "var(--shadow-soft)" : "none",
              border: "none",
            }}>{t.icon}{t.label}</button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "map1" && (
          <div className="fade-in">
            <AURegionalMap stations={stations} />
            {stations.length === 0 && (
              <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-3)", textAlign: "center", fontFamily: "var(--mono)" }}>
                Start the Python backend on port 8000 to load live ARPANSA station data
              </div>
            )}
          </div>
        )}
        {activeTab === "map2" && <div className="fade-in"><GlobalAtmosphericGlobe /></div>}
        {activeTab === "map3" && <div className="fade-in"><MelanomaAwarenessMap /></div>}
        {activeTab === "lab"  && <div className="fade-in" style={{ maxWidth: 520 }}><SkinLab /></div>}
        {activeTab === "learn" && <div className="fade-in" style={{ maxWidth: 640 }}><EducationalHub /></div>}
      </div>
    </div>
  );
}
