"use client";

import { useState, useEffect, useRef } from "react";
import {
  Clock,
  Play,
  Droplets,
  Info,
  Check,
  AlertTriangle,
  Sliders,
} from "lucide-react";

const INTERVALS = [
  { mins: 30, label: "30 min", note: "Extreme UV" },
  { mins: 60, label: "1 hour", note: "Very High UV" },
  { mins: 90, label: "90 min", note: "High UV" },
  { mins: 120, label: "2 hours", note: "Moderate UV" },
  { mins: 240, label: "4 hours", note: "Low UV" },
];

const RULES = [
  "Reapply every 2 hours — or more often when sweating heavily",
  "Always reapply after swimming or towelling off",
  "Sunscreen degrades in heat — store below 30°C",
  "Reapplication does not extend your total safe time — take shade breaks",
  "No sunscreen provides 100% protection — combine with clothing and shade",
];

const STORAGE_KEY = "uvibe_reminder";

// Request browser notification permission
async function requestNotifPermission() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

// Fire the alarm — SW message (works backgrounded) + in-tab audio beep
async function fireAlarm(lv) {
  // 1. Service Worker notification (works in background)
  if ("serviceWorker" in navigator) {
    const reg = await navigator.serviceWorker.ready.catch(() => null);
    if (reg) {
      reg.active?.postMessage({
        type: "REMINDER_ALARM",
        title: "⏱ Time to Reapply Sunscreen!",
        body: "Your sunscreen reminder has gone off. Reapply now to stay protected.",
        color: lv?.color ?? "#22d3aa",
      });
    }
  }

  // 2. In-tab Web Notification fallback (if SW not available)
  if (Notification.permission === "granted") {
    try {
      new Notification("⏱ Time to Reapply Sunscreen!", {
        body: "Your sunscreen reminder has gone off. Reapply now to stay protected.",
        icon: "/icons/icon-192.png",
        tag: "uvibe-reminder",
      });
    } catch {}
  }

  // 3. Audible beep using Web Audio API
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const beep = (freq, start, dur) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.4, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + start + dur,
      );
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur);
    };
    beep(880, 0, 0.18);
    beep(880, 0.22, 0.18);
    beep(1100, 0.48, 0.28);
  } catch {}
}

