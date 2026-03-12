"use client";

const NAV_ITEMS = [
  { id: "home", icon: "🌤", label: "Home", sub: "Live UV" },
  { id: "awareness", icon: "📊", label: "Awareness", sub: "Data & Trends" },
  { id: "prevention", icon: "🧴", label: "Prevention", sub: "SPF & Clothing" },
  { id: "profile", icon: "⚙️", label: "Settings", sub: "Preferences" },
];

export function Sidebar({ page, setPage, city, geoGranted, uvColor, uvDim }) {
  return (
    <aside className="sidebar" aria-label="Main navigation">
      <div className="sidebar-head">
        <div className="sidebar-brand">
          <div
            className="brand-mark"
            style={{ background: uvDim, boxShadow: `0 4px 20px ${uvDim}` }}
          >
            ☀️
          </div>
          <div className="brand-text">
            <div className="brand-name">UVibe</div>
            <div className="brand-sub">UV Safety · AU</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`nav-btn ${page === item.id ? "on" : ""}`}
            style={
              page === item.id
                ? {
                    background: uvDim,
                    borderLeftColor: uvColor,
                    color: uvColor,
                  }
                : {}
            }
            onClick={() => setPage(item.id)}
            aria-current={page === item.id ? "page" : undefined}
          >
            <span className="nav-icon">{item.icon}</span>
            <div>
              <div className="nav-label">{item.label}</div>
              <div className="nav-sub">{item.sub}</div>
            </div>
          </button>
        ))}
      </nav>

      <div className="sidebar-foot">
        <div className="city-chip">
          <span>{geoGranted ? "📍" : "🏙️"}</span>
          <span>{city}</span>
        </div>
        <div className="foot-meta">
          UV data · ARPANSA
          <br />© 2025 UVibe
        </div>
      </div>
    </aside>
  );
}

export function BottomNav({ page, setPage, uvColor }) {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          className={`bnav-btn ${page === item.id ? "on" : ""}`}
          style={page === item.id ? { color: uvColor } : {}}
          onClick={() => setPage(item.id)}
          aria-current={page === item.id ? "page" : undefined}
          aria-label={item.label}
        >
          <span className="bnav-icon">{item.icon}</span>
          <span className="bnav-label">{item.label}</span>
          <div
            className="bnav-pip"
            style={{ background: uvColor, boxShadow: `0 0 8px ${uvColor}` }}
          />
        </button>
      ))}
    </nav>
  );
}
