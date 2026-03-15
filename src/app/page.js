"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import "@/app/globals.css";

import { Sidebar, BottomNav } from "@/app/components/Nav";
import LocationModal from "@/app/components/LocationModal";
import WelcomeModal from "@/app/components/WelcomeModal";
import APIBanner from "@/app/components/APIBanner";
import CitySearch from "@/app/components/CitySearch";
import { UVGauge, MetricCard, BentoGrid, uvMeta } from "@/app/components/BentoCards";
import {
  UVInfoDrawer, UserProfileForm, HourlyForecastChart, UnifiedSuggestionCard
} from "@/app/components/DashboardWidgets";

import Prevention from "@/app/prevention/page";
import AwarenessPage from "@/app/awareness/page";

import {
  CITIES, UV_LEVELS, getLevel, calcBurn, humanAlert,
  getDynamicInterval, simulateUV, buildForecast,
} from "@/utils/uv";
import { fetchWeatherConditions } from "@/utils/api";
import { MapPin, Clock, RefreshCw, Thermometer, Droplets, Info, Sunrise, Sunset } from "lucide-react";


function HomePage({
  city, setCity, prefs: rootPrefs, geoGranted, onRequestGeo, uvColor, uvDim, geoCoords,
}) {
  const [uv, setUv] = useState(0);
  const [loading, setLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState(null);
  const [time, setTime] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [envData, setEnvData] = useState(null);
  const [showUVInfo, setShowUVInfo] = useState(false);
  const [profile, setProfile] = useState({ weightKg: 75, ageYears: 30, spf: 30 });
  const timerRef = useRef(null);

  const handleProfileChange = useCallback((key, val) => {
    setProfile((p) => ({ ...p, [key]: val }));
  }, []);

  // ─── Fetch UV ────────────────────────────────────────────────
  const fetchUV = useCallback(async () => {
    setLoading(true);
    const lat = city.lat || CITIES["Melbourne"].lat;
    const lon = city.lon || CITIES["Melbourne"].lon;
    const arpansa = city.arpansa || "Melbourne";

    try {
      const res = await fetch(`/api/uv?city=${encodeURIComponent(arpansa)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUv(parseFloat(data.uv));
      setApiStatus("ok");
    } catch {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=uv_index&timezone=auto&forecast_days=1`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setUv(parseFloat((data.hourly?.uv_index?.[new Date().getHours()] ?? simulateUV(city.name || "Melbourne")).toFixed(1)));
        setApiStatus("fallback");
      } catch {
        setUv(simulateUV(city.name || "Melbourne"));
        setApiStatus("error");
      }
    }
    setLoading(false);
  }, [city]);

  // ─── Fetch WBGT + Sunrise/Sunset (Parallel) ──────────────────
  useEffect(() => {
    const lat = city.lat;
    const lon = city.lon;
    if (!lat || !lon) return;
    let cancelled = false;

    (async () => {
      try {
        // Fire weather and sun data in parallel for ~50% faster loads
        const [wRes, sunRes] = await Promise.all([
          fetch(`/api/weather?lat=${lat}&lon=${lon}`),
          fetch(`http://localhost:8000/api/sun?lat=${lat}&lon=${lon}`),
        ]);

        if (cancelled) return;

        const weather = wRes.ok ? await wRes.json() : null;
        const sunData = sunRes.ok ? await sunRes.json() : null;

        if (!weather?.air_temp_c) return;

        // Inline WBGT calculation (no extra backend roundtrip)
        const ta = weather.air_temp_c;
        const rh = weather.humidity_pct ?? 60;
        const ws = weather.wind_speed_ms ?? 2;
        const twb = ta - ((100 - rh) / 5);
        const tg = ta + 8 - 5 * Math.pow(Math.max(ws, 0.1), 0.7);
        const wbgt = Math.round((0.7 * twb + 0.2 * tg + 0.1 * ta) * 10) / 10;
        const bmr = profile.weightKg * 1.1;
        const gain = Math.max(0, 15 * (wbgt - 28));
        const sweat = Math.round((bmr + gain) / 0.84 / (2426 / 3600));
        const cat = wbgt < 28 ? "Low Risk" : wbgt < 32 ? "Moderate Risk" : wbgt < 36 ? "High Risk" : "Extreme Risk";

        // Format Open-Meteo sun times (e.g., "2026-03-15T06:12" → "6:12 AM")
        const fmtIso = (isoStr) => {
          if (!isoStr) return null;
          try {
            const d = new Date(isoStr);
            return d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" });
          } catch { return null; }
        };

        setEnvData({
          wbgt_cels: wbgt, wbgt_category: cat,
          sweat_loss_ml_hr: sweat, heat_stress_warning: wbgt >= 32,
          sunrise: fmtIso(sunData?.sunrise) ?? fmtIso(weather.sunrise),
          sunset:  fmtIso(sunData?.sunset)  ?? fmtIso(weather.sunset),
          solar_noon: sunData?.solar_noon ?? null,
          day_length_hrs: sunData?.day_length_hrs ?? null,
        });

      } catch { /* silent */ }
    })();

    return () => { cancelled = true; };
  }, [city, profile.weightKg]);


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

  // Auto-trigger geolocation on first load
  const geoRequestedRef = useRef(false);
  useEffect(() => {
    if (!geoGranted && !geoRequestedRef.current) {
      geoRequestedRef.current = true;
      const id = setTimeout(onRequestGeo, 1500);
      return () => clearTimeout(id);
    }
  }, [geoGranted, onRequestGeo]);

  const lv = getLevel(uv);
  const burn = calcBurn(uv, profile.spf, profile.spf);
  const forecast = mounted ? buildForecast(city.name || "Melbourne") : [];
  const dateStr = time ? time.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "short" }) : "";
  const timeStr = time ? time.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" }) : "";
  
  const displayCity = city.name || "Melbourne";
  const displayState = city.state || "VIC";

  return (
    <div className="pad fade-in">
      <APIBanner status={apiStatus} />

      {/* ── Header Row ────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <CitySearch city={city} setCity={setCity} uvColor={uvColor} geoGranted={geoGranted} onRequestGeo={onRequestGeo} />
        <button
          className="geo-btn" onClick={onRequestGeo} aria-label="Detect my location"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", borderColor: geoGranted ? `${uvColor}60` : "var(--surface-border-strong)", color: geoGranted ? uvColor : "var(--text-2)", padding: "10px 14px", borderRadius: 14, background: geoGranted ? uvColor + "14" : "rgba(255,255,255,0.04)" }}
        >
          <MapPin size={20} strokeWidth={2.5} />
        </button>
        <button
          aria-label="UV Info" onClick={() => setShowUVInfo(true)}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "10px 14px", borderRadius: 14, border: "1.5px solid var(--surface-border-strong)", color: "var(--text-3)", background: "transparent" }}
        >
          <Info size={20} strokeWidth={2} />
        </button>
      </div>

      <div style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--text-3)", marginBottom: 20, marginTop: 4 }}>
        {dateStr}{dateStr && " · "}{CITIES[city]?.state}{timeStr && ` · ${timeStr}`}
      </div>

      {/* ── UV Gauge ──────────────────────────────── */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <div className="spinner" style={{ width: 40, height: 40, border: "3px solid var(--surface-border)", borderTopColor: uvColor }} />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <UVGauge uv={uv} uvColor={uvColor} size={200} />

          {/* ── Bento Metric Cards ──────────────── */}
          <BentoGrid>
            <MetricCard icon={<MapPin size={18} />} label="Location" value={displayCity} sub={displayState} accent={uvColor} />
            <MetricCard icon={<Clock size={18} />} label="Time to Burn" value={burn != null ? `${burn} min` : "—"} sub={`SPF ${profile.spf}`} accent="#EF6C00" />
            <MetricCard
              icon={<Thermometer size={18} />} label="Heat Stress"
              value={envData?.wbgt_cels != null ? `${envData.wbgt_cels}°C` : "—"}
              sub={envData ? envData.wbgt_category : "Fetching…"}
              accent="#E53935"
            />
            <MetricCard
              icon={<Droplets size={18} />} label="Sweat Loss"
              value={envData?.sweat_loss_ml_hr != null ? `${Math.round(envData.sweat_loss_ml_hr)} mL/hr` : "—"}
              sub={`${profile.weightKg}kg · ${profile.ageYears}yrs`}
              accent="#1565C0"
            />
            <MetricCard
              icon={<Sunrise size={18} />} label="Daylight"
              value={envData?.sunrise || "—"}
              sub={envData?.sunset ? `Sunset ${envData.sunset}` : "Fetching…"}
              accent="#F59E0B"
            />
          </BentoGrid>

          {/* ── Smart Activities & Hydration Card ── */}
          <div style={{ marginTop: 20 }}>
             <UnifiedSuggestionCard uv={uv} burn={burn} envData={envData} />
          </div>

          {/* ── User Profile (weight, age, SPF) ─── */}
          <div style={{ marginTop: 20 }}>
             <UserProfileForm profile={profile} onChange={handleProfileChange} />
          </div>

          {/* ── Animated Hourly Forecast ────────── */}
          <div style={{ marginTop: 20 }}>
             <HourlyForecastChart forecast={forecast} />
          </div>

          {/* Refresh button */}
          <div style={{ textAlign: "center", paddingBottom: 8 }}>
            <button
              className="refresh-btn" onClick={fetchUV} disabled={loading}
              aria-label="Refresh UV data"
              style={{ color: lv.color, borderColor: `${lv.color}55`, boxShadow: loading ? "none" : `0 4px 20px ${lv.color}18` }}
            >
              <RefreshCw size={16} strokeWidth={2.5} /> Refresh
            </button>
            <div className="attr">UV data · ARPANSA · Auto-refreshes every 5 min</div>
          </div>
        </div>
      )}

      {/* ── UV Info Drawer (bottom sheet) ──────── */}
      {showUVInfo && <UVInfoDrawer uv={uv} onClose={() => setShowUVInfo(false)} />}
    </div>
  );
}



