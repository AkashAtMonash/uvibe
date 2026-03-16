/**
 * UVibe Backend API Client
 * Connects to FastAPI at http://localhost:8000
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const PY_BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";
// ─────────────────────────────────────────────────────────
// UV Data
// ─────────────────────────────────────────────────────────

/**
 * Fetch real-time UV data from backend (ARPANSA → OWM fallback)
 */
export async function fetchUVData({ lat, lon, weight_kg = 75, fitzpatrick_type = 2 }) {
  const params = new URLSearchParams({ lat, lon, weight_kg, fitzpatrick_type });
  const res = await fetch(`${BACKEND_URL}/api/uv?${params}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error("UV fetch failed");
  return res.json();
}

// ─────────────────────────────────────────────────────────
// Environmental Data (WBGT + Sweat Loss)
// ─────────────────────────────────────────────────────────

/**
 * POST environmental conditions to get WBGT and sweat loss numbers
 */
export async function fetchEnvData({ lat, lon, air_temp_c, humidity_pct, wind_speed_ms, weight_kg = 75 }) {
  const res = await fetch(`${BACKEND_URL}/api/env`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lat, lon, air_temp_c, humidity_pct, wind_speed_ms, weight_kg }),
  });
  if (!res.ok) throw new Error("Env fetch failed");
  return res.json();
}

// ─────────────────────────────────────────────────────────
// ARPANSA Stations (for D3 map)
// ─────────────────────────────────────────────────────────

export async function fetchARPANSAStations() {
  const res = await fetch(`${BACKEND_URL}/api/arpansa/stations`, {
    next: { revalidate: 120 },
  });
  if (!res.ok) throw new Error("ARPANSA station fetch failed");
  return res.json();
}

// ─────────────────────────────────────────────────────────
// ML Skin Analysis
// ─────────────────────────────────────────────────────────

/**
 * Upload an image File to the backend for Fitzpatrick skin type analysis
 * Returns { fitzpatrick_type, type_name, uv_vulnerability, aging_multiplier,
 *           detected_markers, confidence }
 */
export async function analyzeSkin(imageFile) {
  const form = new FormData();
  form.append("file", imageFile);
  const res = await fetch(`${process.env.BACKEND_URL}/api/ml/analyze-skin`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "ML analysis failed");
  }
  return res.json();
}

// ─────────────────────────────────────────────────────────
// OpenWeatherMap — fetch from client-side using Next.js API route
// ─────────────────────────────────────────────────────────

/**
 * Fetch weather conditions (temp, humidity, wind) via our Next.js route
 * to avoid exposing OWM keys on the client.
 */
export async function fetchWeatherConditions({ lat, lon }) {
  const params = new URLSearchParams({ lat, lon });
  const res = await fetch(`/api/weather?${params}`);
  if (!res.ok) return null;
  return res.json();
}
