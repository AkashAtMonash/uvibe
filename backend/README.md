---
title: UVibe Backend
emoji: ☀️
colorFrom: orange
colorTo: purple
sdk: docker
pinned: false
license: mit
---

# UVibe Backend API

FastAPI backend powering the [UVibe](https://uvibe-ten.vercel.app) UV safety app.

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/api/uv` | Real-time UV index (ARPANSA → OpenWeatherMap fallback) |
| POST | `/api/env` | WBGT Heat Stress & sweat loss calculator |
| POST | `/api/ml/analyze-skin` | Fitzpatrick skin type ML inference |
| GET | `/api/arpansa/stations` | Raw ARPANSA station data |
| GET | `/api/sun` | Sunrise, sunset, solar noon |

## Environment Variables (set in Space Settings)

- `OPENWEATHER_API_KEY` — your OpenWeatherMap API key
- `ALLOWED_ORIGINS` — comma-separated list of allowed frontend URLs (e.g. `https://uvibe-ten.vercel.app`)
