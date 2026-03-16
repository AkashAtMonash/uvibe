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
    <div
      className="fixed z-[9999] bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-[14px] p-3 shadow-apple-md pointer-events-none min-w-[160px] max-w-[220px]"
      style={{
        top: tooltip.y + 16,
        left: Math.min(tooltip.x + 16, window.innerWidth - 220),
      }}
    >
      <div className="font-extrabold text-gray-900 dark:text-gray-100 text-[14px] mb-1 leading-tight tracking-tight">
        {tooltip.title}
      </div>
      {tooltip.sub && (
        <div
          className="text-[11px] font-semibold mb-0.5"
          style={{ color: tooltip.color || "var(--color-gray-500)" }}
        >
          {tooltip.sub}
        </div>
      )}
      {tooltip.body && (
        <div className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium mt-1">
          {tooltip.body}
        </div>
      )}
    </div>
  );
}

// ─── Layer Toggle Button ──────────────────────────────────────────────────────
function LayerToggle({ label, active, onClick, color = "var(--color-sun-500)", tooltipText }) {
  const [showTip, setShowTip] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={onClick}
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all duration-200 border cursor-pointer"
        style={{
          borderColor: active ? color : "var(--color-gray-200)",
          background: active ? color + "22" : "var(--color-white)",
          color: active ? color : "var(--color-gray-500)",
        }}
      >
        <div 
          className="w-1.5 h-1.5 rounded-full" 
          style={{ background: active ? color : "var(--color-gray-400)" }} 
        />
        {label}
        {tooltipText && <Info size={10} className="opacity-50" />}
      </button>
      {showTip && tooltipText && (
        <div className="absolute bottom-[110%] left-0 z-[100] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[10px] p-2.5 text-[11px] text-gray-600 dark:text-gray-400 w-[200px] leading-relaxed shadow-apple-sm pointer-events-none">
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
    <div className="glass-panel w-full overflow-hidden relative">
      <div className="p-4 md:p-5 border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-black/20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-extrabold text-[15px] text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <span className="text-lg">🇦🇺</span> Regional Risk Heatmap
            </div>
            <div className="text-[11px] text-gray-500 font-mono mt-0.5">Live ARPANSA stations · Time-scrub enabled</div>
          </div>
          <div className="text-[13px] font-extrabold font-mono text-sun-500">{fmtHour(timeHour)}</div>
        </div>

        {/* Time Scrub Slider */}
        <div className="mb-4">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            UV Progression — Scrub 24h <span className="text-amber-500">☀️</span>
          </div>
          <input
            type="range" min={0} max={23} step={1} value={timeHour}
            onChange={(e) => setTimeHour(Number(e.target.value))}
            className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: "var(--color-sun-500)" }}
          />
          <div className="flex justify-between text-[9px] text-gray-400 font-mono mt-1 px-1">
            <span>12am</span><span>6am</span><span className="text-amber-500">12pm 🔆</span><span>6pm</span><span>11pm</span>
          </div>
        </div>

        {/* Layer Toggles */}
        <div className="flex gap-2 flex-wrap">
          <LayerToggle label="Protection Window" active={showProtection} onClick={() => setShowProtection(p => !p)} color="#4CAF50"
            tooltipText="Highlights safe zones where UVI < 3. Areas outside the protection window are desaturated." />
          <LayerToggle label="Ozone Layer" active={showOzone} onClick={() => setShowOzone(p => !p)} color="#8B5CF6"
            tooltipText="Semi-transparent overlay showing the Antarctic ozone depletion zone (< 220 Dobson Units) which increases UV penetration." />
          <LayerToggle label="Altitude ⛰" active={showAltitude} onClick={() => setShowAltitude(p => !p)} color="#EC4899"
            tooltipText="Shows altitude-adjusted UV for the Snowy Mountains. Formula: UVIadj = UVI × (1 + 0.10 × altitude/1000m)." />
        </div>
      </div>

      <svg ref={svgRef} className="w-full block bg-[#E8F5FC] dark:bg-[#0B1727] min-h-[420px]" />
      <MapTooltip tooltip={tooltip} />

      {/* WHO Color Legend */}
      <div className="flex gap-4 p-3 md:px-5 flex-wrap border-t border-gray-200 dark:border-gray-800 items-center justify-between">
        <div className="flex gap-3 flex-wrap">
          {WHO_COLORS.map(w => (
            <div key={w.label} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: w.color }} />
              <span className="text-[10px] text-gray-500 font-bold">{w.label}</span>
            </div>
          ))}
        </div>
        <span className="text-[10px] text-gray-400 font-mono">Source: ARPANSA</span>
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
    <div className="glass-panel w-full overflow-hidden relative">
      <div className="p-4 md:p-5 border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-black/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-extrabold text-[15px] text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <span className="text-lg">🌐</span> Equatorial & Atmospheric View
            </div>
            <div className="text-[11px] text-gray-500 font-mono mt-0.5">Robinson projection · Season comparison · Aerosol layers</div>
          </div>
          {/* Season Toggle */}
          <div className="flex gap-1 bg-white/60 dark:bg-gray-800/60 p-1 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
            {["JAN", "JUL"].map(s => (
              <button key={s} onClick={() => setSeason(s)} className={`px-3.5 py-1.5 rounded-full text-[10px] font-extrabold transition-all duration-200 border-none cursor-pointer ${season === s ? 'bg-sun-400 text-gray-900 shadow-sm' : 'bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                {s} {s === "JAN" ? "☀️🇦🇺" : "☀️🌍"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <LayerToggle label="Aerosol Filter" active={showAerosol} onClick={() => setShowAerosol(p => !p)} color="#64748B"
            tooltipText="Grayscale overlay highlights high-aerosol regions (East Asia, Sahara). Aerosols scatter UV, reducing ground-level intensity by 15–30%." />
          <LayerToggle label={realSky ? "Real-Sky (Clouds ON)" : "Clear-Sky (No Clouds)"} active={realSky} onClick={() => setRealSky(p => !p)} color="#0EA5E9"
            tooltipText="Real-Sky includes cloud albedo (clouds reflect UV). Clear-Sky removes clouds to show maximum possible UV intensity — useful for days with no cloud cover." />
          <div className="ml-auto flex flex-col md:flex-row items-end md:items-center gap-1.5 md:gap-2">
            <div className="w-6 h-[3px] bg-sun-400 rounded-full shadow-[0_0_4px_rgba(251,191,36,0.5)]" />
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Peak Sun Band</span>
          </div>
        </div>
      </div>

      <svg ref={svgRef} className="w-full block bg-[#C8E6FA] dark:bg-[#08131F] min-h-[460px] md:min-h-[400px]" />

      {/* Season Info Bar */}
      <div className="px-4 py-3 bg-white/40 dark:bg-black/20 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-[11px] backdrop-blur-md">
        <span className="text-gray-600 dark:text-gray-400">
          <span className="text-sm border mr-1.5">📐</span> 
          <strong className="text-gray-900 dark:text-gray-100">7% intensity variance</strong> — Earth is ~7% closer to the sun in January (perihelion)
        </span>
        <span className="text-gray-500 font-mono md:ml-auto">🇦🇺 highlighted in gold</span>
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
    <div className="glass-panel w-full overflow-hidden relative">
      <div className="p-4 md:p-5 border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-black/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="font-extrabold text-[15px] text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <span className="text-lg">🎗️</span> Melanoma & Behavioral Awareness
            </div>
            <div className="text-[11px] text-gray-500 font-mono mt-0.5">AIHW melanoma incidence · Reflective hotspots · Urban analysis</div>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <LayerToggle label="Reflective Hotspots" active={showHotspots} onClick={() => setShowHotspots(p => !p)} color="#F97316"
            tooltipText="Pulsing icons show coastal (sand/water), alpine (snow), and tropical zones where UV is amplified by reflective surfaces." />
          <LayerToggle label="Urban Sun Analysis" active={showUrban} onClick={() => setShowUrban(p => !p)} color="#8B5CF6"
            tooltipText="Micro-view for Sydney & Melbourne. Sun Traps (🏙) are concrete-heavy areas with UV reflection. Canopy Zones (🌳) have natural UV shade." />
        </div>
      </div>

      <svg ref={svgRef} className="w-full block bg-[#FFF8F8] dark:bg-[#1A0B0B] min-h-[420px]" />
      <MapTooltip tooltip={tooltip} />

      {/* Melanoma incidence legend */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center gap-3">
        <span className="text-[10px] font-bold text-gray-500">Low</span>
        <div className="flex-1 h-2 rounded-full" style={{ background: "linear-gradient(to right, #fff5f0, #fee0d2, #fc9272, #de2d26)" }} />
        <span className="text-[10px] font-bold text-gray-500">High</span>
        <span className="text-[10px] text-gray-400 font-mono ml-2 hidden md:inline">Melanoma per 100k · AIHW 2023</span>
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
    <div className="glass-panel w-full">
      <div className="p-4 md:p-5 border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-black/20 font-extrabold text-[15px] text-gray-900 dark:text-gray-100 flex items-center gap-2">
        <Brain size={18} className="text-sun-500" /> AI Skin Lab
      </div>

      <div className="p-4 md:p-5">
        <div 
          onClick={() => fileRef.current?.click()} onDrop={onDrop} onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-8 md:p-12 text-center cursor-pointer bg-white/50 dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors relative overflow-hidden group"
        >
          {preview ? (
            <div className="relative inline-block">
              <img src={preview} alt="Preview" className="w-32 h-32 object-cover rounded-xl shadow-apple-sm" />
              <button 
                className="absolute -top-3 -right-3 bg-white dark:bg-gray-800 rounded-full p-1.5 shadow-md border border-gray-200 dark:border-gray-700 hover:scale-110 transition-transform"
                onClick={(e) => { e.stopPropagation(); setPreview(null); setResult(null); }}
              >
                <X size={14} className="text-gray-500" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Upload size={28} />
              </div>
              <div className="text-[14px] text-gray-800 dark:text-gray-200 font-bold mb-1">Upload a photo of your forearm or face</div>
              <div className="text-[12px] text-gray-500 dark:text-gray-400">Drag & drop or click — PNG, JPG supported</div>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mt-4 text-[11px] text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
          <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md px-2 py-1 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 w-fit">
            <Shield size={10} /> Security Enclave
          </span>
          Photos are analyzed locally — never stored or sent to the cloud.
        </div>

        {loading && (
          <div className="mt-6 flex flex-col items-center justify-center text-gray-500 text-sm font-medium gap-3">
            <div className="w-6 h-6 border-2 border-sun-500 border-t-transparent rounded-full animate-spin" />
            Analyzing skin tone...
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl text-red-600 dark:text-red-400 text-[13px] flex items-start gap-2.5">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5">Analysis Failed</span>
              {error} — ensure the Python backend is running on localhost:8000.
            </div>
          </div>
        )}

        {result && (
          <div className="mt-6 flex flex-col gap-4 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 shadow-apple-sm">
              <div 
                className="w-12 h-12 rounded-full border-[3px] border-white dark:border-gray-800 shadow-md shrink-0" 
                style={{ background: FITZPATRICK_COLORS[result.fitzpatrick_type] }} 
              />
              <div>
                <div className="font-extrabold text-[16px] text-gray-900 dark:text-gray-100">{result.type_name}</div>
                <div className="text-[12px] text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                  {Math.round(result.confidence * 100)}% confidence <span className="mx-1.5 opacity-50">•</span> Aging mult. ×{result.aging_multiplier}
                </div>
              </div>
            </div>
            
            <div className="p-4 rounded-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20" />
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-orange-500" />
              <p className="relative z-10 text-[13px] text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                {result.uv_vulnerability}
              </p>
            </div>

            {result.detected_markers?.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-1">
                {result.detected_markers.map((m) => (
                  <span key={m} className="text-[11px] font-mono bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-1 rounded-full border border-red-200 dark:border-red-800/30">
                    {m.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Educational Hub ──────────────────────────────────────────────────────────

function EducationalHub() {
  return (
    <div className="flex flex-col gap-6">
      <div className="glass-panel overflow-hidden w-full">
        <div className="p-4 md:p-5 border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-black/20 flex items-center gap-2">
          <BookOpen size={18} className="text-sun-500" />
          <span className="font-extrabold text-[15px] text-gray-900 dark:text-gray-100">Skin Cancer Prevention</span>
        </div>
        <div className="relative w-full aspect-video bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?rel=0&modestbranding=1`}
            title="Skin Cancer Prevention" 
            className="absolute inset-0 w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>

      <div className="glass-panel w-full">
        <div className="p-4 md:p-5 border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-black/20 font-extrabold text-[15px] text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <BookOpen size={18} className="text-sun-500" /> Resources
        </div>
        <div className="p-4 flex flex-col gap-3">
          {EDUCATIONAL_ARTICLES.map((a) => (
            <a key={a.url} href={a.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 transition-colors shadow-sm group">
              <span className="text-[14px] font-bold text-gray-800 dark:text-gray-200 group-hover:text-sun-600 dark:group-hover:text-sun-400 transition-colors">{a.title}</span>
              <span className="text-[11px] font-mono text-gray-400 font-bold tracking-wider">{a.org}</span>
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
    <div className="min-h-screen bg-transparent p-4 md:p-8 pt-24 md:pt-[104px] pb-32 animate-in fade-in duration-500 max-w-[1200px] mx-auto">
      <div className="mb-8 pl-2">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
          UV Awareness Lab
        </h1>
        <p className="text-[15px] text-gray-500 dark:text-gray-400 mt-2 font-medium max-w-2xl">
          Interactive UV maps, AI skin analysis, and melanoma awareness powered by live ARPANSA data.
        </p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-2 mb-8 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl p-1.5 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 w-full md:w-fit overflow-x-auto no-scrollbar shadow-apple-sm">
        {tabs.map((t) => (
          <button 
            key={t.id} 
            onClick={() => setActiveTab(t.id)} 
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold whitespace-nowrap transition-all duration-300
              ${activeTab === t.id 
                ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm border border-gray-200/50 dark:border-gray-700" 
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 border border-transparent"}
            `}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="w-full relative">
        {activeTab === "map1" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <AURegionalMap stations={stations} />
            {stations.length === 0 && (
              <div className="mt-4 p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/30 text-[13px] text-orange-600 dark:text-orange-400 font-mono text-center flex items-center justify-center gap-2">
                <AlertTriangle size={16} /> Start the Python backend on port 8000 to load live ARPANSA data
              </div>
            )}
          </div>
        )}
        {activeTab === "map2" && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><GlobalAtmosphericGlobe /></div>}
        {activeTab === "map3" && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><MelanomaAwarenessMap /></div>}
        {activeTab === "lab"  && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl"><SkinLab /></div>}
        {activeTab === "learn" && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl"><EducationalHub /></div>}
      </div>
    </div>
  );
}
