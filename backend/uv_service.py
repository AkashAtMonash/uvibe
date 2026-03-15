"""
UV Service — ARPANSA XML parsing and OpenWeatherMap API fetching

Real ARPANSA XML structure:
  <stations>
    <location id="Melbourne">
      <name>mel</name>
      <index>1.1</index>
      <status>ok</status>
      <utcdatetime>2026/03/15 06:16</utcdatetime>
    </location>
    ...
  </stations>
"""

import os
import httpx
import xml.etree.ElementTree as ET
from math import sqrt

ARPANSA_URL = os.getenv("ARPANSA_XML_URL", "https://uvdata.arpansa.gov.au/xml/uvvalues.xml")
OWM_API_KEY = os.getenv("OPENWEATHERMAP_API_KEY", "")

# Station names match exactly the `id` attribute in ARPANSA XML
ARPANSA_STATIONS = {
    "Adelaide":      {"lat": -34.929, "lon": 138.601},
    "Alice Springs": {"lat": -23.700, "lon": 133.881},
    "Brisbane":      {"lat": -27.467, "lon": 153.028},
    "Canberra":      {"lat": -35.282, "lon": 149.128},
    "Darwin":        {"lat": -12.462, "lon": 130.842},
    "Gold Coast":    {"lat": -28.017, "lon": 153.400},
    "Hobart":        {"lat": -42.882, "lon": 147.327},
    "Melbourne":     {"lat": -37.814, "lon": 144.963},
    "Newcastle":     {"lat": -32.917, "lon": 151.779},
    "Perth":         {"lat": -31.952, "lon": 115.861},
    "Sydney":        {"lat": -33.869, "lon": 151.209},
    "Townsville":    {"lat": -19.258, "lon": 146.818},
}


def _nearest_station(lat: float, lon: float) -> str:
    """Return the name of the nearest ARPANSA station."""
    return min(
        ARPANSA_STATIONS,
        key=lambda name: (lat - ARPANSA_STATIONS[name]["lat"]) ** 2
                       + (lon - ARPANSA_STATIONS[name]["lon"]) ** 2,
    )


async def fetch_arpansa_uv(lat: float, lon: float) -> dict | None:
    """Fetch UV from ARPANSA XML using real <location> element structure."""
    try:
        async with httpx.AsyncClient(timeout=7.0) as client:
            resp = await client.get(ARPANSA_URL)
            resp.raise_for_status()

        # Strip UTF-8 BOM if present
        xml_text = resp.text.lstrip("\ufeff").strip()
        root = ET.fromstring(xml_text)

        station_name = _nearest_station(lat, lon)

        for loc_el in root.iter("location"):
            loc_id = (loc_el.get("id") or "").strip()
            if loc_id.lower() == station_name.lower():
                index_el = loc_el.find("index")
                status_el = loc_el.find("status")
                # Only return a reading if the station status is "ok"
                if (
                    index_el is not None
                    and index_el.text
                    and (status_el is None or status_el.text == "ok")
                ):
                    try:
                        uv_index = float(index_el.text)
                        return {
                            "uv_index": uv_index,
                            "source": "ARPANSA",
                            "station": station_name,
                        }
                    except (ValueError, TypeError):
                        pass
    except Exception:
        pass
    return None


async def fetch_owm_uv(lat: float, lon: float) -> dict | None:
    """Fetch UV index from OpenWeatherMap One Call 3.0."""
    if not OWM_API_KEY:
        return None
    url = (
        f"https://api.openweathermap.org/data/3.0/onecall"
        f"?lat={lat}&lon={lon}&exclude=minutely,hourly,daily,alerts"
        f"&appid={OWM_API_KEY}"
    )
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()
        uv = data.get("current", {}).get("uvi", 0.0)
        return {"uv_index": float(uv), "source": "OpenWeatherMap", "station": None}
    except Exception:
        pass
    return None


async def fetch_all_arpansa_stations() -> list[dict]:
    """Returns all ARPANSA stations with current UV for the D3.js map."""
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(ARPANSA_URL)
            resp.raise_for_status()

        xml_text = resp.text.lstrip("\ufeff").strip()
        root = ET.fromstring(xml_text)

        result = []
        for loc_el in root.iter("location"):
            loc_id = (loc_el.get("id") or "").strip()
            index_el = loc_el.find("index")
            status_el = loc_el.find("status")
            time_el = loc_el.find("utcdatetime")

            uv_index = None
            if index_el is not None and index_el.text:
                try:
                    uv_index = float(index_el.text)
                except (ValueError, TypeError):
                    pass

            coords = ARPANSA_STATIONS.get(loc_id, {})
            result.append({
                "id": loc_id,
                "name": loc_id,
                "lat": coords.get("lat"),
                "lon": coords.get("lon"),
                "uv_index": uv_index,
                "status": status_el.text if status_el is not None else None,
                "utc": time_el.text if time_el is not None else None,
            })
        return result
    except Exception:
        return []
