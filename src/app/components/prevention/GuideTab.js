"use client";
// src/app/components/prevention/GuideTab.js

import { useState } from "react";
import {
  FIVE_S,
  ACTIVITY_TIPS,
  SKIN_CANCER_SIGNS,
  BEST_TIMES,
} from "./constants";

export default function GuideTab({ lv }) {
  const [activeSign, setActiveSign] = useState(null);

  return (
    <div className="tab-content fade-up">
      <div className="prev-section">
        <div className="prev-section-label">The 5 S's of Sun Protection</div>
        <div className="five-s-grid">
          {FIVE_S.map((item) => (
            <div
              key={item.s}
              className="five-s-card"
              style={{ borderColor: `${item.color}30` }}
            >
              <div className="five-s-icon">{item.icon}</div>
              <div className="five-s-s" style={{ color: item.color }}>
                {item.s}!
              </div>
              <div className="five-s-title">{item.title}</div>
              <div className="five-s-body">{item.body}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="prev-section">
        <div className="prev-section-label">Best Times to Go Outside</div>
        <div className="time-list">
          {BEST_TIMES.map((t) => (
            <div
              key={t.time}
              className={`time-row ${t.safe ? "safe" : "unsafe"}`}
              style={{
                borderColor: t.safe
                  ? "rgba(34,211,170,0.25)"
                  : "rgba(239,68,68,0.2)",
              }}
            >
              <span className="time-icon">{t.icon}</span>
              <div className="time-info">
                <div className="time-label">{t.time}</div>
                <div className="time-desc">{t.desc}</div>
              </div>
              <div
                className="time-uv"
                style={{ color: t.safe ? "#22d3aa" : "#ef4444" }}
              >
                {t.uv}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="prev-section">
        <div className="prev-section-label">UV Protection by Activity</div>
        <div className="activity-list">
          {ACTIVITY_TIPS.map((a) => (
            <div key={a.activity} className="activity-card">
              <div className="activity-head">
                <span className="activity-icon">{a.icon}</span>
                <span className="activity-title">{a.activity}</span>
              </div>
              <ul className="activity-tips">
                {a.tips.map((tip, i) => (
                  <li key={i}>
                    <span style={{ color: lv.color }}>·</span> {tip}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="prev-section">
        <div className="prev-section-label">
          Skin Cancer Early Warning Signs — ABCDE
        </div>
        <div className="abcde-list">
          {SKIN_CANCER_SIGNS.map((s, i) => (
            <button
              key={i}
              className={`abcde-row ${activeSign === i ? "on" : ""}`}
              style={
                activeSign === i
                  ? {
                      background: "rgba(239,68,68,0.08)",
                      borderColor: "rgba(239,68,68,0.35)",
                    }
                  : {}
              }
              onClick={() => setActiveSign(activeSign === i ? null : i)}
            >
              <div
                className="abcde-letter"
                style={{ color: activeSign === i ? "#ef4444" : lv.color }}
              >
                {s.sign.split(" — ")[0]}
              </div>
              <div className="abcde-text">
                <div className="abcde-sign">{s.sign.split(" — ")[1]}</div>
                {activeSign === i && <div className="abcde-desc">{s.desc}</div>}
              </div>
              <span className="abcde-arrow">
                {activeSign === i ? "▴" : "▾"}
              </span>
            </button>
          ))}
        </div>
        <div className="abcde-note">
          If you notice any of these signs, consult a GP or dermatologist
          promptly. Early detection saves lives — skin cancer is almost always
          treatable when caught early.
        </div>
      </div>
    </div>
  );
}
