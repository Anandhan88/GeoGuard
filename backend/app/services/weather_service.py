"""
GeoGuard AI - Weather Intelligence Service Layer
Integration with Open-Meteo API (free, no API key required) and Flood Risk Scoring Engine.
"""
import time
import json
import logging
from typing import Optional, Dict, Any
import httpx
import redis.asyncio as redis
from app.core.config import settings

logger = logging.getLogger(__name__)

# Fallback default coordinates (Chennai / Trichy region)
DEFAULT_LAT = 13.0827
DEFAULT_LON = 80.2707

# HTTP Client instance
_http_client: Optional[httpx.AsyncClient] = None

def get_http_client() -> httpx.AsyncClient:
    global _http_client
    if _http_client is None or _http_client.is_closed:
        _http_client = httpx.AsyncClient(timeout=10.0)
    return _http_client


# Cache Layer (Redis with in-memory fallback)
_redis_client: Optional[redis.Redis] = None
_redis_available = True
_in_memory_cache: Dict[str, tuple] = {}


def get_redis_client() -> Optional[redis.Redis]:
    global _redis_client, _redis_available
    if not _redis_available:
        return None
    if _redis_client is None:
        try:
            _redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
        except Exception as e:
            logger.warning(f"Redis unavailable for weather service ({e}). Using in-memory cache.")
            _redis_available = False
            return None
    return _redis_client


class WeatherServiceCache:
    @staticmethod
    async def get(key: str) -> Optional[dict]:
        global _redis_available
        if _redis_available:
            client = get_redis_client()
            if client:
                try:
                    val = await client.get(key)
                    if val:
                        return json.loads(val)
                except Exception:
                    pass
        if key in _in_memory_cache:
            val, expiry = _in_memory_cache[key]
            if expiry > time.time():
                return val
            else:
                del _in_memory_cache[key]
        return None

    @staticmethod
    async def set(key: str, value: dict, expire_seconds: int = 600):
        global _redis_available
        if _redis_available:
            client = get_redis_client()
            if client:
                try:
                    await client.set(key, json.dumps(value), ex=expire_seconds)
                    return
                except Exception:
                    pass
        _in_memory_cache[key] = (value, time.time() + expire_seconds)


def calculate_flood_risk(
    rain_mm: float,
    precip_prob: float,
    humidity: float,
    cloud_cover: float,
    wind_speed: float,
) -> Dict[str, Any]:
    """
    Flood Risk Scoring Algorithm:
    Risk Score = 40% Rainfall + 25% Rain Probability + 15% Humidity + 10% Cloud Cover + 10% Wind Conditions
    """
    # 40% Rainfall Component (Normalized: 50mm/hr = 100%)
    rain_component = min(100.0, (max(0.0, rain_mm) / 50.0) * 100.0) * 0.40

    # 25% Rain Probability Component (0-100%)
    prob_component = min(100.0, max(0.0, precip_prob)) * 0.25

    # 15% Humidity Component (0-100%)
    humidity_component = min(100.0, max(0.0, humidity)) * 0.15

    # 10% Cloud Cover Component (0-100%)
    cloud_component = min(100.0, max(0.0, cloud_cover)) * 0.10

    # 10% Wind Conditions Component (Normalized: 80 km/h = 100%)
    wind_component = min(100.0, (max(0.0, wind_speed) / 80.0) * 100.0) * 0.10

    total_score = round(
        rain_component + prob_component + humidity_component + cloud_component + wind_component,
        1,
    )

    if total_score <= 25.0:
        level = "Low Risk"
        color = "emerald"
        description = "Minimal flood threat. Standard monitoring."
    elif total_score <= 50.0:
        level = "Moderate Risk"
        color = "amber"
        description = "Moderate water accumulation likely in low-lying areas."
    elif total_score <= 75.0:
        level = "High Risk"
        color = "orange"
        description = "High flood risk. Drainage saturation & local inundation likely."
    else:
        level = "Severe Risk"
        color = "red"
        description = "CRITICAL FLOOD ALERT! Heavy inundation & flash flood threat."

    return {
        "score": total_score,
        "level": level,
        "color": color,
        "description": description,
        "breakdown": {
            "rainfall_component": round(rain_component, 1),
            "probability_component": round(prob_component, 1),
            "humidity_component": round(humidity_component, 1),
            "cloud_component": round(cloud_component, 1),
            "wind_component": round(wind_component, 1),
        },
    }


def map_wmo_code(code: int) -> tuple[str, str]:
    """Map WMO Weather Interpretation Code to condition string and emoji icon."""
    wmo_map = {
        0: ("Clear Sky", "☀️"),
        1: ("Mainly Clear", "🌤️"),
        2: ("Partly Cloudy", "⛅"),
        3: ("Overcast", "☁️"),
        45: ("Foggy", "🌫️"),
        48: ("Depositing Rime Fog", "🌫️"),
        51: ("Light Drizzle", "🌦️"),
        53: ("Moderate Drizzle", "🌦️"),
        55: ("Dense Drizzle", "🌧️"),
        61: ("Slight Rain", "🌦️"),
        63: ("Moderate Rain", "🌧️"),
        65: ("Heavy Rain", "🌧️"),
        71: ("Slight Snow", "🌨️"),
        73: ("Moderate Snow", "🌨️"),
        75: ("Heavy Snow", "❄️"),
        80: ("Slight Rain Showers", "🌦️"),
        81: ("Moderate Rain Showers", "🌧️"),
        82: ("Violent Rain Showers", "⛈️"),
        95: ("Thunderstorm", "⛈️"),
        96: ("Thunderstorm with Slight Hail", "⛈️"),
        99: ("Thunderstorm with Heavy Hail", "⛈️"),
    }
    return wmo_map.get(code, ("Cloudy", "☁️"))


async def fetch_open_meteo_weather(lat: float, lon: float) -> Dict[str, Any]:
    """Fetch live weather metrics from Open-Meteo API."""
    cache_key = f"openmeteo:full:{lat:.3f}:{lon:.3f}"
    cached = await WeatherServiceCache.get(cache_key)
    if cached:
        return cached

    url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat}&longitude={lon}"
        f"&current=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,rain,"
        f"weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,cloud_cover,visibility"
        f"&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,rain,"
        f"wind_speed_10m,cloud_cover,visibility,weather_code"
        f"&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,"
        f"precipitation_probability_max,wind_speed_10m_max"
        f"&timezone=auto"
    )

    client = get_http_client()
    try:
        response = await client.get(url)
        if response.status_code == 200:
            data = response.json()
            await WeatherServiceCache.set(cache_key, data, expire_seconds=600)
            return data
        else:
            logger.error(f"Open-Meteo returned status code {response.status_code}")
    except Exception as e:
        logger.error(f"Error requesting Open-Meteo API for ({lat}, {lon}): {e}")

    # Fallback response structure if Open-Meteo is unreachable
    return {}
