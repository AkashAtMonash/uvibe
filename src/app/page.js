"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import "@/app/globals.css";

import { Sidebar, BottomNav } from "@/app/components/Nav";
import LocationModal from "@/app/components/LocationModal";
import LandingPage from "@/app/components/LandingPage";
import HomePage from "@/app/components/HomePage";
import SettingsPage from "@/app/components/SettingsPage";
import PreventionPage from "@/app/components/PreventionPage";

import { nearestCity, getLevel, applyUVTheme } from "@/utils/uv";
import { useUserSync } from "@/hooks/useUserSync";

const DEFAULT_PREFS = {
  skinType: "III",
  spf: 50,
  notifEnabled: false,
  reapplyReminder: false,
  alertThreshold: 6,
  name: "",
  ageRange: "",
};

function BlankPage({ label }) {
  return <div className="blank-page">{label.toUpperCase()}</div>;
}

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 1100);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return mobile;
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
  const isMobile = useIsMobile();

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
        setCity(c);
        setGeoGranted(granted);
        setScreen("app");
      } else {
        setScreen(window.innerWidth < 1100 ? "modal" : "landing");
      }
    } catch {
      setScreen("landing");
    }
  }, []);

  useEffect(() => {
    if (screen === "loading") return;
    const doc = document.documentElement;
    doc.setAttribute("data-theme", theme);
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
        setGeoCoords({ lat, lon });
        setGeoGranted(true);
        localStorage.setItem(
          "uvibe_location",
          JSON.stringify({ city: detected, granted: true }),
        );
        syncCity(detected);
        setScreen("app");
      },
      () => {
        setCity("Melbourne");
        localStorage.setItem(
          "uvibe_location",
          JSON.stringify({ city: "Melbourne", granted: false }),
        );
        setScreen("app");
      },
    );
  }, [syncCity]);

  const handleDeny = useCallback(() => {
    setShowModal(false);
    const fall = { name: "Melbourne", lat: -37.81, lon: 144.96, state: "VIC", arpansa: "Melbourne" };
    setCity(fall);
    localStorage.setItem(
      "uvibe_location",
      JSON.stringify({ city: fall, granted: false }),
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

  return (
    <div className="app-shell">
      <div className="app-bg" style={{ background: ambientBg }} />

      <WelcomeModal />
      {showModal && <LocationModal onAllow={handleAllow} onDeny={handleDeny} />}

      <Sidebar
        page={page}
        setPage={setPage}
        city={city}
        geoGranted={geoGranted}
        hasNotif={uv >= 8}
      />

      <div className="app-content">
        <div className="page-scroll">
          {page === "home" && (
            <HomePage
              city={city}
              setCity={setCity}
              prefs={prefs}
              geoGranted={geoGranted}
              onRequestGeo={() => setShowModal(true)}
              onSaveReading={saveReading}
              onUVUpdate={setUv}
              onRequestNotif={requestAndRegister}
              onSyncPrefs={handleSyncPrefs}
              sendTestNotification={sendTestNotification}
            />
          )}
          {page === "awareness" && <BlankPage label="Awareness" />}
          {page === "prevention" && (
            <PreventionPage city={city} uv={uv} prefs={prefs} />
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
        <BottomNav page={page} setPage={setPage} hasNotif={uv >= 8} />
      </div>
    </div>
  );
}
