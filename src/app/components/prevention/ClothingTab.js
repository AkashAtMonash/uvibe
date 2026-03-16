"use client";

import { useState } from "react";
import { FABRICS, getClothingTier } from "./constants";

export default function ClothingTab({ lv, uv }) {
  const [activeFabric, setActiveFabric] = useState(null);
  const tier = getClothingTier(uv ?? 0);

  const cardStyle = {
    background: "var(--bg-2, #fff)",
    border: "1px solid var(--border, rgba(0,0,0,0.08))",
    borderRadius: 18,
    padding: "16px 18px",
    marginBottom: 14,
  };

  return (
    <div>
      {/* UV Recommendations */}
      <div style={{ ...cardStyle, borderColor: `${lv.color}40`, background: `${lv.color}08` }}>
        <div style={{ fontSize: 10, fontFamily: "monospace", color: lv.color, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700, marginBottom: 12 }}>
          {tier.label}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {tier.items.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ color: lv.color, fontWeight: 800, fontSize: 14, flexShrink: 0, marginTop: 1 }}>→</span>
              <span style={{ fontSize: 13, color: "var(--fg, #111)", lineHeight: 1.5 }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Fabric Guide */}
      <div style={cardStyle}>
        <div style={{ fontSize: 10, fontFamily: "monospace", color: "var(--fg-3, #9ca3af)", letterSpacing: 2, textTransform: "uppercase", fontWeight: 700, marginBottom: 12 }}>
          Fabric UPF Guide
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {FABRICS.map((f) => {
            const on = activeFabric === f.name;
            return (
              <button
                key={f.name}
                onClick={() => setActiveFabric(on ? null : f.name)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "13px 14px", borderRadius: 12,
                  border: `1.5px solid ${on ? `${f.color}60` : "var(--border, rgba(0,0,0,0.08))"}`,
                  background: on ? `${f.color}10` : "var(--bg-3, rgba(0,0,0,0.03))",
                  cursor: "pointer", transition: "all 0.15s", width: "100%", textAlign: "left",
                }}
              >
                {/* UPF color dot */}
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: f.color, flexShrink: 0 }} />
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--fg, #111)", flex: 1 }}>{f.name}</div>
                {/* Tags */}
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {f.tags.map((t) => (
                    <span key={t} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "var(--bg-4, rgba(0,0,0,0.05))", color: "var(--fg-3, #9ca3af)", fontFamily: "monospace" }}>
                      {t}
                    </span>
                  ))}
                </div>
                {/* UPF */}
                <div style={{ fontSize: 12, fontWeight: 800, fontFamily: "monospace", color: f.color, minWidth: 50, textAlign: "right" }}>
                  UPF {f.upf}
                </div>
                {/* Breathability */}
                <div style={{ fontSize: 11, color: "var(--fg-3, #9ca3af)", minWidth: 50, textAlign: "right" }}>
                  {"●".repeat(f.breathability)}{"○".repeat(5 - f.breathability)}
                </div>
              </button>
            );
          })}
        </div>
        <div style={{ fontSize: 10, fontFamily: "monospace", color: "var(--fg-3, #9ca3af)", marginTop: 8 }}>
          ● = Breathability (5 = most breathable)
        </div>
      </div>

      {/* Info cards */}
      {[
        { icon: "👕", title: "What is UPF?", body: "UPF (Ultraviolet Protection Factor) measures how much UV passes through fabric. UPF 50+ blocks over 98% of UV — equivalent to SPF 50 sunscreen. Wet fabric loses 50–70% of its UPF rating." },
        { icon: "🧢", title: "Hat Requirements by UV", body: "UV 3–5: Wide-brim hat (brim ≥7.5cm). UV 6+: Broad-brim or legionnaire hat with neck flap. Caps and visors leave ears and neck exposed — the most commonly burned areas in outdoor workers." },
      ].map(({ icon, title, body }) => (
        <div key={title} style={{ ...cardStyle, background: "var(--bg-3, rgba(0,0,0,0.02))" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--fg, #111)", marginBottom: 6 }}>
            {icon} {title}
          </div>
          <div style={{ fontSize: 12, color: "var(--fg-2, #555)", lineHeight: 1.7 }}>{body}</div>
        </div>
      ))}
    </div>
  );
}
