"use client";
/**
 * SmartSuggestions — personalised recommendations based on UV + heat stress + sweat loss.
 * HourlyForecastChart — animated bar chart for hourly UV.
 * UserProfileForm — collects age + weight for personalised sweat loss.
 * UVInfoDrawer — full-screen info panel (risk scale + explanations) with close button.
 */

import { useState } from "react";
import { X, Droplets, Sun, Shield, Zap, User, ChevronRight, Info } from "lucide-react";

// ─── UV Risk Scale Data ────────────────────────────────────────────────────────
export const UV_RISK_LEVELS = [
  { label: "Low",       min: 0,  max: 2.9,  color: "#4CAF50", bg: "#E8F5E9", tip: "No protection needed for most. Great time to be outdoors." },
  { label: "Moderate",  min: 3,  max: 5.9,  color: "#FFC107", bg: "#FFF9C4", tip: "Seek shade during midday. Wear a hat and SPF 30+." },
  { label: "High",      min: 6,  max: 7.9,  color: "#FF9800", bg: "#FFF3E0", tip: "Reduce time in sun 10am–4pm. Shirt, SPF 30+, hat essential." },
  { label: "Very High", min: 8,  max: 10.9, color: "#F44336", bg: "#FFEBEE", tip: "Extra protection required. Avoid midday sun. Check UV before going out." },
  { label: "Extreme",   min: 11, max: 99,   color: "#9C27B0", bg: "#F3E5F5", tip: "Unprotected skin burns in minutes. Stay indoors if possible." },
];

export function uvRiskLevel(uv) {
  return UV_RISK_LEVELS.find((l) => uv >= l.min && uv <= l.max) || UV_RISK_LEVELS[0];
}

// ─── UV Info Drawer ────────────────────────────────────────────────────────────

