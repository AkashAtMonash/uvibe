// src/app/page.js
"use client";

import { useState, useEffect, useCallback } from "react";
import "@/app/globals.css";

import { Sidebar, BottomNav } from "@/app/components/Nav";
import LandingPage from "@/app/components/LandingPage";
import HomePage from "@/app/components/HomePage";
import SettingsPage from "@/app/components/SettingsPage";
import PreventionPage from "@/app/components/PreventionPage";
import WelcomeModal from "@/app/components/WelcomeModal";
import AwarenessPage from "@/app/components/AwarenessPage";

import { nearestCity, getLevel, applyUVTheme, CITIES } from "@/utils/uv";
import { useUserSync } from "@/hooks/useUserSync";

const DEFAULT_PREFS = {
  skinType: "III",
  spf: 30,
  weightKg: 70,
  ageYears: 25,
  notifEnabled: false,
  reapplyReminder: false,
  alertThreshold: 6,
  name: "",
  ageRange: "",
};

const MELBOURNE = {
  name: "Melbourne",
  lat: -37.81,
  lon: 144.96,
  state: "VIC",
  arpansa: "Melbourne",
};

function resolveCity(raw) {
  if (!raw) return MELBOURNE;
  if (typeof raw === "object" && raw.lat) return raw;
  const name = typeof raw === "string" ? raw : (raw?.name ?? "Melbourne");
  return CITIES[name] ? { ...CITIES[name], name } : { ...MELBOURNE, name };
}

