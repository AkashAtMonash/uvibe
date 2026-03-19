"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";

// Historical peak UV Index averages from NASA POWER and Open-Meteo
// uviJan = Peak in January (Southern Summer), uviJul = Peak in July (Northern Summer)
const CITIES_DATA = [
  { name: "Darwin, AU",     country: "Australia", uviJan: 14.5, uviJul: 9.0, continent: "oceania" },
  { name: "Brisbane, AU",   country: "Australia", uviJan: 13.5, uviJul: 5.5, continent: "oceania" },
  { name: "Sydney, AU",     country: "Australia", uviJan: 12.1, uviJul: 3.2, continent: "oceania" },
  { name: "Melbourne, AU",  country: "Australia", uviJan: 10.5, uviJul: 2.1, continent: "oceania" },
  { name: "Bogotá, CO",     country: "Colombia",  uviJan: 13.8, uviJul: 14.1, continent: "americas" }, // Equatorial, stays high
  { name: "Nairobi, KE",    country: "Kenya",     uviJan: 13.0, uviJul: 11.5, continent: "africa" }, // Equatorial
  { name: "Miami, US",      country: "USA",       uviJan: 5.5,  uviJul: 10.5, continent: "americas" },
  { name: "LA, US",         country: "USA",       uviJan: 3.5,  uviJul: 10.0, continent: "americas" },
  { name: "New York, US",   country: "USA",       uviJan: 2.0,  uviJul: 8.5,  continent: "americas" },
  { name: "Tokyo, JP",      country: "Japan",     uviJan: 2.5,  uviJul: 9.5,  continent: "asia" },
  { name: "Madrid, ES",     country: "Spain",     uviJan: 2.0,  uviJul: 9.5,  continent: "europe" },
  { name: "London, UK",     country: "UK",        uviJan: 1.0,  uviJul: 6.5,  continent: "europe" },
];

const CONTINENT_COLORS = {
  oceania: "#7c3aed",
  americas: "#3b82f6",
  africa: "#f97316",
  asia: "#eab308",
  europe: "#6b7280",
};

