export const CITIES = {
  Melbourne: { lat: -37.81, lon: 144.96, state: "VIC", arpansa: "Melbourne" },
  Sydney: { lat: -33.87, lon: 151.21, state: "NSW", arpansa: "Sydney" },
  Brisbane: { lat: -27.47, lon: 153.03, state: "QLD", arpansa: "Brisbane" },
  Adelaide: { lat: -34.93, lon: 138.6, state: "SA", arpansa: "Adelaide" },
  Perth: { lat: -31.95, lon: 115.86, state: "WA", arpansa: "Perth" },
  Darwin: { lat: -12.46, lon: 130.84, state: "NT", arpansa: "Darwin" },
  Hobart: { lat: -42.88, lon: 147.33, state: "TAS", arpansa: "Kingston" },
  Canberra: { lat: -35.28, lon: 149.13, state: "ACT", arpansa: "Canberra" },
  Townsville: { lat: -19.26, lon: 146.82, state: "QLD", arpansa: "Townsville" },
  "Alice Springs": {
    lat: -23.7,
    lon: 133.88,
    state: "NT",
    arpansa: "Alice Springs",
  },
  "Gold Coast": {
    lat: -28.0,
    lon: 153.43,
    state: "QLD",
    arpansa: "Gold Coast",
  },
  Newcastle: { lat: -32.93, lon: 151.78, state: "NSW", arpansa: "Newcastle" },
  Emerald: { lat: -23.52, lon: 148.16, state: "QLD", arpansa: "Emerald" },
};

export const UV_LEVELS = [
  {
    name: "Low",
    min: 0,
    max: 2.9,
    color: "#22d3aa",
    dim: "rgba(34,211,170,0.10)",
    glow: "rgba(34,211,170,0.15)",
  },
  {
    name: "Moderate",
    min: 3,
    max: 5.9,
    color: "#f59e0b",
    dim: "rgba(245,158,11,0.10)",
    glow: "rgba(245,158,11,0.15)",
  },
  {
    name: "High",
    min: 6,
    max: 7.9,
    color: "#f97316",
    dim: "rgba(249,115,22,0.10)",
    glow: "rgba(249,115,22,0.15)",
  },
  {
    name: "Very High",
    min: 8,
    max: 10.9,
    color: "#ef4444",
    dim: "rgba(239,68,68,0.10)",
    glow: "rgba(239,68,68,0.15)",
  },
  {
    name: "Extreme",
    min: 11,
    max: 99,
    color: "#c026d3",
    dim: "rgba(192,38,211,0.10)",
    glow: "rgba(192,38,211,0.15)",
  },
];

const FITZPATRICK = [
  { type: "I", label: "Type I", ts: 29 },
  { type: "II", label: "Type II", ts: 44 },
  { type: "III", label: "Type III", ts: 88 },
  { type: "IV", label: "Type IV", ts: 132 },
  { type: "V", label: "Type V", ts: 176 },
  { type: "VI", label: "Type VI", ts: 220 },
];

const BASE_UV = {
  Darwin: 12.4,
  "Alice Springs": 11.8,
  Emerald: 11.0,
  Townsville: 11.2,
  "Gold Coast": 10.6,
  Brisbane: 10.2,
  Newcastle: 9.8,
  Perth: 9.8,
  Adelaide: 9.1,
  Sydney: 8.9,
  Canberra: 8.3,
  Melbourne: 7.9,
  Hobart: 6.4,
};

export function getLevel(uv) {
  return UV_LEVELS.find((l) => uv >= l.min && uv <= l.max) || UV_LEVELS[0];
}

export function applyUVTheme(level) {
  if (typeof document === "undefined" || !level) return;

  const root = document.documentElement;
  root.style.setProperty("--uv-color", level.color || UV_LEVELS[0].color);
  root.style.setProperty("--uv-dim", level.dim || UV_LEVELS[0].dim);
  root.style.setProperty("--uv-glow", level.glow || UV_LEVELS[0].glow);
}

export function calcBurn(uv, skinType = "III", spf = 50) {
  if (!uv || uv <= 0) return null;
  const f = FITZPATRICK.find((f) => f.type === skinType);
  if (!f) return null;
  const bare = Math.round(f.ts / uv);
  const prot = Math.round(bare * spf * 0.4);
  return { bare: Math.max(1, bare), prot: Math.max(1, prot) };
}

export function humanAlert(uv, burn, city) {
  if (!burn || uv <= 0) {
    return `UV data loaded for ${city}. Check back during daylight hours.`;
  }
  if (uv < 3) {
    return `UV is ${uv} in ${city}. Low risk — no sun protection needed for most people. Protect skin if outdoors for more than 1 hour.`;
  }
  if (uv < 6) {
    return `UV is ${uv} in ${city}. Skin damage begins in ~${burn.bare} min unprotected. Wear SPF 30+, a hat and sunglasses outdoors.`;
  }
  if (uv < 8) {
    return `UV is ${uv} in ${city}. Unprotected skin can burn in ~${burn.bare} min. SPF 50+ essential — seek shade between 10am–3pm.`;
  }
  if (uv < 11) {
    return `UV is ${uv} in ${city}. Skin damage in as little as ${burn.bare} min. Avoid outdoor exposure — apply SPF 50+ and cover up now.`;
  }
  return `Extreme UV ${uv} in ${city}. Permanent skin damage in as little as ${burn.bare} min. Stay indoors or in full shade. SPF 50+ mandatory.`;
}

export function getDynamicInterval(uv) {
  if (uv >= 11)
    return {
      label: "Every 2 hours",
      reason: "Extreme UV — reapply regardless of claims",
    };
  if (uv >= 8)
    return {
      label: "Every 2 hours",
      reason: "Very High UV — reapply after sweating or swimming",
    };
  if (uv >= 6)
    return {
      label: "Every 2 hours",
      reason: "High UV — Cancer Council recommendation",
    };
  if (uv >= 3)
    return {
      label: "Every 2 hours",
      reason: "Moderate UV — standard Cancer Council guidance",
    };
  return {
    label: "Every 2 hours",
    reason: "Cancer Council recommends consistent reapplication",
  };
}

export function nearestCity(lat, lon) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return "Melbourne";

  let bestCity = "Melbourne";
  let bestDist = Infinity;

  for (const [name, coords] of Object.entries(CITIES)) {
    if (!coords) continue;
    const dLat = lat - coords.lat;
    const dLon = lon - coords.lon;
    const dist = dLat * dLat + dLon * dLon;

    if (dist < bestDist) {
      bestDist = dist;
      bestCity = name;
    }
  }

  return bestCity;
}

export function simulateUV(city) {
  const hr = new Date().getHours();
  const mod =
    hr >= 10 && hr <= 14 ? 1 : hr < 8 || hr > 18 ? 0.04 : hr < 10 ? 0.55 : 0.65;
  return Math.max(
    0,
    parseFloat(
      ((BASE_UV[city] ?? 8) * mod + (Math.random() - 0.5) * 0.4).toFixed(1),
    ),
  );
}