export default function Page() {
  const [screen, setScreen] = useState("loading");
  const [page, setPage] = useState("home");
  const [city, setCity] = useState(MELBOURNE);
  const [geoGranted, setGeoGranted] = useState(false);
  const [theme, setTheme] = useState("black");
  const [contrast, setContrast] = useState(false);
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [uv, setUv] = useState(0);

  const {
    requestAndRegister,
    syncPrefs,
    syncCity,
    saveReading,
    sendTestNotification,
  } = useUserSync();
  const lv = getLevel(uv);

  // Triggers browser native geolocation prompt — no custom modal
  const requestGeo = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const detectedName = nearestCity(
          pos.coords.latitude,
          pos.coords.longitude,
        );
        const detectedCity = CITIES[detectedName]
          ? { ...CITIES[detectedName], name: detectedName }
          : { ...MELBOURNE, name: detectedName };
        setCity(detectedCity);
        setGeoGranted(true);
        localStorage.setItem(
          "uvibe_location",
          JSON.stringify({ city: detectedCity, granted: true }),
        );
        syncCity(detectedName);
      },
      () => {
        // Denied or timed out — fall back silently to Melbourne
        setCity(MELBOURNE);
        setGeoGranted(false);
        localStorage.setItem(
          "uvibe_location",
          JSON.stringify({ city: MELBOURNE, granted: false }),
        );
      },
      { timeout: 8000, maximumAge: 300000 },
    );
  }, [syncCity]);

  // Single hydration effect
  useEffect(() => {
    try {
      const loc = localStorage.getItem("uvibe_location");
      const savedPg = localStorage.getItem("uvibe_page");
      const savedPrf = localStorage.getItem("uvibe_prefs");
      const savedThm = localStorage.getItem("uvibe_theme");
      const savedCtr = localStorage.getItem("uvibe_contrast");

      if (savedPg) setPage(savedPg);
      if (savedThm) setTheme(savedThm);
      if (savedCtr) setContrast(savedCtr === "true");
      if (savedPrf) setPrefs(JSON.parse(savedPrf));

      if (loc) {
        const { city: c, granted } = JSON.parse(loc);
        setCity(resolveCity(c));
        setGeoGranted(granted ?? false);
        setScreen("app");
      } else {
        // First visit or after reset — go straight to app, set Melbourne as default immediately
        // so the screen is never blank while waiting for geo permission
        setCity(MELBOURNE);
        setScreen(window.innerWidth < 1100 ? "app" : "landing");
      }
    } catch {
      setCity(MELBOURNE);
      setScreen("app"); // safe fallback — always show app, never blank
    }
  }, []);

  // Fire geolocation only on first visit, after screen is set and requestGeo is stable
  useEffect(() => {
    if (screen === "loading") return;
    const hasLocation = localStorage.getItem("uvibe_location");
    if (!hasLocation) requestGeo();
  }, [screen]);

  useEffect(() => {
    if (screen === "loading") return;
    const doc = document.documentElement;
    doc.setAttribute("data-theme", theme);
    if (theme === "dark" || theme === "black") {
      doc.classList.add("dark");
    } else {
      doc.classList.remove("dark");
    }
    doc.setAttribute("data-contrast", contrast ? "high" : "");
    localStorage.setItem("uvibe_theme", theme);
    localStorage.setItem("uvibe_contrast", contrast.toString());
  }, [theme, contrast, screen]);

  useEffect(() => {
    if (screen === "loading") return;
    localStorage.setItem("uvibe_prefs", JSON.stringify(prefs));
  }, [prefs, screen]);

  useEffect(() => {
    if (screen === "app") localStorage.setItem("uvibe_page", page);
  }, [page, screen]);

  useEffect(() => {
    if (screen !== "app") return;
    const existing = localStorage.getItem("uvibe_location");
    const granted = existing ? JSON.parse(existing).granted : geoGranted;
    localStorage.setItem("uvibe_location", JSON.stringify({ city, granted }));
  }, [city, screen]);

  useEffect(() => {
    applyUVTheme(lv);
  }, [lv]);

  const handleSyncPrefs = useCallback(
    (updated) => {
      setPrefs(updated);
      syncPrefs(updated);
    },
    [syncPrefs],
  );

  const handleEnter = useCallback(() => {
    const saved = localStorage.getItem("uvibe_location");
    if (!saved) requestGeo();
    setScreen("app");
  }, [requestGeo]);

  if (screen === "loading") return null;

  if (screen === "landing") {
    return <LandingPage onEnter={handleEnter} />;
  }

  const ambientBg = `radial-gradient(ellipse 70% 40% at 50% 0%, ${lv.glow} 0%, transparent 60%)`;
  const cityName = typeof city === "string" ? city : city?.name || "Melbourne";

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden relative">
      <div
        className="absolute inset-0 pointer-events-none z-0 transition-colors duration-1000"
        style={{ background: ambientBg }}
      />

      <WelcomeModal />

      <Sidebar
        page={page}
        setPage={setPage}
        city={cityName}
        geoGranted={geoGranted}
        hasNotif={uv >= 8}
        theme={theme}
        setTheme={setTheme}
      />

      <div className="flex-1 flex flex-col min-w-0 relative z-10 h-full overflow-hidden">
        <div className="flex-1 w-full h-full overflow-y-auto no-scrollbar pb-24 md:pb-0">
          {page === "home" && (
            <HomePage
              city={city}
              setCity={setCity}
              prefs={prefs}
              geoGranted={geoGranted}
              onRequestGeo={requestGeo}
              onSaveReading={saveReading}
              onUVUpdate={setUv}
              onRequestNotif={requestAndRegister}
              onSyncPrefs={handleSyncPrefs}
              sendTestNotification={sendTestNotification}
              theme={theme}
              setTheme={setTheme}
            />
          )}
          {page === "awareness" && <AwarenessPage />}
          {page === "prevention" && (
            <PreventionPage city={cityName} uv={uv} prefs={prefs} />
          )}
          {page === "settings" && (
            <SettingsPage
              prefs={prefs}
              setPrefs={setPrefs}
              theme={theme}
              setTheme={setTheme}
              contrast={contrast}
              setContrast={setContrast}
              onRequestNotif={requestAndRegister}
              onSyncPrefs={handleSyncPrefs}
              onTestNotif={sendTestNotification}
            />
          )}
        </div>
      </div>

      <BottomNav
        page={page}
        setPage={setPage}
        hasNotif={uv >= 8}
        theme={theme}
        setTheme={setTheme}
      />
    </div>
  );
}
