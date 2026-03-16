// src/app/components/prevention/constants.js

import { Droplets, Clock, Shirt, FileText, Sun, CloudSun, AlertTriangle, Moon, Umbrella, Activity, Car, HardHat, ShieldCheck, TreePine, Glasses } from "lucide-react";

export const TABS = [
  { id: "sunscreen", iconStr: Droplets, label: "Sunscreen", sub: "Dosage & SPF" },
  { id: "reminder", iconStr: Clock, label: "Reminders", sub: "Reapplication" },
  { id: "clothing", iconStr: Shirt, label: "Clothing", sub: "UPF & Fabric" },
  { id: "guide", iconStr: FileText, label: "Guide", sub: "5 S's & Tips" },
];

export const BODY_PARTS = [
  { id: "face", label: "Face & Neck", tsp: 0.5 },
  { id: "arms", label: "Arms", tsp: 0.5 },
  { id: "chest", label: "Chest & Abdomen", tsp: 1.0 },
  { id: "back", label: "Back", tsp: 1.0 },
  { id: "legs", label: "Legs", tsp: 2.0 },
  { id: "feet", label: "Feet & Ankles", tsp: 0.25 },
];

export const FABRICS = [
  {
    name: "Polyester",
    upf: "50+",
    breathability: 3,
    color: "#22d3aa",
    tags: ["Swimwear", "Sport"],
  },
  {
    name: "Nylon",
    upf: "50+",
    breathability: 3,
    color: "#22d3aa",
    tags: ["Activewear", "Beach"],
  },
  {
    name: "Denim (dark)",
    upf: "50+",
    breathability: 2,
    color: "#f59e0b",
    tags: ["Casual", "Commute"],
  },
  {
    name: "Cotton (dark)",
    upf: "25+",
    breathability: 5,
    color: "#f59e0b",
    tags: ["Everyday", "Casual"],
  },
  {
    name: "Linen",
    upf: "15+",
    breathability: 5,
    color: "#f97316",
    tags: ["Summer", "Casual"],
  },
  {
    name: "Cotton (white)",
    upf: "5",
    breathability: 5,
    color: "#ef4444",
    tags: ["Everyday"],
  },
  {
    name: "Wet fabric",
    upf: "3",
    breathability: 5,
    color: "#ef4444",
    tags: ["Warning"],
  },
];

export const CLOTHING_BY_UV = {
  low: {
    label: "Low UV (0–2)",
    items: [
      "Light clothing of any fabric",
      "Hat optional",
      "Sunglasses if outside > 2hrs",
    ],
  },
  moderate: {
    label: "Moderate UV (3–5)",
    items: [
      "Long-sleeve shirt recommended",
      "Wide-brim hat (≥7.5cm brim)",
      "Sunglasses UV400 rating",
      "SPF 30+ on exposed skin",
    ],
  },
  high: {
    label: "High UV (6–7)",
    items: [
      "UPF 30+ rated clothing",
      "Broad-brim hat mandatory",
      "UV400 wrap-around sunglasses",
      "SPF 50+ sunscreen",
      "Seek shade 10am–3pm",
    ],
  },
  veryhigh: {
    label: "Very High UV (8–10)",
    items: [
      "UPF 50+ clothing all exposed areas",
      "Full-coverage hat",
      "UV400 sunglasses",
      "SPF 50+ reapplied every 2 hrs",
      "Avoid 10am–3pm",
    ],
  },
  extreme: {
    label: "Extreme UV (11+)",
    items: [
      "Stay indoors or full shade",
      "UPF 50+ full-coverage if outside",
      "Broad-brim hat + neck flap",
      "SPF 50+ every 2 hrs",
      "UV400 glasses",
    ],
  },
};

export const FIVE_S = [
  {
    s: "Slip",
    iconStr: Shirt,
    color: "#22d3aa",
    title: "Slip on clothing",
    body: "Cover as much skin as possible. Choose loose-fitting, tightly-woven fabric. Dark or bright colours absorb more UV. Look for UPF-rated garments.",
  },
  {
    s: "Slop",
    iconStr: Droplets,
    color: "#fbbf24",
    title: "Slop on SPF 50+",
    body: "Apply SPF 50+ broad-spectrum, water-resistant sunscreen 20 min before going outside. Use a teaspoon per body part. Reapply every 2 hours.",
  },
  {
    s: "Slap",
    iconStr: ShieldCheck,
    color: "#f97316",
    title: "Slap on a hat",
    body: "A broad-brim hat (brim ≥7.5cm) protects face, ears and neck. Caps leave ears and neck exposed. Legionnaire hats with neck flaps are best outdoors.",
  },
  {
    s: "Seek",
    iconStr: TreePine,
    color: "#22d3aa",
    title: "Seek shade",
    body: "Up to 80% of UV penetrates light cloud. Seek shade particularly between 10am and 3pm when UV is at its most intense.",
  },
  {
    s: "Slide",
    iconStr: Glasses,
    color: "#a78bfa",
    title: "Slide on sunglasses",
    body: "UV causes cataracts and eye damage. Choose close-fitting, wrap-around sunglasses that meet AS/NZS 1067. Look for UV400 rating.",
  },
];

