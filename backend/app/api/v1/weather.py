"""
GeoGuard AI - Weather Forecast Intelligence API
Uses Open-Meteo API (free, no key required) with Flood Risk Scoring Engine.
"""
from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import random
import httpx

from app.services.weather_service import (
    fetch_open_meteo_weather,
    calculate_flood_risk,
    map_wmo_code,
    WeatherServiceCache,
    DEFAULT_LAT,
    DEFAULT_LON,
)

router = APIRouter()


@router.get("/current")
async def get_current_weather(
    lat: Optional[float] = Query(None, description="Latitude"),
    lon: Optional[float] = Query(None, description="Longitude"),
    lng: Optional[float] = Query(None, description="Longitude (alias)"),
):
    """
    GET /api/weather/current?lat={lat}&lon={lon}
    Returns real-time weather metrics, weather condition, WMO code, and calculated Flood Risk Score.
    """
    target_lat = lat if lat is not None else DEFAULT_LAT
    target_lon = lon if lon is not None else (lng if lng is not None else DEFAULT_LON)

    cache_key = f"weather:current_api:{target_lat:.3f}:{target_lon:.3f}"
    cached = await WeatherServiceCache.get(cache_key)
    if cached:
        return cached

    raw_data = await fetch_open_meteo_weather(target_lat, target_lon)

    if raw_data and "current" in raw_data:
        curr = raw_data["current"]
        temp = round(curr.get("temperature_2m", 28.0), 1)
        humidity = round(curr.get("relative_humidity_2m", 75))
        precip_prob = round(curr.get("precipitation_probability", 20.0), 1)
        rain = round(curr.get("rain", curr.get("precipitation", 0.0)), 1)
        wind_speed = round(curr.get("wind_speed_10m", 12.0), 1)
        wind_deg = round(curr.get("wind_direction_10m", 180.0), 1)
        pressure = round(curr.get("surface_pressure", 1012.0), 1)
        cloud_cover = round(curr.get("cloud_cover", 40))
        visibility = round(curr.get("visibility", 10000.0), 1)
        weather_code = curr.get("weather_code", 3)
        condition_text, icon_emoji = map_wmo_code(weather_code)
        source = "Open-Meteo API (Live)"
    else:
        # Fallback simulation if Open-Meteo request is degraded
        temp = 29.0
        humidity = 78
        precip_prob = 45.0
        rain = 12.5
        wind_speed = 18.5
        wind_deg = 160.0
        pressure = 1008.0
        cloud_cover = 65
        visibility = 8000.0
        weather_code = 61
        condition_text, icon_emoji = map_wmo_code(weather_code)
        source = "Open-Meteo Engine (Fallback)"

    # Flood Risk Algorithm
    flood_risk = calculate_flood_risk(
        rain_mm=rain,
        precip_prob=precip_prob,
        humidity=humidity,
        cloud_cover=cloud_cover,
        wind_speed=wind_speed,
    )

    response_data = {
        "latitude": target_lat,
        "longitude": target_lon,
        "temperature": temp,
        "humidity": humidity,
        "rain": rain,
        "precipitation_probability": precip_prob,
        "wind_speed": wind_speed,
        "wind_direction": wind_deg,
        "surface_pressure": pressure,
        "cloud_cover": cloud_cover,
        "visibility": visibility,
        "weather_code": weather_code,
        "condition": condition_text,
        "icon": icon_emoji,
        "flood_risk": flood_risk,
        "source": source,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }

    await WeatherServiceCache.set(cache_key, response_data, expire_seconds=600)
    return response_data


