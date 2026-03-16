import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const zip = searchParams.get("zip");

  if (!zip) {
    return NextResponse.json(
      { error: "zip (postcode) required" },
      { status: 400 },
    );
  }

  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 },
    );
  }

  try {
    const res = await fetch(
      `http://api.openweathermap.org/geo/1.0/zip?zip=${encodeURIComponent(zip)},AU&appid=${key}`,
      { next: { revalidate: 86400 } }, // Cache for 24h as geocoding rarely changes
    );
    
    if (res.status === 404) {
      return NextResponse.json({ error: "Postcode not found" }, { status: 404 });
    }
    
    if (!res.ok) throw new Error("OpenWeather error");

    const data = await res.json();

    return NextResponse.json({
      name: data.name,
      lat: data.lat,
      lon: data.lon,
      postcode: data.zip,
      country: "AU"
    });
  } catch (err) {
    console.error("Geocoding Error:", err);
    return NextResponse.json({ error: "Geocoding service unavailable" }, { status: 502 });
  }
}
