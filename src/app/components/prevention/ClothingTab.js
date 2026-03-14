"use client";
// src/app/components/prevention/ReminderTab.js

import { useState, useEffect, useRef } from "react";

const INTERVALS = [
  { mins: 30, label: "30 min", note: "Extreme UV" },
  { mins: 60, label: "1 hour", note: "Very High UV" },
  { mins: 90, label: "90 min", note: "High UV" },
  { mins: 120, label: "2 hours", note: "Moderate UV" },
  { mins: 240, label: "4 hours", note: "Low UV" },
];

export default function ReminderTab({ lv, uv }) {
  const [interval, setInterval_] = useState(120);
  const [active, setActive] = useState(false);
  const [nextAt, setNextAt] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const timerRef = useRef(null);

  const suggestedInterval =
    uv >= 11 ? 30 : uv >= 8 ? 60 : uv >= 6 ? 90 : uv >= 3 ? 120 : 240;
  const suggestedLabel =
    suggestedInterval < 60
      ? `${suggestedInterval} min`
      : suggestedInterval === 60
        ? "1 hour"
        : `${suggestedInterval / 60} hours`;

  useEffect(() => {
    if (!active || !nextAt) return;
    timerRef.current = setInterval(() => {
      const remaining = nextAt - Date.now();
      if (remaining <= 0) {
        setCountdown("Time to reapply!");
        setActive(false);
      } else {
        const m = Math.floor(remaining / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        setCountdown(`${m}m ${s.toString().padStart(2, "0")}s`);
      }
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [active, nextAt]);

  const startReminder = () => {
    setNextAt(Date.now() + interval * 60000);
    setActive(true);
    setCountdown(null);
  };

  const stopReminder = () => {
    setActive(false);
    setNextAt(null);
    setCountdown(null);
    clearInterval(timerRef.current);
  };

  return (
    <div className="tab-content fade-up">
      <div className="prev-section">
        <div className="prev-section-label">
          Suggested Interval for UV {uv.toFixed(1)}
        </div>
        <div
          className="reminder-suggest"
          style={{ background: lv.dim, borderColor: `${lv.color}40` }}
        >
          <span style={{ fontSize: 28 }}>⏰</span>
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: lv.color,
                letterSpacing: -0.4,
              }}
            >
              Every {suggestedLabel}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 3 }}>
              Based on current UV level — Cancer Council AU recommendation
            </div>
          </div>
        </div>
      </div>

      <div className="prev-section">
        <div className="prev-section-label">Choose Interval</div>
        <div className="interval-options">
          {INTERVALS.map((opt) => (
            <button
              key={opt.mins}
              className={`interval-opt ${interval === opt.mins ? "on" : ""}`}
              style={
                interval === opt.mins
                  ? {
                      background: lv.dim,
                      borderColor: `${lv.color}60`,
                      color: lv.color,
                    }
                  : {}
              }
              onClick={() => setInterval_(opt.mins)}
            >
              <span className="interval-opt-label">{opt.label}</span>
              <span className="interval-opt-note">{opt.note}</span>
            </button>
          ))}
        </div>
      </div>

      {active ? (
        <div
          className="reminder-active"
          style={{ borderColor: `${lv.color}50`, background: lv.dim }}
        >
          <div className="reminder-active-title" style={{ color: lv.color }}>
            Reminder Active
          </div>
          <div className="reminder-countdown" style={{ color: lv.color }}>
            {countdown || "Starting…"}
          </div>
          <div className="reminder-next">
            Next reapplication at{" "}
            {nextAt
              ? new Date(nextAt).toLocaleTimeString("en-AU", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—"}
          </div>
          <button className="reminder-stop-btn" onClick={stopReminder}>
            Stop Reminder
          </button>
        </div>
      ) : (
        <button
          className="reminder-start-btn"
          style={{
            background: `linear-gradient(135deg, ${lv.color}, ${lv.color}bb)`,
            boxShadow: `0 6px 24px ${lv.color}33`,
          }}
          onClick={startReminder}
        >
          {countdown === "Time to reapply!"
            ? "🧴 Reapply Now & Restart"
            : "▶ Start Reminder"}
        </button>
      )}

      {countdown === "Time to reapply!" && !active && (
        <div
          className="reapply-alert"
          style={{
            borderColor: `${lv.color}60`,
            background: lv.dim,
            color: lv.color,
          }}
        >
          🧴 Time to reapply your sunscreen!
        </div>
      )}

      <div className="info-card" style={{ marginTop: 14 }}>
        <div className="info-card-title">📋 Reapplication Rules</div>
        <ul className="info-card-list">
          <li>Reapply every 2 hours — or more often when sweating heavily</li>
          <li>Always reapply after swimming or towelling off</li>
          <li>Sunscreen degrades in heat — store below 30°C</li>
          <li>
            Reapplication does not extend your total safe time — take shade
            breaks
          </li>
          <li>
            No sunscreen provides 100% protection — combine with clothing and
            shade
          </li>
        </ul>
      </div>
    </div>
  );
}
