// src/app/components/UVHero.js
"use client";

import { useState, useEffect, useRef } from "react";
import { Info, ChevronDown } from "lucide-react";

const UV_LEVELS = [
  {
    name: "Low",
    min: 0,
    max: 2.9,
    color: "#22d3aa",
    bg: "rgba(34,211,170,0.10)",
    advice: "Safe outdoors. No protection needed for short exposures.",
    spf: "None required",
    hat: "Optional",
    shade: "Not needed",
  },
  {
    name: "Moderate",
    min: 3,
    max: 5.9,
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.10)",
    advice: "Seek shade during midday. Wear SPF 30+ and a hat when outside.",
    spf: "SPF 30+",
    hat: "Recommended",
    shade: "Midday",
  },
  {
    name: "High",
    min: 6,
    max: 7.9,
    color: "#f97316",
    bg: "rgba(249,115,22,0.10)",
    advice:
      "Reduce time outdoors 10am–3pm. Shirt, SPF 50+, hat and sunglasses essential.",
    spf: "SPF 50+",
    hat: "Required",
    shade: "10am–3pm",
  },
  {
    name: "Very High",
    min: 8,
    max: 10.9,
    color: "#ef4444",
    bg: "rgba(239,68,68,0.10)",
    advice:
      "Extra protection required. Avoid midday sun. SPF 50+, cover all exposed skin.",
    spf: "SPF 50+",
    hat: "Mandatory",
    shade: "Avoid 10–3pm",
  },
  {
    name: "Extreme",
    min: 11,
    max: 99,
    color: "#c026d3",
    bg: "rgba(192,38,211,0.10)",
    advice:
      "Unprotected skin burns in minutes. Stay indoors or in full shade if possible.",
    spf: "SPF 50+ max",
    hat: "Broad-brim",
    shade: "Stay indoors",
  },
];

function getLevel(uv) {
  return UV_LEVELS.find((l) => uv >= l.min && uv <= l.max) || UV_LEVELS[0];
}

// ── Ring arc ──────────────────────────────────────────────────────────────────
function UVRingArc({
  uv,
  color,
  size = 220,
  loading = false,
  hovered = false,
}) {
  const strokeW = 8 + Math.min(uv / 13, 1) * 6; // 8px at UV 0 → 14px at UV 13
  const r = (size - strokeW * 2) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(uv / 13, 1);
  const [drawn, setDrawn] = useState(0);

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => setDrawn(pct), 80);
    return () => clearTimeout(t);
  }, [pct, loading]);

  return (
    <svg
      width={size}
      height={size}
      style={{
        transform: `rotate(-90deg) scale(${hovered ? 1.04 : 1})`,
        transition: "transform 0.35s cubic-bezier(0.22,1,0.36,1)",
        overflow: "visible",
      }}
    >
      <defs>
        <filter id="ringGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.07"
        strokeWidth={strokeW}
      />
      {/* Glow copy */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeW + 4}
        strokeLinecap="round"
        opacity={hovered ? 0.18 : 0.08}
        strokeDasharray={`${circ * drawn} ${circ * (1 - drawn)}`}
        style={{
          transition:
            "stroke-dasharray 1.2s cubic-bezier(0.22,1,0.36,1), opacity 0.3s, stroke 0.6s",
        }}
      />
      {/* Arc */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeW}
        strokeLinecap="round"
        strokeDasharray={`${circ * drawn} ${circ * (1 - drawn)}`}
        style={{
          transition:
            "stroke-dasharray 1.2s cubic-bezier(0.22,1,0.36,1), stroke 0.6s, stroke-width 0.6s",
          filter: `drop-shadow(0 0 ${hovered ? 12 : 6}px ${color}aa)`,
        }}
      />
    </svg>
  );
}

