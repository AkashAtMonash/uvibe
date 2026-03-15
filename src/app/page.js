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

// TODO: replace with actual built-out pages
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

function readStorage() {
  if (typeof window === "undefined") return {};
  try {
    const loc = localStorage.getItem("uvibe_location");
    const prefs = localStorage.getItem("uvibe_prefs");
    const theme = localStorage.getItem("uvibe_theme");
    const contrast = localStorage.getItem("uvibe_contrast");
    const page = localStorage.getItem("uvibe_page");
    const location = loc ? JSON.parse(loc) : null;
    return {
      city: location?.city ?? "Melbourne",
      granted: location?.granted ?? false,
      hasLocation: !!loc,
      prefs: prefs ? JSON.parse(prefs) : null,
      theme: theme ?? "black",
      contrast: contrast === "true",
      page: page ?? "home",
    };
  } catch {
    return {};
  }
}

export default function Page() {
  const stored = readStorage();

  const [screen, setScreen] = useState(stored.hasLocation ? "app" : "loading");
  const [page, setPage] = useState(stored.page ?? "home");
  const [city, setCity] = useState(stored.city ?? "Melbourne");
  const [showModal, setShowModal] = useState(false);
  const [geoGranted, setGeoGranted] = useState(stored.granted ?? false);
  const [theme, setTheme] = useState(stored.theme ?? "black");
  const [contrast, setContrast] = useState(stored.contrast ?? false);
  const [prefs, setPrefs] = useState(
    stored.prefs ?? {
      skinType: "III",
      spf: 50,
      notifEnabled: false,
      reapplyReminder: false,
      alertThreshold: 6,
      name: "",
      ageRange: "",
    },
  );
  const [uv, setUv] = useState(0);
  const isMobile = useIsMobile();

  const { requestAndRegister, syncPrefs, syncCity, saveReading } =
    useUserSync();
  const lv = getLevel(uv);

  useEffect(() => {
    if (screen !== "loading") return;
    setScreen(isMobile ? "modal" : "landing");
  }, [isMobile, screen]);

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
      (pos) => {
        const detected = nearestCity(pos.coords.latitude, pos.coords.longitude);
        setCity(detected);
        setGeoGranted(true);
        localStorage.setItem(
          "uvibe_location",
          JSON.stringify({ city: detected, granted: true }),
        );
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
  }, []);

  const handleDeny = useCallback(() => {
    setShowModal(false);
    setCity("Melbourne");
    localStorage.setItem(
      "uvibe_location",
      JSON.stringify({ city: "Melbourne", granted: false }),
    );
    setScreen("app");
  }, []);

  const handleEnter = useCallback(() => {
    const saved = localStorage.getItem("uvibe_location");
    if (saved) {
      setScreen("app");
    } else {
      setShowModal(true);
      setScreen("modal");
    }
  }, []);

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
              onNotifClick={() => setPage("settings")}
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
              onRequestNotif={(p) => requestAndRegister(p)}
              onSyncPrefs={syncPrefs}
            />
          )}
        </div>
        <BottomNav page={page} setPage={setPage} hasNotif={uv >= 8} />
      </div>
    </div>
  );
}
