"use client";
// src/components/UVInfoBanner.js

import { useState, useEffect } from "react";

const INFO_ITEMS = [
  {
    icon: "☀️",
    title: "What is the UV Index?",
    body: "The UV Index is a measure of ultraviolet radiation intensity from the sun. It ranges from 0 (no risk) to 11+ (extreme). Australia consistently records some of the highest UV levels on Earth.",
  },
  {
    icon: "🇦🇺",
    title: "Why UV is Dangerous in Australia",
    body: "Australia has the world's highest rate of skin cancer. The ozone layer is thinner over the southern hemisphere, and the Earth is closest to the sun during Australian summer. Two in three Australians will be diagnosed with skin cancer by age 70.",
  },
  {
    icon: "📊",
    title: "How to Read the UV Scale",
    body: "UV 0–2 is Low (safe). UV 3–5 is Moderate (wear SPF). UV 6–7 is High (SPF 50+ essential). UV 8–10 is Very High (avoid peak hours). UV 11+ is Extreme — permanent skin damage can occur in under 10 minutes.",
  },
  {
    icon: "🧴",
    title: "What SPF Means",
    body: "SPF (Sun Protection Factor) measures how much UV radiation a sunscreen blocks. SPF 30 blocks 97%, SPF 50 blocks 98%. In Australia, dermatologists recommend SPF 50+ applied 20 minutes before going outside, reapplied every 2 hours.",
  },
];

export default function UVInfoBanner({ uvColor, uvDim, onCheckUV }) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const seen = localStorage.getItem("uvibe_info_seen");
    if (seen) setCollapsed(true);
  }, []);

  const handleDismiss = () => {
    setCollapsed(true);
    localStorage.setItem("uvibe_info_seen", "1");
  };

  if (!mounted) return null;

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          padding: "10px 16px",
          borderRadius: 12,
          marginBottom: 14,
          background: uvDim,
          border: `1px solid ${uvColor}30`,
          color: uvColor,
          fontSize: 12,
          fontWeight: 700,
          fontFamily: "var(--mono)",
          letterSpacing: 0.5,
          cursor: "pointer",
          transition: "all 0.2s",
        }}
        aria-label="Show UV information"
      >
        <span>☀️</span>
        <span>What is UV? Learn the basics</span>
        <span style={{ marginLeft: "auto", opacity: 0.6 }}>▾</span>
      </button>
    );
  }

  return (
    <div className="info-banner fade-up" style={{ marginBottom: 14 }}>
      <div className="info-banner-head" style={{ borderColor: `${uvColor}25` }}>
        <div className="info-banner-title" style={{ color: uvColor }}>
          <span>☀️</span> UV Safety Basics
        </div>
        <button
          className="info-dismiss"
          onClick={handleDismiss}
          aria-label="Dismiss UV info banner"
          style={{ color: "var(--text-3)" }}
        >
          ✕ Got it
        </button>
      </div>

      <div className="info-tabs">
        {INFO_ITEMS.map((item, i) => (
          <button
            key={i}
            className={`info-tab ${activeIdx === i ? "on" : ""}`}
            style={
              activeIdx === i
                ? {
                    background: uvDim,
                    borderColor: `${uvColor}50`,
                    color: uvColor,
                  }
                : {}
            }
            onClick={() => setActiveIdx(i)}
            aria-pressed={activeIdx === i}
          >
            <span>{item.icon}</span>
            <span>{item.title.split(" ").slice(0, 3).join(" ")}</span>
          </button>
        ))}
      </div>

      <div className="info-body">
        <div className="info-body-title">{INFO_ITEMS[activeIdx].title}</div>
        <div className="info-body-text">{INFO_ITEMS[activeIdx].body}</div>
      </div>

      <button
        className="info-cta"
        onClick={onCheckUV}
        style={{
          background: `linear-gradient(135deg, ${uvColor}, ${uvColor}bb)`,
          boxShadow: `0 6px 24px ${uvColor}33`,
        }}
        aria-label="Scroll to current UV reading"
      >
        Check My UV Now →
      </button>
    </div>
  );
}
