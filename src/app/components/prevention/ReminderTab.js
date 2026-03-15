"use client";

import { useState, useEffect, useRef } from "react";

const INTERVALS = [
  { mins: 30, label: "30 min", note: "Extreme UV" },
  { mins: 60, label: "1 hour", note: "Very High UV" },
  { mins: 90, label: "90 min", note: "High UV" },
  { mins: 120, label: "2 hours", note: "Moderate UV" },
  { mins: 240, label: "4 hours", note: "Low UV" },
];

const STORAGE_KEY = "uvibe_reminder";

export default function ReminderTab({ lv, uv }) {
  const [interval, setInterval_] = useState(120);
  const [active, setActive] = useState(false);
  const [nextAt, setNextAt] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const timerRef = useRef(null);

  const suggested =
    uv >= 11 ? 30 : uv >= 8 ? 60 : uv >= 6 ? 90 : uv >= 3 ? 120 : 240;
  const suggestedLabel =
    suggested < 60
      ? `${suggested} min`
      : suggested === 60
        ? "1 hour"
        : `${suggested / 60} hours`;

  // Restore persisted reminder state
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const { nextAt: n, interval: i } = JSON.parse(saved);
      if (n && n > Date.now()) {
        setNextAt(n);
        setInterval_(i);
        setActive(true);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (!active || !nextAt) return;
    timerRef.current = setInterval(() => {
      const remaining = nextAt - Date.now();
      if (remaining <= 0) {
        setCountdown("Time to reapply!");
        setActive(false);
        localStorage.removeItem(STORAGE_KEY);
      } else {
        const m = Math.floor(remaining / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        setCountdown(`${m}m ${s.toString().padStart(2, "0")}s`);
      }
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [active, nextAt]);

  const start = () => {
    const n = Date.now() + interval * 60000;
    setNextAt(n);
    setActive(true);
    setCountdown(null);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ nextAt: n, interval }));
  };

  const stop = () => {
    setActive(false);
    setNextAt(null);
    setCountdown(null);
    clearInterval(timerRef.current);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="prev-tab-content">
      <div className="prev-section">
        <div className="prev-label">
          Suggested for Current UV {uv.toFixed(1)}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "16px 18px",
            borderRadius: "var(--r)",
            background: lv.dim,
            border: `1px solid ${lv.color}40`,
          }}
        >
          <span style={{ fontSize: 28 }}>⏰</span>
          <div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: lv.color,
                letterSpacing: -0.5,
              }}
            >
              Every {suggestedLabel}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--fg-2)",
                marginTop: 3,
                fontFamily: "var(--font-mono)",
              }}
            >
              Based on current UV · Cancer Council AU
            </div>
          </div>
        </div>
      </div>

      <div className="prev-section">
        <div className="prev-label">Choose Your Interval</div>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
        >
          {INTERVALS.map((opt) => (
            <button
              key={opt.mins}
              onClick={() => setInterval_(opt.mins)}
              style={{
                padding: "13px 10px",
                borderRadius: "var(--r-sm)",
                border: `1px solid ${interval === opt.mins ? `${lv.color}70` : "var(--border)"}`,
                background: interval === opt.mins ? lv.dim : "var(--surface)",
                cursor: "pointer",
                transition: "all 0.15s",
                fontFamily: "var(--font-display)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
              }}
            >
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: interval === opt.mins ? lv.color : "var(--fg)",
                }}
              >
                {opt.label}
              </span>
              <span
                style={{
                  fontSize: 9,
                  fontFamily: "var(--font-mono)",
                  color: "var(--fg-3)",
                }}
              >
                {opt.note}
              </span>
            </button>
          ))}
        </div>
      </div>

      {active ? (
        <div
          style={{
            border: `1px solid ${lv.color}50`,
            background: lv.dim,
            borderRadius: "var(--r)",
            padding: "28px 20px",
            textAlign: "center",
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
            Reminder Active
          </div>
          <div
            style={{
              fontSize: 48,
              fontWeight: 900,
              color: lv.color,
              letterSpacing: -2,
              lineHeight: 1,
              marginBottom: 10,
            }}
          >
            {countdown || "Starting…"}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--fg-2)",
              fontFamily: "var(--font-mono)",
              marginBottom: 20,
            }}
          >
            Next reapplication at{" "}
            {nextAt
              ? new Date(nextAt).toLocaleTimeString("en-AU", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—"}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={stop}>
            Stop Reminder
          </button>
        </div>
      ) : (
        <button
          onClick={start}
          style={{
            width: "100%",
            padding: 16,
            borderRadius: "var(--r)",
            border: "none",
            background: lv.color,
            color: "#000",
            fontSize: 15,
            fontWeight: 800,
            fontFamily: "var(--font-display)",
            cursor: "pointer",
            transition: "all 0.2s",
            boxShadow: `0 6px 24px ${lv.color}33`,
          }}
        >
          {countdown === "Time to reapply!"
            ? "🧴 Reapply Now & Restart"
            : "▶ Start Reminder"}
        </button>
      )}

      {countdown === "Time to reapply!" && !active && (
        <div
          style={{
            padding: "14px 18px",
            borderRadius: "var(--r)",
            border: `1px solid ${lv.color}60`,
            background: lv.dim,
            color: lv.color,
            fontSize: 14,
            fontWeight: 700,
            textAlign: "center",
          }}
        >
          🧴 Time to reapply your sunscreen!
        </div>
      )}

      <div className="prev-info-card">
        <div className="prev-info-title">📋 Reapplication Rules</div>
        <ul className="prev-info-list">
          <li>Reapply every 2 hours — or more often when sweating heavily</li>
          <li>Always reapply after swimming or towelling off</li>
          <li>Sunscreen degrades in heat — store below 30°C</li>
          <li>
            Reapplication does not extend total safe time — take shade breaks
          </li>
          <li>
            No sunscreen is 100% effective — combine with clothing and shade
          </li>
        </ul>
      </div>
    </div>
  );
}
