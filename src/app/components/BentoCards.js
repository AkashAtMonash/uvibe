"use client";
/**
 * Bento Card System — UVibe Smart Dashboard Components:
 *   - BentoGrid: Responsive CSS grid wrapper
 *   - UVGauge:   Large pulsating circular UV index gauge
 *   - MetricCard: Generic stat card with icon and value
 *   - ContextWarningCard: High-visibility alert card
 *   - HeatStressCard: WBGT display
 *   - SweatLossCard: mL/hr display
 *   - TimeToBurnCard: Skin-type aware burn time
 */

import { useEffect, useState } from "react";
import {
  Thermometer, Droplets, Clock, MapPin, AlertTriangle,
  Sun, Wind, Zap, Info, CheckCircle2,
} from "lucide-react";

// ─── UV Level Meta ─────────────────────────────────────────────────────────────
const UV_LEVELS = [
  { max: 2,  label: "Low",       bg: "#E8F5E9", gradient: "135deg, #A5D6A7, #E8F5E9",     text: "#2E7D32", glow: "rgba(76,175,80,0.25)"   },
  { max: 5,  label: "Moderate",  bg: "#FFF9C4", gradient: "135deg, #FFF176, #FFF9C4",     text: "#F57F17", glow: "rgba(255,235,59,0.30)"  },
  { max: 7,  label: "High",      bg: "#FFE0B2", gradient: "135deg, #FFCC80, #FFE0B2",     text: "#E65100", glow: "rgba(255,152,0,0.35)"   },
  { max: 10, label: "Very High", bg: "#FFCCBC", gradient: "135deg, #FF8A65, #FFCCBC",     text: "#BF360C", glow: "rgba(244,81,30,0.40)"   },
  { max: 99, label: "Extreme",   bg: "#EDE7F6", gradient: "135deg, #CE93D8, #EDE7F6",     text: "#4A148C", glow: "rgba(156,39,176,0.45)"  },
];

export function uvMeta(uv) {
  return UV_LEVELS.find((l) => uv <= l.max) || UV_LEVELS.at(-1);
}

// ─── BentoGrid ────────────────────────────────────────────────────────────────

export function BentoGrid({ children }) {
  return (
    <div style={{
      display: "grid",
      gap: 14,
      gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    }}>
      {children}
    </div>
  );
}

// ─── UV Pulsating Gauge ───────────────────────────────────────────────────────

export function UVGauge({ uv = 0, uvColor, size = 200, cleanMode = false }) {
  const meta = uvMeta(uv);
  const r = (size - 24) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(uv / 13, 1);

  return (
    <div style={{
      position: "relative",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: cleanMode ? 0 : "28px 20px 22px",
      borderRadius: cleanMode ? "50%" : "var(--r-xl)",
      background: cleanMode ? "transparent" : `linear-gradient(${meta.gradient})`,
      overflow: "visible",
      boxShadow: cleanMode ? "none" : `0 16px 48px ${meta.glow}`,
    }}>
      {/* Background pattern overlay */}
      {!cleanMode && (
        <div style={{
          position: "absolute", inset: 0, opacity: 0.04,
          backgroundImage: "radial-gradient(circle, #000 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }} />
      )}

      {/* Pulsating ring */}
      <div style={{
        position: "absolute",
        width: size + 40,
        height: size + 40,
        borderRadius: "50%",
        border: `2px solid ${meta.text}22`,
        animation: "breathe 3s ease-in-out infinite",
      }} />

      {/* SVG Ring */}
      <svg
        width={size}
        height={size}
        style={{ transform: "rotate(-90deg)", zIndex: 1 }}
      >
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={`${meta.text}18`}
          strokeWidth={16}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={meta.text}
          strokeWidth={16}
          strokeLinecap="round"
          strokeDasharray={`${circ * pct} ${circ}`}
          style={{
            transition: "stroke-dasharray 1.4s cubic-bezier(0.4,0,0.2,1)",
            filter: `drop-shadow(0 0 10px ${meta.glow})`,
          }}
        />
      </svg>

      {/* UV Number */}
      <div style={{
        position: "absolute",
        textAlign: "center",
        zIndex: 2,
      }}>
        <div style={{
          fontSize: 64,
          fontWeight: 900,
          color: meta.text,
          lineHeight: 1,
          letterSpacing: -4,
        }}>
          {uv.toFixed(1)}
        </div>
        <div style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 3,
          color: meta.text,
          textTransform: "uppercase",
          fontFamily: "var(--mono)",
          marginTop: 2,
          opacity: 0.85,
        }}>
          {meta.label}
        </div>
      </div>
    </div>
  );
}

