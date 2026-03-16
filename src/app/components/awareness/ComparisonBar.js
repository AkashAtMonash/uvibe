"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { BENCHMARK_CITIES } from "./data";

export default function ComparisonBar({ benchmarkData, sydneyUVI, loading }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!benchmarkData || !svgRef.current) return;

    const container = svgRef.current.parentElement;
    const W = container.clientWidth || 400;
    const H = 260;
    const margin = { top: 20, right: 20, bottom: 40, left: 80 };
    const innerW = W - margin.left - margin.right;
    const innerH = H - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", W).attr("height", H);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const cities = benchmarkData.filter((c) => c.peakUVI != null);
    const maxUVI = d3.max(cities, (c) => c.peakUVI) * 1.15;

    const x = d3.scaleLinear().domain([0, maxUVI]).range([0, innerW]);
    const y = d3.scaleBand().domain(cities.map((c) => c.name)).range([0, innerH]).padding(0.35);

    // Grid lines
    g.append("g")
      .attr("class", "grid")
      .call(d3.axisBottom(x).ticks(5).tickSize(innerH).tickFormat(""))
      .call((axis) => axis.select(".domain").remove())
      .call((axis) => axis.selectAll("line").attr("stroke", "var(--border, rgba(0,0,0,0.07))").attr("stroke-dasharray", "4,4"))
      .attr("transform", "translate(0,0)");

    // Bars
    const colorScale = d3.scaleSequential().domain([0, maxUVI]).interpolator(d3.interpolateYlOrRd);

    g.selectAll(".bar")
      .data(cities)
      .join("rect")
      .attr("class", "bar")
      .attr("y", (d) => y(d.name))
      .attr("height", y.bandwidth())
      .attr("x", 0)
      .attr("width", 0)
      .attr("rx", 8)
      .attr("fill", (d) => (d.name === "Sydney" ? "#7c3aed" : colorScale(d.peakUVI)))
      .transition()
      .duration(700)
      .ease(d3.easeCubicOut)
      .attr("width", (d) => x(d.peakUVI));

    // Value labels
    g.selectAll(".label")
      .data(cities)
      .join("text")
      .attr("class", "label")
      .attr("y", (d) => y(d.name) + y.bandwidth() / 2 + 4)
      .attr("x", (d) => x(d.peakUVI) + 6)
      .text((d) => {
        const ratio = d.name === "Sydney" ? "" : d.ratio ? ` (${d.ratio}× AU)` : "";
        return `${d.peakUVI.toFixed(1)}${ratio}`;
      })
      .attr("font-size", 11)
      .attr("font-weight", 700)
      .attr("fill", "var(--fg-2, #555)");

    // Y axis — city names with flags
    const flagMap = Object.fromEntries(BENCHMARK_CITIES.map((c) => [c.name, c.flag]));
    g.append("g")
      .call(d3.axisLeft(y).tickFormat((d) => `${flagMap[d] || ""} ${d}`))
      .call((axis) => axis.select(".domain").remove())
      .call((axis) => axis.selectAll("line").remove())
      .call((axis) =>
        axis.selectAll("text")
          .attr("font-size", 12)
          .attr("font-weight", 600)
          .attr("fill", "var(--fg, #111)")
      );

    // X axis label
    svg.append("text")
      .attr("x", margin.left + innerW / 2)
      .attr("y", H - 6)
      .attr("text-anchor", "middle")
      .attr("font-size", 11)
      .attr("fill", "var(--fg-3, #9ca3af)")
      .text("Today's Peak UV Index");

    // "Temperature Fallacy" annotation
    const annotY = y("Sydney") ?? 0;
    if (annotY) {
      g.append("line")
        .attr("x1", x(6))
        .attr("x2", x(6))
        .attr("y1", 0)
        .attr("y2", innerH)
        .attr("stroke", "#3b82f6")
        .attr("stroke-dasharray", "5,3")
        .attr("stroke-width", 1.5);
      g.append("text")
        .attr("x", x(6) + 4)
        .attr("y", 14)
        .attr("font-size", 10)
        .attr("fill", "#3b82f6")
        .attr("font-weight", 600)
        .text("London peak summer");
    }
  }, [benchmarkData, sydneyUVI]);

  return (
    <div>
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--fg-3)", fontSize: 13, fontWeight: 600 }}>
          Loading live UV data from 6 cities…
        </div>
      ) : (
        <svg ref={svgRef} style={{ width: "100%", display: "block" }} />
      )}

      {/* Temperature Fallacy callout */}
      <div style={{
        margin: "12px 0 0", padding: "12px 16px",
        background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
        borderRadius: 12, border: "1px solid #bfdbfe", fontSize: 12,
      }}>
        <strong>🌡️ The Temperature Fallacy:</strong> UV is radiation, not heat. On a 22°C day in Hobart, the UVI can be <strong>8 (Very High)</strong>, while a 30°C summer day in London rarely exceeds <strong>6 (High)</strong>.
      </div>
    </div>
  );
}
