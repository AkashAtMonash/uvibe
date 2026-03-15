import { NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";

const ARPANSA_URL = "https://uvdata.arpansa.gov.au/xml/uvvalues.xml";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city") ?? "Melbourne";

  try {
    const res = await fetch(ARPANSA_URL, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error("ARPANSA unavailable");

    const xml = await res.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
    });
    const data = parser.parse(xml);
    const stations = data?.stations?.location ?? [];
    const match = stations.find(
      (s) => s.id?.toLowerCase() === city.toLowerCase(),
    );

    if (!match)
      return NextResponse.json({ error: "City not found" }, { status: 404 });

    return NextResponse.json({
      city: match.id,
      uv: parseFloat(match.index ?? 0),
      time: match.utcdatetime ?? null,
      status: match.status ?? "ok",
      source: "arpansa",
    });
  } catch {
    // TODO: log error to monitoring service
    return NextResponse.json({ error: "ARPANSA unavailable" }, { status: 502 });
  }
}
