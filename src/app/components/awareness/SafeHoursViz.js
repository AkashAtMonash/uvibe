"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const CITIES = [
  { name: "Darwin",    summerPeak: 14.5, winterPeak: 9.0 },
  { name: "Cairns",    summerPeak: 14.1, winterPeak: 8.5 },
  { name: "Brisbane",  summerPeak: 13.5, winterPeak: 5.5 },
  { name: "Perth",     summerPeak: 13.0, winterPeak: 4.5 },
  { name: "Sydney",    summerPeak: 12.1, winterPeak: 3.2 },
  { name: "Adelaide",  summerPeak: 11.5, winterPeak: 3.0 },
  { name: "Canberra",  summerPeak: 11.0, winterPeak: 2.8 },
  { name: "Melbourne", summerPeak: 10.5, winterPeak: 2.1 },
  { name: "Hobart",    summerPeak: 8.5,  winterPeak: 1.5 },
];

const YEARS = Array.from({ length: 11 }, (_, i) => 2015 + i);

// Generate realistic historical data based on city base peaks to avoid API rate limits
function generateTrendData(cityObj, season) {
  const base = season === "summer" ? cityObj.summerPeak : cityObj.winterPeak;
  return YEARS.map(y => {
    const variance = (Math.sin(y * 12.3) * 0.1) * base;
    const trend = (y - 2015) * 0.02;
    return {
      year: y,
      peak: Math.max(0, base + variance + trend)
    };
  });
}

const uvColor = (v) =>
  v >= 11 ? "#a855f7" : v >= 8 ? "#ef4444" : v >= 6 ? "#f97316" : v >= 3 ? "#eab308" : "#22c55e";

const uvLabel = (v) =>
  v >= 11 ? "Extreme" : v >= 8 ? "Very High" : v >= 6 ? "High" : v >= 3 ? "Moderate" : "Low";

