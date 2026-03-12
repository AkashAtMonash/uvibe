import { NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";

const ARPANSA_URL = "https://uvdata.arpansa.gov.au/xml/uvvalues.xml";

export async function GET(request) {
  console.log("GET request received at /api/uv");
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city")?.toLowerCase() ?? "melbourne";

  const res = await fetch(ARPANSA_URL, { next: { revalidate: 300 } });
  if (!res.ok)
    return NextResponse.json({ error: "ARPANSA unavailable" }, { status: 502 });

  const xml = await res.text();
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
  });
  const data = parser.parse(xml);

  const stations = data?.uvvalues?.location ?? [];
  const match = stations.find((s) => s.id?.toLowerCase().includes(city));

  if (!match)
    return NextResponse.json({ error: "City not found" }, { status: 404 });

  return NextResponse.json({
    city: match.id,
    uv: parseFloat(match.index ?? 0),
    time: match.utcdatetime ?? null,
  });
}
