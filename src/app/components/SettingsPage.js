"use client";
// src/components/SettingsPage.js

import { useState, useEffect, useRef } from "react";

const SKIN_TYPES = [
  { type: "I",   label: "Type I",   desc: "Always burns, never tans",          swatch: "#fde8d8" },
  { type: "II",  label: "Type II",  desc: "Usually burns, sometimes tans",      swatch: "#f5cba7" },
  { type: "III", label: "Type III", desc: "Sometimes burns, always tans",       swatch: "#e59866" },
  { type: "IV",  label: "Type IV",  desc: "Rarely burns, always tans",          swatch: "#ca8b4a" },
  { type: "V",   label: "Type V",   desc: "Very rarely burns, tans darkly",     swatch: "#7d5a3c" },
  { type: "VI",  label: "Type VI",  desc: "Never burns, deeply pigmented",      swatch: "#3d1c02" },
];

const SPF_OPTIONS = [
  { val: 15, label: "SPF 15",  note: "Minimum"     },
  { val: 30, label: "SPF 30",  note: "Standard"    },
  { val: 50, label: "SPF 50+", note: "Recommended" },
];

function Toggle({ id, checked, onChange }) {
  return (
    <label className="settings-toggle" htmlFor={id} style={{ cursor: "pointer" }}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
      />
      <div
        className="settings-toggle-track"
        style={{
          background: checked ? "var(--uv)" : "var(--bg-4)",
          borderColor: checked ? "var(--uv)" : "var(--border)",
        }}
      />
      <div
        className="settings-toggle-thumb"
        style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }}
      />
    </label>
  );
}

