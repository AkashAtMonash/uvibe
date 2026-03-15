"use client";

import { useState } from "react";
import { FABRICS, getClothingTier } from "./constants";

export default function ClothingTab({ lv, uv }) {
  const [activeFabric, setActiveFabric] = useState(null);
  const tier = getClothingTier(uv);

  return (
    <div className="prev-tab-content">
      <div className="prev-section">
        <div className="prev-label">Recommendations for UV {uv.toFixed(1)}</div>
        <div
          style={{
            padding: "18px",
            borderRadius: "var(--r)",
            border: `1px solid ${lv.color}40`,
            background: lv.dim,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontFamily: "var(--font-mono)",
              color: lv.color,
              letterSpacing: 2,
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            {tier.label}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {tier.items.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  fontSize: 13,
                  color: "var(--fg-1)",
                  lineHeight: 1.5,
                }}
              >
                <span style={{ color: lv.color, marginTop: 1, flexShrink: 0 }}>
                  →
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="prev-section">
        <div className="prev-label">Fabric UPF Guide</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {FABRICS.map((f) => {
            const on = activeFabric === f.name;
            return (
              <button
                key={f.name}
                onClick={() => setActiveFabric(on ? null : f.name)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "13px 14px",
                  borderRadius: "var(--r-sm)",
                  border: `1px solid ${on ? `${f.color}50` : "var(--border)"}`,
                  background: on ? `${f.color}0e` : "var(--bg-2)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  width: "100%",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--fg)",
                    flex: 1,
                  }}
                >
                  {f.name}
                </div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {f.tags.map((t) => (
                    <span
                      key={t}
                      style={{
                        fontSize: 9,
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: "var(--surface-2)",
                        color: "var(--fg-3)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    fontFamily: "var(--font-mono)",
                    color: f.color,
                    minWidth: 50,
                    textAlign: "right",
                  }}
                >
                  UPF {f.upf}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--fg-3)",
                    minWidth: 52,
                    textAlign: "right",
                    letterSpacing: 1,
                  }}
                >
                  {"●".repeat(f.breathability)}
                  {"○".repeat(5 - f.breathability)}
                </div>
              </button>
            );
          })}
        </div>
        <div
          style={{
            fontSize: 9,
            fontFamily: "var(--font-mono)",
            color: "var(--fg-3)",
            marginTop: 6,
          }}
        >
          ● = Breathability (5 = most breathable)
        </div>
      </div>

      <div className="prev-info-card">
        <div className="prev-info-title">👕 What is UPF?</div>
        <div className="prev-info-body">
          UPF (Ultraviolet Protection Factor) measures how much UV passes
          through fabric. UPF 50+ blocks over 98% of UV — equivalent to SPF 50
          sunscreen. Wet fabric loses 50–70% of its UPF rating.
        </div>
      </div>

      <div className="prev-info-card">
        <div className="prev-info-title">🧢 Hat Requirements by UV</div>
        <div className="prev-info-body">
          UV 3–5: Wide-brim hat (brim ≥7.5cm). UV 6+: Broad-brim or legionnaire
          hat with neck flap. Caps and visors leave ears and neck exposed — the
          most commonly burned areas in outdoor workers.
        </div>
      </div>
    </div>
  );
}
