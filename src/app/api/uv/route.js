import { NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";

const ARPANSA_URL = "https://uvdata.arpansa.gov.au/xml/uvvalues.xml";
const OWM_API_KEY = "09928fa566e5a7a21cbbc8f04fe4a9b4";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city") ?? "Melbourne";
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  try {
    // 1. If we have precise coordinates, prioritize OpenWeatherMap for suburbs
    if (lat && lon) {
      const owmRes = await fetch(
        `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,daily,alerts&appid=${OWM_API_KEY}`
      );
      if (owmRes.ok) {
        const owmData = await owmRes.json();
        if (typeof owmData.current?.uvi === "number") {
          return NextResponse.json({
            city: city,
            uv: parseFloat(owmData.current.uvi.toFixed(1)),
            time: new Date(owmData.current.dt * 1000).toISOString(),
            status: "ok",
            source: "open-weathermap",
          });
        }
      }
    }

    // 2. Fallback to ARPANSA (better for major AU capital cities, but strict on ID matching)
    const res = await fetch(ARPANSA_URL, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error("ARPANSA unavailable");

    const xml = await res.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
    });
    const data = parser.parse(xml);
    const stations = data?.stations?.location ?? [];
    
    // Attempt to match ARPANSA station ID loosely
    const match = stations.find(
      (s) => s.id?.toLowerCase() === city.toLowerCase()
    );

    if (match) {
      return NextResponse.json({
        city: match.id,
        uv: parseFloat(match.index ?? 0),
        time: match.utcdatetime ?? null,
        status: match.status ?? "ok",
        source: "arpansa",
      });
    }

    // 3. Last resort if not found in ARPANSA and OWM failed (not likely)
    return NextResponse.json({ error: "City not found in ARPANSA or OpenWeatherMap fell back" }, { status: 404 });

  } catch {
    return NextResponse.json({ error: "UV API unavailable" }, { status: 502 });
  }
}
