import { NextResponse } from "next/server";
import { CITIES } from "@/utils/uv";

export const dynamic = "force-dynamic";

const DEFAULT_CITY = "Melbourne";

function buildSyntheticHourly(baseUv) {
  const now = new Date();
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Array.from({ length: 24 }, (_, hour) => {
    const t = new Date(day);
    t.setHours(hour, 0, 0, 0);
    const distFromPeak = Math.abs(hour - 13);
    const mod =
      hour > 6 && hour < 19 ? Math.max(0.05, 1 - (distFromPeak / 6.5) ** 2) : 0.02;
    return {
      hour: t.toISOString().slice(0, 13),
      forecast: parseFloat((baseUv * mod).toFixed(2)),
      measured: null,
    };
  });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const cityParam = searchParams.get("city");
  const latParam = searchParams.get("lat");
  const lonParam = searchParams.get("lon");

  // Resolve coordinates: prioritize explicit lat/lon, then known city list, then Melbourne
  let lat, lon, cityLabel;
  if (latParam && lonParam) {
    lat = parseFloat(latParam);
    lon = parseFloat(lonParam);
    cityLabel = cityParam || "Custom";
  } else if (CITIES[cityParam]) {
    lat = CITIES[cityParam].lat;
    lon = CITIES[cityParam].lon;
    cityLabel = cityParam;
  } else {
    lat = CITIES[DEFAULT_CITY].lat;
    lon = CITIES[DEFAULT_CITY].lon;
    cityLabel = DEFAULT_CITY;
  }

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=uv_index&timezone=auto&forecast_days=1`,
      { cache: "no-store" },
    );
    if (!res.ok) throw new Error("Open-Meteo unavailable");

    const data = await res.json();
    const times = data?.hourly?.time ?? [];
    const values = data?.hourly?.uv_index ?? [];
    const hourly = times.map((time, idx) => ({
      hour: String(time).slice(0, 13),
      forecast:
        values[idx] == null ? null : parseFloat(Number(values[idx]).toFixed(2)),
      measured: null,
    }));

    return NextResponse.json({
      city: cityLabel,
      hourly,
      source: "open-meteo",
    });
  } catch {
    const baseUv = cityLabel === "Darwin" ? 12.4 : cityLabel === "Hobart" ? 6.4 : 8.5;
    const hourly = buildSyntheticHourly(baseUv);
    return NextResponse.json({ city: cityLabel, hourly, source: "synthetic" });
  }
}
