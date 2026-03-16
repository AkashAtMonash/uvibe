"use client";

import { useState, useEffect } from "react";
import { CITIES, getLevel, simulateUV } from "@/utils/uv";
import { PREV_TABS } from "./prevention/constants";
import SunscreenTab from "./prevention/SunscreenTab";
import ReminderTab from "./prevention/ReminderTab";
import ClothingTab from "./prevention/ClothingTab";
import GuideTab from "./prevention/GuideTab";

const TAB_KEY = "uvibe_prev_tab";

export default function PreventionPage({ city, uv: parentUv, prefs }) {
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined")
      return localStorage.getItem(TAB_KEY) ?? "sunscreen";
    return "sunscreen";
  });
  const [uv, setUv] = useState(parentUv ?? 0);
  const [loading, setLoading] = useState(
    parentUv === undefined || parentUv === null,
  );

  useEffect(() => {
    if (parentUv !== undefined && parentUv !== null && parentUv > 0) {
      setUv(parentUv);
      setLoading(false);
      return;
    }
    const fetchUV = async () => {
      setLoading(true);
      try {
        const arpansa = CITIES[city]?.arpansa ?? "Melbourne";
        const res = await fetch(`/api/uv?city=${encodeURIComponent(arpansa)}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setUv(parseFloat(data.uv));
      } catch {
        setUv(simulateUV(city ?? "Melbourne"));
      }
      setLoading(false);
    };
    fetchUV();
  }, [city, parentUv]);

  useEffect(() => {
    if (parentUv !== undefined && parentUv !== null) setUv(parentUv);
  }, [parentUv]);

  const handleTab = (id) => {
    setActiveTab(id);
    localStorage.setItem(TAB_KEY, id);
  };

  const lv = getLevel(uv);

  const TAB_ICONS = {
    sunscreen: "🧴",
    reminder: "⏰",
    clothing: "👕",
    guide: "📋",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* ── Hero Header ── */}
      <div
        style={{
          padding: "20px 20px 0",
          borderBottom: "1px solid var(--border, rgba(0,0,0,0.08))",
          background: `linear-gradient(135deg, ${lv.dim || "rgba(245,158,11,0.06)"} 0%, var(--bg, #f8f9fa) 100%)`,
          backdropFilter: "blur(20px)",
          flexShrink: 0,
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Title row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.6, color: "var(--fg, #111)", marginBottom: 3 }}>
              Prevention
            </div>
            <div style={{ fontSize: 11, fontFamily: "monospace", color: "var(--fg-3, #9ca3af)" }}>
              {city ?? "Melbourne"} · UV {loading ? "…" : uv.toFixed(1)} ·{" "}
              <span style={{ color: lv.color, fontWeight: 700 }}>{lv.name}</span>
            </div>
          </div>

          {/* UV badge */}
          <div
            style={{
              padding: "10px 16px",
              borderRadius: 14,
              background: lv.dim || "rgba(245,158,11,0.1)",
              border: `1.5px solid ${lv.color}50`,
              fontSize: 18,
              fontWeight: 900,
              fontFamily: "monospace",
              color: lv.color,
              minWidth: 64,
              textAlign: "center",
              boxShadow: `0 4px 16px ${lv.color}20`,
              transition: "all 0.6s",
            }}
          >
            {loading ? "…" : uv.toFixed(1)}
            <div style={{ fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, opacity: 0.7, marginTop: 1 }}>
              {lv.name}
            </div>
          </div>
        </div>

        {/* Tab bar — pill style */}
        <div style={{ display: "flex", gap: 4, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 0 }}>
          {PREV_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTab(tab.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "9px 16px",
                  fontSize: 13,
                  fontWeight: isActive ? 800 : 500,
                  color: isActive ? lv.color : "var(--fg-3, #9ca3af)",
                  background: isActive ? `${lv.color}15` : "transparent",
                  border: "none",
                  borderBottom: `2.5px solid ${isActive ? lv.color : "transparent"}`,
                  borderRadius: "10px 10px 0 0",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s",
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 15 }}>{TAB_ICONS[tab.id]}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "18px 18px 100px",
          scrollbarWidth: "none",
        }}
      >
        {activeTab === "sunscreen" && <SunscreenTab lv={lv} uv={uv} prefs={prefs} />}
        {activeTab === "reminder"  && <ReminderTab  lv={lv} uv={uv} />}
        {activeTab === "clothing"  && <ClothingTab  lv={lv} uv={uv} />}
        {activeTab === "guide"     && <GuideTab lv={lv} />}
      </div>
    </div>
  );
}
