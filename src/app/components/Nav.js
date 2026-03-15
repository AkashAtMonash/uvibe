"use client";

const NAV_ITEMS = [
  { id: "home", icon: "◎", label: "UV Index", sub: "Live Data" },
  { id: "awareness", icon: "↗", label: "Awareness", sub: "Data & Trends" },
  { id: "prevention", icon: "◈", label: "Prevention", sub: "SPF & Clothing" },
  { id: "settings", icon: "⊙", label: "Settings", sub: "Preferences" },
];

export function Sidebar({ page, setPage, city, geoGranted, hasNotif }) {
  return (
    <aside className="sidebar" aria-label="Main navigation">
      <div className="sidebar-top">
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">☀</div>
          <div className="sidebar-logo-name">UVibe</div>
        </div>
        <div className="sidebar-tagline">UV Safety · Australia</div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`sidebar-nav-item ${page === item.id ? "active" : ""}`}
            onClick={() => setPage(item.id)}
            aria-current={page === item.id ? "page" : undefined}
          >
            <span className="sidebar-nav-icon">{item.icon}</span>
            <div>
              <div className="sidebar-nav-label">{item.label}</div>
              <span className="sidebar-nav-sub">{item.sub}</span>
            </div>
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-city">
          <span>{geoGranted ? "◎" : "○"}</span>
          <span>{city}</span>
        </div>
        <div className="sidebar-meta">
          UV data · ARPANSA
          <br />
          Weather · OpenWeather
          <br />© 2025 UVibe
        </div>
      </div>
    </aside>
  );
}

export function BottomNav({ page, setPage, hasNotif }) {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          className={`bnav-item ${page === item.id ? "active" : ""}`}
          onClick={() => setPage(item.id)}
          aria-current={page === item.id ? "page" : undefined}
          aria-label={item.label}
        >
          <div style={{ position: "relative" }}>
            <span className="bnav-icon">{item.icon}</span>
            {item.id === "settings" && hasNotif && (
              <span
                style={{
                  position: "absolute",
                  top: -2,
                  right: -4,
                  width: 7,
                  height: 7,
                  background: "var(--uv)",
                  borderRadius: "50%",
                  border: "1.5px solid var(--bg)",
                }}
              />
            )}
          </div>
          <span className="bnav-label">{item.label}</span>
          <div className="bnav-dot" />
        </button>
      ))}
    </nav>
  );
}
