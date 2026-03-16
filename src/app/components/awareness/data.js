// ─── Static datasets for the Awareness Module ────────────────────────────────

export const STATE_KPIS = [
  {
    name: "Northern Territory",
    abbr: "NT",
    peakUVI: 14.5,
    burnTimeMin: 8,
    skinCancerIncidence: 60,
    economicBurden: "High",
    commonCancer: "SCC",
    benchmarkLabel: "3× Higher than Berlin",
  },
  {
    name: "Queensland",
    abbr: "QLD",
    peakUVI: 13.8,
    burnTimeMin: 10,
    skinCancerIncidence: 89,
    economicBurden: "$1B+ annually",
    commonCancer: "SCC",
    benchmarkLabel: "Higher than Sahara Desert",
  },
  {
    name: "Western Australia",
    abbr: "WA",
    peakUVI: 12.8,
    burnTimeMin: 11,
    skinCancerIncidence: 78,
    economicBurden: "High",
    commonCancer: "SCC",
    benchmarkLabel: "2× Higher than Madrid",
  },
  {
    name: "South Australia",
    abbr: "SA",
    peakUVI: 11.5,
    burnTimeMin: 13,
    skinCancerIncidence: 72,
    economicBurden: "Moderate-High",
    commonCancer: "BCC/SCC",
    benchmarkLabel: "Higher than peak Cairo",
  },
  {
    name: "New South Wales",
    abbr: "NSW",
    peakUVI: 12.1,
    burnTimeMin: 12,
    skinCancerIncidence: 68,
    economicBurden: "High",
    commonCancer: "SCC",
    benchmarkLabel: "2× Higher than New York",
  },
  {
    name: "Australian Capital Territory",
    abbr: "ACT",
    peakUVI: 11.0,
    burnTimeMin: 14,
    skinCancerIncidence: 65,
    economicBurden: "Moderate",
    commonCancer: "BCC",
    benchmarkLabel: "Equal to peak Cairo",
  },
  {
    name: "Victoria",
    abbr: "VIC",
    peakUVI: 10.5,
    burnTimeMin: 15,
    skinCancerIncidence: 58,
    economicBurden: "Moderate",
    commonCancer: "BCC",
    benchmarkLabel: "Equal to peak Cairo",
  },
  {
    name: "Tasmania",
    abbr: "TAS",
    peakUVI: 8.2,
    burnTimeMin: 20,
    skinCancerIncidence: 55,
    economicBurden: "Moderate",
    commonCancer: "BCC",
    benchmarkLabel: '"Extreme" by European standards',
  },
];

// Benchmark cities for the live comparison bar chart
// Real-time UV data is fetched from Open-Meteo for these coordinates
export const BENCHMARK_CITIES = [
  { name: "Sydney", lat: -33.87, lon: 151.21, flag: "🇦🇺" },
  { name: "London", lat: 51.51, lon: -0.13, flag: "🇬🇧" },
  { name: "New York", lat: 40.71, lon: -74.01, flag: "🇺🇸" },
  { name: "Tokyo", lat: 35.68, lon: 139.69, flag: "🇯🇵" },
  { name: "Dubai", lat: 25.20, lon: 55.27, flag: "🇦🇪" },
  { name: "Berlin", lat: 52.52, lon: 13.40, flag: "🇩🇪" },
];

// Fitzpatrick skin type factors for burn time calculation
// Burn Time (min) = (200 / UVI) * skin_factor
export const FITZPATRICK_TYPES = [
  { type: 1, label: "Type I", description: "Always burns, never tans", color: "#FFEAD4", factor: 1.0 },
  { type: 2, label: "Type II", description: "Usually burns, tans minimally", color: "#F6D5B0", factor: 1.5 },
  { type: 3, label: "Type III", description: "Sometimes burns, tans gradually", color: "#E8B88A", factor: 2.0 },
  { type: 4, label: "Type IV", description: "Rarely burns, tans well", color: "#C68642", factor: 2.5 },
  { type: 5, label: "Type V", description: "Very rarely burns, tans deeply", color: "#8D5524", factor: 3.0 },
  { type: 6, label: "Type VI", description: "Never burns, deeply pigmented", color: "#4A2912", factor: 3.5 },
];

// WHO UV risk levels (colorblind-friendly palette)
export const WHO_LEVELS = [
  { min: 0,  max: 2,  label: "Low",       color: "#4CAF50", cbColor: "#1a9850" },
  { min: 3,  max: 5,  label: "Moderate",  color: "#FFC107", cbColor: "#fee08b" },
  { min: 6,  max: 7,  label: "High",      color: "#FF9800", cbColor: "#f46d43" },
  { min: 8,  max: 10, label: "Very High", color: "#F44336", cbColor: "#d73027" },
  { min: 11, max: 99, label: "Extreme",   color: "#9C27B0", cbColor: "#762a83" },
];

export const getWHOLevel = (uv) =>
  WHO_LEVELS.find((l) => uv >= l.min && uv <= l.max) ?? WHO_LEVELS[0];

// Solar noon bell curve: UVI(t) = peakUVI × sin(π × (t-6)/12)
// t = hour (6 to 18)
export const uvAtHour = (peakUVI, hour) => {
  if (hour < 6 || hour > 18) return 0;
  return Math.max(0, peakUVI * Math.sin((Math.PI * (hour - 6)) / 12));
};

// Dose-response data for SPF chart (Cumulative UV Dose SED vs Cancer Probability %)
// Source: adapted from studies on cumulative UVR and keratinocyte carcinoma
export const DOSE_RESPONSE = {
  noSpf: [
    { sed: 0, risk: 0 }, { sed: 500, risk: 2 }, { sed: 1000, risk: 5 },
    { sed: 2000, risk: 12 }, { sed: 3000, risk: 22 }, { sed: 5000, risk: 40 },
    { sed: 7000, risk: 60 }, { sed: 10000, risk: 80 },
  ],
  spf30: [
    { sed: 0, risk: 0 }, { sed: 500, risk: 0.5 }, { sed: 1000, risk: 2 },
    { sed: 2000, risk: 5 }, { sed: 3000, risk: 10 }, { sed: 5000, risk: 20 },
    { sed: 7000, risk: 35 }, { sed: 10000, risk: 55 },
  ],
  spf50: [
    { sed: 0, risk: 0 }, { sed: 500, risk: 0.2 }, { sed: 1000, risk: 0.8 },
    { sed: 2000, risk: 2 }, { sed: 3000, risk: 5 }, { sed: 5000, risk: 12 },
    { sed: 7000, risk: 22 }, { sed: 10000, risk: 38 },
  ],
};

// Compute actual SPF based on thickness using logarithmic scaling
// actual_SPF ≈ labeled_SPF × (thickness / 2)^1.7
export const actualSpf = (labeledSpf, thickness) =>
  Math.max(1, Math.round(labeledSpf * Math.pow(thickness / 2, 1.7)));