@router.get("/forecast")
async def get_weather_forecast(
    lat: Optional[float] = Query(None, description="Latitude"),
    lon: Optional[float] = Query(None, description="Longitude"),
    lng: Optional[float] = Query(None, description="Longitude (alias)"),
    days: int = Query(7, le=14, description="Forecast days"),
):
    """
    GET /api/weather/forecast?lat={lat}&lon={lon}
    Returns 7-day daily forecast & 24-hour hourly forecast data.
    """
    target_lat = lat if lat is not None else DEFAULT_LAT
    target_lon = lon if lon is not None else (lng if lng is not None else DEFAULT_LON)

    cache_key = f"weather:forecast_api:{days}:{target_lat:.3f}:{target_lon:.3f}"
    cached = await WeatherServiceCache.get(cache_key)
    if cached:
        return cached

    raw_data = await fetch_open_meteo_weather(target_lat, target_lon)

    daily_list = []
    hourly_list = []

    if raw_data and "daily" in raw_data:
        d = raw_data["daily"]
        times = d.get("time", [])
        codes = d.get("weather_code", [])
        max_temps = d.get("temperature_2m_max", [])
        min_temps = d.get("temperature_2m_min", [])
        precip_sums = d.get("precipitation_sum", [])
        precip_probs = d.get("precipitation_probability_max", [])
        wind_maxs = d.get("wind_speed_10m_max", [])

        for i in range(min(days, len(times))):
            w_code = codes[i] if i < len(codes) else 0
            cond, icon = map_wmo_code(w_code)
            rain_val = round(precip_sums[i], 1) if i < len(precip_sums) else 0.0
            prob_val = round(precip_probs[i], 1) if i < len(precip_probs) else 0.0
            wind_val = round(wind_maxs[i], 1) if i < len(wind_maxs) else 10.0
            max_t = round(max_temps[i], 1) if i < len(max_temps) else 30.0
            min_t = round(min_temps[i], 1) if i < len(min_temps) else 24.0

            # Daily Flood Risk
            day_risk = calculate_flood_risk(
                rain_mm=rain_val,
                precip_prob=prob_val,
                humidity=75.0,
                cloud_cover=50.0,
                wind_speed=wind_val,
            )

            daily_list.append({
                "date": times[i],
                "weather_code": w_code,
                "condition": cond,
                "icon": icon,
                "temp_max": max_t,
                "temp_min": min_t,
                "rainfall": rain_val,
                "precipitation_probability": prob_val,
                "wind_speed_max": wind_val,
                "flood_risk_level": day_risk["level"],
                "flood_risk_score": day_risk["score"],
            })

    if raw_data and "hourly" in raw_data:
        h = raw_data["hourly"]
        h_times = h.get("time", [])
        h_temps = h.get("temperature_2m_2m", h.get("temperature_2m", []))
        h_precip = h.get("precipitation", [])
        h_probs = h.get("precipitation_probability", [])
        h_wind = h.get("wind_speed_10m", [])
        h_humidity = h.get("relative_humidity_2m", [])

        for i in range(min(24, len(h_times))):
            dt_str = h_times[i]
            t_obj = datetime.fromisoformat(dt_str)
            hourly_list.append({
                "time": t_obj.strftime("%H:%M"),
                "timestamp": dt_str + "Z",
                "temperature": round(h_temps[i], 1) if i < len(h_temps) else 28.0,
                "rainfall": round(h_precip[i], 1) if i < len(h_precip) else 0.0,
                "precipitation_probability": round(h_probs[i], 1) if i < len(h_probs) else 0.0,
                "wind_speed": round(h_wind[i], 1) if i < len(h_wind) else 10.0,
                "humidity": round(h_humidity[i]) if i < len(h_humidity) else 75,
            })

    # Simulation fallback if needed
    if not daily_list:
        now = datetime.utcnow()
        for i in range(days):
            d_date = (now + timedelta(days=i)).strftime("%Y-%m-%d")
            daily_list.append({
                "date": d_date,
                "weather_code": 63,
                "condition": "Moderate Rain",
                "icon": "🌧️",
                "temp_max": 31.0,
                "temp_min": 25.0,
                "rainfall": 25.0,
                "precipitation_probability": 60.0,
                "wind_speed_max": 20.0,
                "flood_risk_level": "Moderate Risk",
                "flood_risk_score": 42.0,
            })

    if not hourly_list:
        now = datetime.utcnow()
        for i in range(24):
            t_time = (now + timedelta(hours=i)).strftime("%H:00")
            hourly_list.append({
                "time": t_time,
                "timestamp": (now + timedelta(hours=i)).isoformat() + "Z",
                "temperature": round(28.0 + (i % 4)),
                "rainfall": round(random.uniform(0, 15), 1),
                "precipitation_probability": random.randint(20, 80),
                "wind_speed": random.randint(10, 25),
                "humidity": random.randint(70, 90),
            })

    result_data = {
        "latitude": target_lat,
        "longitude": target_lon,
        "daily": daily_list,
        "hourly": hourly_list,
        "source": raw_data.get("source", "Open-Meteo Forecast Engine"),
        "generated_at": datetime.utcnow().isoformat() + "Z",
    }

    await WeatherServiceCache.set(cache_key, result_data, expire_seconds=900)
    return result_data


