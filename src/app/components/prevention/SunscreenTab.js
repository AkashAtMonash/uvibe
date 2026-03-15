"use client";

import { useState } from "react";
import { BODY_PARTS, calcDosage } from "./constants";

const SPF_OPTIONS = [
  { val: 15, label: "SPF 15", note: "Minimum" },
  { val: 30, label: "SPF 30", note: "Standard" },
  { val: 50, label: "SPF 50+", note: "Recommended" },
];

export default function SunscreenTab({ lv, uv, prefs }) {
  const [selectedParts, setSelectedParts] = useState(["face", "arms"]);
  const [spf, setSpf] = useState(prefs?.spf ?? 50);

  const toggle = (id) =>
    setSelectedParts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );

  const dosage = calcDosage(selectedParts, spf);

  return (
    <div className="prev-tab-content">
      <div className="prev-section">
        <div className="prev-label">Select Body Parts to Cover</div>
        <div className="prev-part-grid">
          {BODY_PARTS.map((p) => {
            const on = selectedParts.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggle(p.id)}
                className="prev-part-btn"
                style={{
                  borderColor: on ? `${lv.color}70` : "var(--border)",
                  background: on ? lv.dim : "var(--surface)",
                  color: on ? lv.color : "var(--fg-2)",
                }}
              >
                <span style={{ fontSize: 12 }}>{on ? "✓" : "○"}</span>
                <span className="prev-part-name">{p.label}</span>
                <span className="prev-part-tsp">{p.tsp} tsp</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="prev-section">
        <div className="prev-label">SPF Rating</div>
        <div style={{ display: "flex", gap: 8 }}>
          {SPF_OPTIONS.map((s) => (
            <button
              key={s.val}
              onClick={() => setSpf(s.val)}
              style={{
                flex: 1,
                padding: "12px 8px",
                borderRadius: "var(--r-sm)",
                border: `1px solid ${spf === s.val ? `${lv.color}70` : "var(--border)"}`,
                background: spf === s.val ? lv.dim : "var(--surface)",
                cursor: "pointer",
                transition: "all 0.15s",
                fontFamily: "var(--font-display)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: spf === s.val ? lv.color : "var(--fg)",
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontSize: 9,
                  fontFamily: "var(--font-mono)",
                  color: "var(--fg-3)",
                }}
              >
                {s.note}
              </div>
            </button>
          ))}
        </div>
        <div className="prev-note">
          Cancer Council Australia recommends SPF 50+ broad-spectrum,
          water-resistant sunscreen. SPF 50 filters ~98% of UVB.
        </div>
      </div>

      <div
        className="prev-dosage-card"
        style={{ borderColor: `${lv.color}40`, background: lv.dim }}
      >
        <div className="prev-dosage-label" style={{ color: lv.color }}>
          Recommended Dosage
        </div>
        <div className="prev-dosage-numbers">
          <div className="prev-dosage-stat">
            <div className="prev-dosage-val" style={{ color: lv.color }}>
              {dosage.tsp}
            </div>
            <div className="prev-dosage-unit">teaspoons</div>
          </div>
          <div className="prev-dosage-divider" />
          <div className="prev-dosage-stat">
            <div className="prev-dosage-val" style={{ color: lv.color }}>
              {dosage.pumps}
            </div>
            <div className="prev-dosage-unit">pumps</div>
          </div>
          <div className="prev-dosage-divider" />
          <div className="prev-dosage-stat">
            <div className="prev-dosage-val" style={{ color: lv.color }}>
              {dosage.ml}
            </div>
            <div className="prev-dosage-unit">ml</div>
          </div>
        </div>
        <div
          style={{
            fontSize: 12,
            color: lv.color,
            opacity: 0.7,
            textAlign: "center",
          }}
        >
          Apply 20 min before going outside. Most people use 25–50% less than
          needed.
        </div>
      </div>

      <div className="prev-info-card">
        <div className="prev-info-title">⚠️ 2025 TGA Sunscreen Alert</div>
        <div className="prev-info-body">
          In 2025, a CHOICE investigation found 18 of 20 popular Australian
          sunscreens did not meet their claimed SPF under Australian Standard
          AS/NZS 2604. Apply generously and look for an AUST number on the label
          confirming TGA registration.
        </div>
      </div>
    </div>
  );
}
