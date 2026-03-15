"use client";
// src/components/HomePage.js

import { useState, useEffect, useCallback, useRef } from "react";
import UVRing from "./UVRing";
import UVGraph from "./UVGraph";
import CitySearch from "./CitySearch";
import {
  CITIES,
  UV_LEVELS,
  getLevel,
  calcBurn,
  humanAlert,
  getDynamicInterval,
  simulateUV,
  buildForecast,
  applyUVTheme,
} from "@/utils/uv";

const WEATHER_ICON_MAP = {
  "01d": "☀",
  "01n": "☽",
  "02d": "⛅",
  "02n": "⛅",
  "03d": "☁",
  "03n": "☁",
  "04d": "☁",
  "04n": "☁",
  "09d": "🌧",
  "09n": "🌧",
  "10d": "🌦",
  "10n": "🌦",
  "11d": "⛈",
  "11n": "⛈",
  "13d": "❄",
  "13n": "❄",
  "50d": "🌫",
  "50n": "🌫",
};

function formatTime(unix) {
  if (!unix) return "—";
  return new Date(unix * 1000).toLocaleTimeString("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatCard({ label, value, unit }) {
  return (
    <div className="stat-item">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-unit">{unit}</div>
    </div>
  );
}

export default function HomePage({
  city,
  setCity,
  prefs,
  geoGranted,
  onRequestGeo,
  onSaveReading,
  onNotifClick,
  onUVUpdate,
}) {
  const [uv, setUv] = useState(0);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wLoading, setWLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState(null);
  const [time, setTime] = useState(null);
  const [mounted, setMounted] = useState(false);
  const timerRef = useRef(null);

  const fetchUV = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/uv?city=${encodeURIComponent(CITIES[city]?.arpansa ?? "Melbourne")}`,
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      const uvVal = parseFloat(data.uv);
      setUv(uvVal);
      setApiStatus("ok");
      onSaveReading?.(city, uvVal, "arpansa");
      onUVUpdate?.(uvVal);
    } catch {
      // TODO: remove simulation once Open-Meteo is confirmed as official fallback
      try {
        const c = CITIES[city];
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&hourly=uv_index&timezone=auto&forecast_days=1`,
        );
        if (!res.ok) throw new Error();
        const data = await res.json();
        const hr = new Date().getHours();
        const fallbackVal = parseFloat(
          (data.hourly?.uv_index?.[hr] ?? simulateUV(city)).toFixed(1),
        );
        setUv(fallbackVal);
        setApiStatus("fallback");
        onSaveReading?.(city, fallbackVal, "open-meteo");
        onUVUpdate?.(fallbackVal);
      } catch {
        setUv(simulateUV(city));
        setApiStatus("error");
      }
    }
    setLoading(false);
  }, [city]);

  const fetchWeather = useCallback(async () => {
    setWLoading(true);
    try {
      const c = CITIES[city];
      if (!c) throw new Error();
      const res = await fetch(`/api/weather?lat=${c.lat}&lon=${c.lon}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setWeather(data);
    } catch {
      setWeather(null);
    }
    setWLoading(false);
  }, [city]);

  useEffect(() => {
    fetchUV();
    fetchWeather();
    timerRef.current = setInterval(
      () => {
        fetchUV();
        fetchWeather();
      },
      5 * 60 * 1000,
    );
    return () => clearInterval(timerRef.current);
  }, [fetchUV, fetchWeather]);

  useEffect(() => {
    setMounted(true);
    setTime(new Date());
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    applyUVTheme(getLevel(uv));
  }, [uv]);

  const lv = getLevel(uv);
  const burn = calcBurn(uv, prefs.skinType, prefs.spf);
  const alert = humanAlert(uv, burn, city);
  const interval = getDynamicInterval(uv);
  const forecast = mounted ? buildForecast(city) : [];
  const dateStr = time
    ? time.toLocaleDateString("en-AU", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })
    : "";
  const timeStr = time
    ? time.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div className="page anim-fade-in">
      {/* ── Top bar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
          position: "relative",
          zIndex: 300,
        }}
      >
        <CitySearch city={city} setCity={setCity} />
        <button
          className="btn btn-ghost btn-icon"
          onClick={onRequestGeo}
          aria-label="Detect location"
          style={{
            color: geoGranted ? "var(--uv)" : "var(--fg-2)",
            borderColor: geoGranted ? "var(--uv-20)" : "var(--border)",
            flexShrink: 0,
          }}
        >
          ◎
        </button>
        <button
          className="notif-bell"
          onClick={onNotifClick}
          aria-label="UV notifications"
          style={{ flexShrink: 0, cursor: "pointer" }}
        >
          🔔
          {uv >= 8 && <div className="notif-badge" />}
        </button>
      </div>

      {/* ── Date / state ── */}
      <div
        style={{
          fontSize: 10,
          fontFamily: "var(--font-mono)",
          color: "var(--fg-3)",
          letterSpacing: 1,
          marginBottom: 16,
        }}
      >
        {dateStr}
        {dateStr && " · "}
        {CITIES[city]?.state}
        {timeStr && ` · ${timeStr}`}
      </div>

      {/* ── API status ── */}
      {apiStatus && apiStatus !== "ok" && (
        <div
          className="api-banner"
          style={{
            background:
              apiStatus === "fallback"
                ? "rgba(245,158,11,0.08)"
                : "rgba(239,68,68,0.08)",
            borderColor:
              apiStatus === "fallback"
                ? "rgba(245,158,11,0.3)"
                : "rgba(239,68,68,0.3)",
            color: apiStatus === "fallback" ? "#f59e0b" : "#ef4444",
            marginBottom: 14,
          }}
          role="alert"
        >
          <span>⚠</span>
          {apiStatus === "fallback"
            ? "ARPANSA offline — showing Open-Meteo forecast"
            : "All UV feeds unavailable — showing estimate"}
        </div>
      )}

      {/* ── UV Hero ── */}
      <div className="uv-hero-card anim-fade-up">
        {/* background glow — clipped to card */}
        <div
          className="uv-hero-glow"
          style={{
            background: `radial-gradient(ellipse 100% 100% at 20% 50%, ${lv.color}22 0%, transparent 60%)`,
          }}
        />

        {/* LEFT — ring */}
        <div className="uv-hero-left">
          {weather && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                marginBottom: 18,
                alignSelf: "center",
              }}
            >
              <span style={{ fontSize: 20 }}>
                {WEATHER_ICON_MAP[weather.icon] || "◌"}
              </span>
              <span
                style={{
                  fontSize: 13,
                  color: "var(--fg-2)",
                  textTransform: "capitalize",
                  fontWeight: 500,
                }}
              >
                {weather.description}
              </span>
            </div>
          )}
          {/* ring wrapper has padding so glow is never clipped */}
          <div style={{ padding: 12 }}>
            <UVRing uv={uv} color={lv.color} size={220} loading={loading} />
          </div>
        </div>

        {/* RIGHT — info */}
        <div className="uv-hero-right">
          {/* Alert */}
          <div
            style={{
              padding: "14px 16px",
              borderRadius: "var(--r)",
              border: `1px solid ${lv.color}40`,
              background: lv.dim,
              color: lv.color,
              fontSize: 13,
              lineHeight: 1.7,
              fontWeight: 500,
              width: "100%",
            }}
            role="status"
            aria-live="polite"
          >
            {alert}
          </div>

          {/* Burn time */}
          {burn && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 14,
                padding: "9px 14px",
                borderRadius: 40,
                border: "1px solid var(--border-2)",
                background: "var(--surface)",
                fontSize: 12,
                fontWeight: 500,
                color: "var(--fg-2)",
              }}
            >
              <span style={{ color: lv.color }}>⏱</span>
              <span>
                Bare skin burns in{" "}
                <strong style={{ color: "var(--fg)" }}>~{burn.bare} min</strong>{" "}
                · SPF {prefs.spf} gives{" "}
                <strong style={{ color: "var(--fg)" }}>{burn.prot} min</strong>
              </span>
            </div>
          )}

          {/* Protection info row */}
          <div
            style={{
              display: "flex",
              gap: 20,
              marginTop: 20,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 9,
                  fontFamily: "var(--font-mono)",
                  color: "var(--fg-3)",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                Reapply
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: lv.color,
                  letterSpacing: -0.6,
                }}
              >
                {interval.label}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--fg-2)",
                  marginTop: 3,
                  fontFamily: "var(--font-mono)",
                }}
              >
                {interval.reason}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 9,
                  fontFamily: "var(--font-mono)",
                  color: "var(--fg-3)",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                SPF
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: "var(--fg)",
                  letterSpacing: -0.6,
                }}
              >
                {prefs.spf}+
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--fg-2)",
                  marginTop: 3,
                  fontFamily: "var(--font-mono)",
                }}
              >
                Recommended
              </div>
            </div>
            {weather && (
              <div>
                <div
                  style={{
                    fontSize: 9,
                    fontFamily: "var(--font-mono)",
                    color: "var(--fg-3)",
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  Temp
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: "var(--fg)",
                    letterSpacing: -0.6,
                  }}
                >
                  {weather.temp}°
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--fg-2)",
                    marginTop: 3,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  Feels {weather.feelsLike}°
                </div>
              </div>
            )}
          </div>

          {/* UV level pills */}
          <div
            style={{ marginTop: 20, display: "flex", flexWrap: "wrap", gap: 6 }}
          >
            {UV_LEVELS.map((level) => {
              const active = uv >= level.min && uv <= level.max;
              return (
                <div
                  key={level.name}
                  style={{
                    padding: "5px 13px",
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 700,
                    background: active ? level.dim : "transparent",
                    border: `1px solid ${active ? level.color + "70" : "var(--border)"}`,
                    color: active ? level.color : "var(--fg-3)",
                    transition: "all 0.4s var(--ease)",
                  }}
                >
                  {level.name}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Weather Stats ── */}
      {weather ? (
        <div className="anim-fade-up" style={{ marginBottom: 14 }}>
          <div className="divider-label label-sm">Weather Conditions</div>
          <div className="stat-grid">
            <StatCard
              label="Temp"
              value={`${weather.temp}°`}
              unit={`Feels ${weather.feelsLike}°`}
            />
            <StatCard
              label="Humidity"
              value={`${weather.humidity}%`}
              unit="Relative"
            />
            <StatCard label="Wind" value={`${weather.windSpeed}`} unit="km/h" />
            <StatCard
              label="Cloud"
              value={`${weather.cloudCover}%`}
              unit="Cover"
            />
            <StatCard
              label="Sunrise"
              value={formatTime(weather.sunrise)}
              unit="AEST"
            />
            <StatCard
              label="Sunset"
              value={formatTime(weather.sunset)}
              unit="AEST"
            />
          </div>
        </div>
      ) : wLoading ? (
        <div className="anim-fade-up" style={{ marginBottom: 14 }}>
          <div className="divider-label label-sm">Weather Conditions</div>
          <div className="stat-grid">
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="stat-item skeleton"
                  style={{ height: 72 }}
                />
              ))}
          </div>
        </div>
      ) : null}

      {/* ── UV Graph ── */}
      <UVGraph city={city} lv={lv} />

      {/* ── UV Risk Scale ── */}
      <div className="anim-fade-up card" style={{ marginBottom: 14 }}>
        <div className="divider-label label-sm">UV Risk Scale</div>
        <div role="list">
          {UV_LEVELS.map((level) => {
            const active = uv >= level.min && uv <= level.max;
            const tips = {
              Low: "Safe outdoors",
              Moderate: "Wear SPF 30+",
              High: "SPF 50+ essential",
              "Very High": "Avoid peak hours",
              Extreme: "Stay indoors",
            };
            return (
              <div
                key={level.name}
                role="listitem"
                className="uv-scale-row"
                style={
                  active
                    ? { background: level.dim, borderColor: `${level.color}50` }
                    : {}
                }
              >
                <div
                  className="uv-scale-dot"
                  style={{
                    background: level.color,
                    boxShadow: active ? `0 0 6px ${level.color}` : "none",
                  }}
                />
                <div className="uv-scale-name" style={{ color: level.color }}>
                  {level.name}
                </div>
                <div className="uv-scale-range">
                  {level.min}–{level.max === 99 ? "11+" : level.max}
                </div>
                <div className="uv-scale-tip">{tips[level.name]}</div>
                {active && (
                  <div
                    className="uv-scale-now"
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

      {/* ── Refresh ── */}
      <div
        className="anim-fade-up"
        style={{ textAlign: "center", paddingBottom: 8 }}
      >
        <button
          className="refresh-btn"
          onClick={() => {
            fetchUV();
            fetchWeather();
          }}
          disabled={loading}
          style={{ color: lv.color, borderColor: `${lv.color}55` }}
        >
          {loading ? (
            <>
              <span className="spinner" style={{ width: 14, height: 14 }} />
              Refreshing…
            </>
          ) : (
            <>↻ Refresh</>
          )}
        </button>
        <div className="attr">
          UV · ARPANSA · Weather · OpenWeather · Refreshes every 5 min
        </div>
      </div>
    </div>
  );
}
