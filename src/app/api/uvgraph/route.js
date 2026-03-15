import { NextResponse } from "next/server";

// Map app city names to ARPANSA location names
const ARPANSA_NAMES = {
  Melbourne: "melbourne",
  Sydney: "sydney",
  Brisbane: "brisbane",
  Adelaide: "adelaide",
  Perth: "perth",
  Darwin: "darwin",
  Hobart: "kingston",
  Canberra: "canberra",
  Townsville: "townsville",
  "Alice Springs": "alice springs",
  "Gold Coast": "gold coast",
  Newcastle: "newcastle",
  Emerald: "emerald",
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city") ?? "Melbourne";
  const location = ARPANSA_NAMES[city] ?? "melbourne";

  try {
    // Import the arpansa-uv-data package (must be installed: npm install arpansa-uv-data)
    const { default: fetchUVData } = await import("arpansa-uv-data");

    const raw = await fetchUVData({ location, date: new Date() });

    // Aggregate per-minute data into hourly points
    const hourlyMap = {};
    for (const point of raw) {
      if (!point.timestamp) continue;
      const hour = point.timestamp.slice(0, 13); // "2026-03-16 14"
      if (!hourlyMap[hour]) hourlyMap[hour] = { forecast: [], measured: [] };
      if (point.forecast != null) hourlyMap[hour].forecast.push(point.forecast);
      if (point.measured != null) hourlyMap[hour].measured.push(point.measured);
    }

    const hourly = Object.entries(hourlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([hour, vals]) => {
        const avg = (arr) =>
          arr.length
            ? parseFloat(
                (arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(2),
              )
            : null;
        return {
          hour,
          forecast: avg(vals.forecast),
          measured: avg(vals.measured),
        };
      });

    return NextResponse.json({
      city,
      location,
      hourly,
      source: "arpansa",
    });
  } catch (err) {
    console.error("ARPANSA uvgraph error:", err.message);
    return NextResponse.json(
      { error: "UV graph unavailable", detail: err.message },
      { status: 502 },
    );
  }
}
