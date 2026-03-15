"use client";

import { useState } from "react";
import {
  FIVE_S,
  ACTIVITY_TIPS,
  SKIN_CANCER_SIGNS,
  BEST_TIMES,
} from "./constants";

export default function GuideTab({ lv }) {
  const [activeSign, setActiveSign] = useState(null);
  const [activeActivity, setActiveActivity] = useState(null);

  return (
    <div className="prev-tab-content">
      <div className="prev-section">
        <div className="prev-label">The 5 S's of Sun Protection</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {FIVE_S.map((item) => (
            <div
              key={item.s}
              style={{
                display: "grid",
                gridTemplateColumns: "36px 1fr",
                gap: "4px 12px",
                background: "var(--bg-2)",
                border: `1px solid ${item.color}25`,
                borderRadius: "var(--r)",
                padding: "16px",
              }}
            >
              <div style={{ fontSize: 26, gridRow: "span 3", paddingTop: 2 }}>
                {item.icon}
              </div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  fontFamily: "var(--font-mono)",
                  color: item.color,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                {item.s}!
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "var(--fg)",
                  letterSpacing: -0.2,
                }}
              >
                {item.title}
              </div>
              <div
                style={{ fontSize: 12, color: "var(--fg-2)", lineHeight: 1.7 }}
              >
                {item.body}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="prev-section">
        <div className="prev-label">Best Times to Go Outside</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {BEST_TIMES.map((t) => (
            <div
              key={t.time}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 14px",
                borderRadius: "var(--r-sm)",
                border: `1px solid ${t.safe ? "rgba(34,211,170,0.2)" : "rgba(239,68,68,0.18)"}`,
                background: "var(--bg-2)",
              }}
            >
              <span style={{ fontSize: 20, flexShrink: 0 }}>{t.icon}</span>
              <div style={{ flex: 1 }}>
                <div
                  style={{ fontSize: 13, fontWeight: 700, color: "var(--fg)" }}
                >
                  {t.time}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--fg-2)",
                    marginTop: 2,
                    lineHeight: 1.5,
                  }}
                >
                  {t.desc}
                </div>
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                  color: t.safe ? "#22d3aa" : "#ef4444",
                  flexShrink: 0,
                  textAlign: "right",
                }}
              >
                {t.uv}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="prev-section">
        <div className="prev-label">UV Protection by Activity</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {ACTIVITY_TIPS.map((a, i) => {
            const open = activeActivity === i;
            return (
              <div key={a.activity}>
                <button
                  onClick={() => setActiveActivity(open ? null : i)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: open ? "var(--r) var(--r) 0 0" : "var(--r)",
                    border: `1px solid ${open ? `${lv.color}40` : "var(--border)"}`,
                    borderBottom: open ? "none" : undefined,
                    background: open ? lv.dim : "var(--bg-2)",
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: "var(--font-display)",
                    transition: "all 0.15s",
                  }}
                >
                  <span style={{ fontSize: 20 }}>{a.icon}</span>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: open ? lv.color : "var(--fg)",
                      flex: 1,
                    }}
                  >
                    {a.activity}
                  </span>
                  <span style={{ color: "var(--fg-3)", fontSize: 11 }}>
                    {open ? "▴" : "▾"}
                  </span>
                </button>
                {open && (
                  <div
                    style={{
                      padding: "12px 16px 14px",
                      border: `1px solid ${lv.color}40`,
                      borderTop: "none",
                      borderRadius: "0 0 var(--r) var(--r)",
                      background: lv.dim,
                      display: "flex",
                      flexDirection: "column",
                      gap: 7,
                    }}
                  >
                    {a.tips.map((tip, j) => (
                      <div
                        key={j}
                        style={{
                          display: "flex",
                          gap: 8,
                          fontSize: 12,
                          color: "var(--fg-2)",
                          lineHeight: 1.6,
                        }}
                      >
                        <span style={{ color: lv.color, flexShrink: 0 }}>
                          ·
                        </span>
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="prev-section">
        <div className="prev-label">Skin Cancer Warning Signs — ABCDE</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {SKIN_CANCER_SIGNS.map((s, i) => {
            const open = activeSign === i;
            return (
              <button
                key={i}
                onClick={() => setActiveSign(open ? null : i)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "13px 14px",
                  borderRadius: "var(--r-sm)",
                  border: `1px solid ${open ? "rgba(239,68,68,0.35)" : "var(--border)"}`,
                  background: open ? "rgba(239,68,68,0.07)" : "var(--bg-2)",
                  cursor: "pointer",
                  width: "100%",
                  textAlign: "left",
                  fontFamily: "var(--font-display)",
                  transition: "all 0.15s",
                }}
              >
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    fontFamily: "var(--font-mono)",
                    color: open ? "#ef4444" : lv.color,
                    minWidth: 28,
                    transition: "color 0.2s",
                  }}
                >
                  {s.sign.split(" — ")[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "var(--fg)",
                    }}
                  >
                    {s.sign.split(" — ")[1]}
                  </div>
                  {open && (
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--fg-2)",
                        marginTop: 4,
                        lineHeight: 1.6,
                      }}
                    >
                      {s.desc}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: 10, color: "var(--fg-3)" }}>
                  {open ? "▴" : "▾"}
                </span>
              </button>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 10,
            padding: "12px 14px",
            background: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.18)",
            borderRadius: "var(--r-sm)",
            fontSize: 12,
            color: "var(--fg-2)",
            lineHeight: 1.7,
          }}
        >
          If you notice any of these signs, consult a GP or dermatologist
          promptly. Early detection saves lives — skin cancer is almost always
          treatable when caught early.
        </div>
      </div>
    </div>
  );
}
