"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { BentoGrid, MetricCard, UVGauge } from "./BentoCards";
import { HourlyForecastChart, UnifiedSuggestionCard, UserProfileForm } from "./DashboardWidgets";
import CitySearch from "./CitySearch";
import { MapPin, Thermometer, Droplets, Clock, Sunrise } from "lucide-react";
import WelcomeModal from "./WelcomeModal";
import {
  CITIES,
  getLevel,
  calcBurn,
  humanAlert,
  getDynamicInterval,
  simulateUV,
  applyUVTheme,
} from "@/utils/uv";

export default function HomePage({
  city,
  setCity,
  prefs,
  geoGranted,
  onRequestGeo,
  onSaveReading,
  onUVUpdate,
  onRequestNotif,
  onSyncPrefs,
  sendTestNotification,
  theme,
  setTheme,
}) {
  const [uv, setUv] = useState(0);
  const [weather, setWeather] = useState(null);
  const [envData, setEnvData] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState(null);
  const [time, setTime] = useState(null);
  const timerRef = useRef(null);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [notifError, setNotifError] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [uvFailed, setUvFailed] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const fetchUV = useCallback(async () => {
    setLoading(true);
    try {
      const c = typeof city === "string" ? CITIES[city] : city;
      let url = `/api/uv?city=${encodeURIComponent(c?.arpansa || c?.name || "Melbourne")}`;
      if (c && c.lat && c.lon) {
        url += `&lat=${c.lat}&lon=${c.lon}`;
      }
      
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const uvVal = parseFloat(data.uv);
      setUv(uvVal);
      setApiStatus("ok");
      setLastUpdated(new Date());
      setUvFailed(false);
      onSaveReading?.(city, uvVal, data.source || "api");
      onUVUpdate?.(uvVal);
    } catch {
      try {
        const c = typeof city === "string" ? CITIES[city] : city;
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
        setLastUpdated(new Date());
        setUvFailed(false);
        onSaveReading?.(city, fallbackVal, "open-meteo");
        onUVUpdate?.(fallbackVal);
      } catch {
        setApiStatus("error");
        setUvFailed(true);
      }
    }
    setLoading(false);
  }, [city]);

  const fetchWeather = useCallback(async () => {
    try {
      const c = typeof city === "string" ? CITIES[city] : city;
      if (!c) return;
      const res = await fetch(`/api/weather?lat=${c.lat}&lon=${c.lon}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setWeather(data);
    } catch {
      setWeather(null);
    }
  }, [city]);

  const fetchEnv = useCallback(async () => {
    try {
      const c = typeof city === "string" ? CITIES[city] : city;
      if (!c) return;
      const res = await fetch("/api/env", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: c.lat,
          lon: c.lon,
          weight_kg: prefs.weightKg || 70,
          age_years: prefs.ageYears || 25,
        }),
      });
      if (res.ok) setEnvData(await res.json());
    } catch {}
  }, [city, prefs]);

  const fetchForecast = useCallback(async () => {
    try {
      const cityName = typeof city === "string" ? city : city.name;
      const res = await fetch(`/api/uvgraph?city=${encodeURIComponent(cityName)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (!data.hourly) throw new Error();
      const currentH = new Date().getHours();
      // Build full 24-hour strip with labelled hours (e.g. "3 AM", "6 AM")
      const strip = data.hourly.map((h) => {
        const val = h.measured ?? h.forecast ?? 0;
        // API returns ISO strings like '2024-03-16T13' (hour field)
        // Extract just the hour number: handle both 'HH:MM' and 'YYYY-MM-DDTHH'
        const hourStr = h.hour || "0";
        const hourNum = hourStr.includes("T")
          ? parseInt(hourStr.split("T")[1], 10) // ISO: take part after T
          : parseInt(hourStr.split(":")[0], 10); // HH:MM: take part before :
        const amPm = hourNum < 12 ? "AM" : "PM";
        const h12 = hourNum % 12 || 12;
        return {
          label: `${h12} ${amPm}`,
          val: parseFloat(val.toFixed(1)),
          lv: getLevel(val),
          now: hourNum === currentH,
        };
      });
      setForecast(strip);
    } catch {
      setForecast([]);
    }
  }, [city]);

  useEffect(() => {
    fetchUV();
    fetchWeather();
    fetchEnv();
    fetchForecast();
    timerRef.current = setInterval(
      () => {
        fetchUV();
        fetchWeather();
        fetchEnv();
        fetchForecast();
      },
      5 * 60 * 1000,
    );
    return () => clearInterval(timerRef.current);
  }, [fetchUV, fetchWeather, fetchEnv, fetchForecast]);

  useEffect(() => {
    setTime(new Date());
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    applyUVTheme(getLevel(uv));
  }, [uv]);

  const lv = getLevel(uv);
  const burn = calcBurn(uv, prefs.skinType, prefs.spf);
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

  const isDark = theme === "dark" || theme === "black";

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth p-6 pb-[88px] md:p-8 md:pb-12 md:max-w-4xl md:mx-auto">

      {/* ── Top bar ── */}
      <div className="w-full flex items-center gap-3 mb-2 relative z-[300]">
        {/* Search */}
        <div className="flex-1 min-w-0">
          <CitySearch
            city={city}
            setCity={(c) => {
              if (typeof c === "string") setCity(c);
              else if (c?.name) setCity(c.name);
            }}
          />
        </div>

        {/* Info button — opens the UV guide */}
        <button
          onClick={() => setShowGuide(true)}
          title="UV & Heat Guide"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: "50%", background: "var(--bg-2, rgba(255,255,255,0.6))", border: "1.5px solid var(--border-2, rgba(0,0,0,0.1))", color: "var(--fg-2, #555)", cursor: "pointer", flexShrink: 0, transition: "all 0.2s", fontSize: 16, fontWeight: 700 }}
        >
          ℹ
        </button>

        {/* Location pin */}
        <button
          onClick={onRequestGeo}
          title="Use My Location"
          style={{ display: "flex", color: "#9ca3af", background: "none", border: "none", cursor: "pointer", padding: 4 }}
        >
          <MapPin size={20} strokeWidth={2} />
        </button>

        {/* Notifications */}
        <div className="relative" style={{ flexShrink: 0 }}>
          <button
            onClick={() => {
              setShowNotifPanel((p) => !p);
              setNotifError(null);
              setTestResult(null);
            }}
            title="Notifications"
            style={{ display: "flex", color: "#9ca3af", background: "none", border: "none", cursor: "pointer", padding: 4, position: "relative" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {uv >= 8 && <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />}
          </button>

          {showNotifPanel && (
            <>
              <div className="fixed inset-0 z-[399]" onClick={() => setShowNotifPanel(false)} />
              <div className="absolute top-[calc(100%+8px)] right-0 w-[300px] z-[400] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-lg overflow-hidden">

                <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--fg)", marginBottom: 2 }}>UV Notifications</div>
                  <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--fg-3)" }}>
                    {city} · UV {uv.toFixed(1)}
                  </div>
                </div>

                <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>UV Alerts</div>
                    <div style={{ fontSize: 11, color: "var(--fg-3)" }}>Notify when UV is high</div>
                  </div>
                  <label style={{ position: "relative", width: 48, height: 28, flexShrink: 0, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={prefs.notifEnabled ?? false}
                      style={{ opacity: 0, width: 0, height: 0, position: "absolute" }}
                      onChange={async (e) => {
                        const val = e.target.checked;
                        setNotifError(null);
                        if (val) {
                          const result = await onRequestNotif?.({ ...prefs, notifEnabled: true });
                          if (result?.error) { setNotifError(result.error); return; }
                          onSyncPrefs?.({ ...prefs, notifEnabled: true });
                        } else {
                          onSyncPrefs?.({ ...prefs, notifEnabled: false });
                        }
                      }}
                    />
                    <div style={{ position: "absolute", inset: 0, borderRadius: 28, background: (prefs.notifEnabled ?? false) ? "var(--uv)" : "var(--bg-4)", border: `1px solid ${(prefs.notifEnabled ?? false) ? "var(--uv)" : "var(--border)"}`, transition: "all 0.15s" }} />
                    <div style={{ position: "absolute", top: 3, left: 3, width: 20, height: 20, borderRadius: "50%", background: "var(--fg)", transform: (prefs.notifEnabled ?? false) ? "translateX(20px)" : "translateX(0)", transition: "transform 0.15s var(--ease)", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
                  </label>
                </div>

                {notifError && (
                  <div style={{ padding: "8px 16px", fontSize: 11, fontFamily: "var(--font-mono)", color: "#ef4444", borderBottom: "1px solid var(--border)" }}>
                    ✗ {notifError}
                  </div>
                )}

                <div style={{ padding: 12 }}>
                  <button
                    onClick={async () => {
                      setTestResult("Sending…");
                      const result = await sendTestNotification?.();
                      setTestResult(result?.success ? "✓ Notification sent!" : `✗ ${result?.error ?? "Failed"}`);
                      setTimeout(() => setTestResult(null), 3000);
                    }}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--r-sm)", border: "1px solid var(--border-2)", background: "var(--surface)", color: "var(--fg-2)", fontSize: 12, fontWeight: 600, fontFamily: "var(--font-display)", cursor: "pointer", transition: "all 0.15s" }}
                  >
                    🔔 Send Test Notification
                  </button>
                  {testResult && (
                    <div style={{ marginTop: 8, padding: "7px 12px", borderRadius: "var(--r-sm)", fontSize: 11, fontFamily: "var(--font-mono)", textAlign: "center", background: testResult.startsWith("✓") ? "rgba(34,211,170,0.1)" : "rgba(239,68,68,0.1)", color: testResult.startsWith("✓") ? "#22d3aa" : "#ef4444", border: `1px solid ${testResult.startsWith("✓") ? "rgba(34,211,170,0.3)" : "rgba(239,68,68,0.3)"}` }}>
                      {testResult}
                    </div>
                  )}
                </div>

              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Date / state ── */}
      <div className="text-xs text-gray-400 font-medium mb-6 ml-1 tracking-wide flex justify-between">
        <span>{dateStr} · {CITIES[city]?.state || "VIC"} · {timeStr}</span>
        {lastUpdated && (
          <span style={{ color: uvFailed ? "#ef4444" : "inherit" }}>
            UV updated {lastUpdated.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      {/* ── Data status bar ── */}
      {apiStatus && apiStatus !== "ok" && (
        <div
          role="alert"
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            padding: "12px 14px",
            borderRadius: "var(--r-sm)",
            marginBottom: 14,
            border: `1px solid ${apiStatus === "error" ? "rgba(239,68,68,0.35)" : "rgba(245,158,11,0.35)"}`,
            background: apiStatus === "error" ? "rgba(239,68,68,0.07)" : "rgba(245,158,11,0.07)",
          }}
        >
          <span style={{ fontSize: 16, flexShrink: 0 }}>{apiStatus === "error" ? "⚠" : "⚡"}</span>
          <div style={{ flex: 1 }}>
            {apiStatus === "error" ? (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#ef4444", marginBottom: 2 }}>UV Data Unavailable</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>Could not fetch UV data. Please check your connection and refresh.</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b", marginBottom: 2 }}>Forecast Data</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>Displaying forecast data. Actual UV may differ from measured values.</div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── UV Hero Wide Pill ── */}
      <div
        className="w-full h-[240px] rounded-[120px] mb-8 flex items-center justify-center relative shadow-sm overflow-hidden"
        style={{ backgroundColor: lv.dim }}
      >
        <div className="p-2 transform transition-transform hover:scale-105 duration-500 z-10">
          <UVGauge uv={uv} uvColor={lv.color} size={200} cleanMode={true} />
        </div>
      </div>

      {/* ── Bento Grid: Core Metrics ── */}
      <div className="w-full relative z-10 mb-6">
        <BentoGrid>
          <MetricCard
            icon={<MapPin size={18} strokeWidth={2.5} />}
            label="Location"
            value={CITIES[city]?.arpansa || city}
            sub={CITIES[city]?.state || "VIC"}
            accent={lv.color}
          />
          <MetricCard
            icon={<Clock size={18} strokeWidth={2.5} />}
            label="Time to Burn"
            value={burn ? `${burn.bare}m` : "—"}
            sub={`SPF ${prefs.spf}`}
            accent={lv.color}
          />
          <MetricCard
            icon={<Thermometer size={18} strokeWidth={2.5} />}
            label="Heat Stress"
            value={envData?.wbgt_cels != null ? `${envData.wbgt_cels}°C` : "—"}
            sub={envData?.wbgt_category || "Loading…"}
            accent="#E65100"
          />
          <MetricCard
            icon={<Droplets size={18} strokeWidth={2.5} />}
            label="Sweat Loss"
            value={envData?.sweat_loss_ml_hr != null ? `${envData.sweat_loss_ml_hr} mL/hr` : "—"}
            sub={`${prefs.weightKg || 70}kg · ${prefs.ageYears || 25}yrs`}
            accent="#0288D1"
          />
          <MetricCard
            icon={<Sunrise size={18} strokeWidth={2.5} />}
            label="Daylight"
            value={weather?.sunrise ? new Date(weather.sunrise * 1000).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" }) : "—"}
            sub={weather?.sunset ? `Sunset ${new Date(weather.sunset * 1000).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" })}` : "—"}
            accent="#FBC02D"
          />
        </BentoGrid>
      </div>

      <div className="w-full flex flex-col gap-6 mb-8">
        <UnifiedSuggestionCard uv={uv} burn={burn} envData={envData} />
        <UserProfileForm profile={prefs} onChange={(k, v) => onSyncPrefs({ ...prefs, [k]: v })} />
        <HourlyForecastChart forecast={forecast} />
      </div>

      {/* ── Refresh ── */}
      <div className="text-center pb-2">
        <button
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-black/50 backdrop-blur-md text-[13px] font-semibold transition-all hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50"
          onClick={() => { fetchUV(); fetchWeather(); }}
          disabled={loading}
          style={{ color: lv.color, borderColor: `${lv.color}55` }}
        >
          {loading ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${lv.color}55`, borderTopColor: "transparent" }} />
              Refreshing…
            </>
          ) : (
            <>↻ Refresh</>
          )}
        </button>
        <div className="text-[9px] font-mono text-gray-400 mt-3 tracking-wider">
          UV · ARPANSA · Weather · OpenWeather · Refreshes every 5 min
        </div>
      </div>
      {/* Guide modal triggered by info button */}
      {showGuide && (
        <WelcomeModal
          forceOpen={showGuide}
          onClose={(isFirstTime) => {
            setShowGuide(false);
            if (isFirstTime) {
              setTimeout(() => onRequestGeo(), 500);
            }
          }}
        />
      )}
    </div>
  );
}