// TODO: replace with actual page components as Awareness, Prevention and Settings are built
function BlankPage({ label }) {
  return <div className="blank-page">{label.toUpperCase()} — COMING SOON</div>;
}

export default function Page() {
  const [page, setPage] = useState("home");
  const [city, setCity] = useState({ name: "Melbourne", lat: -37.81, lon: 144.96, state: "VIC", arpansa: "Melbourne" });
  const [showModal, setShowModal] = useState(false);
  const [geoGranted, setGeoGranted] = useState(false);
  const [uv, setUv] = useState(0);
  const [prefs] = useState({ skinType: 2, spf: 30, weightKg: 75 });
  const [geoCoords, setGeoCoords] = useState(null);

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
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setGeoCoords({ lat, lon });
        setGeoGranted(true);

        try {
          // Reverse geocode to get suburb/city name
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
          const data = await res.json();
          
          const name = data.address?.suburb || data.address?.town || data.address?.city || "Current Location";
          const state = data.address?.state || "AU";
          
          const newCityObj = {
            name,
            lat,
            lon,
            state,
            arpansa: name
          };

          setCity(newCityObj);
          localStorage.setItem("uvibe_location", JSON.stringify({ city: newCityObj, granted: true }));
        } catch {
          // Fallback if reverse geocoding fails
          const fallback = { name: "Current Location", lat, lon, state: "AU", arpansa: "Melbourne" };
          setCity(fallback);
          localStorage.setItem("uvibe_location", JSON.stringify({ city: fallback, granted: true }));
        }
      },
      () => {
        const fall = { name: "Melbourne", lat: -37.81, lon: 144.96, state: "VIC", arpansa: "Melbourne" };
        setCity(fall);
        localStorage.setItem("uvibe_location", JSON.stringify({ city: fall, granted: false }));
      },
    );
  }, []);

  const handleDeny = useCallback(() => {
    setShowModal(false);
    const fall = { name: "Melbourne", lat: -37.81, lon: 144.96, state: "VIC", arpansa: "Melbourne" };
    setCity(fall);
    localStorage.setItem(
      "uvibe_location",
      JSON.stringify({ city: fall, granted: false }),
    );
  }, []);

  const ambientBg = `radial-gradient(ellipse 80% 50% at 50% -10%, ${lv.glow} 0%, transparent 60%)`;

  return (
    <div className="app">
      <div className="app-ambient" style={{ background: ambientBg }} />

      <WelcomeModal />
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
              geoCoords={geoCoords}
            />
          )}
          {page === "awareness" && <AwarenessPage />}
          {page === "prevention" && <Prevention />}
          {page === "profile" && <BlankPage label="Settings" />}
        </div>
        <BottomNav page={page} setPage={setPage} uvColor={lv.color} />
      </div>
    </div>
  );
}
