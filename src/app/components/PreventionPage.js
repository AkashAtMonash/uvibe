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

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          padding: "20px 20px 0",
          borderBottom: "1px solid var(--border)",
          background: "color-mix(in srgb, var(--bg) 85%, transparent)",
          backdropFilter: "blur(20px)",
          flexShrink: 0,
          position: "relative",
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: -0.6,
                color: "var(--fg)",
                marginBottom: 3,
              }}
            >
              Prevention
            </div>
            <div
              style={{
                fontSize: 11,
                fontFamily: "var(--font-mono)",
                color: "var(--fg-3)",
              }}
            >
              {city ?? "Melbourne"} · UV {loading ? "—" : uv.toFixed(1)} ·{" "}
              <span style={{ color: lv.color }}>{lv.name}</span>
            </div>
          </div>
          <div
            style={{
              padding: "8px 14px",
              borderRadius: "var(--r-sm)",
              background: lv.dim,
              border: `1px solid ${lv.color}50`,
              fontSize: 15,
              fontWeight: 800,
              fontFamily: "var(--font-mono)",
              color: lv.color,
              flexShrink: 0,
              transition: "all 0.6s",
            }}
          >
            UV {loading ? "·" : uv.toFixed(1)}
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 0,
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
        >
          {PREV_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTab(tab.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "11px 18px",
                fontSize: 13,
                fontWeight: activeTab === tab.id ? 700 : 500,
                fontFamily: "var(--font-display)",
                color: activeTab === tab.id ? lv.color : "var(--fg-3)",
                background: "transparent",
                border: "none",
                borderBottom: `2px solid ${activeTab === tab.id ? lv.color : "transparent"}`,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s",
                flexShrink: 0,
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "18px 18px 100px",
        }}
      >
        {activeTab === "sunscreen" && (
          <SunscreenTab lv={lv} uv={uv} prefs={prefs} />
        )}
        {activeTab === "reminder" && <ReminderTab lv={lv} uv={uv} />}
        {activeTab === "clothing" && <ClothingTab lv={lv} uv={uv} />}
        {activeTab === "guide" && <GuideTab lv={lv} />}
      </div>
    </div>
  );
}
