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
    glow: "rgba(34,211,170,0.20)",
    short: "Safe outdoors",
  },
  {
    name: "Moderate",
    min: 3,
    max: 5.9,
    color: "#fbbf24",
    dim: "rgba(251,191,36,0.10)",
    glow: "rgba(251,191,36,0.20)",
    short: "Wear SPF 30+",
  },
  {
    name: "High",
    min: 6,
    max: 7.9,
    color: "#f97316",
    dim: "rgba(249,115,22,0.10)",
    glow: "rgba(249,115,22,0.20)",
    short: "SPF 50+ essential",
  },
  {
    name: "Very High",
    min: 8,
    max: 10.9,
    color: "#ef4444",
    dim: "rgba(239,68,68,0.10)",
    glow: "rgba(239,68,68,0.20)",
    short: "Avoid peak hours",
  },
  {
    name: "Extreme",
    min: 11,
    max: 99,
    color: "#c026d3",
    dim: "rgba(192,38,211,0.10)",
    glow: "rgba(192,38,211,0.20)",
    short: "Stay indoors",
  },
];

const FITZPATRICK = [
  { type: "I", multi: 0.6 },
  { type: "II", multi: 0.8 },
  { type: "III", multi: 1.0 },
  { type: "IV", multi: 1.3 },
  { type: "V", multi: 1.6 },
  { type: "VI", multi: 2.0 },
];

const BASE_UV = {
  Darwin: 12.4,
  "Alice Springs": 11.8,
  Townsville: 11.2,
  Emerald: 11.0,
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

export function calcBurn(uv, skinType = "III", spf = 30) {
  if (!uv || uv <= 0) return null;
  const f = FITZPATRICK.find((f) => f.type === skinType);
  if (!f) return null;
  return {
    bare: Math.max(3, Math.round((200 / (3 * uv)) * f.multi)),
    prot: Math.max(
      10,
      Math.round((200 / (3 * uv)) * f.multi * Math.sqrt(spf / 15)),
    ),
  };
}

export function humanAlert(uv, burn, city) {
  if (!burn || uv <= 0)
    return `UV data loaded for ${city}. Check back during daylight hours.`;
  if (uv <= 2)
    return `UV is ${uv} in ${city}. Conditions are safe — no sun protection needed right now.`;
  if (uv <= 5)
    return `UV is ${uv} in ${city}. Skin damage begins in ~${burn.bare} min without protection.`;
  if (uv <= 7)
    return `UV is ${uv} in ${city}. Bare skin burns in ~${burn.bare} min. SPF 50+ gives ~${burn.prot} min.`;
  if (uv <= 10)
    return `Dangerous UV of ${uv} in ${city}. Skin damage starts in ${burn.bare} min — apply SPF 50+ and seek shade now.`;
  return `Extreme UV ${uv} in ${city}. Permanent damage in as little as ${burn.bare} min. Stay indoors if possible.`;
}

export function getDynamicInterval(uv) {
  if (uv >= 11)
    return {
      label: "Every 30 min",
      reason: "Extreme UV — maximum reminder frequency",
    };
  if (uv >= 8)
    return {
      label: "Every 1 hour",
      reason: "Very High UV — hourly reapplication essential",
    };
  if (uv >= 6)
    return {
      label: "Every 90 min",
      reason: "High UV — standard reapplication window",
    };
  if (uv >= 3)
    return {
      label: "Every 2 hours",
      reason: "Moderate UV — regular reapplication recommended",
    };
  return { label: "Every 4 hours", reason: "Low UV — minimal reminder needed" };
}

export function nearestCity(lat, lon) {
  let best = "Melbourne",
    bestD = Infinity;
  Object.entries(CITIES).forEach(([name, c]) => {
    const d = Math.sqrt((lat - c.lat) ** 2 + (lon - c.lon) ** 2);
    if (d < bestD) {
      bestD = d;
      best = name;
    }
  });
  return best;
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

export function buildForecast(city) {
  return Array.from({ length: 10 }, (_, i) => {
    const h = new Date();
    h.setHours(h.getHours() + i - 3);
    const hr = h.getHours();
    const mod =
      hr >= 10 && hr <= 14
        ? 1
        : hr < 8 || hr > 18
          ? 0.04
          : hr < 10
            ? 0.5
            : 0.62;
    const val = Math.max(
      0,
      parseFloat(
        ((BASE_UV[city] ?? 8) * mod + (Math.random() - 0.5) * 0.3).toFixed(1),
      ),
    );
    const lbl =
      i === 3
        ? "Now"
        : hr === 0
          ? "12am"
          : `${hr > 12 ? hr - 12 : hr || 12}${hr >= 12 ? "pm" : "am"}`;
    return { label: lbl, val, lv: getLevel(val), now: i === 3 };
  });
}
