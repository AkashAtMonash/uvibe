"use client";

import { useState } from "react";
import CancerAwarenessViz from "./awareness/CancerAwarenessViz";
import SafeHoursViz from "./awareness/SafeHoursViz";
import GlobalUVRankViz from "./awareness/GlobalUVRankViz";
import SkinLabPanel from "./awareness/SkinLabPanel";
import BlogPanel from "./awareness/BlogPanel";

const TABS = [
  { key: "viz", label: "Visualizations" },
  { key: "skinlab", label: "Skin Lab" },
  { key: "blog", label: "Resources" },
];

const VIZ_SECTIONS = [
  {
    id: "cancer",
    title: "Skin Cancer: Australia vs the World",
    subtitle: "Why Australia has the world's highest melanoma rate — by state & globally",
    tag: "AIHW / WHO 2023",
    tagColor: "#ef4444",
    Component: CancerAwarenessViz,
  },
  {
    id: "safehours",
    title: "Safe Hours Clock",
    subtitle: "How many safe daylight hours do you actually have? Pick your city & season",
    tag: "Open-Meteo UV Data",
    tagColor: "#22c55e",
    Component: SafeHoursViz,
  },
  {
    id: "globalrank",
    title: "Global UV League Table",
    subtitle: "Where Australian cities rank against the world — the answer might surprise you",
    tag: "NASA POWER / Open-Meteo",
    tagColor: "#3b82f6",
    Component: GlobalUVRankViz,
  },
];

export default function AwarenessPage() {
  const [activeTab, setActiveTab] = useState("viz");
  const [expandedViz, setExpandedViz] = useState(null);

  return (
    <div style={{ padding: "20px 16px 48px", maxWidth: 900, margin: "0 auto" }}>

      {/* ─── Header ──────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "var(--fg, #111)", margin: 0 }}>
          UV Awareness
        </h1>
        <p style={{ fontSize: 13, color: "var(--fg-3, #9ca3af)", marginTop: 4, fontWeight: 500 }}>
          Data-driven visualizations to help Australians understand UV risk, skin cancer, and sun protection.
        </p>
      </div>

      {/* ─── Tab Switcher ─────────────────────────────── */}
      <div style={{
        display: "flex", gap: 6, marginBottom: 24,
        background: "var(--bg-3, #f3f4f6)", borderRadius: 16, padding: 6,
      }}>
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "10px 14px", borderRadius: 12, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 700,
              background: activeTab === key ? "var(--bg-2, #fff)" : "transparent",
              color: activeTab === key ? "var(--fg, #111)" : "var(--fg-3, #9ca3af)",
              boxShadow: activeTab === key ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.2s",
            }}
          >
            <span style={{ display: "inline" }}>{label}</span>
          </button>
        ))}
      </div>

      {/* ─── VISUALIZATIONS TAB ───────────────── */}
      {activeTab === "viz" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Intro strip */}
          <div style={{
            padding: "14px 18px", borderRadius: 16,
            background: "linear-gradient(135deg, rgba(124,58,237,0.10), rgba(59,130,246,0.07))",
            border: "1.5px solid rgba(124,58,237,0.2)",
            display: "flex", gap: 12, alignItems: "center",
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--fg)", marginBottom: 2 }}>
                Data stories every Australian should know
              </div>
              <div style={{ fontSize: 11, color: "var(--fg-3)", fontWeight: 500 }}>
                All charts use open public data (BOM, AIHW, WHO, NASA POWER, Open-Meteo). Tap any section to explore.
              </div>
            </div>
          </div>

          {/* Visualization sections */}
          {VIZ_SECTIONS.map(({ id, title, subtitle, tag, tagColor, Component }) => {
            const isExpanded = expandedViz === id;
            return (
              <div
                key={id}
                style={{
                  background: "var(--bg-2, #fff)",
                  borderRadius: 20,
                  border: "1px solid var(--border, rgba(0,0,0,0.08))",
                  boxShadow: isExpanded ? "0 4px 24px rgba(0,0,0,0.10)" : "0 2px 12px rgba(0,0,0,0.06)",
                  overflow: "hidden",
                  transition: "box-shadow 0.2s",
                }}
              >
                {/* Section header — always visible, tap to expand */}
                <button
                  onClick={() => setExpandedViz(isExpanded ? null : id)}
                  style={{
                    width: "100%", padding: "18px 20px", display: "flex", gap: 14,
                    alignItems: "center", background: "none", border: "none", cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 14, fontWeight: 800, color: "var(--fg)",
                      marginBottom: 3, lineHeight: 1.3,
                    }}>
                      {title}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--fg-3)", fontWeight: 500 }}>
                      {subtitle}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                    <span style={{
                      fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 8,
                      background: `${tagColor}18`, color: tagColor,
                      border: `1px solid ${tagColor}30`, whiteSpace: "nowrap",
                    }}>
                      {tag}
                    </span>
                    <span style={{
                      fontSize: 18, color: "var(--fg-3)",
                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.25s",
                    }}>
                      ↓
                    </span>
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div
                    style={{ padding: "4px 20px 22px", borderTop: "1px solid var(--border)" }}
                  >
                    <Component />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── SKIN LAB TAB ─────────────────────────── */}
      {activeTab === "skinlab" && (
        <div style={{ background: "var(--bg-2, #fff)", borderRadius: 20, padding: 20, border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "var(--fg-3)", marginBottom: 4, letterSpacing: "0.05em" }}>SKIN TYPE ANALYSIS — ML MODEL</div>
          <div style={{ fontSize: 11, color: "var(--fg-3)", marginBottom: 16, fontWeight: 500 }}>Upload a photo to identify your Fitzpatrick type and personalise your UV risk</div>
          <SkinLabPanel />
        </div>
      )}

      {/* ─── BLOG/RESOURCES TAB ──────────────────────── */}
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
