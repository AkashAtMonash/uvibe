"use client";

import { useState } from "react";
import { FIVE_S, ACTIVITY_TIPS, SKIN_CANCER_SIGNS, BEST_TIMES } from "./constants";
import { ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";

export default function GuideTab({ lv }) {
  const [activeSign, setActiveSign] = useState(null);

  const card = {
    background: "var(--bg-2, #fff)",
    border: "1px solid var(--border, rgba(0,0,0,0.08))",
    borderRadius: 18,
    padding: "16px 18px",
    marginBottom: 14,
  };

  const sectionLabel = {
    fontSize: 10, fontFamily: "monospace", color: "var(--fg-3, #9ca3af)",
    letterSpacing: 2, textTransform: "uppercase", fontWeight: 700, marginBottom: 14,
  };

  return (
    <div>

      {/* ── 5 S's ── */}
      <div style={card}>
        <div style={sectionLabel}>The 5 S's of Sun Protection</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {FIVE_S.map((item) => {
            const Icon = item.iconStr;
            return (
              <div key={item.s} style={{
                display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px",
                borderRadius: 12, border: `1px solid ${item.color}25`,
                background: `${item.color}08`,
              }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: `${item.color}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: item.color }}>
                  <Icon size={20} strokeWidth={2} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 15, fontWeight: 900, color: item.color }}>{item.s}!</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--fg, #111)" }}>{item.title}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--fg-2, #555)", lineHeight: 1.6 }}>{item.body}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Best Times ── */}
      <div style={card}>
        <div style={sectionLabel}>Best Times to Go Outside</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {BEST_TIMES.map((t) => {
            const TimeIcon = t.iconStr;
            const safeColor = "#10b981";
            const warnColor = "#ef4444";
            const c = t.safe ? safeColor : warnColor;
            return (
              <div key={t.time} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 12,
                border: `1px solid ${c}25`,
                background: `${c}06`,
              }}>
                <div style={{ color: c, flexShrink: 0 }}>
                  <TimeIcon size={18} strokeWidth={2.5} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "var(--fg, #111)" }}>{t.time}</div>
                  <div style={{ fontSize: 11, color: "var(--fg-2, #555)", lineHeight: 1.5, marginTop: 1 }}>{t.desc}</div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: c, fontFamily: "monospace", whiteSpace: "nowrap", flexShrink: 0, padding: "4px 10px", background: `${c}12`, borderRadius: 10 }}>
                  {t.uv}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Activity Tips ── */}
      <div style={card}>
        <div style={sectionLabel}>UV Protection by Activity</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {ACTIVITY_TIPS.map((a) => {
            const ActIcon = a.iconStr;
            return (
              <div key={a.activity} style={{
                padding: "12px 14px", borderRadius: 14,
                border: "1px solid var(--border, rgba(0,0,0,0.08))",
                background: "var(--bg-3, rgba(0,0,0,0.02))",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ color: lv.color }}>
                    <ActIcon size={16} strokeWidth={2.5} />
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "var(--fg, #111)" }}>{a.activity}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {a.tips.map((tip, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <span style={{ color: lv.color, fontWeight: 800, fontSize: 14, flexShrink: 0, marginTop: 0 }}>·</span>
                      <span style={{ fontSize: 12, color: "var(--fg-2, #555)", lineHeight: 1.5 }}>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── ABCDE Skin Cancer signs ── */}
      <div style={card}>
        <div style={sectionLabel}>Skin Cancer Early Warning — ABCDE</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {SKIN_CANCER_SIGNS.map((s, i) => {
            const on = activeSign === i;
            return (
              <button
                key={i}
                onClick={() => setActiveSign(on ? null : i)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
                  borderRadius: 12, cursor: "pointer", width: "100%", textAlign: "left",
                  border: `1.5px solid ${on ? "rgba(239,68,68,0.35)" : "var(--border, rgba(0,0,0,0.07))"}`,
                  background: on ? "rgba(239,68,68,0.06)" : "var(--bg-3, rgba(0,0,0,0.02))",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 900, color: on ? "#ef4444" : lv.color, minWidth: 28, flexShrink: 0 }}>
                  {s.sign.split(" — ")[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--fg, #111)" }}>{s.sign.split(" — ")[1]}</div>
                  {on && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 4, lineHeight: 1.5 }}>{s.desc}</div>}
                </div>
                <span style={{ color: on ? "#ef4444" : "var(--fg-3, #9ca3af)", flexShrink: 0 }}>
                  {on ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginTop: 14, padding: "12px 14px", background: "rgba(239,68,68,0.06)", borderRadius: 12, border: "1px solid rgba(239,68,68,0.2)" }}>
          <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 12, color: "#ef4444", lineHeight: 1.6 }}>
            If you notice any of these signs, consult a GP or dermatologist promptly. Early detection saves lives — skin cancer is almost always treatable when caught early.
          </span>
        </div>
      </div>
    </div>
  );
}
