"use client";

import { useState, useEffect, useCallback } from "react";
import "@/app/globals.css";

import { Sidebar, BottomNav } from "@/app/components/Nav";
import LocationModal from "@/app/components/LocationModal";
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

function BlankPage({ label }) {
  return <div className="blank-page">{label.toUpperCase()}</div>;
}

export default function Page() {
  // All state starts with server-safe defaults — localStorage hydration happens in useEffect
  const [screen, setScreen] = useState("loading");
  const [page, setPage] = useState("home");
  const [city, setCity] = useState({ name: "Melbourne", lat: -37.81, lon: 144.96, state: "VIC", arpansa: "Melbourne" });
  const [showModal, setShowModal] = useState(false);
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

  // Single hydration effect — reads localStorage once on mount, sets all state, then reveals UI
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
        // Restore as full object if available, else treat as string (backwards compat)
        if (c && typeof c === "object" && c.lat) {
          setCity(c);
        } else {
          const name = typeof c === "string" ? c : c?.name ?? "Melbourne";
          setCity(CITIES[name] ? { ...CITIES[name], name } : { name, lat: -37.81, lon: 144.96, state: "VIC", arpansa: name });
        }
        setGeoGranted(granted);
        setScreen("app");
      } else {
        // No saved location — always show modal first (mobile or desktop)
        setShowModal(true);
        setScreen("modal");
      }
    } catch {
      setScreen("landing");
    }
  }, []);

  useEffect(() => {
    if (screen === "loading") return;
    const doc = document.documentElement;
    doc.setAttribute("data-theme", theme);
    // Both 'dark' and 'black' should use dark mode Tailwind classes
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

  const handleAllow = useCallback(() => {
    setShowModal(false);
    if (!navigator.geolocation) {
      setScreen("app");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const detectedName = nearestCity(lat, lon);
        const detectedCity = CITIES[detectedName]
          ? { ...CITIES[detectedName], name: detectedName, lat, lon }
          : { name: detectedName, lat, lon, state: "AU", arpansa: detectedName };
        setCity(detectedCity);
        setGeoGranted(true);
        localStorage.setItem(
          "uvibe_location",
          JSON.stringify({ city: detectedCity, granted: true }),
        );
        syncCity(detectedName);
        setScreen("app");
      },
      () => {
        const melbCity = { name: "Melbourne", lat: -37.81, lon: 144.96, state: "VIC", arpansa: "Melbourne" };
        setCity(melbCity);
        localStorage.setItem(
          "uvibe_location",
          JSON.stringify({ city: melbCity, granted: false }),
        );
        setScreen("app");
      },
    );
  }, [syncCity]);

  const handleDeny = useCallback(() => {
    setShowModal(false);
    const melbCity = { name: "Melbourne", lat: -37.81, lon: 144.96, state: "VIC", arpansa: "Melbourne" };
    setCity(melbCity);
    localStorage.setItem(
      "uvibe_location",
      JSON.stringify({ city: melbCity, granted: false }),
    );
    syncCity("Melbourne");
    setScreen("app");
  }, [syncCity]);

  const handleEnter = useCallback(() => {
    const saved = localStorage.getItem("uvibe_location");
    if (saved) {
      setScreen("app");
    } else {
      setShowModal(true);
      setScreen("modal");
    }
  }, []);

  const handleSyncPrefs = useCallback(
    (updated) => {
      setPrefs(updated);
      syncPrefs(updated);
    },
    [syncPrefs],
  );

  // Render nothing while hydrating — prevents any flash or mismatch
  if (screen === "loading") return null;

  if (screen === "landing") {
    return (
      <>
        {showModal && (
          <LocationModal onAllow={handleAllow} onDeny={handleDeny} />
        )}
        <LandingPage onEnter={handleEnter} />
      </>
    );
  }

  if (screen === "modal") {
    return <LocationModal onAllow={handleAllow} onDeny={handleDeny} />;
  }

  const ambientBg = `radial-gradient(ellipse 70% 40% at 50% 0%, ${lv.glow} 0%, transparent 60%)`;
  // Derived city name string for components that render it as text
  const cityName = typeof city === "string" ? city : city?.name || "Melbourne";

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none z-0 transition-colors duration-1000" style={{ background: ambientBg }} />

      <WelcomeModal />
      {showModal && <LocationModal onAllow={handleAllow} onDeny={handleDeny} />}

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
        <div className="flex-1 w-full h-full overflow-y-auto no-scrollbar pb-[80px] md:pb-0">
          {page === "home" && (
            <HomePage
              city={city}
              setCity={setCity}
              prefs={prefs}
              geoGranted={geoGranted}
              onRequestGeo={handleAllow}
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
        <BottomNav page={page} setPage={setPage} hasNotif={uv >= 8} theme={theme} setTheme={setTheme} />
      </div>
    </div>
  );
}
