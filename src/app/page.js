"use client";
// src/app/page.js

import { useState, useEffect, useCallback, useRef } from "react";
import "@/app/globals.css";

import { Sidebar, BottomNav } from "@/app/components/Nav";
import LocationModal from "@/app/components/LocationModal";
import APIBanner from "@/app/components/APIBanner";
import UVRing from "@/app/components/UVRing";
// import SunRayBackground from "@/app/components/SunRayBackground";
import UVInfoBanner from "@/app/components/UVInfoBanner";
import CitySearch from "@/app/components/CitySearch";

import {
  CITIES,
  UV_LEVELS,
  getLevel,
  calcBurn,
  humanAlert,
  getDynamicInterval,
  nearestCity,
  simulateUV,
  buildForecast,
} from "@/utils/uv";

function HomePage({
  city,
  setCity,
  prefs,
  geoGranted,
  onRequestGeo,
  uvColor,
  uvDim,
}) {
  const [uv, setUv] = useState(0);
  const [loading, setLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState(null);
  const [time, setTime] = useState(null);
  const [mounted, setMounted] = useState(false);
  const timerRef = useRef(null);
  const uvSectionRef = useRef(null);

  const fetchUV = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/uv?city=${encodeURIComponent(CITIES[city]?.arpansa ?? "Melbourne")}`,
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUv(parseFloat(data.uv));
      setApiStatus("ok");
    } catch {
      // TODO: remove simulated fallback once Open-Meteo is confirmed as official secondary source
      try {
        const c = CITIES[city];
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&hourly=uv_index&timezone=auto&forecast_days=1`,
        );
        if (!res.ok) throw new Error();
        const data = await res.json();
        const hr = new Date().getHours();
        setUv(
          parseFloat(
            (data.hourly?.uv_index?.[hr] ?? simulateUV(city)).toFixed(1),
          ),
        );
        setApiStatus("fallback");
      } catch {
        setUv(simulateUV(city));
        setApiStatus("error");
      }
    }
    setLoading(false);
  }, [city]);

  useEffect(() => {
    fetchUV();
    timerRef.current = setInterval(fetchUV, 5 * 60 * 1000);
    return () => clearInterval(timerRef.current);
  }, [fetchUV]);

  useEffect(() => {
    setMounted(true);
    setTime(new Date());
    const t = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const lv = getLevel(uv);
  const burn = calcBurn(uv, prefs.skinType, prefs.spf);
  const alert = humanAlert(uv, burn, city);
  const interval = getDynamicInterval(uv);
  const forecast = mounted ? buildForecast(city) : [];
  const dateStr = time
    ? time.toLocaleDateString("en-AU", {
        weekday: "long",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";
  const timeStr = time
    ? time.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })
    : "";

  const scrollToUV = () => {
    uvSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="pad fade-in">
      <APIBanner status={apiStatus} />

      <UVInfoBanner uvColor={uvColor} uvDim={uvDim} onCheckUV={scrollToUV} />

      <div
        className="hero fade-up"
        style={{ marginBottom: 14 }}
        ref={uvSectionRef}
      >
        <div className="hero-glass" />
        {/* <SunRayBackground color={lv.color} uv={uv} /> */}
        <div className="hero-glow" style={{ background: lv.glow }} />

        <div className="hero-body">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "100%",
              marginBottom: 6,
            }}
          >
            <CitySearch
              city={city}
              setCity={setCity}
              uvColor={uvColor}
              geoGranted={geoGranted}
              onRequestGeo={onRequestGeo}
            />
            <button
              className="geo-btn"
              onClick={onRequestGeo}
              aria-label="Detect my location"
              style={{
                borderColor: geoGranted
                  ? `${uvColor}60`
                  : "var(--surface-border-strong)",
                color: geoGranted ? uvColor : "var(--text-2)",
                padding: "10px 14px",
                borderRadius: 14,
                fontSize: 18,
                lineHeight: 1,
                background: geoGranted
                  ? uvColor + "14"
                  : "rgba(255,255,255,0.04)",
              }}
            >
              📍
            </button>
          </div>

          <div
            style={{
              fontSize: 11,
              fontFamily: "var(--mono)",
              color: "var(--text-3)",
              marginBottom: 24,
              alignSelf: "flex-start",
            }}
          >
            {dateStr}
            {dateStr && " · "}
            {CITIES[city]?.state}
            {timeStr && ` · ${timeStr}`}
          </div>

          {loading ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 18,
                padding: "40px 0",
              }}
            >
              <div
                className="spinner"
                style={{
                  width: 40,
                  height: 40,
                  color: lv.color,
                  borderWidth: 3,
                }}
              />
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-3)",
                  fontFamily: "var(--mono)",
                }}
              >
                Contacting ARPANSA…
              </div>
            </div>
          ) : (
            <>
              <div className="ring-wrap">
                <div
                  className="ring-pulse"
                  style={{ background: lv.color, opacity: 0.1 }}
                />
                <UVRing uv={uv} color={lv.color} size={210} />
              </div>

              <div
                className="alert-pill"
                role="status"
                aria-live="polite"
                style={{
                  background: lv.dim,
                  borderColor: `${lv.color}40`,
                  color: lv.color,
                }}
              >
                {alert}
              </div>

              {burn && (
                <div className="burn-row">
                  <span style={{ color: lv.color }}>⏱</span>
                  <span>
                    Bare skin burns in <b>~{burn.bare} min</b> ·{" "}
                    <b>{burn.prot} min</b> with SPF {prefs.spf}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="cards">
        <div className="card fade-up">
          <div className="card-head">Hourly Forecast</div>
          <div className="forecast-row" role="list">
            {forecast.map((f, i) => (
              <div
                key={i}
                role="listitem"
                className={`fc-item ${f.now ? "now" : ""}`}
                style={
                  f.now
                    ? {
                        borderColor: `${f.lv.color}55`,
                        background: `${f.lv.color}0e`,
                      }
                    : {}
                }
              >
                <div className="fc-time">{f.label}</div>
                <div className="fc-val" style={{ color: f.lv.color }}>
                  {f.val}
                </div>
                <div className="fc-track">
                  <div
                    className="fc-fill"
                    style={{
                      width: `${Math.min(f.val / 13, 1) * 100}%`,
                      background: f.lv.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="interval-row fade-up"
          style={{
            borderColor: uv >= 6 ? `${lv.color}30` : "var(--surface-border)",
          }}
        >
          <div
            className="interval-icon"
            style={{ background: lv.dim, borderColor: `${lv.color}40` }}
          >
            ⏰
          </div>
          <div>
            <div className="interval-lbl" style={{ color: lv.color }}>
              {interval.label}
            </div>
            <div className="interval-reason">{interval.reason}</div>
          </div>
        </div>

        <div className="card fade-up">
          <div className="card-head">UV Risk Scale</div>
          <div className="scale-list" role="list">
            {UV_LEVELS.map((level) => {
              const active = uv >= level.min && uv <= level.max;
              return (
                <div
                  key={level.name}
                  role="listitem"
                  className="scale-row"
                  style={
                    active
                      ? {
                          background: level.dim,
                          borderColor: `${level.color}50`,
                        }
                      : {}
                  }
                >
                  <div
                    className="scale-dot"
                    style={{
                      background: level.color,
                      boxShadow: active ? `0 0 7px ${level.color}` : "none",
                    }}
                  />
                  <div className="scale-name" style={{ color: level.color }}>
                    {level.name}
                  </div>
                  <div className="scale-range">
                    {level.min}–{level.max === 99 ? "11+" : level.max}
                  </div>
                  <div className="scale-tip">{level.short}</div>
                  {active && (
                    <div
                      className="scale-now"
                      style={{ background: level.dim, color: level.color }}
                    >
                      NOW
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div
          className="fade-up"
          style={{ textAlign: "center", paddingBottom: 8 }}
        >
          <button
            className="refresh-btn"
            onClick={fetchUV}
            disabled={loading}
            aria-label="Refresh UV data"
            style={{
              color: lv.color,
              borderColor: `${lv.color}55`,
              boxShadow: loading ? "none" : `0 4px 20px ${lv.color}18`,
            }}
          >
            {loading ? (
              <>
                <span className="spinner" />
                Refreshing…
              </>
            ) : (
              <>↻ Refresh</>
            )}
          </button>
          <div className="attr">
            UV observations courtesy of ARPANSA · Auto-refreshes every 5 min
          </div>
        </div>
      </div>
    </div>
  );
}

// TODO: replace with actual page components as Awareness, Prevention and Settings are built
function BlankPage({ label }) {
  return <div className="blank-page">{label.toUpperCase()} — COMING SOON</div>;
}

export default function Page() {
  const [page, setPage] = useState("home");
  const [city, setCity] = useState("Melbourne");
  const [showModal, setShowModal] = useState(false);
  const [geoGranted, setGeoGranted] = useState(false);
  const [uv, setUv] = useState(0);
  const [prefs] = useState({ skinType: "III", spf: 30 });

  const lv = getLevel(uv);

  useEffect(() => {
    const saved = localStorage.getItem("uvibe_location");
    if (saved) {
      const { city: c, granted } = JSON.parse(saved);
      setCity(c);
      setGeoGranted(granted);
    } else {
      setShowModal(true);
    }
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--uv-color", lv.color);
    document.documentElement.style.setProperty("--uv-dim", lv.dim);
    document.documentElement.style.setProperty("--uv-glow", lv.glow);
  }, [lv]);

  const handleAllow = useCallback(() => {
    setShowModal(false);
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const detected = nearestCity(pos.coords.latitude, pos.coords.longitude);
        setCity(detected);
        setGeoGranted(true);
        localStorage.setItem(
          "uvibe_location",
          JSON.stringify({ city: detected, granted: true }),
        );
      },
      () => {
        setCity("Melbourne");
        localStorage.setItem(
          "uvibe_location",
          JSON.stringify({ city: "Melbourne", granted: false }),
        );
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
  }, []);

  const ambientBg = `radial-gradient(ellipse 80% 50% at 50% -10%, ${lv.glow} 0%, transparent 60%)`;

  return (
    <div className="app">
      <div className="app-ambient" style={{ background: ambientBg }} />

      {showModal && <LocationModal onAllow={handleAllow} onDeny={handleDeny} />}

      <Sidebar
        page={page}
        setPage={setPage}
        city={city}
        geoGranted={geoGranted}
        uvColor={lv.color}
        uvDim={lv.dim}
      />

      <div className="main">
        <div className="scroll">
          {page === "home" && (
            <HomePage
              city={city}
              setCity={setCity}
              prefs={prefs}
              geoGranted={geoGranted}
              onRequestGeo={() => setShowModal(true)}
              uvColor={lv.color}
              uvDim={lv.dim}
            />
          )}
          {page === "awareness" && <BlankPage label="Awareness" />}
          {page === "prevention" && <BlankPage label="Prevention" />}
          {page === "profile" && <BlankPage label="Settings" />}
        </div>
        <BottomNav page={page} setPage={setPage} uvColor={lv.color} />
      </div>
    </div>
  );
}