export function UVInfoDrawer({ uv = 0, onClose }) {
  const active = uvRiskLevel(uv);
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 999,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        background: "rgba(0,0,0,0.35)", backdropFilter: "blur(12px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="slide-up"
        style={{
          width: "100%", maxWidth: 540, maxHeight: "88vh", overflowY: "auto",
          background: "var(--bg-2)", borderRadius: "28px 28px 0 0",
          padding: "0 0 40px", boxShadow: "0 -12px 60px rgba(0,0,0,0.14)",
        }}
      >
        {/* Handle + Header */}
        <div style={{ padding: "16px 22px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "var(--bg-2)", zIndex: 2, borderBottom: "1px solid var(--surface-border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Info size={18} style={{ color: "var(--uv-color)" }} />
            <span style={{ fontWeight: 800, fontSize: 17, color: "var(--text-1)" }}>UV Index Guide</span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 34, height: 34, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "var(--surface-hover)", border: "1.5px solid var(--surface-border)",
              cursor: "pointer", color: "var(--text-2)",
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: "20px 22px" }}>
          {/* Risk Scale */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-3)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Risk Scale</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {UV_RISK_LEVELS.map((lvl) => {
                const isActive = uv >= lvl.min && uv <= lvl.max;
                return (
                  <div
                    key={lvl.label}
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "12px 16px", borderRadius: 14,
                      background: isActive ? lvl.bg : "var(--surface)",
                      border: `1.5px solid ${isActive ? lvl.color + "55" : "var(--surface-border)"}`,
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: lvl.color, flexShrink: 0, boxShadow: isActive ? `0 0 10px ${lvl.color}` : "none" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontWeight: 800, color: lvl.color, fontSize: 14 }}>{lvl.label}</span>
                        <span style={{ fontSize: 10, fontFamily: "var(--mono)", color: "var(--text-3)" }}>{lvl.min}–{lvl.max === 99 ? "11+" : lvl.max}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2, lineHeight: 1.5 }}>{lvl.tip}</div>
                    </div>
                    {isActive && (
                      <div style={{ background: lvl.color, color: "#fff", padding: "3px 10px", borderRadius: 20, fontSize: 9, fontWeight: 800, letterSpacing: 1.5, flexShrink: 0 }}>NOW</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Explainers */}
          {[
            { icon: <Sun size={15} />, title: "What is UV Index?", body: "A scale measuring the strength of ultraviolet radiation reaching the Earth's surface. Developed by WHO and WMO to help you protect your skin and eyes." },
            { icon: <Shield size={15} />, title: "SPF & Sunscreen", body: "SPF 15 blocks 93% of UVB · SPF 30 blocks 97% · SPF 50 blocks 98%. Always reapply every 2 hours and after swimming or sweating." },
            { icon: <Zap size={15} />, title: "Fitzpatrick Scale", body: "Classifies skin's response to UV (Type I = very fair, always burns → Type VI = dark, rarely burns). Used to calculate your personal burn time in the app." },
          ].map((s) => (
            <div key={s.title} style={{ marginBottom: 18, padding: "16px 18px", background: "var(--surface)", borderRadius: 16, border: "1px solid var(--surface-border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, color: "var(--uv-color)", fontWeight: 800, fontSize: 13 }}>
                {s.icon} {s.title}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.8 }}>{s.body}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── User Profile Form ─────────────────────────────────────────────────────────

export function UserProfileForm({ profile, onChange }) {
  return (
    <div className="card" style={{ padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div style={{ width: 30, height: 30, borderRadius: 10, background: "var(--uv-dim)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--uv-color)" }}>
          <User size={15} />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 13, color: "var(--text-1)" }}>{profile.name ? profile.name : "Your Profile"}</div>
          <div style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "var(--mono)" }}>Personalises sweat loss &amp; burn time</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {[
          { key: "weightKg", label: "Weight", unit: "kg", min: 30, max: 200, step: 1 },
          { key: "ageYears", label: "Age", unit: "yrs", min: 10, max: 90, step: 1 },
          { key: "spf", label: "SPF", unit: "", min: 0, max: 100, step: 5 },
        ].map(({ key, label, unit, min, max, step }) => (
          <div key={key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: 1.2, fontFamily: "var(--mono)" }}>
              {label}
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                type="number"
                value={profile[key] ?? ""}
                min={min} max={max} step={step}
                onChange={(e) => onChange(key, Number(e.target.value))}
                style={{
                  width: "100%", padding: "9px 10px", borderRadius: 10,
                  border: "1.5px solid var(--surface-border)",
                  background: "var(--bg-2)", color: "var(--text-1)",
                  fontSize: 15, fontWeight: 700, outline: "none",
                  fontFamily: "var(--mono)",
                }}
              />
              {unit && <span style={{ fontSize: 11, color: "var(--text-3)", flexShrink: 0 }}>{unit}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}




// ─── Unified Suggestion Card ───────────────────────────────────────────────────

export function UnifiedSuggestionCard({ uv, burn, envData }) {
  if (uv == null && !envData?.wbgt_cels) return null;

  // 1. Immediate UV Warning & Visual Styling
  let statusBg = "rgba(34, 197, 94, 0.1)"; // Default Safe
  let statusBorder = "rgba(34, 197, 94, 0.25)";
  let statusIconColor = "#16a34a"; // Green
  let statusText = "UV is safe right now. No immediate sun protection needed.";
  let IconCmp = Shield;

  if (uv >= 8) {
    statusBg = "rgba(239, 68, 68, 0.1)"; // Light Red
    statusBorder = "rgba(239, 68, 68, 0.25)";
    statusIconColor = "#dc2626"; // Deep Red
    statusText = burn ? `Your skin will start damaging in ${burn.bare} minutes—find shade now.` : "Extreme UV risk—find shade now.";
    IconCmp = Zap;
  } else if (uv >= 3) {
    statusBg = "rgba(245, 158, 11, 0.1)"; // Pale Yellow/Orange
    statusBorder = "rgba(245, 158, 11, 0.25)";
    statusIconColor = "#d97706"; // Orange
    statusText = burn ? `Your skin will start damaging in ${burn.bare} minutes—find shade.` : "Moderate/High UV risk—protect yourself.";
    IconCmp = Zap;
  }

  // 2. Activity Logic & Thresholds
  const act = (maxWbgt, maxUv) => {
    const heatDanger = envData?.wbgt_cels >= maxWbgt;
    const uvDanger = uv >= maxUv;
    if (heatDanger) return { label: `Heat Risk (≥${maxWbgt}°C)`, color: "#dc2626" };
    if (uvDanger) return { label: `UV Risk (≥${maxUv})`, color: "#d97706" };
    return { label: "Good to go", color: "#16a34a" }; // Green
  };

  const activities = [
    { name: "🚶 Walking", ...act(31, 8) },
    { name: "🚴 Cycling", ...act(29, 9) },
    { name: "🏋️ Gym (Indoors)", label: "Always Safe", color: "#16a34a" }
  ];

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 20, padding: "20px 24px" }}>
      {/* Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, color: "var(--uv-color)" }}>
          <Zap size={18} strokeWidth={2.5} />
          <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text-1)", letterSpacing: -0.3 }}>Smart Action Plan</div>
        </div>
        <div style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--mono)", letterSpacing: 0.5 }}>
          Based on live UV & Heat Stress
        </div>
      </div>

      {/* Main UV Status Card */}
      <div style={{ 
        display: "flex", gap: 14, alignItems: "flex-start", 
        padding: "16px 18px", borderRadius: 16, 
        background: statusBg, border: `1px solid ${statusBorder}`
      }}>
         <div style={{ color: statusIconColor, display: "flex", marginTop: 2 }}>
           <IconCmp size={22} strokeWidth={2.5} />
         </div>
         <div style={{ fontSize: 14, color: statusIconColor, fontWeight: 700, lineHeight: 1.5, letterSpacing: -0.2 }}>
            {statusText}
         </div>
      </div>

      {/* Activity Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 4 }}>
        {activities.map(a => (
          <div key={a.name} style={{ 
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            textAlign: "center", gap: 8, padding: "14px 10px", 
            background: "var(--surface)", border: "1px solid var(--surface-border)", borderRadius: 14 
          }}>
             <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-1)" }}>{a.name}</div>
             <div style={{ color: a.color, fontSize: 10, fontWeight: 800, fontFamily: "var(--mono)", textTransform: "uppercase", background: `${a.color}15`, padding: "4px 8px", borderRadius: 6 }}>
                {a.label}
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Hydration Needs Card ───────────────────────────────────────────────────────

export function HydrationCard({ envData }) {
  const cups = envData?.sweat_loss_ml_hr ? Math.max(1, Math.round(envData.sweat_loss_ml_hr / 250)) : 1;
  const hydroText = envData?.heat_stress_warning
    ? `Drink ~${cups} cups of water/hr + Electrolytes`
    : `Keep sipping water (~${cups} cups/hr)`;

  return (
    <div className="card" style={{ padding: "20px 24px", display: "flex", flexDirection: "column", justifyContent: "center", height: "100%" }}>
       <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <Droplets size={18} color="#0288D1" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: 0.5 }}>Hydration Needs</div>
       </div>
       <div style={{ fontSize: 14, fontWeight: 700, color: "#0288D1", marginLeft: 30, lineHeight: 1.4 }}>{hydroText}</div>
    </div>
  );
}


// ─── SVG 24-Hour Area Chart ──────────────────────────────────────────────────

export function HourlyForecastChart({ forecast }) {
  if (!forecast || forecast.length === 0) return null;

  const W = 1000;   // SVG coordinate width
  const H = 120;    // chart height in SVG units
  const PAD_TOP = 20;
  const AXIS_H = 28;  // axis label area at bottom

  const maxUV = Math.max(...forecast.map(f => f.val), 6);
  const peakIdx = forecast.reduce((pi, f, i, a) => f.val > a[pi].val ? i : pi, 0);
  const peakUV = forecast[peakIdx].val;
  const peakLvl = UV_RISK_LEVELS.find(l => peakUV >= l.min && peakUV <= l.max) || UV_RISK_LEVELS[0];
  const nowIdx = forecast.findIndex(f => f.now);

  const pts = forecast.map((f, i) => ({
    x: (i / (forecast.length - 1)) * W,
    y: H - ((f.val / maxUV) * (H - PAD_TOP)),
    ...f,
  }));

  // Smooth bezier path
  const pathD = pts.reduce((acc, pt, i) => {
    if (i === 0) return `M${pt.x},${pt.y}`;
    const prev = pts[i - 1];
    const cx = prev.x + (pt.x - prev.x) / 2;
    return `${acc} C${cx},${prev.y} ${cx},${pt.y} ${pt.x},${pt.y}`;
  }, "");
  const areaD = `${pathD} L${W},${H} L0,${H} Z`;

  const nowPt = pts[nowIdx] || pts[0];

  // Which indices to label on x-axis: every 3 hours
  const labelIndices = new Set();
  forecast.forEach((f, i) => {
    const label = f.label || "";
    // Label if hour is multiple of 3 (e.g. "3 AM", "6 AM", "9 PM" etc.) or if it's NOW
    if (f.now) { labelIndices.add(i); return; }
    const hourMatch = label.match(/(\d+)/);
    if (hourMatch) {
      const h = parseInt(hourMatch[1], 10);
      if (h % 3 === 0) labelIndices.add(i);
    }
  });

  return (
    <div className="card" style={{ padding: "18px 20px", overflow: "visible", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-3)", letterSpacing: 2, textTransform: "uppercase" }}>24-Hour UV Curve</div>
        {peakUV > 0 && (
          <div style={{ fontSize: 10, color: peakLvl.color, fontFamily: "var(--mono)", fontWeight: 700, background: `${peakLvl.color}22`, padding: "4px 12px", borderRadius: 20 }}>
            Peak {peakUV} at {forecast[peakIdx]?.label}
          </div>
        )}
      </div>

      <div style={{ position: "relative", width: "100%", height: 190 }}>
        <svg
          viewBox={`0 0 ${W} ${H + AXIS_H}`}
          style={{ width: "100%", height: "100%", overflow: "visible" }}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="uvFill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F57C00" stopOpacity={0.55} />
              <stop offset="50%" stopColor="#FFB300" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#4CAF50" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="uvLine" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4CAF50" />
              <stop offset="50%" stopColor={peakLvl.color} />
              <stop offset="100%" stopColor="#4CAF50" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines */}
          {[0.25, 0.5, 0.75, 1].map((frac) => (
            <line
              key={frac}
              x1={0} y1={H - frac * (H - PAD_TOP)}
              x2={W} y2={H - frac * (H - PAD_TOP)}
              stroke="currentColor" strokeOpacity={0.06} strokeWidth={1}
            />
          ))}

          {/* Area fill */}
          <path d={areaD} fill="url(#uvFill)" />

          {/* Line */}
          <path d={pathD} fill="none" stroke="url(#uvLine)" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />

          {/* NOW dot */}
          <circle cx={nowPt.x} cy={nowPt.y} r={7} fill={peakLvl.color} stroke="#fff" strokeWidth={3}
            style={{ filter: `drop-shadow(0 0 6px ${peakLvl.color})` }} />

          {/* X-axis labels — every 3 hours */}
          {pts.map((pt, i) => {
            if (!labelIndices.has(i)) return null;
            const isNow = pt.now;
            // Compute text anchor to prevent clipping at edges
            const anchor = i === 0 ? "start" : i === pts.length - 1 ? "end" : "middle";
            return (
              <g key={i} transform={`translate(${pt.x}, ${H + AXIS_H - 4})`}>
                <text
                  textAnchor={anchor}
                  fill={isNow ? "#F57C00" : "#9CA3AF"}
                  fontSize={isNow ? 17 : 14}
                  fontWeight={isNow ? 800 : 500}
                  fontFamily="system-ui, sans-serif"
                >
                  {isNow ? "NOW" : pt.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