// ─── Metric Card (location, burn time, etc) ───────────────────────────────────

export function MetricCard({ icon, label, value, sub, accent, wide = false, style = {} }) {
  return (
    <div
      className="bento-card card"
      style={{
        gridColumn: wide ? "span 2" : "span 1",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: "18px 20px",
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: "var(--r-sm)",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: accent ? `${accent}18` : "var(--surface-hover)",
          color: accent || "var(--uv-color)",
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "var(--mono)" }}>
          {label}
        </span>
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 900, color: "var(--text-1)", letterSpacing: -1, lineHeight: 1 }}>
          {value}
        </div>
        {sub && <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 4, lineHeight: 1.5 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─── Context Warning Card ─────────────────────────────────────────────────────

export function ContextWarningCard({ uv, timeToBurn, skinType = 2 }) {
  if (uv < 3) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "16px 20px", borderRadius: "var(--r-lg)",
        background: "#E8F5E9", border: "1px solid #A5D6A7",
      }}>
        <CheckCircle2 size={22} style={{ color: "#2E7D32", flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 700, color: "#2E7D32", fontSize: 14 }}>UV is Low — Safe Conditions</div>
          <div style={{ fontSize: 12, color: "#388E3C", marginTop: 2 }}>No sunscreen required for short exposures today.</div>
        </div>
      </div>
    );
  }
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "16px 20px", borderRadius: "var(--r-lg)",
      background: "#FFF3E0", border: "1px solid #FFCC80",
    }}>
      <AlertTriangle size={22} style={{ color: "#E65100", flexShrink: 0 }} />
      <div>
        <div style={{ fontWeight: 700, color: "#E65100", fontSize: 14 }}>
          {timeToBurn != null
            ? `Bare skin may burn in ~${timeToBurn} min — apply SPF 30+ now.`
            : "High UV — protect your skin."}
        </div>
        <div style={{ fontSize: 12, color: "#EF6C00", marginTop: 2 }}>
          Based on Fitzpatrick Type {skinType}. Seek shade during peak hours (10am–2pm).
        </div>
      </div>
    </div>
  );
}

// ─── Info Modal ───────────────────────────────────────────────────────────────

export function UVInfoModal({ onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 999,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.3)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card slide-up"
        style={{ width: 380, maxWidth: "90vw", padding: 28 }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Info size={18} style={{ color: "var(--uv-color)" }} />
            <span style={{ fontWeight: 800, fontSize: 16, color: "var(--text-1)" }}>About UV Index</span>
          </div>
          <button onClick={onClose} style={{ color: "var(--text-3)" }}>✕</button>
        </div>
        {[
          { title: "What is the UV Index?", body: "A measurement of the UV radiation level at the Earth's surface. Developed by WHO to help people protect themselves from UV overexposure." },
          { title: "SPF Calculation", body: "SPF 15 blocks ~93% of UVB. SPF 30 blocks ~97%. SPF 50 blocks ~98%. No sunscreen blocks 100%. Reapply every 2 hours." },
          { title: "Fitzpatrick Scale", body: "Describes skin's reaction to UV. Type I (very fair, always burns) → Type VI (dark, rarely burns). Used to calculate your personal burn time." },
        ].map((s) => (
          <div key={s.title} style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-1)", marginBottom: 4 }}>{s.title}</div>
            <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.7 }}>{s.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