function Section({ title, children }) {
  return (
    <div className="settings-section">
      <div className="divider-label label-sm" style={{ marginBottom: 10, color: "var(--fg-3)", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>
        {title}
      </div>
      <div className="settings-group" style={{ background: "var(--surface, #1a1a2e)", borderRadius: "var(--r, 16px)", border: "1px solid var(--border, rgba(255,255,255,0.08))", overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}

function Row({ label, desc, right }) {
  return (
    <div className="settings-row" style={{ display: "flex", alignItems: "center", padding: "14px 18px", borderBottom: "1px solid var(--border, rgba(255,255,255,0.06))", justifyContent: "space-between", gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg, #f0f0f0)" }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: "var(--fg-3, #888)", marginTop: 2 }}>{desc}</div>}
      </div>
      {right}
    </div>
  );
}

// Compact number stepper input
function NumberInput({ label, value, onChange, min, max, step = 1, unit }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: "var(--fg-3, #888)", textTransform: "uppercase", letterSpacing: 1 }}>
        {label}
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--bg-3, #111)", borderRadius: 10, border: "1px solid var(--border-2, rgba(255,255,255,0.12))", padding: "0 10px 0 0", overflow: "hidden" }}>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            flex: 1,
            padding: "10px 10px",
            background: "transparent",
            border: "none",
            color: "var(--fg, #f0f0f0)",
            fontSize: 15,
            fontWeight: 700,
            outline: "none",
            fontFamily: "var(--font-mono, monospace)",
            minWidth: 0,
          }}
        />
        {unit && <span style={{ fontSize: 11, color: "var(--fg-3, #888)", flexShrink: 0 }}>{unit}</span>}
      </div>
    </div>
  );
}

export default function SettingsPage({
  prefs,
  setPrefs,
  theme,
  setTheme,
  contrast,
  setContrast,
  onRequestNotif,
  onSyncPrefs,
  onTestNotif,
}) {
  const [testResult, setTestResult] = useState(null);
  const [name, setName]             = useState("");
  const [weight, setWeight]         = useState(70);
  const [age, setAge]               = useState(25);
  const [skinType, setSkinType]     = useState("III");
  const [spf, setSpf]               = useState(30);
  const [notif, setNotif]           = useState(false);
  const [reapply, setReapply]       = useState(false);
  const [threshold, setThreshold]   = useState(6);
  const [saved, setSaved]           = useState(false);
  const [notifError, setNotifError] = useState(null);
  const initialisedRef = useRef(false);

  useEffect(() => {
    if (initialisedRef.current) return;
    initialisedRef.current = true;
    setName(prefs.name ?? "");
    setWeight(prefs.weightKg ?? 70);
    setAge(prefs.ageYears ?? 25);
    setSkinType(prefs.skinType ?? "III");
    setSpf(prefs.spf ?? 30);
    setNotif(prefs.notifEnabled ?? false);
    setReapply(prefs.reapplyReminder ?? false);
    setThreshold(prefs.alertThreshold ?? 6);
  }, [prefs]);

  const buildUpdated = () => ({
    ...prefs,
    name,
    weightKg: weight,
    ageYears: age,
    skinType,
    spf,
    notifEnabled: notif,
    reapplyReminder: reapply,
    alertThreshold: threshold,
  });

  const handleSave = async () => {
    const updated = buildUpdated();
    setPrefs(updated);
    onSyncPrefs?.(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const autoSave = (patch) => {
    const updated = { ...buildUpdated(), ...patch };
    setPrefs(updated);
    onSyncPrefs?.(updated);
  };

  const handleNotifToggle = async (val) => {
    setNotif(val);
    autoSave({ notifEnabled: val });
    if (val) {
      setNotifError(null);
      const result = await onRequestNotif?.({ ...buildUpdated(), notifEnabled: true });
      if (result?.error) {
        setNotifError(result.error);
        setNotif(false);
        autoSave({ notifEnabled: false });
      }
    }
  };

  const inputStyle = {
    width: "100%",
    background: "var(--bg-3, #111)",
    border: "1px solid var(--border-2, rgba(255,255,255,0.12))",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 14,
    color: "var(--fg, #f0f0f0)",
    fontFamily: "var(--font-display)",
    outline: "none",
  };

  return (
    <div className="page anim-fade-in" style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px 100px" }}>
      {/* Header */}
      <div className="anim-fade-up" style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.8, marginBottom: 4, color: "var(--fg, #f0f0f0)" }}>
          Settings
        </div>
        <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--fg-3, #888)" }}>
          Personalise your UVibe experience
        </div>
      </div>

      {/* PROFILE section */}
      <Section title="Profile">
        <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Display Name */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: "var(--fg, #f0f0f0)", display: "block", marginBottom: 8 }}>
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name (optional)"
              style={inputStyle}
            />
          </div>

          {/* Age + Weight — numeric inputs in a grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <NumberInput
              label="Age"
              value={age}
              onChange={setAge}
              min={1} max={120} step={1}
              unit="yrs"
            />
            <NumberInput
              label="Weight"
              value={weight}
              onChange={setWeight}
              min={20} max={250} step={1}
              unit="kg"
            />
          </div>

        </div>
      </Section>

      {/* APPEARANCE */}
      <Section title="Appearance">
        <div style={{ padding: "16px 18px 8px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--fg, #f0f0f0)", marginBottom: 12 }}>Theme</div>
          <div style={{ display: "flex", gap: 12 }}>
            {[
              { id: "dark",  label: "Moon 🌙", desc: "Dark Mode",  bg: "#0a0a0a" },
              { id: "light", label: "Sun ☀️",  desc: "Light Mode", bg: "#f9fafb" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                style={{
                  flex: 1,
                  padding: "14px 12px",
                  borderRadius: 14,
                  border: `2px solid ${theme === t.id ? "var(--uv, #22c55e)" : "var(--border, rgba(255,255,255,0.1))"}`,
                  background: theme === t.id ? "var(--uv-10, rgba(34,197,94,0.1))" : "var(--surface, #1a1a2e)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 22, marginBottom: 4 }}>{t.id === "dark" ? "🌙" : "☀️"}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: theme === t.id ? "var(--uv, #22c55e)" : "var(--fg, #f0f0f0)" }}>{t.label}</div>
                <div style={{ fontSize: 10, color: "var(--fg-3, #888)", marginTop: 2 }}>{t.desc}</div>
              </button>
            ))}
          </div>
        </div>
        <Row
          label="High Contrast"
          desc="Enhanced borders and text for outdoor use"
          right={
            <Toggle id="contrast" checked={contrast} onChange={(e) => setContrast(e.target.checked)} />
          }
        />
      </Section>

      {/* SUN PROTECTION PROFILE */}
      <Section title="Sun Protection Profile">
        <div style={{ padding: "16px 18px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--fg, #f0f0f0)", marginBottom: 12 }}>
            Fitzpatrick Skin Type
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {SKIN_TYPES.map((s) => (
              <button
                key={s.type}
                onClick={() => setSkinType(s.type)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 14px",
                  borderRadius: 12,
                  border: `1px solid ${skinType === s.type ? "var(--uv, #22c55e)" : "var(--border, rgba(255,255,255,0.08))"}`,
                  background: skinType === s.type ? "var(--uv-10, rgba(34,197,94,0.08))" : "var(--bg-3, #111)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  width: "100%",
                  textAlign: "left",
                }}
              >
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: s.swatch, border: "1px solid rgba(255,255,255,0.15)", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: skinType === s.type ? "var(--uv, #22c55e)" : "var(--fg, #f0f0f0)" }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: "var(--fg-3, #888)", marginTop: 1 }}>{s.desc}</div>
                </div>
                {skinType === s.type && <div style={{ color: "var(--uv, #22c55e)", fontSize: 16 }}>✓</div>}
              </button>
            ))}
          </div>
        </div>

        {/* SPF */}
        <div style={{ padding: "0 18px 16px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--fg, #f0f0f0)", marginBottom: 12 }}>Default SPF</div>
          <div style={{ display: "flex", gap: 8 }}>
            {SPF_OPTIONS.map((s) => (
              <button
                key={s.val}
                onClick={() => setSpf(s.val)}
                style={{
                  flex: 1,
                  padding: "12px 8px",
                  borderRadius: 12,
                  border: `1px solid ${spf === s.val ? "var(--uv, #22c55e)" : "var(--border, rgba(255,255,255,0.08))"}`,
                  background: spf === s.val ? "var(--uv-10, rgba(34,197,94,0.08))" : "var(--bg-3, #111)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 800, color: spf === s.val ? "var(--uv, #22c55e)" : "var(--fg, #f0f0f0)" }}>{s.label}</div>
                <div style={{ fontSize: 10, color: "var(--fg-3, #888)" }}>{s.note}</div>
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* NOTIFICATIONS */}
      <Section title="Notifications">
        <Row
          label="UV Alerts"
          desc="Push notifications when UV reaches dangerous levels"
          right={
            <Toggle id="notif" checked={notif} onChange={(e) => handleNotifToggle(e.target.checked)} />
          }
        />
        {notifError && (
          <div style={{ padding: "8px 18px 12px", fontSize: 11, fontFamily: "var(--font-mono)", color: "#ef4444", lineHeight: 1.6 }}>
            ✗ {notifError}
          </div>
        )}
        <Row
          label="Reapplication Reminders"
          desc="Periodic reminders to reapply sunscreen based on UV level"
          right={
            <Toggle id="reapply" checked={reapply} onChange={(e) => { setReapply(e.target.checked); autoSave({ reapplyReminder: e.target.checked }); }} />
          }
        />
        <Row
          label="Alert UV Threshold"
          desc="Notify me when UV reaches this level or above"
          right={
            <select
              className="settings-select"
              value={threshold}
              onChange={(e) => { const v = parseInt(e.target.value); setThreshold(v); autoSave({ alertThreshold: v }); }}
              style={{ background: "var(--bg-3, #111)", color: "var(--fg, #f0f0f0)", border: "1px solid var(--border-2, rgba(255,255,255,0.12))", borderRadius: 8, padding: "6px 10px", fontSize: 13 }}
            >
              <option value={3}>UV 3+ Moderate</option>
              <option value={6}>UV 6+ High</option>
              <option value={8}>UV 8+ Very High</option>
              <option value={11}>UV 11+ Extreme</option>
            </select>
          }
        />
        <div style={{ padding: "12px 18px 16px" }}>
          <button
            className="btn btn-ghost"
            style={{ width: "100%", fontSize: 13, background: "var(--bg-3, #111)", border: "1px solid var(--border-2, rgba(255,255,255,0.12))", borderRadius: 10, padding: "12px", color: "var(--fg-2, #ccc)", cursor: "pointer" }}
            onClick={async () => {
              setTestResult("Sending…");
              const result = await onTestNotif?.();
              setTestResult(result?.success ? "✓ Test notification sent!" : `✗ ${result?.error ?? "Failed"}`);
              setTimeout(() => setTestResult(null), 4000);
            }}
          >
            🔔 Send Test Notification
          </button>
          {testResult && (
            <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 10, fontSize: 12, fontFamily: "var(--font-mono)", textAlign: "center", background: testResult.startsWith("✓") ? "rgba(34,211,170,0.1)" : "rgba(239,68,68,0.1)", color: testResult.startsWith("✓") ? "#22d3aa" : "#ef4444", border: `1px solid ${testResult.startsWith("✓") ? "rgba(34,211,170,0.3)" : "rgba(239,68,68,0.3)"}` }}>
              {testResult}
            </div>
          )}
        </div>
      </Section>

      {/* DATA & PRIVACY */}
      <Section title="Data &amp; Privacy">
        <Row
          label="Location Data"
          desc="Your GPS coordinates are only used to match the nearest city. Never stored on our servers."
        />
        <Row
          label="Reset Location"
          desc="Clear saved location and ask again on next visit"
          right={
            <button
              style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid var(--border-2, rgba(255,255,255,0.15))", background: "var(--bg-3, #111)", color: "var(--fg-2, #ccc)", fontSize: 13, cursor: "pointer" }}
              onClick={() => { localStorage.removeItem("uvibe_location"); window.location.reload(); }}
            >
              Reset
            </button>
          }
        />
      </Section>

      {/* SAVE */}
      <div className="anim-fade-up" style={{ marginTop: 24, marginBottom: 32 }}>
        <button
          onClick={handleSave}
          style={{
            width: "100%",
            padding: "16px",
            fontSize: 15,
            fontWeight: 800,
            borderRadius: 14,
            border: "none",
            background: saved ? "#22d3aa" : "#22c55e",
            color: "#fff",
            cursor: "pointer",
            boxShadow: "0 8px 32px rgba(34,197,94,0.3)",
            transition: "background 0.3s",
          }}
        >
          {saved ? "✓ Saved!" : "Save Changes"}
        </button>
      </div>

      {/* About */}
      <div className="anim-fade-up" style={{ marginBottom: 32 }}>
        <div style={{ background: "var(--bg-2, #0d0d1a)", border: "1px solid var(--border, rgba(255,255,255,0.08))", borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--fg-3, #888)", letterSpacing: 1, marginBottom: 8 }}>ABOUT UVIBE</div>
          <div style={{ fontSize: 13, color: "var(--fg-2, #aaa)", lineHeight: 1.7 }}>
            UV data courtesy of <strong style={{ color: "var(--fg, #f0f0f0)" }}>ARPANSA</strong> (Australian Radiation Protection and Nuclear Safety Agency).<br />
            Weather data by <strong style={{ color: "var(--fg, #f0f0f0)" }}>OpenWeather</strong>.
          </div>
        </div>
      </div>
    </div>
  );
}
