import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon)
    return NextResponse.json(
      { error: "lat and lon required" },
      { status: 400 },
    );

  const key = process.env.OPENWEATHER_API_KEY;
  if (!key)
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 },
    );

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&units=metric`,
      { next: { revalidate: 600 } },
    );
    if (!res.ok) throw new Error("OpenWeather error");

    const data = await res.json();

    return NextResponse.json({
      temp: Math.round(data.main?.temp ?? 0),
      feelsLike: Math.round(data.main?.feels_like ?? 0),
      humidity: data.main?.humidity ?? 0,
      windSpeed: Math.round((data.wind?.speed ?? 0) * 3.6),
      cloudCover: data.clouds?.all ?? 0,
      description: data.weather?.[0]?.description ?? "",
      icon: data.weather?.[0]?.icon ?? "",
      sunrise: data.sys?.sunrise ?? null,
      sunset: data.sys?.sunset ?? null,
      source: "openweather",
    });
  } catch {
    // TODO: log error to monitoring service
    return NextResponse.json({ error: "Weather unavailable" }, { status: 502 });
  }
}