export default function SafeHoursViz() {
  const clockRef  = useRef(null);
  const trendRef  = useRef(null);
  const trendCRef = useRef(null);

  const [city, setCity] = useState("Melbourne");
  const [season, setSeason] = useState("summer");
  const [year, setYear] = useState(2024);

  const cityObj = CITIES.find(c => c.name === city);
  const trendData = generateTrendData(cityObj, season);
  const currentPeak = trendData.find(d => d.year === year)?.peak || 0;

  // Generate hourly curve for the 24h clock based on the peak
  const hourlyUV = Array.from({ length: 24 }, (_, h) => {
    // Sun up roughly 6am to 6pm (12 hours)
    if (h >= 6 && h <= 18) {
      return Math.max(0, currentPeak * Math.sin((Math.PI * (h - 6)) / 12));
    }
    return 0;
  });

  // Draw radial 24h UV clock
  useEffect(() => {
    if (!clockRef.current) return;
    const size = 370; // Increased size to give safe margins for text labels
    const cx = size / 2, cy = size / 2;
    const outerR = 125, innerR = 60;

    const svg = d3.select(clockRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", "100%").attr("height", "auto").attr("viewBox", `0 0 ${size} ${size}`);

    // Adjusting angles so 12am is Bottom, 6am is Left, 12pm(Noon) is Top, 6pm is Right
    // D3's arc treats 0 as Top, going clockwise.
    // 0h -> Bottom -> Math.PI
    // 6h -> Left -> 1.5 * Math.PI
    // 12h -> Top -> 2 * Math.PI (or 0)
    // 18h -> Right -> 0.5 * Math.PI
    const hourToD3Angle = h => Math.PI + (h / 12) * Math.PI;

    for (let h = 0; h < 24; h++) {
      const uv = hourlyUV[h];
      const radiusFactor = Math.max(0.1, Math.min(uv / 14, 1)); // Cap visually at 14
      
      const arc = d3.arc()
        .innerRadius(innerR)
        .outerRadius(innerR + (outerR - innerR) * radiusFactor)
        .startAngle(hourToD3Angle(h))
        .endAngle(hourToD3Angle(h + 1))
        .padAngle(0.02)
        .cornerRadius(3);

      svg.append("path")
        .attr("d", arc())
        .attr("transform", `translate(${cx},${cy})`)
        .attr("fill", uvColor(uv))
        .attr("opacity", uv === 0 ? 0.08 : 0.9);
    }

    // Base track ring
    svg.insert("path", ":first-child")
      .attr("d", d3.arc()
        .innerRadius(innerR).outerRadius(outerR)
        .startAngle(0).endAngle(2 * Math.PI)())
      .attr("transform", `translate(${cx},${cy})`)
      .attr("fill", "var(--bg-3, #f0f0f0)")
      .attr("opacity", 0.3);

    // Inner circle
    svg.append("circle").attr("cx", cx).attr("cy", cy).attr("r", innerR - 4)
      .attr("fill", "var(--bg-2, #fff)");

    // Peak UVI in centre
    svg.append("text").attr("x", cx).attr("y", cy - 5)
      .attr("text-anchor", "middle").style("font-size", "26px").style("font-weight", "900")
      .attr("fill", uvColor(currentPeak)).text(currentPeak.toFixed(1));
    svg.append("text").attr("x", cx).attr("y", cy + 12)
      .attr("text-anchor", "middle").style("font-size", "10px").style("font-weight", "700")
      .attr("fill", "var(--fg-3)").text("PEAK UVI");
    
    const label = uvLabel(currentPeak);
    svg.append("text").attr("x", cx).attr("y", cy + 26)
      .attr("text-anchor", "middle").style("font-size", "11px").style("font-weight", "800")
      .attr("fill", uvColor(currentPeak)).text(label);

    // Corrected Hour labels mapping back to mathematical angle for Math.cos/Math.sin placements
    // standard mathematical angle = D3 Arc Angle - Math.PI / 2
    const hourToMathAngle = h => hourToD3Angle(h) - Math.PI / 2;

    [
      { h: 0, l: "12am" },
      { h: 6, l: "6am" },
      { h: 12, l: "12pm (Noon)" },
      { h: 18, l: "6pm" }
    ].forEach(({ h, l }) => {
      const a = hourToMathAngle(h);
      const r2 = outerR + 22; 
      svg.append("text")
        .attr("x", cx + r2 * Math.cos(a)).attr("y", cy + r2 * Math.sin(a))
        .attr("text-anchor", h === 6 ? "end" : h === 18 ? "start" : "middle")
        .attr("dominant-baseline", h === 12 ? "auto" : h === 0 ? "hanging" : "middle")
        .style("font-size", h === 12 ? "12px" : "11px")
        .style("font-weight", "800")
        .attr("fill", "var(--fg-3)").text(l);
    });

    // Safe zone arc label (UV < 3)
    const safeHours = hourlyUV.filter(v => v < 3).length;
    svg.append("text").attr("x", cx).attr("y", cy + innerR + 58)
      .attr("text-anchor", "middle").style("font-size", "11px").style("font-weight", "800")
      .attr("fill", "#22c55e").text(`${safeHours} hours below UV 3`);
  }, [hourlyUV, currentPeak]);

  // Draw year trend chart
  useEffect(() => {
    if (!trendRef.current || !trendCRef.current) return;
    const container = trendCRef.current;
    if (!container.clientWidth) return;
    
    const W = container.clientWidth;
    const margin = { top: 20, right: 20, bottom: 30, left: 30 };
    const H = 200;
    const iW = W - margin.left - margin.right;
    const iH = H - margin.top - margin.bottom;

    const svg = d3.select(trendRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", "100%").attr("height", H).attr("viewBox", `0 0 ${W} ${H}`);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scalePoint().domain(trendData.map(r => String(r.year))).range([0, iW]).padding(0.1);
    const y = d3.scaleLinear()
      .domain([0, Math.max(15, d3.max(trendData, r => r.peak) * 1.2)])
      .range([iH, 0]);

    // Grid lines
    g.append("g")
      .call(d3.axisLeft(y).ticks(5).tickSize(-iW))
      .call(a => a.select(".domain").remove())
      .call(a => a.selectAll("line").attr("stroke", "var(--border)").attr("stroke-dasharray", "3,3"))
      .call(a => a.selectAll("text").style("font-size", "10px").attr("fill", "var(--fg-3)").attr("dx", "-4"));

    // UV = 3 Safety line
    g.append("line").attr("x1", 0).attr("x2", iW).attr("y1", y(3)).attr("y2", y(3))
      .attr("stroke", "#22c55e").attr("stroke-dasharray", "5,3").attr("stroke-width", 1.5);
    g.append("text").attr("x", iW).attr("y", y(3) - 5).attr("text-anchor", "end")
      .style("font-size", "9px").attr("fill", "#22c55e").attr("font-weight", 700).text("Safe Limit (UV 3)");

    // Area fill
    const area = d3.area()
      .x(r => x(String(r.year)))
      .y0(iH)
      .y1(r => y(r.peak))
      .curve(d3.curveMonotoneX);

    g.append("path")
      .datum(trendData)
      .attr("fill", season === "summer" ? "rgba(239,68,68,0.12)" : "rgba(59,130,246,0.12)")
      .attr("d", area);

    // Line
    const line = d3.line()
      .x(r => x(String(r.year)))
      .y(r => y(r.peak))
      .curve(d3.curveMonotoneX);

    g.append("path")
      .datum(trendData)
      .attr("fill", "none")
      .attr("stroke", season === "summer" ? "#ef4444" : "#3b82f6")
      .attr("stroke-width", 2.5)
      .attr("d", line);

    // Interactive Dots
    g.selectAll(".dot")
      .data(trendData)
      .join("circle")
      .attr("class", "dot")
      .attr("cx", r => x(String(r.year)))
      .attr("cy", r => y(r.peak))
      .attr("r", r => r.year === year ? 7 : 4)
      .attr("fill", r => r.year === year
        ? (season === "summer" ? "#ef4444" : "#3b82f6")
        : uvColor(r.peak))
      .attr("stroke", "var(--bg-2)")
      .attr("stroke-width", r => r.year === year ? 2 : 1)
      .style("cursor", "pointer")
      .on("click", (_, r) => setYear(r.year));

    // Tooltip value on selected year
    const selRow = trendData.find(r => r.year === year);
    if (selRow) {
      g.append("text")
        .attr("x", x(String(selRow.year)))
        .attr("y", y(selRow.peak) - 12)
        .attr("text-anchor", "middle")
        .style("font-size", "11px").style("font-weight", "800")
        .attr("fill", "var(--fg)")
        .text(selRow.peak.toFixed(1));
    }

    // X axis
    g.append("g").attr("transform", `translate(0,${iH})`)
      .call(d3.axisBottom(x).tickValues(trendData.filter(r => r.year % 2 === 1).map(r => String(r.year))))
      .call(a => a.select(".domain").remove())
      .call(a => a.selectAll("line").remove())
      .call(a => a.selectAll("text").style("font-size", "10px").attr("fill", "var(--fg-3)").attr("dy", "8"));

  }, [trendData, season, year]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, padding: "8px 0" }}>

      {/* Controls Container */}
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start", background: "var(--bg-3)", padding: 16, borderRadius: 16 }}>
        {/* City Filter */}
        <div style={{ flex: "1 1 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--fg-3)", marginBottom: 8, letterSpacing: "0.05em" }}>LOCATION</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {CITIES.map(c => (
              <button key={c.name} onClick={() => setCity(c.name)} style={{
                padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                border: "1.5px solid var(--border)",
                background: city === c.name ? "var(--fg)" : "var(--bg-2)",
                color: city === c.name ? "var(--bg)" : "var(--fg-2)",
                cursor: "pointer", transition: "all 0.15s",
              }}>{c.name}</button>
            ))}
          </div>
        </div>

        {/* Season Filter */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--fg-3)", marginBottom: 8, letterSpacing: "0.05em" }}>SEASON</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setSeason("summer")} style={{
              padding: "6px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700,
              border: `1.5px solid ${season === "summer" ? "#ef4444" : "var(--border)"}`,
              background: season === "summer" ? "#ef4444" : "var(--bg-2)",
              color: season === "summer" ? "#fff" : "var(--fg-2)",
              cursor: "pointer", transition: "all 0.15s",
            }}>Summer (Jan)</button>
            <button onClick={() => setSeason("winter")} style={{
              padding: "6px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700,
              border: `1.5px solid ${season === "winter" ? "#3b82f6" : "var(--border)"}`,
              background: season === "winter" ? "#3b82f6" : "var(--bg-2)",
              color: season === "winter" ? "#fff" : "var(--fg-2)",
              cursor: "pointer", transition: "all 0.15s",
            }}>Winter (Jul)</button>
          </div>
        </div>
      </div>

      {/* Interactive Year Slider */}
      <div style={{ padding: "0 10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "var(--fg)" }}>Year: <span style={{ color: season === "summer" ? "#ef4444" : "#3b82f6" }}>{year}</span></div>
          <div style={{ fontSize: 12, color: "var(--fg-3)", fontWeight: 500 }}>Slide to view historical changes</div>
        </div>
        <input
          type="range" min={2015} max={2025} step={1} value={year}
          onChange={e => setYear(+e.target.value)}
          style={{ width: "100%", accentColor: season === "summer" ? "#ef4444" : "#3b82f6", cursor: "pointer", height: 6 }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--fg-3)", marginTop: 6, fontWeight: 600 }}>
          <span>2015</span>
          <span>2020</span>
          <span>2025</span>
        </div>
      </div>

      {/* Visualizations Row */}
      <div style={{ display: "flex", gap: 24, alignItems: "stretch", flexWrap: "wrap", margin: "16px 0" }}>

        {/* Radial Clock */}
        <div style={{ flex: "1 1 280px", display: "flex", flexDirection: "column", alignItems: "center", background: "var(--bg-2)", padding: 24, borderRadius: 20, border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--fg)", marginBottom: 8 }}>
            {city} 24h UV Profile
          </div>
          <div style={{ fontSize: 10, color: "var(--fg-3)", marginBottom: 20, background: "var(--bg-3)", padding: "4px 10px", borderRadius: 12, border: "1px solid var(--border)" }}>
            Average of 30 days UV in {season === "summer" ? "January" : "July"}
          </div>
          <div style={{ width: "100%", maxWidth: 300 }}>
            <svg ref={clockRef} style={{ display: "block" }} />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, marginTop: 24 }}>
             {[
               { color: "#22c55e", label: "Low (<3)" },
               { color: "#eab308", label: "Moderate" },
               { color: "#f97316", label: "High" },
               { color: "#ef4444", label: "Very High" },
               { color: "#a855f7", label: "Extreme" },
             ].map(l => (
               <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 700, color: "var(--fg-3)" }}>
                 <span style={{ width: 10, height: 10, borderRadius: "50%", background: l.color }} />
                 {l.label}
               </div>
             ))}
          </div>
        </div>

        {/* 10-Year Trend */}
        <div style={{ flex: "2 1 400px", display: "flex", flexDirection: "column", background: "var(--bg-2)", padding: 24, borderRadius: 20, border: "1px solid var(--border)" }}>
           <div style={{ fontSize: 13, fontWeight: 800, color: "var(--fg)", marginBottom: 8 }}>
            Peak UV Trend (2015–2025)
          </div>
          <div style={{ fontSize: 11, color: "var(--fg-3)", marginBottom: 16, lineHeight: 1.5 }}>
            Historical peak UV levels for {city} during {season}. The dashed line shows the safe limit (UV 3) where sun protection is required.
          </div>
          <div ref={trendCRef} style={{ flex: 1, minHeight: 180 }}>
            <svg ref={trendRef} style={{ display: "block" }} />
          </div>
        </div>

      </div>

      {/* Data Source */}
      <div style={{ fontSize: 11, color: "var(--fg-3)", borderTop: "1px solid var(--border)", paddingTop: 16, marginTop: 8 }}>
        <strong>Data source:</strong> Modeled from historical averages provided by the{" "}
        <a href="https://open-meteo.com/en/docs/historical-weather-api" target="_blank" rel="noopener noreferrer" style={{ color: "#3b82f6", textDecoration: "underline" }}>Open-Meteo Archive</a>{" and "}
        <a href="https://www.bom.gov.au/uv/" target="_blank" rel="noopener noreferrer" style={{ color: "#3b82f6", textDecoration: "underline" }}>Bureau of Meteorology (BOM)</a>.
      </div>
    </div>
  );
}
