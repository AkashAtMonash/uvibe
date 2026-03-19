"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { STATE_KPIS } from "./data";

// Global cancer incidence per 100k for comparison (WHO / AIHW 2023)
const GLOBAL_COMPARISON = [
  { label: "Australia", value: 33.6, color: "#ef4444", flag: "🇦🇺", bold: true },
  { label: "New Zealand", value: 35.1, color: "#f97316", flag: "🇳🇿", bold: false },
  { label: "Norway", value: 29.6, color: "#eab308", flag: "🇳🇴", bold: false },
  { label: "USA", value: 22.7, color: "#22c55e", flag: "🇺🇸", bold: false },
  { label: "UK", value: 17.9, color: "#22c55e", flag: "🇬🇧", bold: false },
  { label: "Japan", value: 4.8, color: "#22c55e", flag: "🇯🇵", bold: false },
  { label: "China", value: 1.5, color: "#22c55e", flag: "🇨🇳", bold: false },
];

const STATE_CANCER_INFO = [
  { name: "QLD", cases: 89, label: "89/100k", desc: "Highest — tropical UV + outdoor culture" },
  { name: "WA", cases: 78, label: "78/100k", desc: "2× Madrid's peak UV exposure" },
  { name: "SA", cases: 72, label: "72/100k", desc: "Desert UV levels year-round" },
  { name: "NSW", cases: 68, label: "68/100k", desc: "2× New York's intensity" },
  { name: "ACT", cases: 65, label: "65/100k", desc: "High altitude increases UV" },
  { name: "NT", cases: 60, label: "60/100k", desc: "3× higher than Berlin" },
  { name: "VIC", cases: 58, label: "58/100k", desc: "Still extreme by global standards" },
  { name: "TAS", cases: 55, label: "55/100k", desc: "\"Extreme\" by European standards" },
];

export default function CancerTreemapViz() {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;
    const W = containerRef.current.clientWidth || 480;
    const H = 200;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", W).attr("height", H);

    const data = { children: GLOBAL_COMPARISON.map((d) => ({ ...d, size: d.value })) };
    const root = d3.hierarchy(data).sum((d) => d.size);
    d3.treemap().size([W, H]).padding(3).round(true)(root);

    const cell = svg.selectAll("g")
      .data(root.leaves())
      .join("g")
      .attr("transform", (d) => `translate(${d.x0},${d.y0})`);

    cell.append("rect")
      .attr("width", (d) => d.x1 - d.x0)
      .attr("height", (d) => d.y1 - d.y0)
      .attr("fill", (d) => d.data.color)
      .attr("rx", 6)
      .attr("opacity", (d) => d.data.bold ? 1 : 0.75);

    // Outer ring highlight for AU
    cell.filter((d) => d.data.bold)
      .append("rect")
      .attr("width", (d) => d.x1 - d.x0)
      .attr("height", (d) => d.y1 - d.y0)
      .attr("fill", "none")
      .attr("stroke", "#fff")
      .attr("stroke-width", 3)
      .attr("rx", 6);

    cell.each(function (d) {
      const w = d.x1 - d.x0;
      const h = d.y1 - d.y0;
      const g = d3.select(this);
      if (w > 50 && h > 30) {
        g.append("text")
          .attr("x", w / 2).attr("y", h / 2 - (h > 60 ? 10 : 0))
          .attr("text-anchor", "middle").attr("dominant-baseline", "middle")
          .style("font-size", d.data.bold ? "14px" : "11px")
          .style("font-weight", "800")
          .style("fill", "#fff")
          .style("pointer-events", "none")
          .text(d.data.flag + " " + d.data.label);

        if (h > 60) {
          g.append("text")
            .attr("x", w / 2).attr("y", h / 2 + 12)
            .attr("text-anchor", "middle")
            .style("font-size", "10px")
            .style("font-weight", "700")
            .style("fill", "rgba(255,255,255,0.85)")
            .style("pointer-events", "none")
            .text(`${d.data.value}/100k`);
        }
      }
    });
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Treemap */}
      <div>
        <div style={{ fontSize: 11, color: "var(--fg-3)", marginBottom: 8, fontWeight: 600 }}>
          MELANOMA INCIDENCE — AUSTRALIA VS THE WORLD (cases per 100k population)
        </div>
        <div ref={containerRef} style={{ borderRadius: 12, overflow: "hidden" }}>
          <svg ref={svgRef} style={{ width: "100%", display: "block" }} />
        </div>
        <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 6, fontWeight: 500 }}>
          Source: WHO Global Cancer Observatory (GLOBOCAN 2022), AIHW 2023
        </div>
      </div>

      {/* State breakdown bar chart */}
      <div>
        <div style={{ fontSize: 11, color: "var(--fg-3)", marginBottom: 12, fontWeight: 600 }}>
          SKIN CANCER INCIDENCE BY AUSTRALIAN STATE (AIHW 2023 data)
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {STATE_CANCER_INFO.map((s, i) => {
            const pct = (s.cases / 89) * 100;
            const colors = ["#ef4444", "#f97316", "#f97316", "#eab308", "#eab308", "#84cc16", "#22c55e", "#22c55e"];
            return (
              <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, fontSize: 12, fontWeight: 800, color: "var(--fg)", textAlign: "right", flexShrink: 0 }}>
                  {s.name}
                </div>
                <div style={{ flex: 1, background: "var(--bg-3)", borderRadius: 8, height: 26, position: "relative", overflow: "hidden" }}>
                  <div style={{
                    position: "absolute", left: 0, top: 0, bottom: 0,
                    width: `${pct}%`,
                    background: colors[i],
                    borderRadius: 8,
                    transition: "width 0.8s cubic-bezier(0.25,0.8,0.25,1)",
                  }} />
                  <div style={{
                    position: "absolute", left: 8, top: 0, bottom: 0,
                    display: "flex", alignItems: "center",
                    fontSize: 11, fontWeight: 700, color: pct > 30 ? "#fff" : "var(--fg-2)",
                  }}>
                    {s.label}
                  </div>
                  <div style={{
                    position: "absolute", right: 8, top: 0, bottom: 0,
                    display: "flex", alignItems: "center",
                    fontSize: 10, fontWeight: 500, color: "var(--fg-3)",
                  }}>
                    {s.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Insight cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[
          { icon: "💰", title: "$1.7B+", desc: "Annual economic burden on Australian healthcare from UV-related skin cancers", color: "#ef4444" },
          { icon: "🧬", title: "2 in 3", desc: "Australians will be diagnosed with skin cancer by age 70 — highest globally", color: "#f97316" },
          { icon: "📅", title: "5 min", desc: "Minutes to sunburn at noon in QLD on summer peak days (Skin Type II)", color: "#a855f7" },
          { icon: "✅", title: "95%", desc: "Of skin cancers are preventable with regular sunscreen, hats, and UV-protective clothing", color: "#22c55e" },
        ].map((c) => (
          <div key={c.title} style={{
            padding: "14px 16px", borderRadius: 14,
            background: "var(--bg-3, #f3f4f6)",
            border: "1.5px solid var(--border)",
          }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{c.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: c.color, marginBottom: 4 }}>{c.title}</div>
            <div style={{ fontSize: 11, color: "var(--fg-2)", lineHeight: 1.4 }}>{c.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
