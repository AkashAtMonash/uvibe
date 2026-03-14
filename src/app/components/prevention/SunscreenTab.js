"use client";
// src/app/components/prevention/SunscreenTab.js

import { useState } from "react";
import { BODY_PARTS, calcDosage } from "./constants";

export default function SunscreenTab({ lv }) {
  const [selectedParts, setSelectedParts] = useState(["face"]);
  const [spf, setSpf] = useState(50);

  const togglePart = (id) =>
    setSelectedParts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );

  const dosage = calcDosage(selectedParts, spf);

  return (
    <div className="tab-content fade-up">
      <div className="prev-section">
        <div className="prev-section-label">Body Parts to Cover</div>
        <div className="part-grid">
          {BODY_PARTS.map((p) => (
            <button
              key={p.id}
              className={`part-btn ${selectedParts.includes(p.id) ? "on" : ""}`}
              style={
                selectedParts.includes(p.id)
                  ? {
                      background: lv.dim,
                      borderColor: `${lv.color}60`,
                      color: lv.color,
                    }
                  : {}
              }
              onClick={() => togglePart(p.id)}
            >
              <span className="part-check">
                {selectedParts.includes(p.id) ? "✓" : ""}
              </span>
              <span className="part-name">{p.label}</span>
              <span className="part-tsp">{p.tsp} tsp</span>
            </button>
          ))}
        </div>
      </div>

      <div className="prev-section">
        <div className="prev-section-label">SPF Rating</div>
        <div className="spf-row">
          {[15, 30, 50].map((s) => (
            <button
              key={s}
              className={`spf-btn ${spf === s ? "on" : ""}`}
              style={
                spf === s
                  ? {
                      background: lv.dim,
                      borderColor: `${lv.color}60`,
                      color: lv.color,
                    }
                  : {}
              }
              onClick={() => setSpf(s)}
            >
              SPF {s}
              {s === 50 ? "+" : ""}
            </button>
          ))}
        </div>
        <div className="spf-note">
          Cancer Council Australia recommends SPF 50+ broad-spectrum,
          water-resistant sunscreen.
          <br />
          SPF 50 filters ~98% of UVB rays. SPF 30 filters ~97%.
        </div>
      </div>

      <div
        className="dosage-result"
        style={{ borderColor: `${lv.color}40`, background: lv.dim }}
      >
        <div className="dosage-result-label" style={{ color: lv.color }}>
          Recommended Dosage
        </div>
        <div className="dosage-numbers">
          <div className="dosage-stat">
            <div className="dosage-val" style={{ color: lv.color }}>
              {dosage.tsp}
            </div>
            <div className="dosage-unit">teaspoons</div>
          </div>
          <div className="dosage-divider" />
          <div className="dosage-stat">
            <div className="dosage-val" style={{ color: lv.color }}>
              {dosage.pumps}
            </div>
            <div className="dosage-unit">pumps</div>
          </div>
          <div className="dosage-divider" />
          <div className="dosage-stat">
            <div className="dosage-val" style={{ color: lv.color }}>
              {dosage.ml}
            </div>
            <div className="dosage-unit">ml</div>
          </div>
        </div>
        <div className="dosage-tip">
          Apply 20 min before going outside. Most people use 25–50% less than
          needed — be generous.
        </div>
      </div>

      <div className="info-card">
        <div className="info-card-title">⚠️ 2025 TGA Sunscreen Alert</div>
        <div className="info-card-body">
          In 2025, a CHOICE investigation found 18 of 20 popular Australian
          sunscreens did not meet their claimed SPF rating under Australian
          Standard AS/NZS 2604. Apply more than the recommended amount to
          compensate. Look for an AUST number on the label confirming TGA
          registration.
        </div>
      </div>
    </div>
  );
}