export default function ReminderTab({ lv, uv }) {
  const [interval, setInterval_] = useState(120);
  const [customMins, setCustomMins] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [customError, setCustomError] = useState("");
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

  // Effective interval — preset or custom
  const effectiveMins = useCustom ? parseInt(customMins, 10) || 0 : interval;

  const effectiveLabel = (() => {
    const m = effectiveMins;
    if (!m || m <= 0) return "—";
    if (m < 60) return `${m} min`;
    if (m === 60) return "1 hour";
    if (m % 60 === 0) return `${m / 60} hours`;
    return `${Math.floor(m / 60)}h ${m % 60}m`;
  })();

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const { nextAt: n, interval: i, custom } = JSON.parse(saved);
      if (n && n > Date.now()) {
        setNextAt(n);
        if (custom) {
          setUseCustom(true);
          setCustomMins(String(i));
        } else setInterval_(i);
        setActive(true);
      } else localStorage.removeItem(STORAGE_KEY);
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
        fireAlarm(lv); // ← fire SW notification + audio beep
      } else {
        const m = Math.floor(remaining / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        setCountdown(`${m}m ${s.toString().padStart(2, "0")}s`);
      }
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [active, nextAt, lv]);

  const start = async () => {
    const mins = effectiveMins;
    if (!mins || mins <= 0) {
      setCustomError("Please enter a valid number of minutes.");
      return;
    }
    if (mins < 5) {
      setCustomError("Minimum reminder time is 5 minutes.");
      return;
    }
    if (mins > 480) {
      setCustomError("Maximum reminder time is 8 hours (480 min).");
      return;
    }
    setCustomError("");
    // Request notification permission so alarm can fire even when backgrounded
    await requestNotifPermission();
    const n = Date.now() + mins * 60000;
    setNextAt(n);
    setActive(true);
    setCountdown(null);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ nextAt: n, interval: mins, custom: useCustom }),
    );
  };

  const stop = () => {
    setActive(false);
    setNextAt(null);
    setCountdown(null);
    clearInterval(timerRef.current);
    localStorage.removeItem(STORAGE_KEY);
  };

  const cardStyle = {
    background: "var(--bg-2, #fff)",
    border: "1px solid var(--border, rgba(0,0,0,0.08))",
    borderRadius: 18,
    padding: "16px 18px",
    marginBottom: 14,
  };

  return (
    <div>
      {/* Suggested Interval */}
      <div
        style={{
          ...cardStyle,
          borderColor: `${lv.color}40`,
          background: `${lv.color}08`,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontFamily: "monospace",
            color: lv.color,
            letterSpacing: 2,
            textTransform: "uppercase",
            fontWeight: 700,
            marginBottom: 10,
          }}
        >
          Suggested for UV {uv.toFixed(1)}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: `${lv.color}20`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Clock size={26} color={lv.color} strokeWidth={2} />
          </div>
          <div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 900,
                color: lv.color,
                letterSpacing: -0.5,
              }}
            >
              Every {suggestedLabel}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--fg-3, #9ca3af)",
                marginTop: 3,
                fontFamily: "monospace",
              }}
            >
              Based on current UV · Cancer Council AU
            </div>
          </div>
        </div>
      </div>

      {/* Interval Picker */}
      <div style={cardStyle}>
        <div
          style={{
            fontSize: 10,
            fontFamily: "monospace",
            color: "var(--fg-3, #9ca3af)",
            letterSpacing: 2,
            textTransform: "uppercase",
            fontWeight: 700,
            marginBottom: 12,
          }}
        >
          Choose Your Interval
        </div>

        {/* Preset grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            marginBottom: 10,
          }}
        >
          {INTERVALS.map((opt) => {
            const on = !useCustom && interval === opt.mins;
            return (
              <button
                key={opt.mins}
                onClick={() => {
                  setInterval_(opt.mins);
                  setUseCustom(false);
                  setCustomError("");
                }}
                style={{
                  padding: "13px 10px",
                  borderRadius: 12,
                  border: `1.5px solid ${on ? lv.color : "var(--border, rgba(0,0,0,0.08))"}`,
                  background: on
                    ? `${lv.color}15`
                    : "var(--bg-3, rgba(0,0,0,0.03))",
                  cursor: "pointer",
                  transition: "all 0.15s",
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
                    color: on ? lv.color : "var(--fg, #111)",
                  }}
                >
                  {opt.label}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    fontFamily: "monospace",
                    color: "var(--fg-3, #9ca3af)",
                  }}
                >
                  {opt.note}
                </span>
              </button>
            );
          })}

          {/* Custom tile — same grid slot */}
          <button
            onClick={() => {
              setUseCustom(true);
              setCustomError("");
            }}
            style={{
              padding: "13px 10px",
              borderRadius: 12,
              border: `1.5px solid ${useCustom ? lv.color : "var(--border, rgba(0,0,0,0.08))"}`,
              background: useCustom
                ? `${lv.color}15`
                : "var(--bg-3, rgba(0,0,0,0.03))",
              cursor: "pointer",
              transition: "all 0.15s",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
            }}
          >
            <Sliders
              size={16}
              color={useCustom ? lv.color : "var(--fg-3)"}
              strokeWidth={2.5}
            />
            <span
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: useCustom ? lv.color : "var(--fg, #111)",
              }}
            >
              Custom
            </span>
            <span
              style={{
                fontSize: 9,
                fontFamily: "monospace",
                color: "var(--fg-3, #9ca3af)",
              }}
            >
              Set your own
            </span>
          </button>
        </div>

        {/* Custom input — expands when selected */}
        <div
          style={{
            maxHeight: useCustom ? 120 : 0,
            overflow: "hidden",
            transition: "max-height 0.35s cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          <div style={{ paddingTop: 4 }}>
            <div
              style={{
                fontSize: 11,
                fontFamily: "monospace",
                color: "var(--fg-3)",
                letterSpacing: 1,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Custom interval (minutes)
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="number"
                min={5}
                max={480}
                placeholder="e.g. 45"
                value={customMins}
                onChange={(e) => {
                  setCustomMins(e.target.value);
                  setCustomError("");
                }}
                style={{
                  flex: 1,
                  padding: "11px 14px",
                  background: "var(--bg-3, rgba(0,0,0,0.04))",
                  border: `1.5px solid ${customError ? "#ef4444" : useCustom ? lv.color + "60" : "var(--border)"}`,
                  borderRadius: 10,
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--fg)",
                  outline: "none",
                  fontFamily: "monospace",
                  transition: "border-color 0.15s",
                }}
              />
              <div
                style={{
                  fontSize: 12,
                  color: "var(--fg-3)",
                  fontFamily: "monospace",
                  flexShrink: 0,
                }}
              >
                min
              </div>
              {customMins && parseInt(customMins) > 0 && (
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: lv.color,
                    background: `${lv.color}15`,
                    border: `1px solid ${lv.color}30`,
                    padding: "6px 10px",
                    borderRadius: 8,
                    flexShrink: 0,
                    fontFamily: "monospace",
                  }}
                >
                  {effectiveLabel}
                </div>
              )}
            </div>
            {customError && (
              <div
                style={{
                  fontSize: 11,
                  color: "#ef4444",
                  marginTop: 6,
                  fontFamily: "monospace",
                }}
              >
                ⚠ {customError}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timer / Start */}
      {active ? (
        <div
          style={{
            ...cardStyle,
            textAlign: "center",
            borderColor: `${lv.color}40`,
            background: `${lv.color}08`,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontFamily: "monospace",
              color: lv.color,
              letterSpacing: 2,
              textTransform: "uppercase",
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            Reminder Active · Every {effectiveLabel}
          </div>
          <div
            style={{
              fontSize: 44,
              fontWeight: 900,
              color: lv.color,
              letterSpacing: -1.5,
              lineHeight: 1,
              marginBottom: 6,
            }}
          >
            {countdown || "Starting…"}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--fg-3, #9ca3af)",
              fontFamily: "monospace",
              marginBottom: 18,
            }}
          >
            Reapply at{" "}
            {nextAt
              ? new Date(nextAt).toLocaleTimeString("en-AU", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—"}
          </div>
          <button
            onClick={stop}
            style={{
              padding: "10px 22px",
              borderRadius: 10,
              background: "var(--bg-3, rgba(0,0,0,0.06))",
              border: "1px solid var(--border, rgba(0,0,0,0.1))",
              color: "var(--fg-2, #555)",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Stop Reminder
          </button>
        </div>
      ) : (
        <button
          onClick={start}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: 16,
            border: "none",
            background: lv.color,
            color: "#fff",
            boxShadow: `0 8px 24px ${lv.color}40`,
            fontSize: 15,
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginBottom: 14,
            transition: "all 0.2s",
            opacity:
              useCustom && (!customMins || parseInt(customMins) <= 0) ? 0.5 : 1,
          }}
        >
          {countdown === "Time to reapply!" ? (
            <>
              <Droplets size={18} strokeWidth={2.5} /> Reapply Now &amp; Restart
            </>
          ) : (
            <>
              <Play size={18} fill="#fff" /> Start{" "}
              {effectiveMins ? `${effectiveLabel} ` : ""}Reminder
            </>
          )}
        </button>
      )}

      {/* Alert */}
      {countdown === "Time to reapply!" && !active && (
        <div
          style={{
            padding: "14px 18px",
            borderRadius: 14,
            border: `1px solid ${lv.color}60`,
            background: `${lv.color}10`,
            color: lv.color,
            fontSize: 14,
            fontWeight: 800,
            marginBottom: 14,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <AlertTriangle size={18} strokeWidth={2.5} /> Time to reapply your
          sunscreen!
        </div>
      )}

      {/* Rules */}
      <div
        style={{
          background: "var(--bg-2, #fff)",
          border: "1px solid var(--border, rgba(0,0,0,0.08))",
          borderRadius: 18,
          padding: "16px 18px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <Info size={15} color={lv.color} />
          <span
            style={{ fontSize: 13, fontWeight: 800, color: "var(--fg, #111)" }}
          >
            Reapplication Rules
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {RULES.map((rule) => (
            <div
              key={rule}
              style={{ display: "flex", gap: 10, alignItems: "flex-start" }}
            >
              <Check
                size={14}
                color={lv.color}
                style={{ flexShrink: 0, marginTop: 2 }}
              />
              <span
                style={{
                  fontSize: 12,
                  color: "var(--fg-2, #555)",
                  lineHeight: 1.6,
                }}
              >
                {rule}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
