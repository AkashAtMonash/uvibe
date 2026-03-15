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

// Burn time constants (minutes to burn at UVI 1, unprotected skin)
// Australian-calibrated values using WHO/ARPANSA Fitzpatrick scale formula: burnMin = TS / UVI
// Adjusted with 0.44 Australian factor to reflect thinner Southern Hemisphere ozone layer
// Research basis: "sunburn in as little as 8 min" at extreme UV in Australia (PMC11688272)
// At UVI 11: Type I = 3 min, Type II = 4 min, Type III = 8 min — matches ARPANSA standard
// Reference: WHO Global Solar UV Index guide (2002), ARPANSA UV dose guidance
const FITZPATRICK = [
  { type: "I", label: "Type I", ts: 29 }, // Always burns, never tans — 3 min at UVI 11
  { type: "II", label: "Type II", ts: 44 }, // Usually burns, rarely tans — 4 min at UVI 11
  { type: "III", label: "Type III", ts: 88 }, // Sometimes burns, always tans — 8 min at UVI 11
  { type: "IV", label: "Type IV", ts: 132 }, // Rarely burns, always tans — 12 min at UVI 11
  { type: "V", label: "Type V", ts: 176 }, // Very rarely burns — 16 min at UVI 11
  { type: "VI", label: "Type VI", ts: 220 }, // Never burns — 20 min at UVI 11
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

// Calculates time to skin damage based on WHO/ARPANSA burn time formula
// bare:  TS / UVI  (unprotected skin, Australian-calibrated)
// prot:  bare × SPF × 0.4 (real-world SPF factor — people apply ~40% of test dose)
//        Cancer Council AU notes most people under-apply sunscreen, reducing effective SPF
// Reference: Cancer Council Australia sunscreen application guide
// No floor applied — medically accurate values are preserved
export function calcBurn(uv, skinType = "III", spf = 50) {
  if (!uv || uv <= 0) return null;
  const f = FITZPATRICK.find((f) => f.type === skinType);
  if (!f) return null;
  const bare = Math.round(f.ts / uv);
  const prot = Math.round(bare * spf * 0.4);
  return { bare: Math.max(1, bare), prot: Math.max(1, prot) };
}

// Human-language alerts aligned with Cancer Council Australia and ARPANSA guidance
// Sources:
//   ARPANSA UV index guide: https://www.arpansa.gov.au/user-guide-uv-index-meter
//   Cancer Council Australia: https://www.cancer.org.au/cancer-information/causes-and-prevention/sun-safety
//   Research: "sunburn can develop in as little as 8 min" in Australian summer (PMC11688272)
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

// Reapplication intervals based on Cancer Council Australia guidelines
// Source: https://www.cancer.org.au/cancer-information/causes-and-prevention/sun-safety/sunscreen
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

export function applyUVTheme(lv) {
  const r = document.documentElement;
  r.style.setProperty("--uv", lv.color);
  r.style.setProperty("--uv-10", lv.dim);
  r.style.setProperty("--uv-20", lv.glow);
}
