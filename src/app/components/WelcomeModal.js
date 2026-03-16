"use client";
import { useState, useEffect } from "react";
import { Sun, Thermometer, Droplets, Shield, Activity, X, ChevronLeft, ChevronRight } from "lucide-react";

// Full onboarding guide shown on every app launch (and can be re-opened via the info button)
export default function WelcomeModal({ forceOpen, onClose: externalClose }) {
  const [open, setOpen] = useState(false);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    if (forceOpen) { setOpen(true); setSlide(0); return; }
    // Show on every fresh launch (not just once)
    const seen = sessionStorage.getItem("uvibe_guide_seen");
    if (!seen) { setOpen(true); }
  }, [forceOpen]);

  const handleClose = () => {
    const isFirstTime = !sessionStorage.getItem("uvibe_guide_seen");
    sessionStorage.setItem("uvibe_guide_seen", "true");
    setOpen(false);
    externalClose?.(isFirstTime);
  };

  if (!open) return null;

  const SLIDES = [
    {
      icon: <Sun size={28} color="#f59e0b" fill="#f59e0b" />,
      title: "Welcome to UVibe",
      subtitle: "Your smart UV & Heat safety dashboard",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ fontSize: 14, color: "var(--fg-2, #aaa)", lineHeight: 1.7, margin: 0 }}>
            UVibe gives you <strong style={{ color: "var(--fg, #f0f0f0)" }}>live UV index data</strong> from ARPANSA (Australia's radiation authority),
            combined with real-time heat stress calculations and personalised sun protection advice.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { icon: "☀️", label: "Live UV Index", desc: "Real-time ARPANSA data" },
              { icon: "🌡️", label: "Heat Stress (WBGT)", desc: "International standard" },
              { icon: "💧", label: "Sweat Loss", desc: "Personalised hydration" },
              { icon: "🛡️", label: "Smart Suggestions", desc: "Activity-based advice" },
            ].map(({ icon, label, desc }) => (
              <div key={label} style={{ background: "var(--bg-3, #13132a)", borderRadius: 12, padding: "12px 14px", border: "1px solid var(--border, rgba(255,255,255,0.08))" }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--fg, #f0f0f0)" }}>{label}</div>
                <div style={{ fontSize: 10, color: "var(--fg-3, #888)", marginTop: 2 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      icon: <Sun size={28} color="#f59e0b" />,
      title: "UV Risk Scale",
      subtitle: "How dangerous is the sun right now?",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { range: "0 – 2", label: "Low",       color: "#22c55e", bg: "rgba(34,197,94,0.1)",   tip: "No protection needed. Enjoy the outdoors." },
            { range: "3 – 5", label: "Moderate",  color: "#fbbf24", bg: "rgba(251,191,36,0.1)",  tip: "Seek shade at noon. Sunscreen SPF 30+ recommended." },
            { range: "6 – 7", label: "High",      color: "#f97316", bg: "rgba(249,115,22,0.1)",  tip: "Sun protection essential. Limit 10am–4pm exposure." },
            { range: "8–10",  label: "Very High", color: "#ef4444", bg: "rgba(239,68,68,0.1)",   tip: "Extra protection required. Avoid midday sun." },
            { range: "11+",   label: "Extreme",   color: "#a855f7", bg: "rgba(168,85,247,0.1)",  tip: "Unprotected skin burns in minutes. Stay indoors." },
          ].map(({ range, label, color, bg, tip }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 12, background: bg, border: `1px solid ${color}30` }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color }}>{label}</span>
                  <span style={{ fontSize: 10, color: "var(--fg-3, #888)", fontFamily: "monospace" }}>UV {range}</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--fg-2, #aaa)", marginTop: 2 }}>{tip}</div>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: <Shield size={28} color="#22c55e" />,
      title: "Fitzpatrick Skin Type",
      subtitle: "How your skin responds to UV",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ fontSize: 12, color: "var(--fg-3, #888)", margin: "0 0 4px", lineHeight: 1.6 }}>
            The Fitzpatrick scale classifies skin's sensitivity to UV, used to calculate your personal <strong style={{ color: "var(--fg, #f0f0f0)" }}>Time to Burn</strong>.
          </p>
          {[
            { type: "I",   swatch: "#fde8d8", desc: "Always burns, never tans",          burn: "~10 min at UV 6" },
            { type: "II",  swatch: "#f5cba7", desc: "Usually burns, sometimes tans",      burn: "~15 min at UV 6" },
            { type: "III", swatch: "#e59866", desc: "Sometimes burns, always tans",       burn: "~20 min at UV 6" },
            { type: "IV",  swatch: "#ca8b4a", desc: "Rarely burns, always tans",          burn: "~30 min at UV 6" },
            { type: "V",   swatch: "#7d5a3c", desc: "Very rarely burns, tans darkly",     burn: "~45 min at UV 6" },
            { type: "VI",  swatch: "#3d1c02", desc: "Never burns, deeply pigmented",      burn: "~60+ min at UV 6" },
          ].map(({ type, swatch, desc, burn }) => (
            <div key={type} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, background: "var(--bg-3, #13132a)", border: "1px solid var(--border, rgba(255,255,255,0.06))" }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: swatch, border: "1px solid rgba(255,255,255,0.15)", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--fg, #f0f0f0)" }}>Type {type}</span>
                <span style={{ fontSize: 11, color: "var(--fg-3, #888)", marginLeft: 8 }}>{desc}</span>
              </div>
              <span style={{ fontSize: 10, color: "#f59e0b", fontFamily: "monospace", flexShrink: 0 }}>{burn}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: <Thermometer size={28} color="#ef4444" />,
      title: "Heat Stress (WBGT)",
      subtitle: "Detecting dangerous heat beyond temperature",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444", marginBottom: 6 }}>What is WBGT?</div>
            <p style={{ fontSize: 13, color: "var(--fg-2, #aaa)", margin: 0, lineHeight: 1.7 }}>
              <strong style={{ color: "var(--fg, #f0f0f0)" }}>Wet Bulb Globe Temperature</strong> is the international standard for measuring true heat stress on the human body. 
              It combines air temperature, humidity, and wind speed — giving a much more accurate picture than air temperature alone.
            </p>
          </div>
          <div style={{ background: "var(--bg-3, #13132a)", borderRadius: 12, padding: "14px 16px", border: "1px solid var(--border, rgba(255,255,255,0.08))" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--fg, #f0f0f0)", marginBottom: 10 }}>WBGT Risk Levels</div>
            {[
              { range: "< 18°C", label: "Safe",          color: "#22c55e" },
              { range: "18–28°C",label: "Moderate Risk", color: "#fbbf24" },
              { range: "28–32°C",label: "High Risk",     color: "#f97316" },
              { range: "> 32°C", label: "Extreme Risk",  color: "#ef4444" },
            ].map(({ range, label, color }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--border, rgba(255,255,255,0.05))" }}>
                <span style={{ fontSize: 12, color: "var(--fg-2, #aaa)", fontFamily: "monospace" }}>{range}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      icon: <Droplets size={28} color="#0ea5e9" />,
      title: "Live Sweat Loss",
      subtitle: "Personalised hydration calculations",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ fontSize: 13, color: "var(--fg-2, #aaa)", margin: 0, lineHeight: 1.7 }}>
            Your sweat loss (mL/hr) is calculated using your <strong style={{ color: "var(--fg, #f0f0f0)" }}>body weight, age, and live WBGT</strong>, based on thermodynamic sweat rate models.
          </p>
          <div style={{ background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#0ea5e9", marginBottom: 8 }}>Hydration Formula</div>
            <div style={{ fontSize: 12, color: "var(--fg-2, #aaa)", lineHeight: 1.8 }}>
              Cups/hr = <code style={{ color: "#0ea5e9" }}>sweat_loss_ml ÷ 250</code> (1 standard cup)<br />
              <br />
              <strong style={{ color: "var(--fg, #f0f0f0)" }}>Normal:</strong> "Keep sipping water"<br />
              <strong style={{ color: "#f97316" }}>WBGT &gt; 28°C:</strong> "Water + Electrolytes"
            </div>
          </div>
        </div>
      ),
    },
    {
      icon: <Activity size={28} color="#a855f7" />,
      title: "Activity Suggestions",
      subtitle: "Smart advice based on heat + UV thresholds",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontSize: 12, color: "var(--fg-3, #888)", margin: 0, lineHeight: 1.6 }}>
            Advice differs by activity type — high-intensity activities have stricter limits than casual ones.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { activity: "🚴 Cycling",    wbgt: "29°C", uv: "9", reason: "High metabolic rate → heat exhaustion risk sooner" },
              { activity: "🚶 Walking",    wbgt: "31°C", uv: "8", reason: "Slower pace → longer UV exposure per distance" },
              { activity: "🏋️ Gym (Indoor)",wbgt: "N/A", uv: "N/A", reason: "Always safe — no direct UV or solar heat gain" },
            ].map(({ activity, wbgt, uv, reason }) => (
              <div key={activity} style={{ background: "var(--bg-3, #13132a)", borderRadius: 12, padding: "12px 14px", border: "1px solid var(--border, rgba(255,255,255,0.08))" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--fg, #f0f0f0)" }}>{activity}</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <span style={{ fontSize: 10, fontFamily: "monospace", background: "rgba(239,68,68,0.15)", color: "#ef4444", padding: "2px 8px", borderRadius: 8 }}>🌡 {wbgt}</span>
                    <span style={{ fontSize: 10, fontFamily: "monospace", background: "rgba(245,158,11,0.15)", color: "#f59e0b", padding: "2px 8px", borderRadius: 8 }}>UV {uv}</span>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "var(--fg-3, #888)" }}>{reason}</div>
              </div>
            ))}
          </div>
          <div style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#a855f7", marginBottom: 4 }}>Sunburn Warning Colours</div>
            <div style={{ fontSize: 11, color: "var(--fg-2, #aaa)", lineHeight: 1.7 }}>
              🟢 UV &lt; 3 — Safe. No protection needed.<br />
              🟡 UV 3–7 — Moderate/High risk. Cover up.<br />
              🔴 UV 8+ — Extreme. Find shade immediately.
            </div>
          </div>
        </div>
      ),
    },
  ];

  const current = SLIDES[slide];
  const isLast = slide === SLIDES.length - 1;

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.65)", backdropFilter: "blur(16px)", padding: 20 }}
    >
      <div
        style={{ width: "100%", maxWidth: 480, background: "var(--bg-2, #0d0d1a)", borderRadius: 28, boxShadow: "0 32px 80px rgba(0,0,0,0.4)", overflow: "hidden", border: "1px solid var(--border-2, rgba(255,255,255,0.12))", display: "flex", flexDirection: "column", maxHeight: "90vh" }}
      >
        {/* Header */}
        <div style={{ padding: "20px 22px 16px", borderBottom: "1px solid var(--border, rgba(255,255,255,0.08))", display: "flex", alignItems: "center", gap: 14, position: "relative" }}>
          <div style={{ width: 46, height: 46, borderRadius: 14, background: "var(--bg-3, #13132a)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-2, rgba(255,255,255,0.1))", flexShrink: 0 }}>
            {current.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: "var(--fg, #f0f0f0)", letterSpacing: -0.4 }}>{current.title}</div>
            <div style={{ fontSize: 12, color: "var(--fg-3, #888)", marginTop: 2 }}>{current.subtitle}</div>
          </div>
          <button onClick={handleClose} style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--bg-3, #13132a)", border: "1px solid var(--border, rgba(255,255,255,0.1))", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--fg-3, #888)", flexShrink: 0 }}>
            <X size={14} />
          </button>
        </div>

        {/* Slide dots */}
        <div style={{ display: "flex", gap: 5, justifyContent: "center", padding: "10px 22px 0" }}>
          {SLIDES.map((_, i) => (
            <div key={i} onClick={() => setSlide(i)} style={{ width: i === slide ? 20 : 6, height: 6, borderRadius: 6, background: i === slide ? "#22c55e" : "var(--border-2, rgba(255,255,255,0.15))", cursor: "pointer", transition: "all 0.2s" }} />
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 22px", scrollbarWidth: "none" }}>
          {current.content}
        </div>

        {/* Footer navigation */}
        <div style={{ padding: "14px 22px 20px", borderTop: "1px solid var(--border, rgba(255,255,255,0.08))", display: "flex", alignItems: "center", gap: 10 }}>
          {slide > 0 && (
            <button
              onClick={() => setSlide(s => s - 1)}
              style={{ padding: "10px 16px", borderRadius: 12, border: "1px solid var(--border-2, rgba(255,255,255,0.12))", background: "var(--bg-3, #13132a)", color: "var(--fg-2, #ccc)", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
            >
              <ChevronLeft size={16} /> Back
            </button>
          )}
          <button
            onClick={isLast ? handleClose : () => setSlide(s => s + 1)}
            style={{ flex: 1, padding: "12px", borderRadius: 14, border: "none", background: isLast ? "#22c55e" : "#f59e0b", color: "white", fontSize: 14, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: isLast ? "0 4px 20px rgba(34,197,94,0.3)" : "0 4px 20px rgba(245,158,11,0.3)", transition: "all 0.2s" }}
          >
            {isLast ? (
              <><Shield size={16} /> Get Started</>
            ) : (
              <>Next <ChevronRight size={16} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
