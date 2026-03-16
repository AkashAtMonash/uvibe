"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { DOSE_RESPONSE } from "./data";

const SERIES = [
  { key: "noSpf",  label: "No Sunscreen",   color: "#dc2626" },
  { key: "spf30",  label: "SPF 30+",         color: "#f59e0b" },
  { key: "spf50",  label: "SPF 50+",         color: "#16a34a" },
];

export default function DoseResponseChart() {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const container = svgRef.current.parentElement;
    const W = container.clientWidth || 400;
    const H = 260;
    const m = { top: 24, right: 110, bottom: 48, left: 52 };
    const iW = W - m.left - m.right;
    const iH = H - m.top - m.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", W).attr("height", H);

    const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);

    const x = d3.scaleLinear().domain([0, 10000]).range([0, iW]);
    const y = d3.scaleLinear().domain([0, 90]).range([iH, 0]);

    // Grid
    g.append("g").call(d3.axisLeft(y).ticks(5).tickSize(-iW).tickFormat(""))
      .call(ax => ax.select(".domain").remove())
      .call(ax => ax.selectAll("line").attr("stroke", "var(--border, rgba(0,0,0,0.07))").attr("stroke-dasharray", "4,4"));

    // Shaded "prevented fraction" area between noSpf and spf50
    const areaGen = d3.area()
      .x((d) => x(d.sed))
      .y0((d, i) => y(DOSE_RESPONSE.spf50[i]?.risk ?? 0))
      .y1((d) => y(d.risk))
      .curve(d3.curveMonotoneX);

    g.append("path")
      .datum(DOSE_RESPONSE.noSpf)
      .attr("d", areaGen)
      .attr("fill", "#16a34a")
      .attr("opacity", 0.1);

    // Lines
    const lineGen = d3.line()
      .x((d) => x(d.sed))
      .y((d) => y(d.risk))
      .curve(d3.curveMonotoneX);

    SERIES.forEach(({ key, label, color }) => {
      const data = DOSE_RESPONSE[key];

      g.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 2.5)
        .attr("stroke-dasharray", key === "noSpf" ? "none" : "none")
        .attr("d", lineGen);

      // End label
      const last = data[data.length - 1];
      g.append("text")
        .attr("x", x(last.sed) + 6)
        .attr("y", y(last.risk) + 4)
        .attr("font-size", 10)
        .attr("font-weight", 700)
        .attr("fill", color)
        .text(label);
    });

    // Axes
    g.append("g").attr("transform", `translate(0,${iH})`).call(d3.axisBottom(x).ticks(5).tickFormat(d => `${(d/1000).toFixed(0)}k`))
      .call(ax => ax.select(".domain").attr("stroke", "var(--border)"))
      .call(ax => ax.selectAll("text").attr("font-size", 10).attr("fill", "var(--fg-3)"));

    g.append("g").call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}%`))
      .call(ax => ax.select(".domain").attr("stroke", "var(--border)"))
      .call(ax => ax.selectAll("text").attr("font-size", 10).attr("fill", "var(--fg-3)"));

    // Axis labels
    svg.append("text")
      .attr("x", m.left + iW / 2).attr("y", H - 6)
      .attr("text-anchor", "middle").attr("font-size", 11).attr("fill", "var(--fg-3)")
      .text("Lifetime Cumulative UV Dose (SED)");

    svg.append("text")
      .attr("transform", `rotate(-90)`)
      .attr("x", -(m.top + iH / 2)).attr("y", 13)
      .attr("text-anchor", "middle").attr("font-size", 11).attr("fill", "var(--fg-3)")
      .text("Cancer Risk (%)");

    // "Prevented Fraction" annotation
    g.append("text")
      .attr("x", x(6000)).attr("y", y(27))
      .attr("font-size", 10).attr("fill", "#16a34a").attr("font-weight", 700)
      .text("← Prevented");
    g.append("text")
      .attr("x", x(6000)).attr("y", y(27) + 12)
      .attr("font-size", 10).attr("fill", "#16a34a").attr("font-weight", 700)
      .text("   Fraction");
  }, []);

  return (
    <div>
      <svg ref={svgRef} style={{ width: "100%", display: "block" }} />
      <div style={{
        marginTop: 12, padding: "10px 14px", background: "#f0fdf4",
        borderRadius: 10, border: "1px solid #86efac", fontSize: 12,
      }}>
        <strong>📊 AIHW 2025:</strong> Regular SPF 30+ use is estimated to prevent ~9.3% of squamous cell carcinomas and ~14% of melanomas in Australia, even accounting for imperfect application.
      </div>
    </div>
  );
}
