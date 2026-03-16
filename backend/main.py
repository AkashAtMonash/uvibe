"""
UVibe v2 — FastAPI Backend
Endpoints:
  GET  /api/uv              → Real-time UV from ARPANSA or OpenWeatherMap
  POST /api/env             → WBGT + Sweat Loss calculation
  POST /api/ml/analyze-skin → Fitzpatrick skin type inference via PyTorch
  GET  /api/arpansa/stations → Raw ARPANSA station feed
  GET  /health               → Health check
"""

import os
import io
import math
import asyncio
import httpx
from typing import Optional
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from uv_service import fetch_arpansa_uv, fetch_owm_uv
from env_calculations import calculate_wbgt, calculate_sweat_loss
from ml_engine import predict_skin_type

load_dotenv()

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app = FastAPI(
    title="UVibe API",
    description="Environmental UV & AI Skin Analysis Backend",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ───────────────────────────────────────────────────────────────────────
# Pydantic Schemas
# ───────────────────────────────────────────────────────────────────────

class LocationRequest(BaseModel):
    lat: float
    lon: float
    weight_kg: Optional[float] = 75.0  # Default 75kg
    fitzpatrick_type: Optional[int] = 2  # Default Type II


class EnvRequest(BaseModel):
    lat: float
    lon: float
    air_temp_c: float
    humidity_pct: float
    wind_speed_ms: float
    weight_kg: Optional[float] = 75.0


class UVResponse(BaseModel):
    uv_index: float
    source: str
    station: Optional[str] = None
    risk_level: str
    risk_description: str
    time_to_burn_min: Optional[float] = None


class EnvResponse(BaseModel):
    wbgt_cels: float
    wbgt_category: str
    sweat_loss_ml_hr: float
    heat_stress_warning: bool


class MLResponse(BaseModel):
    fitzpatrick_type: int
    type_name: str
    uv_vulnerability: str
    aging_multiplier: float
    detected_markers: list[str]
    confidence: float


# ───────────────────────────────────────────────────────────────────────
# Helper: UV Risk Level
# ───────────────────────────────────────────────────────────────────────

def get_risk_level(uv: float) -> tuple[str, str]:
    if uv < 3:
        return ("Low", "Minimal protection needed")
    elif uv < 6:
        return ("Moderate", "Seek shade during midday hours")
    elif uv < 8:
        return ("High", "Protection essential — hat, sunscreen SPF 30+")
    elif uv < 11:
        return ("Very High", "Extra protection required — avoid midday sun")
    else:
        return ("Extreme", "Unprotected skin burns in minutes — stay indoors")


# ───────────────────────────────────────────────────────────────────────
# Routes
# ───────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "version": "2.0.0"}


@app.get("/api/uv", response_model=UVResponse)
async def get_uv(lat: float, lon: float, weight_kg: float = 75.0, fitzpatrick_type: int = 2):
    """
    Returns the real-time UV index.
    - Tries ARPANSA XML first (AU stations only).
    - Falls back to OpenWeatherMap for global coverage.
    """
    uv_data = None

    # Try ARPANSA first if in AU bounding box
    AU_BOUNDS = {"lat_min": -44, "lat_max": -10, "lon_min": 113, "lon_max": 154}
    in_australia = (
        AU_BOUNDS["lat_min"] <= lat <= AU_BOUNDS["lat_max"]
        and AU_BOUNDS["lon_min"] <= lon <= AU_BOUNDS["lon_max"]
    )

    if in_australia:
        uv_data = await fetch_arpansa_uv(lat, lon)

    if not uv_data:
        uv_data = await fetch_owm_uv(lat, lon)

    if not uv_data:
        raise HTTPException(status_code=503, detail="All UV data sources unavailable")

    uv_index = uv_data["uv_index"]
    risk_level, risk_description = get_risk_level(uv_index)

    # Fitzpatrick minimal erythema dose (MED) table in minutes at UV=1
    med_table = {1: 67, 2: 50, 3: 40, 4: 30, 5: 20, 6: 15}
    med_base = med_table.get(fitzpatrick_type, 50)
    time_to_burn = round(med_base / max(uv_index, 0.1), 1) if uv_index > 0 else None

    return UVResponse(
        uv_index=uv_index,
        source=uv_data.get("source", "unknown"),
        station=uv_data.get("station"),
        risk_level=risk_level,
        risk_description=risk_description,
        time_to_burn_min=time_to_burn,
    )


@app.post("/api/env", response_model=EnvResponse)
async def get_env(body: EnvRequest):
    """
    Calculates WBGT Heat Stress and Live Sweat Loss.
    """
    wbgt = calculate_wbgt(body.air_temp_c, body.humidity_pct, body.wind_speed_ms)
    sweat = calculate_sweat_loss(wbgt, body.weight_kg)

    # WBGT Categories (ISO 7933)
    if wbgt < 28:
        category = "Low Risk"
    elif wbgt < 32:
        category = "Moderate Risk"
    elif wbgt < 36:
        category = "High Risk"
    else:
        category = "Extreme Risk"

    return EnvResponse(
        wbgt_cels=round(wbgt, 1),
        wbgt_category=category,
        sweat_loss_ml_hr=round(sweat, 0),
        heat_stress_warning=wbgt >= 32,
    )


@app.post("/api/ml/analyze-skin", response_model=MLResponse)
async def analyze_skin(file: UploadFile = File(...)):
    """
    Accepts an image upload, runs the PyTorch Fitzpatrick classifier,
    and returns the skin type with UV vulnerability description.
    Images are NOT stored — deleted immediately after inference.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are accepted.")

    contents = await file.read()
    result = await predict_skin_type(contents)

    return MLResponse(
        fitzpatrick_type=result["fitzpatrick_type"],
        type_name=result["type_name"],
        uv_vulnerability=result["uv_vulnerability"],
        aging_multiplier=result["aging_multiplier"],
        detected_markers=result["detected_markers"],
        confidence=result["confidence"],
    )


@app.get("/api/arpansa/stations")
async def get_arpansa_stations():
    """
    Returns raw parsed ARPANSA station data.
    Used by the D3.js map on the awareness page.
    """
    from uv_service import fetch_all_arpansa_stations
    stations = await fetch_all_arpansa_stations()
    return {"stations": stations}


@app.get("/api/sun")
async def get_sun(lat: float, lon: float, tz: str = "auto"):
    """
    Returns sunrise, sunset, solar_noon, and day_length for today.
    Uses Open-Meteo daily forecast API — free, fast, no key required.
    Solar noon is dynamically calculated from the user's longitude.
    """
    import math
    from datetime import datetime, timezone

    url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={lat}&longitude={lon}"
        f"&daily=sunrise,sunset,uv_index_max"
        f"&timezone={tz}"
        f"&forecast_days=1"
    )
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()

        daily = data.get("daily", {})
        sunrise_raw = (daily.get("sunrise") or [""])[0]
        sunset_raw  = (daily.get("sunset")  or [""])[0]
        uv_max      = (daily.get("uv_index_max") or [0])[0]

        # Solar noon: midpoint of sunrise and sunset
        solar_noon = ""
        if sunrise_raw and sunset_raw:
            try:
                sr = datetime.fromisoformat(sunrise_raw)
                ss = datetime.fromisoformat(sunset_raw)
                midpoint = sr + (ss - sr) / 2
                solar_noon = midpoint.strftime("%H:%M")
                day_length_hrs = round((ss - sr).total_seconds() / 3600, 1)
            except Exception:
                day_length_hrs = None
        else:
            day_length_hrs = None

        return {
            "sunrise": sunrise_raw,
            "sunset": sunset_raw,
            "solar_noon": solar_noon,
            "day_length_hrs": day_length_hrs,
            "uv_index_max": uv_max,
            "timezone": data.get("timezone", ""),
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Sunrise/sunset data unavailable: {e}")
