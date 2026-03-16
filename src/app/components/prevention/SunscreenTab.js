"use client";

import { useState } from "react";
import { BODY_PARTS, calcDosage } from "./constants";
import { Check, AlertTriangle } from "lucide-react";

const SPF_OPTIONS = [
  { val: 15, label: "SPF 15",  note: "Minimum"     },
  { val: 30, label: "SPF 30",  note: "Standard"    },
  { val: 50, label: "SPF 50+", note: "Recommended" },
];

export default function SunscreenTab({ lv, uv }) {
  const [selectedParts, setSelectedParts] = useState(["face", "arms"]);
  const [spf, setSpf] = useState(50);

  const toggle = (id) =>
    setSelectedParts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );

  const dosage = calcDosage(selectedParts, spf);

  const cardStyle = {
    background: "var(--bg-2, #fff)",
    border: "1px solid var(--border, rgba(0,0,0,0.08))",
    borderRadius: 18,
    padding: "16px 18px",
    marginBottom: 14,
  };

  const labelStyle = {
    fontSize: 10,
    fontFamily: "monospace",
    color: "var(--fg-3, #9ca3af)",
    letterSpacing: 2,
    textTransform: "uppercase",
    fontWeight: 700,
    marginBottom: 12,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

      {/* Body Parts */}
      <div style={cardStyle}>
        <div style={labelStyle}>Body Parts to Cover</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {BODY_PARTS.map((p) => {
            const on = selectedParts.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggle(p.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "11px 13px",
                  borderRadius: 12,
                  border: `1.5px solid ${on ? lv.color : "var(--border, rgba(0,0,0,0.08))"}`,
                  background: on ? `${lv.color}15` : "var(--bg-3, rgba(0,0,0,0.03))",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  textAlign: "left",
                  width: "100%",
                }}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: 8,
                  background: on ? lv.color : "var(--border, rgba(0,0,0,0.1))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, transition: "all 0.15s",
                }}>
                  {on && <Check size={13} color="#fff" strokeWidth={3} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: on ? lv.color : "var(--fg, #111)" }}>{p.label}</div>
                  <div style={{ fontSize: 10, color: "var(--fg-3, #9ca3af)", fontFamily: "monospace" }}>{p.tsp} tsp</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SPF Rating */}
      <div style={cardStyle}>
        <div style={labelStyle}>SPF Rating</div>
        <div style={{ display: "flex", gap: 8 }}>
          {SPF_OPTIONS.map((s) => (
            <button
              key={s.val}
              onClick={() => setSpf(s.val)}
              style={{
                flex: 1, padding: "12px 8px", borderRadius: 12,
                border: `1.5px solid ${spf === s.val ? lv.color : "var(--border, rgba(0,0,0,0.08))"}`,
                background: spf === s.val ? `${lv.color}15` : "var(--bg-3, rgba(0,0,0,0.03))",
                cursor: "pointer", transition: "all 0.15s",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 800, color: spf === s.val ? lv.color : "var(--fg, #111)" }}>{s.label}</div>
              <div style={{ fontSize: 10, color: "var(--fg-3, #9ca3af)", fontFamily: "monospace" }}>{s.note}</div>
            </button>
          ))}
        </div>
        <div style={{ fontSize: 11, color: "var(--fg-3, #9ca3af)", marginTop: 10, lineHeight: 1.6 }}>
          Cancer Council Australia recommends SPF 50+ broad-spectrum, water-resistant sunscreen.
        </div>
      </div>

      {/* Recommended Dosage */}
      <div style={{ ...cardStyle, borderColor: `${lv.color}40`, background: `${lv.color}08` }}>
        <div style={{ fontSize: 11, fontFamily: "monospace", color: lv.color, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700, marginBottom: 14 }}>
          Recommended Dosage
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1px 1fr 1px 1fr", gap: 0, alignItems: "center" }}>
          {[
            { val: dosage.tsp, unit: "teaspoons" },
            null,
            { val: dosage.pumps, unit: "pumps" },
            null,
            { val: dosage.ml, unit: "ml" },
          ].map((item, i) => item === null ? (
            <div key={i} style={{ width: 1, background: `${lv.color}30`, alignSelf: "stretch", margin: "0 8px" }} />
          ) : (
            <div key={i} style={{ textAlign: "center", padding: "4px 0" }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: lv.color, letterSpacing: -1 }}>{item.val}</div>
              <div style={{ fontSize: 11, color: "var(--fg-3, #9ca3af)", marginTop: 2 }}>{item.unit}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: lv.color, textAlign: "center", marginTop: 12, opacity: 0.8 }}>
          Apply 20 min before going outside. Most people use 25–50% less than needed.
        </div>
      </div>

      {/* TGA Warning */}
      <div style={{ ...cardStyle, background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.2)", borderRadius: 14 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <AlertTriangle size={16} color="#DC2626" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#DC2626", marginBottom: 4 }}>2025 TGA Sunscreen Alert</div>
            <div style={{ fontSize: 12, color: "var(--fg-2, #555)", lineHeight: 1.7 }}>
              A CHOICE investigation found 18 of 20 popular Australian sunscreens did not meet their claimed SPF under Australian Standard AS/NZS 2604. Apply generously and look for an AUST number confirming TGA registration.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
