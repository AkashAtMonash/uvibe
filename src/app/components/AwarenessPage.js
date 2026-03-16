"use client";

import { useState, useEffect, useCallback } from "react";
import { Activity, Shield, FlaskConical, BookOpen } from "lucide-react";
import UVChoroplethPanel from "./awareness/UVChoroplethPanel";
import ComparisonBar from "./awareness/ComparisonBar";
import RiskGauge from "./awareness/RiskGauge";
import DoseResponseChart from "./awareness/DoseResponseChart";
import SkinFilterHeatmap from "./awareness/SkinFilterHeatmap";
import SkinLabPanel from "./awareness/SkinLabPanel";
import BlogPanel from "./awareness/BlogPanel";
import { uvAtHour } from "./awareness/data";

const TABS = [
  { key: "uv",     label: "UV Risk Map",   icon: Activity     },
  { key: "roi",    label: "Sunscreen ROI", icon: Shield       },
  { key: "skinlab",label: "Skin Lab",      icon: FlaskConical },
  { key: "blog",   label: "Resources",     icon: BookOpen     },
];

const AU_PEAK_UVI = 12; // Representative AU summer peak used by RiskGauge

export default function AwarenessPage() {
  const [activeTab, setActiveTab] = useState("uv");
  const [hourSlider, setHourSlider] = useState(12);
  const [skinCancerMode, setSkinCancerMode] = useState(false);
  const [benchmarkData, setBenchmarkData] = useState(null);
  const [benchmarkLoading, setBenchmarkLoading] = useState(true);

  // Fetch live benchmark data from our proxy
  const fetchBenchmarks = useCallback(async () => {
    try {
      const res = await fetch("/api/uv-benchmark");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBenchmarkData(data.cities);
    } catch {
      setBenchmarkData(null);
    } finally {
      setBenchmarkLoading(false);
    }
  }, []);

  useEffect(() => { fetchBenchmarks(); }, [fetchBenchmarks]);

  const currentUVI = uvAtHour(AU_PEAK_UVI, hourSlider);
  const sydneyUVI = benchmarkData?.find((c) => c.name === "Sydney")?.peakUVI ?? AU_PEAK_UVI;

  return (
    <div style={{ padding: "20px 16px 48px", maxWidth: 900, margin: "0 auto" }}>

      {/* ─── Header ──────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "var(--fg, #111)", margin: 0 }}>
          UV Awareness
        </h1>
        <p style={{ fontSize: 13, color: "var(--fg-3, #9ca3af)", marginTop: 4, fontWeight: 500 }}>
          Data-driven insights on Australia&apos;s UV risk — powered by real-time global comparisons.
        </p>
      </div>

      {/* ─── Tab Switcher ─────────────────────────────── */}
      <div style={{
        display: "flex", gap: 6, marginBottom: 24,
        background: "var(--bg-3, #f3f4f6)", borderRadius: 16, padding: 6,
      }}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "10px 16px", borderRadius: 12, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 700,
              background: activeTab === key ? "var(--bg-2, #fff)" : "transparent",
              color: activeTab === key ? "var(--fg, #111)" : "var(--fg-3, #9ca3af)",
              boxShadow: activeTab === key ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.2s",
            }}
          >
            <Icon size={16} strokeWidth={2.5} />
            {label}
          </button>
        ))}
      </div>

      {/* ─── DASHBOARD 1: UV Choropleth ───────────────── */}
      {activeTab === "uv" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Time Slider */}
          <div style={{ background: "var(--bg-2, #fff)", borderRadius: 20, padding: "20px 24px", border: "1px solid var(--border, rgba(0,0,0,0.08))", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "var(--fg)" }}>TIME OF DAY — {String(Math.floor(hourSlider)).padStart(2, "0")}:{hourSlider % 1 >= 0.5 ? "30" : "00"}</div>
                <div style={{ fontSize: 11, color: "var(--fg-3)", fontWeight: 500, marginTop: 2 }}>
                  UVI now: <strong style={{ color: currentUVI >= 8 ? "#dc2626" : currentUVI >= 3 ? "#f97316" : "#16a34a" }}>{currentUVI.toFixed(1)}</strong>
                </div>
              </div>
              <button
                onClick={() => setSkinCancerMode((prev) => !prev)}
                style={{
                  padding: "7px 14px", borderRadius: 10, border: "1.5px solid var(--border)",
                  background: skinCancerMode ? "#fef2f2" : "var(--bg-3)",
                  color: skinCancerMode ? "#dc2626" : "var(--fg-3)",
                  font: "700 11px/1 inherit", cursor: "pointer",
                }}
              >
                {skinCancerMode ? "🎯 Cancer Mode" : "☀️ UV Mode"}
              </button>
            </div>
            <input
              type="range" min={6} max={18} step={0.5} value={hourSlider}
              onChange={(e) => setHourSlider(parseFloat(e.target.value))}
              style={{ width: "100%", accentColor: "#7c3aed" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--fg-3)", marginTop: 4, fontWeight: 600 }}>
              <span>06:00</span><span>09:00</span><span>12:00 ☀️</span><span>15:00</span><span>18:00</span>
            </div>
          </div>

          {/* Map + Gauge side by side */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 20, alignItems: "start" }}>
            <div style={{ background: "var(--bg-2, #fff)", borderRadius: 20, padding: 20, border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--fg-3)", marginBottom: 12, letterSpacing: "0.05em" }}>AUSTRALIA UV RISK MAP</div>
              <UVChoroplethPanel hourSlider={hourSlider} skinCancerMode={skinCancerMode} />
            </div>

            <div style={{ background: "var(--bg-2, #fff)", borderRadius: 20, padding: 20, border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", width: 220 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--fg-3)", marginBottom: 12, letterSpacing: "0.05em" }}>BURN TIME CALCULATOR</div>
              <RiskGauge hourSlider={hourSlider} peakUVI={sydneyUVI} />
            </div>
          </div>

          {/* Benchmarking chart */}
          <div style={{ background: "var(--bg-2, #fff)", borderRadius: 20, padding: 20, border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--fg-3)", marginBottom: 4, letterSpacing: "0.05em" }}>GLOBAL UV BENCHMARK — TODAY&apos;S PEAK</div>
            <div style={{ fontSize: 11, color: "var(--fg-3)", marginBottom: 16, fontWeight: 500 }}>Live data from Open-Meteo (CAMS radiation model)</div>
            <ComparisonBar benchmarkData={benchmarkData} sydneyUVI={sydneyUVI} loading={benchmarkLoading} />
          </div>
        </div>
      )}

      {/* ─── DASHBOARD 2: Sun-Safety ROI ──────────────── */}
      {activeTab === "roi" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Dose-Response Chart */}
          <div style={{ background: "var(--bg-2, #fff)", borderRadius: 20, padding: 20, border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--fg-3)", marginBottom: 4, letterSpacing: "0.05em" }}>LIFETIME CANCER RISK vs. SUNSCREEN USE</div>
            <div style={{ fontSize: 11, color: "var(--fg-3)", marginBottom: 16, fontWeight: 500 }}>Cumulative UV dose (SED) → keratinocyte cancer probability</div>
            <DoseResponseChart />
          </div>

          {/* SPF Heatmap */}
          <div style={{ background: "var(--bg-2, #fff)", borderRadius: 20, padding: 20, border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--fg-3)", marginBottom: 4, letterSpacing: "0.05em" }}>SPF APPLICATION THICKNESS — REAL PROTECTION</div>
            <div style={{ fontSize: 11, color: "var(--fg-3)", marginBottom: 16, fontWeight: 500 }}>How under-application destroys your SPF 50&apos;s effectiveness</div>
            <SkinFilterHeatmap />
          </div>

          {/* Cancer Incidence Map */}
          <div style={{ background: "var(--bg-2, #fff)", borderRadius: 20, padding: 20, border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--fg-3)", marginBottom: 4, letterSpacing: "0.05em" }}>SKIN CANCER INCIDENCE BY STATE</div>
            <div style={{ fontSize: 11, color: "var(--fg-3)", marginBottom: 16, fontWeight: 500 }}>AIHW data — cases per 100k population</div>
            <UVChoroplethPanel hourSlider={12} skinCancerMode={true} />

            {/* State comparison table */}
            <div style={{ marginTop: 16, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ color: "var(--fg-3)", fontWeight: 700, fontSize: 10 }}>
                    {["State", "Incidence/100k", "Common Cancer", "Economic Burden"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "6px 10px", borderBottom: "1.5px solid var(--border)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { state: "QLD / NT", inc: "60–89", cancer: "SCC (cumulative damage)", burden: "$1B+ annually" },
                    { state: "WA / SA / NSW", inc: "68–78", cancer: "SCC / BCC mixed", burden: "High" },
                    { state: "VIC / TAS", inc: "55–58", cancer: "BCC (intermittent)", burden: "Moderate" },
                  ].map((row) => (
                    <tr key={row.state}>
                      <td style={{ padding: "8px 10px", fontWeight: 700 }}>{row.state}</td>
                      <td style={{ padding: "8px 10px" }}>{row.inc}</td>
                      <td style={{ padding: "8px 10px" }}>{row.cancer}</td>
                      <td style={{ padding: "8px 10px", color: "#dc2626", fontWeight: 700 }}>{row.burden}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {/* ─── DASHBOARD 3: Skin Lab ─────────────────────────── */}
      {activeTab === "skinlab" && (
        <div style={{ background: "var(--bg-2, #fff)", borderRadius: 20, padding: 20, border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "var(--fg-3)", marginBottom: 4, letterSpacing: "0.05em" }}>SKIN TYPE ANALYSIS — ML MODEL</div>
          <div style={{ fontSize: 11, color: "var(--fg-3)", marginBottom: 16, fontWeight: 500 }}>Upload a photo to identify your Fitzpatrick type and personalise your UV risk</div>
          <SkinLabPanel />
        </div>
      )}

      {/* ─── DASHBOARD 4: Blog/Resources ──────────────────── */}
      {activeTab === "blog" && (
        <div style={{ background: "var(--bg-2, #fff)", borderRadius: 20, padding: 20, border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "var(--fg-3)", marginBottom: 4, letterSpacing: "0.05em" }}>SUN-SAFETY RESOURCES</div>
          <div style={{ fontSize: 11, color: "var(--fg-3)", marginBottom: 16, fontWeight: 500 }}>Curated articles from Cancer Council AU, WHO, AIHW, ARPANSA and more</div>
          <BlogPanel />
        </div>
      )}
    </div>
  );
}
