"use client";

import { useState, useEffect, useRef } from "react";

const SKIN_TYPES = [
  {
    type: "I",
    label: "Type I",
    desc: "Always burns, never tans",
    swatch: "#fde8d8",
  },
  {
    type: "II",
    label: "Type II",
    desc: "Usually burns, sometimes tans",
    swatch: "#f5cba7",
  },
  {
    type: "III",
    label: "Type III",
    desc: "Sometimes burns, always tans",
    swatch: "#e59866",
  },
  {
    type: "IV",
    label: "Type IV",
    desc: "Rarely burns, always tans",
    swatch: "#ca8b4a",
  },
  {
    type: "V",
    label: "Type V",
    desc: "Very rarely burns, tans darkly",
    swatch: "#7d5a3c",
  },
  {
    type: "VI",
    label: "Type VI",
    desc: "Never burns, deeply pigmented",
    swatch: "#3d1c02",
  },
];

const SPF_OPTIONS = [
  { val: 15, label: "SPF 15", note: "Minimum" },
  { val: 30, label: "SPF 30", note: "Standard" },
  { val: 50, label: "SPF 50+", note: "Recommended" },
];

const AGE_RANGES = [
  "Under 18",
  "18–24",
  "25–34",
  "35–44",
  "45–54",
  "55–64",
  "65+",
];

function Toggle({ id, checked, onChange }) {
  return (
    <label
      className="settings-toggle"
      htmlFor={id}
      style={{ cursor: "pointer" }}
    >
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
      <div className="divider-label label-sm" style={{ marginBottom: 10 }}>
        {title}
      </div>
      <div className="settings-group">{children}</div>
    </div>
  );
}