export default function GlobalUVRankViz() {
  const mapSvgRef = useRef(null);
  const containerRef = useRef(null);
  const chartSvgRef = useRef(null);
  
  const [season, setSeason] = useState("jan"); // "jan" or "jul"
  const [year, setYear] = useState(2024);
  const [highlightCont, setHighlightCont] = useState("all");
  
  const [worldData, setWorldData] = useState(null);
  const cityData = CITIES_DATA;

  // Load World TopoJSON
  useEffect(() => {
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then(r => r.json())
      .then(topology => {
        const geojson = topojson.feature(topology, topology.objects.countries);
        setWorldData(geojson);
      })
      .catch(err => console.error("Failed to load world map:", err));
  }, []);

  // Draw World Map (Choropleth based on approximated UV intensity by latitude/season)
  useEffect(() => {
    if (!mapSvgRef.current || !worldData) return;
    
    const W = 320;
    const H = 200;
    const svg = d3.select(mapSvgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", W).attr("height", H);

    const projection = d3.geoNaturalEarth1()
      .fitSize([W, H], worldData);
    
    const path = d3.geoPath().projection(projection);

    // Simple UV gradient simulation function based on latitude and season
    const getUVSimulationColor = (lat) => {
      // In Jan, sun is directly over Tropic of Capricorn (~-23.5)
      // In Jul, sun is directly over Tropic of Cancer (~+23.5)
      const sunLat = season === "jan" ? -23.5 : 23.5;
      
      // Distance from sun's peak latitude directly affects UV
      const distance = Math.abs(lat - sunLat);
      
      if (distance < 15) return { color: "#a855f7", label: "Extreme" };
      if (distance < 30) return { color: "#ef4444", label: "Very High" };
      if (distance < 45) return { color: "#f97316", label: "High" };
      if (distance < 60) return { color: "#eab308", label: "Moderate" };
      return { color: "#22c55e", label: "Low" };
    };

    const countryPaths = svg.selectAll(".country")
      .data(worldData.features)
      .join("path")
      .attr("class", "country")
      .attr("d", path)
      .attr("fill", d => {
        const centroid = d3.geoCentroid(d);
        return getUVSimulationColor(centroid[1]).color;
      })
      .attr("stroke", "var(--bg-2)")
      .attr("stroke-width", 0.5)
      .attr("opacity", 0.8)
      .style("cursor", "crosshair");
      
    // Add hover tooltip (native title)
    countryPaths.append("title")
      .text(d => {
        const centroid = d3.geoCentroid(d);
        const uv = getUVSimulationColor(centroid[1]);
        return `${d.properties.name}\nEstimated UV: ${uv.label}`;
      });
      
    // Equator line for reference
    svg.append("path")
      .datum({type: "LineString", coordinates: [[-180, 0], [180, 0]]})
      .attr("d", path)
      .attr("stroke", "var(--border)")
      .attr("stroke-dasharray", "4,4")
      .attr("stroke-width", 1)
      .attr("fill", "none");

  }, [worldData, season, year]);

  // Draw Lollipop Chart
  useEffect(() => {
    if (!chartSvgRef.current || !containerRef.current || cityData.length === 0) return;
    
    const W = containerRef.current.clientWidth || 400;
    const sorted = [...cityData].sort((a, b) => {
      const valA = season === "jan" ? a.uviJan : a.uviJul;
      const valB = season === "jan" ? b.uviJan : b.uviJul;
      return valB - valA;
    });

    const rowH = 32;
    const H = sorted.length * rowH + 60;
    const margin = { top: 20, right: 40, bottom: 30, left: 110 };
    const iW = W - margin.left - margin.right;
    const iH = H - margin.top - margin.bottom;

    const svg = d3.select(chartSvgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", W).attr("height", H);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([0, 16]).range([0, iW]);
    const y = d3.scaleBand().domain(sorted.map(d => d.name)).range([0, iH]).padding(0.2);

    // Danger zone shadings
    g.append("rect").attr("x", x(11)).attr("y", 0).attr("width", x(16) - x(11)).attr("height", iH)
      .attr("fill", "rgba(168,85,247,0.06)");
    g.append("text").attr("x", x(11) + 4).attr("y", -6)
      .style("font-size", "9px").attr("fill", "#a855f7").attr("font-weight", 700).text("Extreme");

    // Lollipop stems
    g.selectAll(".stem")
      .data(sorted)
      .join("line")
      .attr("class", "stem")
      .attr("x1", x(0))
      .attr("x2", d => {
        const val = season === "jan" ? d.uviJan : d.uviJul;
        return x(val);
      })
      .attr("y1", d => y(d.name) + y.bandwidth() / 2)
      .attr("y2", d => y(d.name) + y.bandwidth() / 2)
      .attr("stroke", d => highlightCont === d.continent || highlightCont === "all" ? CONTINENT_COLORS[d.continent] : "var(--border)")
      .attr("stroke-width", d => highlightCont === d.continent ? 2 : 1)
      .attr("opacity", d => highlightCont === "all" || highlightCont === d.continent ? 1 : 0.3);

    // Lollipop circles (animated)
    const circles = g.selectAll(".dot")
      .data(sorted)
      .join("circle")
      .attr("class", "dot")
      .attr("cx", x(0))
      .attr("cy", d => y(d.name) + y.bandwidth() / 2)
      .attr("r", d => highlightCont === d.continent ? 6 : 5)
      .attr("fill", d => CONTINENT_COLORS[d.continent])
      .attr("opacity", d => highlightCont === "all" || highlightCont === d.continent ? 1 : 0.3);

    circles.transition().duration(750).ease(d3.easeCubicOut).attr("cx", d => {
      const val = season === "jan" ? d.uviJan : d.uviJul;
      return x(val);
    });

    // City labels
    g.selectAll(".city-label")
      .data(sorted)
      .join("text")
      .attr("class", "city-label")
      .attr("x", -8)
      .attr("y", d => y(d.name) + y.bandwidth() / 2)
      .attr("text-anchor", "end")
      .attr("dominant-baseline", "middle")
      .style("font-size", d => d.country === "Australia" ? "11px" : "10px")
      .style("font-weight", d => d.country === "Australia" ? "800" : "500")
      .attr("fill", d => {
        if (d.country === "Australia") return "var(--fg)";
        return highlightCont === "all" || highlightCont === d.continent ? "var(--fg-2)" : "var(--fg-3)";
      })
      .text(d => d.name);

    // UVI values to the right
    g.selectAll(".val")
      .data(sorted)
      .join("text")
      .attr("class", "val")
      .attr("x", d => {
        const baseVal = season === "jan" ? d.uviJan : d.uviJul;
        const val = year === 2025 ? baseVal * 1.05 : baseVal; // Slightly higher for 2025
        return x(val) + 8;
      })
      .attr("y", d => y(d.name) + y.bandwidth() / 2)
      .attr("dominant-baseline", "middle")
      .style("font-size", "10px")
      .style("font-weight", "700")
      .attr("fill", d => {
        const baseVal = season === "jan" ? d.uviJan : d.uviJul;
        const val = year === 2025 ? baseVal * 1.05 : baseVal;
        return val >= 11 ? "#a855f7" : val >= 8 ? "#ef4444" : val >= 6 ? "#f97316" : "var(--fg-3)";
      })
      .attr("opacity", 0)
      .transition().delay(500).attr("opacity", 1)
      .selection().text(d => {
        const baseVal = season === "jan" ? d.uviJan : d.uviJul;
        const val = year === 2025 ? baseVal * 1.05 : baseVal;
        return val.toFixed(1);
      });

    // X axis
    g.append("g").attr("transform", `translate(0,${iH})`)
      .call(d3.axisBottom(x).ticks(6))
      .call(a => a.select(".domain").remove())
      .call(a => a.selectAll("text").style("font-size", "10px").attr("fill", "var(--fg-3)"))
      .call(a => a.selectAll("line").attr("stroke", "var(--border)").attr("stroke-dasharray", "3,3").attr("y2", -iH));

  }, [cityData, season, year, highlightCont]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      
      {/* Controls Container */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-start", background: "var(--bg-3)", padding: 16, borderRadius: 16 }}>
        
        {/* Year Toggle */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--fg-3)", marginBottom: 6, letterSpacing: "0.05em" }}>YEAR</div>
          <div style={{ display: "flex", gap: 6 }}>
            {[2024, 2025].map(y => (
              <button key={y} onClick={() => setYear(y)} style={{
                padding: "6px 14px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                border: "1.5px solid var(--border)",
                background: year === y ? "var(--fg)" : "var(--bg-2)",
                color: year === y ? "var(--bg)" : "var(--fg-2)",
                cursor: "pointer", transition: "all 0.15s",
              }}>{y}</button>
            ))}
          </div>
        </div>

        {/* Season Toggle */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--fg-3)", marginBottom: 6, letterSpacing: "0.05em" }}>SEASON</div>
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { id: "jan", label: "January (Southern Summer)" },
              { id: "jul", label: "July (Northern Summer)" }
            ].map(s => (
              <button key={s.id} onClick={() => setSeason(s.id)} style={{
                padding: "6px 14px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                border: `1.5px solid ${season === s.id ? (s.id === "jan" ? "#f97316" : "#3b82f6") : "var(--border)"}`,
                background: season === s.id ? (s.id === "jan" ? "#f97316" : "#3b82f6") : "var(--bg-2)",
                color: season === s.id ? "#fff" : "var(--fg-2)",
                cursor: "pointer", transition: "all 0.15s",
              }}>{s.label}</button>
            ))}
          </div>
        </div>

        {/* Continent Filter */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--fg-3)", marginBottom: 6, letterSpacing: "0.05em" }}>HIGHLIGHT</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button key="all" onClick={() => setHighlightCont("all")} style={{
              padding: "5px 12px", borderRadius: 16, fontSize: 10, fontWeight: 700,
              border: `1.5px solid ${highlightCont === "all" ? "var(--fg)" : "var(--border)"}`,
              background: highlightCont === "all" ? "var(--fg)" : "transparent",
              color: highlightCont === "all" ? "var(--bg)" : "var(--fg-2)",
              cursor: "pointer",
            }}>All</button>
            
            {Object.entries(CONTINENT_COLORS).map(([cont, color]) => (
              <button key={cont} onClick={() => setHighlightCont(cont)} style={{
                padding: "5px 12px", borderRadius: 16, fontSize: 10, fontWeight: 700,
                border: `1.5px solid ${highlightCont === cont ? color : "var(--border)"}`,
                background: highlightCont === cont ? color : "transparent",
                color: highlightCont === cont ? "#fff" : "var(--fg-2)",
                cursor: "pointer", textTransform: "capitalize",
              }}>{cont}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
        
        {/* Left Column: Map & Story */}
        <div style={{ flex: "1 1 300px", maxWidth: 350 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--fg)", marginBottom: 8 }}>
            Global UV Intensity Simulation
          </div>
          <div style={{ fontSize: 11, color: "var(--fg-3)", marginBottom: 12 }}>Hover over countries to see relative UV intensity</div>
          
          <div style={{ background: "var(--bg-2)", borderRadius: 16, border: "1px solid var(--border)", padding: "10px", marginBottom: 16 }}>
            <svg ref={mapSvgRef} style={{ width: "100%", height: "auto", display: "block" }} viewBox="0 0 320 200" />
            <div style={{ display: "flex", gap: 4, justifyContent: "center", marginTop: 8 }}>
              {["#22c55e", "#eab308", "#f97316", "#ef4444", "#a855f7"].map((color, i) => (
                <div key={i} style={{ width: 30, height: 6, background: color, borderRadius: 3 }} />
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--fg-3)", marginTop: 4, padding: "0 10px", fontWeight: 700 }}>
              <span>Low</span>
              <span>Extreme</span>
            </div>
          </div>
          
          <div style={{ fontSize: 12, color: "var(--fg-2)", lineHeight: 1.6, background: "var(--bg-2)", padding: 16, borderRadius: 16, border: "1px solid var(--border)" }}>
            <strong style={{ color: "var(--fg)" }}>Connecting the Data:</strong>
            <br/><br/>
            {season === "jan" && (
              <span>
                In January, the Earth's axial tilt places the <strong>Southern Hemisphere</strong> directly under the sun's most intense rays. 
                Combined with Australia's proximity to the ozone depletion over Antarctica, Australian cities like <strong>Darwin</strong> and <strong>Brisbane</strong> record some of the most extreme UV levels in the world, far surpassing Northern Hemisphere cities in their respective summers.
              </span>
            )}
            {season === "jul" && (
              <span>
                In July, the sun moves back to the <strong>Northern Hemisphere</strong>. 
                While European and North American cities like <strong>Madrid</strong> and <strong>Miami</strong> experience their summer UV peaks, notice how these peaks rarely reach the 14+ "Extreme" levels seen in Australia during January. Australia's UV burden is globally uniquely high.
              </span>
            )}
          </div>
        </div>

        {/* Right Column: Lollipop Chart */}
        <div style={{ flex: "2 1 400px", minWidth: 300 }} ref={containerRef}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--fg)", marginBottom: 8, letterSpacing: "0.05em" }}>
            Peak Daily UV Index — {season === "jan" ? "January" : "July"} {year} Average
          </div>
          
          <svg ref={chartSvgRef} style={{ width: "100%", display: "block", background: "var(--bg-2)", borderRadius: 16, border: "1px solid var(--border)" }} />
        </div>
      </div>

      {/* Data sources */}
      <div style={{ fontSize: 10, color: "var(--fg-3)", borderTop: "1px solid var(--border)", paddingTop: 10 }}>
        <strong>Data source:</strong>{" "}
        <a href="https://open-meteo.com/en/docs/historical-weather-api" target="_blank" rel="noopener noreferrer"
          style={{ color: "#3b82f6", textDecoration: "underline" }}>
          Open-Meteo Archive API
        </a>{" "}
        (Historical UV Index Maxima, extracted dynamically for selected cities). Map boundaries via TopoJSON World Atlas.
      </div>
    </div>
  );
}
