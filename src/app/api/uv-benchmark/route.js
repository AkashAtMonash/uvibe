import { NextResponse } from "next/server";

const BENCHMARK_CITIES = [
  { name: "Sydney",   lat: -33.87, lon: 151.21 },
  { name: "London",   lat: 51.51,  lon: -0.13  },
  { name: "New York", lat: 40.71,  lon: -74.01 },
  { name: "Tokyo",    lat: 35.68,  lon: 139.69 },
  { name: "Dubai",    lat: 25.20,  lon: 55.27  },
  { name: "Berlin",   lat: 52.52,  lon: 13.40  },
];

export async function GET() {
  try {
    const results = await Promise.all(
      BENCHMARK_CITIES.map(async (city) => {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&daily=uv_index_max&timezone=auto&forecast_days=1`;
        const res = await fetch(url, { next: { revalidate: 3600 } }); // Cache 1hr
        if (!res.ok) return { ...city, peakUVI: null };
        const data = await res.json();
        const peakUVI = data.daily?.uv_index_max?.[0] ?? null;
        return { ...city, peakUVI };
      })
    );

    const sydneyUVI = results.find((c) => c.name === "Sydney")?.peakUVI ?? 12;
    const withRatios = results.map((city) => ({
      ...city,
      ratio: city.peakUVI
        ? parseFloat((sydneyUVI / city.peakUVI).toFixed(1))
        : null,
    }));

    return NextResponse.json({ cities: withRatios, sydneyUVI });
  } catch (err) {
    console.error("UVBenchmark error:", err);
    return NextResponse.json({ error: "Failed to fetch UV benchmarks" }, { status: 502 });
  }
}