export const ACTIVITY_TIPS = [
  {
    iconStr: Umbrella,
    activity: "Beach & Swimming",
    tips: [
      "Water reflects up to 25% extra UV",
      "Reapply SPF 50+ immediately after towelling",
      "Wet clothing loses 50–70% of UPF rating",
      "Seek shade between swim sessions",
      "Peak UV at beach: 10am–2pm",
    ],
  },
  {
    iconStr: Activity,
    activity: "Sport & Exercise",
    tips: [
      "Sweat degrades sunscreen — reapply every 60–90 min",
      "Wear UPF 50+ rashies instead of relying on sunscreen",
      "Schedule training before 10am or after 3pm",
      "Even 30 min of sport exposure adds up over time",
    ],
  },
  {
    iconStr: Car,
    activity: "Daily Commute",
    tips: [
      "Car windows block UVB but not UVA — face and arms still at risk",
      "Apply SPF as part of morning routine every UV ≥ 3 day",
      "10 min of incidental daily exposure accumulates over years",
    ],
  },
  {
    iconStr: HardHat,
    activity: "Outdoor Work",
    tips: [
      "Outdoor workers get 5–10× more UV than indoor workers",
      "Safe Work Australia recommends SPF even when UV < 3",
      "Employers must provide shade, SPF 50+ and UV uniforms",
      "UV skin cancer is a compensable workplace injury in Australia",
    ],
  },
];

export const SKIN_CANCER_SIGNS = [
  {
    sign: "A — Asymmetry",
    desc: "One half of a mole or spot does not match the other half",
  },
  {
    sign: "B — Border",
    desc: "Edges are irregular, ragged, notched or blurred",
  },
  {
    sign: "C — Colour",
    desc: "Colour varies within the same lesion — shades of brown, black, red or white",
  },
  {
    sign: "D — Diameter",
    desc: "Larger than 6mm (roughly the size of a pencil eraser)",
  },
  {
    sign: "E — Evolving",
    desc: "Any change in size, shape, colour or any new symptom such as bleeding",
  },
];

export const BEST_TIMES = [
  {
    time: "Before 10am",
    iconStr: CloudSun,
    uv: "Low–Moderate",
    safe: true,
    desc: "Safest time for outdoor activity. UV typically below 3 in most Australian cities.",
  },
  {
    time: "10am – 12pm",
    iconStr: AlertTriangle,
    uv: "High",
    safe: false,
    desc: "UV rising rapidly. Full sun protection required. Limit exposure time.",
  },
  {
    time: "12pm – 2pm",
    iconStr: Sun,
    uv: "Peak",
    safe: false,
    desc: "Highest UV of the day. Seek shade. Avoid prolonged outdoor activity.",
  },
  {
    time: "2pm – 4pm",
    iconStr: AlertTriangle,
    uv: "High",
    safe: false,
    desc: "UV still dangerously high. Do not drop sun protection.",
  },
  {
    time: "After 4pm",
    iconStr: Moon,
    uv: "Moderate–Low",
    safe: true,
    desc: "UV decreasing. SPF still recommended until UV index drops below 3.",
  },
];

export function calcDosage(parts, spf) {
  const tspTotal = parts.reduce(
    (sum, p) => sum + (BODY_PARTS.find((b) => b.id === p)?.tsp ?? 0),
    0,
  );
  const spfFactor = spf >= 50 ? 1.0 : spf >= 30 ? 1.15 : 1.35;
  const adjusted = tspTotal * spfFactor;
  return {
    tsp: parseFloat(adjusted.toFixed(1)),
    pumps: Math.ceil(adjusted / 0.25),
    ml: parseFloat((adjusted * 5).toFixed(0)),
  };
}

export function getClothingTier(uv) {
  if (uv >= 11) return CLOTHING_BY_UV.extreme;
  if (uv >= 8) return CLOTHING_BY_UV.veryhigh;
  if (uv >= 6) return CLOTHING_BY_UV.high;
  if (uv >= 3) return CLOTHING_BY_UV.moderate;
  return CLOTHING_BY_UV.low;
}

export const PREV_TABS = [
  { id: "sunscreen", icon: "🧴", label: "Sunscreen" },
  { id: "reminder", icon: "⏰", label: "Reminder" },
  { id: "clothing", icon: "👕", label: "Clothing" },
  { id: "guide", icon: "📋", label: "Guide" },
];