# Keep location search and station queries for backward compatibility
LOCAL_GEOCODE_DB = [
    {"name": "Chennai, Tamil Nadu", "lat": 13.0827, "lng": 80.2707, "type": "city"},
    {"name": "Velachery, Chennai, Tamil Nadu", "lat": 12.9750, "lng": 80.2206, "type": "suburb"},
    {"name": "Anna Nagar, Chennai, Tamil Nadu", "lat": 13.0850, "lng": 80.2101, "type": "suburb"},
    {"name": "Tambaram, Chennai, Tamil Nadu", "lat": 12.9229, "lng": 80.1275, "type": "suburb"},
    {"name": "Madurai, Tamil Nadu", "lat": 9.9252, "lng": 78.1198, "type": "city"},
    {"name": "Coimbatore, Tamil Nadu", "lat": 11.0168, "lng": 76.9558, "type": "city"},
    {"name": "Tiruchirappalli (Trichy), Tamil Nadu", "lat": 10.7905, "lng": 78.7047, "type": "city"},
    {"name": "Salem, Tamil Nadu", "lat": 11.6643, "lng": 78.1460, "type": "city"},
    {"name": "Tirunelveli, Tamil Nadu", "lat": 8.7139, "lng": 77.7567, "type": "city"},
    {"name": "Bengaluru, Karnataka", "lat": 12.9716, "lng": 77.5946, "type": "city"},
    {"name": "Mumbai, Maharashtra", "lat": 19.0760, "lng": 72.8777, "type": "city"},
    {"name": "Delhi, NCR", "lat": 28.6139, "lng": 77.2090, "type": "city"},
]

@router.get("/search")
async def search_location(query: str = Query(..., min_length=2)):
    """Search for locations using Nominatim with local fallback."""
    import urllib.parse
    query_clean = query.strip().lower()
    cache_key = f"weather:search:{query_clean}"
    cached = await WeatherServiceCache.get(cache_key)
    if cached:
        return cached

    encoded = urllib.parse.quote(query.strip())
    client = httpx.AsyncClient(timeout=5.0)
    headers = {"User-Agent": "GeoGuardAI/1.0"}
    url = f"https://nominatim.openstreetmap.org/search?q={encoded}&format=json&limit=6&countrycodes=in"

    results = []
    try:
        res = await client.get(url, headers=headers)
        if res.status_code == 200:
            for item in res.json():
                if item.get("lat") and item.get("lon"):
                    results.append({
                        "name": item.get("display_name"),
                        "lat": float(item.get("lat")),
                        "lng": float(item.get("lon")),
                        "lon": float(item.get("lon")),
                    })
    except Exception:
        pass

    if not results:
        results = [
            {**loc, "lon": loc["lng"]}
            for loc in LOCAL_GEOCODE_DB
            if query_clean in loc["name"].lower()
        ]

    await WeatherServiceCache.set(cache_key, results, expire_seconds=86400)
    return results