// ── Danger flash for extreme UV ───────────────────────────────────────────────
function DangerBanner({ uv, color }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    if (uv < 11) return;
    const t = setInterval(() => setVisible((v) => !v), 1800);
    return () => clearInterval(t);
  }, [uv]);
  if (uv < 11) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        padding: "7px 16px",
        borderRadius: 40,
        background: `${color}18`,
        border: `1px solid ${color}60`,
        fontSize: 11,
        fontWeight: 800,
        color,
        letterSpacing: 0.5,
        marginBottom: 8,
        opacity: visible ? 1 : 0.3,
        transition: "opacity 0.6s",
      }}
    >
      <span style={{ fontSize: 13 }}>⚠</span>
      EXTREME UV — SKIN DAMAGE IN MINUTES
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function UVHero({
  uv = 0,
  burn = null,
  loading = false,
  city = "Melbourne",
  prefs = {},
}) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [burnHover, setBurnHover] = useState(false);
  const prevUv = useRef(uv);
  const lv = getLevel(uv);

  // Pulse on UV change
  useEffect(() => {
    if (prevUv.current !== uv && !loading) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 900);
      prevUv.current = uv;
      return () => clearTimeout(t);
    }
  }, [uv, loading]);

  // Auto-expand for high UV
  useEffect(() => {
    if (uv >= 8) setExpanded(true);
  }, [uv]);

  const protectionItems = [
    { icon: "🧴", label: "Sunscreen", value: lv.spf },
    { icon: "🧢", label: "Hat", value: lv.hat },
    { icon: "🌳", label: "Shade", value: lv.shade },
  ];

  return (
    <div
      style={{
        width: "100%",
        borderRadius: 32,
        marginBottom: 24,
        background: lv.bg,
        border: `1px solid ${hovered ? lv.color + "60" : lv.color + "30"}`,
        overflow: "hidden",
        transition: "background 0.8s, border-color 0.35s",
        boxShadow: hovered ? `0 8px 40px ${lv.color}18` : "none",
      }}
    >
      {/* ── Main ring section ── */}
      <div
        style={{
          padding: "28px 24px 20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          cursor: "pointer",
          position: "relative",
        }}
        onClick={() => setExpanded((p) => !p)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Header row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontFamily: "var(--mono, monospace)",
              color: lv.color,
              letterSpacing: 2,
              textTransform: "uppercase",
              opacity: 0.8,
            }}
          >
            {city} · Live UV
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 10,
              fontFamily: "var(--mono, monospace)",
              color: lv.color,
              opacity: 0.7,
            }}
          >
            <Info size={11} />
            <span>{expanded ? "Less" : "Details"}</span>
            <ChevronDown
              size={12}
              style={{
                transform: expanded ? "rotate(180deg)" : "none",
                transition: "transform 0.25s",
              }}
            />
          </div>
        </div>

        {/* Ring */}
        <div
          style={{
            position: "relative",
            width: 220,
            height: 220,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Pulse on UV update */}
          {pulse && (
            <div
              style={{
                position: "absolute",
                inset: -16,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${lv.color}35 0%, transparent 70%)`,
                animation: "uvPulse 0.9s ease-out forwards",
                pointerEvents: "none",
              }}
            />
          )}

          {/* Hover glow halo */}
          <div
            style={{
              position: "absolute",
              inset: -8,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${lv.color}${hovered ? "22" : "00"} 0%, transparent 70%)`,
              transition: "background 0.4s",
              pointerEvents: "none",
            }}
          />

          <div style={{ position: "absolute" }}>
            <UVRingArc
              uv={uv}
              color={lv.color}
              size={220}
              loading={loading}
              hovered={hovered}
            />
          </div>

          {/* Centre content */}
          <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
            {loading ? (
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  border: `3px solid ${lv.color}40`,
                  borderTopColor: lv.color,
                  animation: "spin 0.7s linear infinite",
                  margin: "0 auto",
                }}
              />
            ) : (
              <>
                <div
                  style={{
                    fontSize: 64,
                    fontWeight: 900,
                    letterSpacing: -3,
                    lineHeight: 1,
                    color: lv.color,
                    transition: "color 0.6s, transform 0.3s",
                    transform: hovered ? "scale(1.06)" : "scale(1)",
                    fontFamily: "var(--font-display, sans-serif)",
                  }}
                >
                  {uv.toFixed(1)}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: 3,
                    textTransform: "uppercase",
                    color: lv.color,
                    opacity: 0.8,
                    marginTop: 4,
                    fontFamily: "var(--mono, monospace)",
                    transition: "color 0.6s",
                  }}
                >
                  {lv.name}
                </div>
                {/* Hover hint */}
                <div
                  style={{
                    fontSize: 9,
                    fontFamily: "var(--mono, monospace)",
                    color: lv.color,
                    opacity: hovered ? 0.5 : 0,
                    marginTop: 6,
                    letterSpacing: 1.5,
                    transition: "opacity 0.3s",
                  }}
                >
                  TAP FOR DETAILS
                </div>
              </>
            )}
          </div>
        </div>

        {/* Danger banner for extreme UV */}
        <DangerBanner uv={uv} color={lv.color} />

        {/* Burn badge — expands on hover */}
        {burn && !loading && (
          <div
            onMouseEnter={() => setBurnHover(true)}
            onMouseLeave={() => setBurnHover(false)}
            onClick={(e) => {
              e.stopPropagation();
              setBurnHover((p) => !p);
            }}
            style={{
              marginTop: 12,
              cursor: "default",
              padding: burnHover ? "12px 18px" : "8px 16px",
              borderRadius: 40,
              background: burnHover ? `${lv.color}25` : `${lv.color}18`,
              border: `1px solid ${burnHover ? lv.color + "70" : lv.color + "40"}`,
              fontSize: 12,
              fontWeight: 600,
              color: lv.color,
              transition: "all 0.25s",
              display: "flex",
              flexDirection: burnHover ? "column" : "row",
              alignItems: "center",
              gap: burnHover ? 6 : 8,
              textAlign: "center",
              maxWidth: burnHover ? 280 : "none",
            }}
          >
            {burnHover ? (
              <>
                <span
                  style={{
                    fontSize: 11,
                    opacity: 0.7,
                    fontFamily: "var(--mono, monospace)",
                    letterSpacing: 1,
                  }}
                >
                  UNPROTECTED SKIN
                </span>
                <span style={{ fontSize: 22, fontWeight: 900 }}>
                  ~{burn.bare} min
                </span>
                <div
                  style={{
                    width: "100%",
                    height: 1,
                    background: `${lv.color}30`,
                  }}
                />
                <span
                  style={{
                    fontSize: 11,
                    opacity: 0.7,
                    fontFamily: "var(--mono, monospace)",
                    letterSpacing: 1,
                  }}
                >
                  WITH SPF {prefs.spf || 50}
                </span>
                <span style={{ fontSize: 22, fontWeight: 900 }}>
                  ~{burn.prot} min
                </span>
                <span
                  style={{
                    fontSize: 10,
                    opacity: 0.55,
                    fontFamily: "var(--mono, monospace)",
                  }}
                >
                  Tap to collapse
                </span>
              </>
            ) : (
              <>
                <span>⏱</span>
                <span>
                  Bare skin burns in <strong>~{burn.bare} min</strong>
                </span>
                <span style={{ opacity: 0.4 }}>·</span>
                <span>
                  SPF {prefs.spf || 50} → <strong>{burn.prot} min</strong>
                </span>
              </>
            )}
          </div>
        )}

        {/* Alert text */}
        {!loading && (
          <div
            style={{
              marginTop: 12,
              padding: "10px 16px",
              borderRadius: 12,
              background: `${lv.color}12`,
              border: `1px solid ${lv.color}30`,
              fontSize: 13,
              fontWeight: 500,
              color: lv.color,
              textAlign: "center",
              maxWidth: 380,
              lineHeight: 1.6,
              transition: "background 0.4s",
            }}
          >
            {lv.advice}
          </div>
        )}
      </div>

      {/* ── Expandable details ── */}
      <div
        style={{
          maxHeight: expanded ? 500 : 0,
          overflow: "hidden",
          transition: "max-height 0.45s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        <div style={{ padding: "0 24px 24px" }}>
          <div
            style={{
              width: "100%",
              height: 1,
              background: `${lv.color}25`,
              marginBottom: 20,
            }}
          />

          {/* Protection grid with hover */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 10,
              marginBottom: 20,
            }}
          >
            {protectionItems.map((item) => (
              <ProtectionCard key={item.label} item={item} color={lv.color} />
            ))}
          </div>

          {/* UV scale bar — interactive */}
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 9,
                fontFamily: "var(--mono, monospace)",
                color: lv.color,
                letterSpacing: 2,
                textTransform: "uppercase",
                marginBottom: 10,
                opacity: 0.7,
              }}
            >
              UV Risk Scale
            </div>
            <div style={{ display: "flex", gap: 5 }}>
              {UV_LEVELS.map((level) => {
                const active = uv >= level.min && uv <= level.max;
                return (
                  <div
                    key={level.name}
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <div
                      style={{
                        height: active ? 8 : 5,
                        width: "100%",
                        borderRadius: 3,
                        background: active ? level.color : `${level.color}35`,
                        boxShadow: active ? `0 0 10px ${level.color}` : "none",
                        transition: "all 0.4s",
                      }}
                    />
                    <span
                      style={{
                        fontSize: 8,
                        fontFamily: "var(--mono, monospace)",
                        color: active ? level.color : `${level.color}70`,
                        fontWeight: active ? 900 : 500,
                        letterSpacing: 0.3,
                        transition: "all 0.3s",
                      }}
                    >
                      {level.name.replace("Very High", "V.High")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            style={{
              fontSize: 9,
              fontFamily: "var(--mono, monospace)",
              color: lv.color,
              opacity: 0.4,
              textAlign: "center",
              letterSpacing: 0.5,
            }}
          >
            UV observations courtesy of ARPANSA · Cancer Council Australia
            guidelines
          </div>
        </div>
      </div>

      <style>{`
        @keyframes uvPulse {
          0%   { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.4); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function ProtectionCard({ item, color }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        padding: "14px 10px",
        borderRadius: 14,
        background: hov ? `${color}20` : `${color}10`,
        border: `1px solid ${hov ? color + "50" : color + "25"}`,
        transform: hov ? "translateY(-2px)" : "none",
        boxShadow: hov ? `0 6px 20px ${color}18` : "none",
        transition: "all 0.2s",
        cursor: "default",
      }}
    >
      <span style={{ fontSize: hov ? 26 : 22, transition: "font-size 0.2s" }}>
        {item.icon}
      </span>
      <span
        style={{
          fontSize: 9,
          fontFamily: "var(--mono, monospace)",
          color,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          opacity: 0.7,
        }}
      >
        {item.label}
      </span>
      <span
        style={{ fontSize: 12, fontWeight: 800, color, textAlign: "center" }}
      >
        {item.value}
      </span>
    </div>
  );
}
