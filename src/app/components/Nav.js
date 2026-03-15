"use client";

import { Sun, LineChart, ShieldCheck, Settings, MapPin, Building2, SunMedium } from "lucide-react";

const NAV_ITEMS = [
  { id: "home", icon: Sun, label: "Home", sub: "Live UV" },
  { id: "awareness", icon: LineChart, label: "Awareness", sub: "UV Map · AI Lab" },
  { id: "prevention", icon: ShieldCheck, label: "Prevention", sub: "SPF & Clothing" },
  { id: "profile", icon: Settings, label: "Settings", sub: "Preferences" },
];

export function Sidebar({ page, setPage, city, geoGranted, uvColor, uvDim }) {
  return (
    <aside className="sidebar" aria-label="Main navigation">
      <div className="sidebar-head">
        <div className="sidebar-brand">
          <div
            className="brand-mark"
            style={{ background: "#FFFFFF", color: uvColor, boxShadow: `0 4px 20px ${uvDim}` }}
          >
            <SunMedium size={26} strokeWidth={2.5} />
          </div>
          <div className="brand-text">
            <div className="brand-name">UVibe</div>
            <div className="brand-sub">UV Safety · AU</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = page === item.id;
          return (
            <button
              key={item.id}
              className={`nav-btn ${isActive ? "on" : ""}`}
              style={
                isActive
                  ? {
                      background: uvDim,
                      borderLeftColor: uvColor,
                      color: uvColor,
                    }
                  : {}
              }
              onClick={() => setPage(item.id)}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="nav-icon" style={{ display: 'flex', justifyContent: 'center' }}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </span>
              <div>
                <div className="nav-label">{item.label}</div>
                <div className="nav-sub">{item.sub}</div>
              </div>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-foot">
        <div className="city-chip">
          <span style={{ display: 'flex', color: geoGranted ? uvColor : 'var(--text-2)' }}>
            {geoGranted ? <MapPin size={14} /> : <Building2 size={14} />}
          </span>
          <span>{city?.name || city}</span>
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
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = page === item.id;
        return (
          <button
            key={item.id}
            className={`bnav-btn ${isActive ? "on" : ""}`}
            style={isActive ? { color: uvColor } : {}}
            onClick={() => setPage(item.id)}
            aria-current={isActive ? "page" : undefined}
            aria-label={item.label}
          >
            <span className="bnav-icon" style={{ display: 'flex', marginBottom: 2 }}>
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            </span>
            <span className="bnav-label">{item.label}</span>
            <div
              className="bnav-pip"
              style={{ background: uvColor, boxShadow: `0 0 8px ${uvColor}` }}
            />
          </button>
        );
      })}
    </nav>
  );
}