function Row({ label, desc, right }) {
  return (
    <div className="settings-row">
      <div className="settings-row-left">
        <div className="settings-row-label">{label}</div>
        {desc && <div className="settings-row-desc">{desc}</div>}
      </div>
      {right}
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
}) {
  const [name, setName] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [skinType, setSkinType] = useState("III");
  const [spf, setSpf] = useState(50);
  const [notif, setNotif] = useState(false);
  const [reapply, setReapply] = useState(false);
  const [threshold, setThreshold] = useState(6);
  const [saved, setSaved] = useState(false);
  const initialisedRef = useRef(false);

  useEffect(() => {
    if (initialisedRef.current) return;
    initialisedRef.current = true;
    setName(prefs.name ?? "");
    setAgeRange(prefs.ageRange ?? "");
    setSkinType(prefs.skinType ?? "III");
    setSpf(prefs.spf ?? 50);
    setNotif(prefs.notifEnabled ?? false);
    setReapply(prefs.reapplyReminder ?? false);
    setThreshold(prefs.alertThreshold ?? 6);
  }, [prefs]);

  const handleSave = async () => {
    const updated = {
      ...prefs,
      name,
      ageRange,
      skinType,
      spf,
      notifEnabled: notif,
      reapplyReminder: reapply,
      alertThreshold: threshold,
    };
    setPrefs(updated);
    onSyncPrefs?.(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const autoSave = (patch) => {
    const updated = {
      ...prefs,
      name,
      ageRange,
      skinType,
      spf,
      notifEnabled: notif,
      reapplyReminder: reapply,
      alertThreshold: threshold,
      ...patch,
    };
    setPrefs(updated);
    onSyncPrefs?.(updated);
  };

  const handleNotifToggle = async (val) => {
    setNotif(val);
    autoSave({ notifEnabled: val });
    if (val) await onRequestNotif?.({ ...prefs, notifEnabled: true });
  };

  const handleReapplyToggle = (val) => {
    setReapply(val);
    autoSave({ reapplyReminder: val });
  };

  const handleThresholdChange = (val) => {
    setThreshold(val);
    autoSave({ alertThreshold: val });
  };

  return (
    <div className="page anim-fade-in">
      <div className="anim-fade-up" style={{ marginBottom: 28 }}>
        <div
          style={{
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: -0.8,
            marginBottom: 4,
          }}
        >
          Settings
        </div>
        <div
          style={{
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            color: "var(--fg-3)",
          }}
        >
          Personalise your UVibe experience
        </div>
      </div>

      <Section title="Profile">
        <div
          style={{
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div>
            <div className="settings-row-label" style={{ marginBottom: 8 }}>
              Display Name
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name (optional)"
              style={{
                width: "100%",
                background: "var(--bg-3)",
                border: "1px solid var(--border-2)",
                borderRadius: "var(--r-sm)",
                padding: "10px 14px",
                fontSize: 14,
                color: "var(--fg)",
                fontFamily: "var(--font-display)",
                outline: "none",
              }}
            />
          </div>
          <div>
            <div className="settings-row-label" style={{ marginBottom: 8 }}>
              Age Range
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {AGE_RANGES.map((r) => (
                <button
                  key={r}
                  onClick={() => setAgeRange(r)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: "var(--font-display)",
                    border: `1px solid ${ageRange === r ? "var(--uv)" : "var(--border)"}`,
                    background: ageRange === r ? "var(--uv-10)" : "transparent",
                    color: ageRange === r ? "var(--uv)" : "var(--fg-2)",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section title="Appearance">
        <div style={{ padding: "16px 20px 8px" }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "var(--fg)",
              marginBottom: 12,
            }}
          >
            Theme
          </div>
          <div className="theme-options">
            {[
              {
                id: "black",
                label: "Black",
                dark: "#0a0a0a",
                light: "#1a1a1a",
              },
              {
                id: "white",
                label: "White",
                dark: "#f0ede8",
                light: "#e8e4dd",
              },
            ].map((t) => (
              <button
                key={t.id}
                className={`theme-option ${theme === t.id ? "active" : ""}`}
                onClick={() => setTheme(t.id)}
              >
                <div className="theme-preview">
                  <div
                    className="theme-preview-half"
                    style={{ background: t.dark }}
                  />
                  <div
                    className="theme-preview-half"
                    style={{ background: t.light }}
                  />
                </div>
                <div className="theme-preview-label">{t.label}</div>
              </button>
            ))}
          </div>
        </div>
        <Row
          label="High Contrast"
          desc="Enhanced borders and text for outdoor use"
          right={
            <Toggle
              id="contrast"
              checked={contrast}
              onChange={(e) => setContrast(e.target.checked)}
            />
          }
        />
      </Section>

      <Section title="Sun Protection Profile">
        <div style={{ padding: "16px 20px" }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "var(--fg)",
              marginBottom: 12,
            }}
          >
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
                  borderRadius: "var(--r-sm)",
                  border: `1px solid ${skinType === s.type ? "var(--uv)" : "var(--border)"}`,
                  background:
                    skinType === s.type ? "var(--uv-10)" : "var(--surface)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  width: "100%",
                  textAlign: "left",
                  fontFamily: "var(--font-display)",
                }}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: s.swatch,
                    border: "1px solid var(--border-2)",
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: skinType === s.type ? "var(--uv)" : "var(--fg)",
                    }}
                  >
                    {s.label}
                  </div>
                  <div
                    style={{ fontSize: 11, color: "var(--fg-2)", marginTop: 1 }}
                  >
                    {s.desc}
                  </div>
                </div>
                {skinType === s.type && (
                  <div style={{ marginLeft: "auto", color: "var(--uv)" }}>
                    ✓
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
        <div style={{ padding: "0 20px 16px" }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "var(--fg)",
              marginBottom: 12,
            }}
          >
            Default SPF
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {SPF_OPTIONS.map((s) => (
              <button
                key={s.val}
                onClick={() => setSpf(s.val)}
                style={{
                  flex: 1,
                  padding: "12px 8px",
                  borderRadius: "var(--r-sm)",
                  border: `1px solid ${spf === s.val ? "var(--uv)" : "var(--border)"}`,
                  background: spf === s.val ? "var(--uv-10)" : "var(--surface)",
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
                    color: spf === s.val ? "var(--uv)" : "var(--fg)",
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    fontFamily: "var(--font-mono)",
                    color: "var(--fg-3)",
                  }}
                >
                  {s.note}
                </div>
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Notifications">
        <Row
          label="UV Alerts"
          desc="Push notifications when UV reaches dangerous levels"
          right={
            <Toggle
              id="notif"
              checked={notif}
              onChange={(e) => handleNotifToggle(e.target.checked)}
            />
          }
        />
        <Row
          label="Reapplication Reminders"
          desc="Periodic reminders to reapply sunscreen based on UV level"
          right={
            <Toggle
              id="reapply"
              checked={reapply}
              onChange={(e) => handleReapplyToggle(e.target.checked)}
            />
          }
        />
        <Row
          label="Alert UV Threshold"
          desc="Notify me when UV reaches this level or above"
          right={
            <select
              className="settings-select"
              value={threshold}
              onChange={(e) => handleThresholdChange(parseInt(e.target.value))}
            >
              <option value={3}>UV 3+ Moderate</option>
              <option value={6}>UV 6+ High</option>
              <option value={8}>UV 8+ Very High</option>
              <option value={11}>UV 11+ Extreme</option>
            </select>
          }
        />
      </Section>

      <Section title="Data & Privacy">
        <Row
          label="Location Data"
          desc="Your GPS coordinates are only used to match the nearest city. Never stored on our servers."
        />
        <Row
          label="Reset Location"
          desc="Clear saved location and ask again on next visit"
          right={
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                localStorage.removeItem("uvibe_location");
                window.location.reload();
              }}
            >
              Reset
            </button>
          }
        />
      </Section>

      <div className="anim-fade-up" style={{ marginBottom: 32 }}>
        <button
          className="btn btn-uv"
          onClick={handleSave}
          style={{
            width: "100%",
            padding: "16px",
            fontSize: 15,
            fontWeight: 800,
            background: saved ? "#22d3aa" : "var(--uv)",
            boxShadow: `0 8px 32px var(--uv-20)`,
            transition: "background 0.3s",
          }}
        >
          {saved ? "✓ Saved" : "Save Changes"}
        </button>
      </div>

      <div className="anim-fade-up" style={{ marginBottom: 32 }}>
        <div
          style={{
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r)",
            padding: 20,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              color: "var(--fg-3)",
              letterSpacing: 1,
              marginBottom: 8,
            }}
          >
            ABOUT UVIBE
          </div>
          <div style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.7 }}>
            UV data courtesy of{" "}
            <strong style={{ color: "var(--fg)" }}>ARPANSA</strong> (Australian
            Radiation Protection and Nuclear Safety Agency).
            <br />
            Weather data by{" "}
            <strong style={{ color: "var(--fg)" }}>OpenWeather</strong>.<br />
            Built for FIT5120 · Monash University 2025.
          </div>
        </div>
      </div>
    </div>
  );
}
