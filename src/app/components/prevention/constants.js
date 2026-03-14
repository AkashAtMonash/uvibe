// src/app/components/prevention/constants.js

export const TABS = [
  { id: "sunscreen", icon: "🧴", label: "Sunscreen", sub: "Dosage & SPF" },
  { id: "reminder", icon: "⏰", label: "Reminders", sub: "Reapplication" },
  { id: "clothing", icon: "👕", label: "Clothing", sub: "UPF & Fabric" },
  { id: "guide", icon: "📋", label: "Guide", sub: "5 S's & Tips" },
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
    color: "#fbbf24",
    tags: ["Casual", "Commute"],
  },
  {
    name: "Cotton (dark)",
    upf: "25+",
    breathability: 5,
    color: "#fbbf24",
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
      "Sunglasses with UV400 rating",
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
      "UPF 50+ clothing on all exposed areas",
      "Full-coverage hat",
      "UV400 sunglasses",
      "SPF 50+ reapplied every 2 hrs",
      "Avoid 10am–3pm",
    ],
  },
  extreme: {
    label: "Extreme UV (11+)",
    items: [
      "Stay indoors or in full shade",
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
    icon: "👕",
    color: "#22d3aa",
    title: "Slip on clothing",
    body: "Cover as much skin as possible. Choose loose-fitting, tightly-woven fabric. Dark or bright colours absorb more UV than pale ones. Look for garments with a UPF rating.",
  },
  {
    s: "Slop",
    icon: "🧴",
    color: "#fbbf24",
    title: "Slop on SPF 50+",
    body: "Apply SPF 50+ broad-spectrum, water-resistant sunscreen 20 minutes before going outside. Use a teaspoon per body part. Reapply every 2 hours — or more often if sweating or swimming.",
  },
  {
    s: "Slap",
    icon: "🧢",
    color: "#f97316",
    title: "Slap on a hat",
    body: "A broad-brim hat (brim ≥7.5cm) protects your face, ears and neck. Caps and visors leave your ears and neck exposed. Legionnaire hats with neck flaps provide the best coverage outdoors.",
  },
  {
    s: "Seek",
    icon: "🌳",
    color: "#22d3aa",
    title: "Seek shade",
    body: "UV radiation can be intense even on cloudy days — up to 80% of UV penetrates light cloud cover. Seek shade particularly between 10am and 3pm when UV is at its most intense.",
  },
  {
    s: "Slide",
    icon: "🕶️",
    color: "#a78bfa",
    title: "Slide on sunglasses",
    body: "UV radiation can cause cataracts and eye damage. Choose close-fitting, wrap-around sunglasses that meet the Australian Standard AS/NZS 1067. Look for a UV400 rating.",
  },
];

export const ACTIVITY_TIPS = [
  {
    icon: "🏖️",
    activity: "Beach & Swimming",
    tips: [
      "Water reflects up to 25% extra UV — protection is critical",
      "Reapply SPF 50+ immediately after towelling",
      "Wet clothing loses 50–70% of UPF rating — change into dry clothes",
      "Seek shade under umbrellas between sessions",
      "UV intensity is highest 10am–2pm even at the beach",
    ],
  },
  {
    icon: "🏃",
    activity: "Sport & Exercise",
    tips: [
      "Sweat degrades sunscreen — reapply every 60–90 min during sport",
      "Wear UPF 50+ rashies or sports tops instead of relying on sunscreen alone",
      "Schedule training before 10am or after 3pm when UV is lower",
      "UV exposure during sport adds up quickly — even 30 min counts",
    ],
  },
  {
    icon: "🚗",
    activity: "Daily Commute",
    tips: [
      "Car windows block UVB but not UVA — arm and face still exposed during driving",
      "Glass in offices and cars does not block all UV — seated near windows still carries risk",
      "Apply SPF as part of your morning routine every day UV ≥ 3",
      "Even 10 min of incidental exposure daily accumulates over years",
    ],
  },
  {
    icon: "👷",
    activity: "Outdoor Work",
    tips: [
      "Outdoor workers receive 5–10× more UV than indoor workers",
      "Safe Work Australia recommends sun protection even when UV < 3 for outdoor workers",
      "Employers must provide shade, SPF 50+ and UV-protective uniforms",
      "UV-related skin cancer is a compensable workplace injury in Australia",
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
    icon: "🌅",
    uv: "Low–Moderate",
    safe: true,
    desc: "Safest time for outdoor activity. UV typically below 3 in most Australian cities.",
  },
  {
    time: "10am – 12pm",
    icon: "⚠️",
    uv: "High",
    safe: false,
    desc: "UV rising rapidly. Full sun protection required. Limit exposure time.",
  },
  {
    time: "12pm – 2pm",
    icon: "🔴",
    uv: "Peak",
    safe: false,
    desc: "Highest UV of the day. Seek shade. Avoid prolonged outdoor activity.",
  },
  {
    time: "2pm – 4pm",
    icon: "⚠️",
    uv: "High",
    safe: false,
    desc: "UV still dangerously high despite the sun moving lower. Do not drop protection.",
  },
  {
    time: "After 4pm",
    icon: "🌇",
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
