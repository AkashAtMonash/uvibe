"use client";

import {
  Sun,
  LineChart,
  ShieldCheck,
  Settings,
  MapPin,
  SunMedium,
  Moon,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "home", icon: SunMedium, label: "UV Index", sub: "Live Data" },
  {
    id: "awareness",
    icon: LineChart,
    label: "Awareness",
    sub: "Data & Trends",
  },
  {
    id: "prevention",
    icon: ShieldCheck,
    label: "Prevention",
    sub: "SPF & Clothing",
  },
  { id: "settings", icon: Settings, label: "Settings", sub: "Preferences" },
];

// Compact Sun/Moon pill toggle used in both Sidebar + BottomNav header
function ThemeToggle({ theme, setTheme }) {
  if (!setTheme) return null;
  const isDark = theme === "dark" || theme === "black";
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "Switch to Light mode" : "Switch to Dark mode"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "5px 12px",
        borderRadius: 24,
        border: `1.5px solid ${isDark ? "rgba(255,255,255,0.12)" : "#fbbf24"}`,
        background: isDark ? "rgba(255,255,255,0.05)" : "#fffbeb",
        color: isDark ? "#d1d5db" : "#b45309",
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer",
        transition: "all 0.2s",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {isDark ? (
        <>
          <Moon size={13} fill="#94a3b8" color="#94a3b8" />
          <span>Moon</span>
        </>
      ) : (
        <>
          <Sun size={13} fill="#f59e0b" color="#f59e0b" />
          <span>Sun</span>
        </>
      )}
    </button>
  );
}

export function Sidebar({
  page,
  setPage,
  city,
  geoGranted,
  hasNotif,
  theme,
  setTheme,
}) {
  return (
    <aside
      className="hidden md:flex w-[260px] h-[100dvh] flex-col shrink-0 z-20 relative"
      style={{
        background: "var(--glass-bg-light, rgba(255,255,255,0.65))",
        backdropFilter: "blur(40px) saturate(150%)",
        borderRight:
          "1px solid var(--glass-border-light, rgba(255,255,255,0.3))",
        boxShadow: "var(--apple-shadow-sm)",
      }}
      aria-label="Main navigation"
    >
      <div
        style={{
          padding: "28px 20px 20px",
          borderBottom: "1px solid var(--glass-border-light, rgba(0,0,0,0.06))",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 6,
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--bg-2, white)",
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <Sun
              className="w-5 h-5 text-sun-500"
              style={{ color: "#f59e0b" }}
            />
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: -0.5,
              color: "var(--fg, #111)",
            }}
          >
            UVibe
          </div>
        </div>
        <div
          style={{
            fontSize: 9,
            fontFamily: "monospace",
            color: "var(--fg-3, #aaa)",
            letterSpacing: 2,
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          UV Safety · Australia
        </div>
        <ThemeToggle theme={theme} setTheme={setTheme} />
      </div>

      <nav
        style={{
          flex: 1,
          padding: "16px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = page === item.id;
          return (
            <button
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 14px",
                borderRadius: 14,
                fontSize: 14,
                fontWeight: 600,
                textAlign: "left",
                cursor: "pointer",
                border: "none",
                background: isActive ? "rgba(245,158,11,0.1)" : "transparent",
                color: isActive ? "#f59e0b" : "var(--fg-2, #555)",
                borderLeft: `2px solid ${isActive ? "#f59e0b" : "transparent"}`,
                transition: "all 0.2s",
              }}
              onClick={() => setPage(item.id)}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  {item.label}
                </div>
                <span
                  style={{
                    fontSize: 9,
                    fontFamily: "monospace",
                    color: isActive ? "#f59e0b" : "var(--fg-3, #aaa)",
                    display: "block",
                    marginTop: 1,
                    letterSpacing: 0.5,
                  }}
                >
                  {item.sub}
                </span>
              </div>
            </button>
          );
        })}
      </nav>

      <div
        style={{
          padding: "14px 18px 20px",
          borderTop: "1px solid var(--glass-border-light, rgba(0,0,0,0.06))",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 12px",
            background: "var(--bg-2, rgba(255,255,255,0.5))",
            border: "1px solid rgba(0,0,0,0.06)",
            borderRadius: 10,
            fontSize: 11,
            fontFamily: "monospace",
            color: "var(--fg-2, #666)",
            marginBottom: 8,
          }}
        >
          <MapPin
            size={13}
            strokeWidth={geoGranted ? 2.5 : 1.5}
            color={geoGranted ? "#f59e0b" : "currentColor"}
          />
          <span>{city}</span>
        </div>
        <div
          style={{
            fontSize: 9,
            fontFamily: "monospace",
            color: "var(--fg-3, #aaa)",
            lineHeight: 1.7,
          }}
        >
          UV data · ARPANSA
          <br />
          Weather · OpenWeather
          <br />© 2025 UVibe
        </div>
      </div>
    </aside>
  );
}

export function BottomNav({ page, setPage, hasNotif, theme, setTheme }) {
  return (
    // ✅ flex and flex-col moved to className so md:hidden can properly override display
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-[100] flex flex-col"
      style={{
        background: "var(--bottom-nav-bg, rgba(255,255,255,0.85))",
        backdropFilter: "blur(40px) saturate(180%)",
        borderTop: "1px solid var(--glass-border-light, rgba(0,0,0,0.08))",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
      }}
      aria-label="Main navigation"
    >
      {/* Mobile Theme Toggle Strip */}
      <div
        style={{
          padding: "8px 16px",
          display: "flex",
          justifyContent: "flex-end",
          borderBottom: "1px solid var(--glass-border-light, rgba(0,0,0,0.03))",
        }}
      >
        <ThemeToggle theme={theme} setTheme={setTheme} />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          padding: "8px 8px 0",
        }}
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = page === item.id;
          return (
            <button
              key={item.id}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                padding: "6px 4px",
                borderRadius: 12,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: isActive ? "#f59e0b" : "var(--fg-3, #9ca3af)",
                transition: "all 0.2s",
              }}
              onClick={() => setPage(item.id)}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
            >
              <div style={{ position: "relative" }}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                {item.id === "settings" && hasNotif && (
                  <span
                    style={{
                      position: "absolute",
                      top: -2,
                      right: -4,
                      width: 8,
                      height: 8,
                      background: "#f59e0b",
                      borderRadius: "50%",
                      border: "2px solid white",
                    }}
                  />
                )}
              </div>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  fontFamily: "monospace",
                  letterSpacing: 0.3,
                }}
              >
                {item.label}
              </span>
              <div
                style={{
                  width: 3,
                  height: 3,
                  borderRadius: "50%",
                  background: "#f59e0b",
                  opacity: isActive ? 1 : 0,
                  boxShadow: "0 0 6px #f59e0b",
                  transition: "opacity 0.2s",
                }}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
