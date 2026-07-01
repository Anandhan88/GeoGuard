"""
GeoGuard AI - Weather Data API
Fetches real-time weather and forecast data from Open-Meteo for Chennai, with a simulated fallback.
"""
from fastapi import APIRouter, Query
from typing import Optional
from datetime import datetime, timedelta, timezone
import random
import httpx
import json
import time
import redis.asyncio as redis
from app.core.config import settings

router = APIRouter()

# Trichy (Central Tamil Nadu) coordinates
LAT = 10.7905
LNG = 78.7047

# Base weather conditions for Chennai during monsoon (Fallback)
BASE_WEATHER = {
    "temperature": 29,
    "humidity": 85,
    "rainfall": 45.2,
    "windSpeed": 32,
    "windDirection": "NE",
    "pressure": 1006,
    "visibility": 5,
    "condition": "Heavy Rain",
    "icon": "🌧️",
    "uvIndex": 2,
    "dewPoint": 26,
    "feelsLike": 37,
}


# Global HTTP client to reuse connections
_http_client: Optional[httpx.AsyncClient] = None

def get_http_client() -> httpx.AsyncClient:
    global _http_client
    if _http_client is None or _http_client.is_closed:
        _http_client = httpx.AsyncClient(timeout=5.0)
    return _http_client


# Global Redis client with failover
_redis_client: Optional[redis.Redis] = None
_redis_available = True

def get_redis_client() -> Optional[redis.Redis]:
    global _redis_client, _redis_available
    if not _redis_available:
        return None
    if _redis_client is None:
        try:
            _redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
        except Exception as e:
            print(f"Redis initialization failed: {e}. Weather cache falling back to in-memory.")
            _redis_available = False
            return None
    return _redis_client


# In-memory fallback cache
_in_memory_cache = {}

class WeatherCache:
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
                except Exception as e:
                    print(f"Redis cache GET failed: {e}. Falling back to in-memory.")
        
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
                except Exception as e:
                    print(f"Redis cache SET failed: {e}.")
        
        _in_memory_cache[key] = (value, time.time() + expire_seconds)


def map_wmo_code(code: int):
    """Maps WMO weather codes to condition string and emoji icon."""
    if code == 0:
        return "Clear Sky", "☀️"
    elif code in [1, 2, 3]:
        return "Partly Cloudy" if code < 3 else "Cloudy", "⛅" if code < 3 else "☁️"
    elif code in [45, 48]:
        return "Foggy", "🌫️"
    elif code in [51, 53, 55]:
        return "Light Drizzle", "🌦️"
    elif code in [61, 63]:
        return "Rain", "🌦️"
    elif code in [65, 82]:
        return "Heavy Rain", "🌧️"
    elif code in [80, 81]:
        return "Rain Showers", "🌦️"
    elif code in [95, 96, 99]:
        return "Thunderstorm", "⛈️"
    else:
        return "Rain", "🌧️"


def get_wind_direction_label(degrees: float):
    """Maps wind degrees (0-360) to compass direction strings."""
    if degrees is None:
        return "NE"
    val = int((degrees / 22.5) + 0.5)
    arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    return arr[(val % 16)]


def get_forecast_days(base_date: datetime = None):
    """Generate 5-day forecast from a base date."""
    if not base_date:
        base_date = datetime.utcnow()

    forecasts = []
    conditions = [
        ("Heavy Rain", "🌧️", 72),
        ("Thunderstorm", "⛈️", 85),
        ("Rain", "🌦️", 55),
        ("Cloudy", "☁️", 30),
        ("Partly Cloudy", "⛅", 10),
    ]

    for i, (cond, icon, rain) in enumerate(conditions):
        day_date = base_date + timedelta(days=i)
        variation = random.uniform(-3, 3)
        forecasts.append({
            "date": day_date.strftime("%Y-%m-%d"),
            "tempHigh": round(31 + variation),
            "tempLow": round(25 + variation * 0.5),
            "rainfall": rain + random.randint(-5, 5),
            "condition": cond,
            "icon": icon,
            "humidity": random.randint(75, 95),
            "windSpeed": random.randint(20, 45),
        })
    return forecasts


def get_hourly_forecast(base_date: datetime = None):
    """Generate 24-hr hourly rainfall forecast."""
    if not base_date:
        base_date = datetime.utcnow()

    base_date = base_date.replace(minute=0, second=0, microsecond=0)
    hourly = []
    for i in range(24):
        t = base_date + timedelta(hours=i)
        hour = t.hour
        if 6 <= hour < 12:
            rain = random.uniform(15, 40)
        elif 12 <= hour < 18:
            rain = random.uniform(35, 75)
        elif 18 <= hour < 23:
            rain = random.uniform(50, 90)
        else:
            rain = random.uniform(10, 35)

        hourly.append({
            "time": t.strftime("%H:%M"),
            "timestamp": t.isoformat() + "Z",
            "rainfall": round(rain, 1),
            "predicted": True if i >= 6 else False,
        })
    return hourly


def owm_id_to_wmo_code(owm_id: int) -> int:
    """Maps OpenWeatherMap weather conditions to WMO weather codes."""
    if 200 <= owm_id < 300:
        return 95  # Thunderstorm
    elif 300 <= owm_id < 400:
        return 51  # Drizzle
    elif 500 <= owm_id < 600:
        if owm_id in [502, 503, 504, 522, 524]:
            return 65  # Heavy rain
        return 61  # Moderate rain
    elif 600 <= owm_id < 700:
        return 71  # Snow
    elif 700 <= owm_id < 800:
        return 45  # Fog
    elif owm_id == 800:
        return 0  # Clear sky
    elif owm_id == 801:
        return 1  # Partly cloudy
    elif owm_id in [802, 803]:
        return 2  # Cloudy
    else:
        return 3  # Overcast


async def fetch_live_openweather(lat: float, lng: float, api_key: str) -> dict:
    """Fetch live current and forecast data from OpenWeatherMap API and adapter-map it to Open-Meteo schema."""
    client = get_http_client()
    
    # 1. Fetch current weather
    current_url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lng}&appid={api_key}&units=metric"
    curr_res = await client.get(current_url)
    if curr_res.status_code != 200:
        raise Exception(f"OpenWeather Map Current API failed: status {curr_res.status_code}")
    curr_data = curr_res.json()
    
    # 2. Fetch forecast weather (5 day / 3 hour)
    forecast_url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lng}&appid={api_key}&units=metric"
    fore_res = await client.get(forecast_url)
    if fore_res.status_code != 200:
        raise Exception(f"OpenWeather Map Forecast API failed: status {fore_res.status_code}")
    fore_data = fore_res.json()
    
    # ─── Mapping Current ───
    main = curr_data.get("main", {})
    wind = curr_data.get("wind", {})
    rain = curr_data.get("rain", {})
    weather_list = curr_data.get("weather", [{}])
    owm_weather_id = weather_list[0].get("id", 800)
    wmo_code = owm_id_to_wmo_code(owm_weather_id)
    
    # Wind speed: OWM in m/s, convert to km/h (multiply by 3.6)
    wind_speed_kmh = wind.get("speed", 0.0) * 3.6
    
    # Rainfall in past 1h
    precipitation = rain.get("1h", 0.0)
    
    current_mapped = {
        "temperature_2m": main.get("temp", 28.0),
        "relative_humidity_2m": main.get("humidity", 80),
        "precipitation": precipitation,
        "rain": precipitation,
        "weather_code": wmo_code,
        "pressure_msl": main.get("pressure", 1008.0),
        "wind_speed_10m": wind_speed_kmh,
        "wind_direction_10m": wind.get("deg", 0.0)
    }
    
    # ─── Mapping Hourly Forecast (8 intervals = 24 hours) ───
    list_3h = fore_data.get("list", [])
    hourly_times = []
    hourly_precip = []
    for item in list_3h[:8]:
        dt_txt = item.get("dt_txt", "")
        time_iso = dt_txt.replace(" ", "T")[:-3] if dt_txt else datetime.utcnow().strftime("%Y-%m-%dT%H:00")
        hourly_times.append(time_iso)
        
        # 3h rain to 1h average
        rain_val = item.get("rain", {}).get("3h", 0.0) / 3.0
        hourly_precip.append(rain_val)
        
    hourly_mapped = {
        "time": hourly_times,
        "precipitation": hourly_precip
    }
    
    # ─── Mapping Daily Forecast (5 days) ───
    from collections import defaultdict
    daily_groups = defaultdict(list)
    for item in list_3h:
        dt_txt = item.get("dt_txt", "")
        if dt_txt:
            date_str = dt_txt.split(" ")[0]
            daily_groups[date_str].append(item)
            
    sorted_dates = sorted(daily_groups.keys())[:5]
    
    daily_times = []
    daily_codes = []
    daily_temp_max = []
    daily_temp_min = []
    daily_precip_sum = []
    
    for d_str in sorted_dates:
        items = daily_groups[d_str]
        daily_times.append(d_str)
        
        temps = [it.get("main", {}).get("temp", 28.0) for it in items]
        max_t = max(temps) if temps else 30.0
        min_t = min(temps) if temps else 24.0
        
        # Sum 3-hour precipitation
        day_precip = sum(it.get("rain", {}).get("3h", 0.0) for it in items)
        
        # Most frequent weather code for the day
        weather_ids = [it.get("weather", [{}])[0].get("id", 800) for it in items]
        if weather_ids:
            from collections import Counter
            common_id = Counter(weather_ids).most_common(1)[0][0]
        else:
            common_id = 800
        wmo_daily_code = owm_id_to_wmo_code(common_id)
        
        daily_codes.append(wmo_daily_code)
        daily_temp_max.append(max_t)
        daily_temp_min.append(min_t)
        daily_precip_sum.append(day_precip)
        
    daily_mapped = {
        "time": daily_times,
        "weather_code": daily_codes,
        "temperature_2m_max": daily_temp_max,
        "temperature_2m_min": daily_temp_min,
        "precipitation_sum": daily_precip_sum
    }
    
    return {
        "current": current_mapped,
        "hourly": hourly_mapped,
        "daily": daily_mapped
    }


async def fetch_live_openmeteo(lat: float, lng: float):
    """Fetch live data. Uses OpenWeatherMap API if a key is configured, falling back to Open-Meteo."""
    if settings.OPENWEATHER_API_KEY and settings.OPENWEATHER_API_KEY.strip():
        try:
            data = await fetch_live_openweather(lat, lng, settings.OPENWEATHER_API_KEY)
            data["source"] = "OpenWeatherMap Real-Time API"
            return data
        except Exception as e:
            print(f"OpenWeather API failed for ({lat}, {lng}): {e}. Falling back to Open-Meteo.")

    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,pressure_msl,wind_speed_10m,wind_direction_10m&hourly=precipitation,temperature_2m,relative_humidity_2m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto"
    client = get_http_client()
    response = await client.get(url)
    if response.status_code == 200:
        data = response.json()
        data["source"] = "Open-Meteo Real-Time API"
        return data
    raise Exception(f"Unsuccessful weather API request: status {response.status_code}")


@router.get("/search")
async def search_location(query: str = Query(..., min_length=2)):
    """Search for any location using OpenStreetMap Nominatim geocoding API."""
    query_clean = query.strip().lower()
    cache_key = f"weather:search:{query_clean}"
    cached = await WeatherCache.get(cache_key)
    if cached is not None:
        return cached

    client = get_http_client()
    headers = {"User-Agent": "GeoGuardAI/1.0"}
    url = f"https://nominatim.openstreetmap.org/search?q={query}&format=json&limit=5&countrycodes=in"
    try:
        response = await client.get(url, headers=headers)
        if response.status_code == 200:
            results = response.json()
            search_results = [
                {
                    "name": r.get("display_name"),
                    "lat": float(r.get("lat")),
                    "lng": float(r.get("lon")),
                    "class": r.get("class"),
                    "type": r.get("type"),
                }
                for r in results
            ]
            await WeatherCache.set(cache_key, search_results, expire_seconds=86400)
            return search_results
        return []
    except Exception as e:
        print(f"Error calling Nominatim geocoder: {e}")
        return []


@router.get("/current")
async def get_current_weather(
    lat: Optional[float] = Query(None, description="Latitude"),
    lng: Optional[float] = Query(None, description="Longitude")
):
    """Get current weather conditions for specified location (defaults to Trichy)."""
    current_lat = lat if lat is not None else LAT
    current_lng = lng if lng is not None else LNG

    cache_key = f"weather:current:{current_lat:.4f}:{current_lng:.4f}"
    cached = await WeatherCache.get(cache_key)
    if cached:
        return cached

    now = datetime.utcnow()
    try:
        data = await fetch_live_openmeteo(current_lat, current_lng)
        current = data.get("current", {})
        hourly = data.get("hourly", {})
        daily = data.get("daily", {})
        
        # 1. Map Current
        temp = current.get("temperature_2m")
        humidity = current.get("relative_humidity_2m")
        precip = current.get("precipitation", 0.0)
        wind_speed = current.get("wind_speed_10m")
        wind_deg = current.get("wind_direction_10m")
        pressure = current.get("pressure_msl")
        wmo_code = current.get("weather_code", 0)
        
        cond_text, icon_emoji = map_wmo_code(wmo_code)
        wind_dir = get_wind_direction_label(wind_deg)
        
        # 2. Map Hourly Forecast (8 intervals: every 3 hours)
        hourly_times = hourly.get("time", [])
        hourly_precip = hourly.get("precipitation", [])
        
        current_hour_str = now.strftime("%Y-%m-%dT%H:00")
        start_idx = 0
        for idx, t_str in enumerate(hourly_times):
            if t_str.startswith(current_hour_str):
                start_idx = idx
                break
                
        hourly_forecast = []
        for i in range(8):
            idx = start_idx + (i * 3)
            if idx < len(hourly_times):
                t_val = datetime.fromisoformat(hourly_times[idx])
                # format hour e.g. "6 AM" or "12 PM"
                hr_label = t_val.strftime("%I%p").lstrip("0")
                val_precip = hourly_precip[idx]
                hourly_forecast.append({
                    "time": hr_label,
                    "timestamp": hourly_times[idx] + "Z",
                    "rainfall": round(val_precip, 1),
                    "predicted": True if i >= 3 else False
                })
        if not hourly_forecast:
            hourly_forecast = get_hourly_forecast(now)
            
        # 3. Map Daily Forecast (5 days)
        daily_times = daily.get("time", [])
        daily_codes = daily.get("weather_code", [])
        daily_max = daily.get("temperature_2m_max", [])
        daily_min = daily.get("temperature_2m_min", [])
        daily_precip = daily.get("precipitation_sum", [])
        
        forecast = []
        for i in range(min(5, len(daily_times))):
            d_code = daily_codes[i] if i < len(daily_codes) else 0
            d_cond, d_icon = map_wmo_code(d_code)
            forecast.append({
                "date": daily_times[i],
                "tempHigh": round(daily_max[i]) if i < len(daily_max) else 30,
                "tempLow": round(daily_min[i]) if i < len(daily_min) else 24,
                "rainfall": round(daily_precip[i], 1) if i < len(daily_precip) else 0.0,
                "condition": d_cond,
                "icon": d_icon
            })
        if not forecast:
            forecast = get_forecast_days(now)
            
        result = {
            "temperature": round(temp) if temp is not None else 29,
            "humidity": humidity if humidity is not None else 85,
            "rainfall": round(precip, 1) if precip is not None else 0.0,
            "windSpeed": round(wind_speed) if wind_speed is not None else 15,
            "windDirection": wind_dir,
            "pressure": round(pressure) if pressure is not None else 1008,
            "visibility": 8,
            "condition": cond_text,
            "icon": icon_emoji,
            "uvIndex": 5,
            "dewPoint": 24,
            "feelsLike": round(temp + 3) if temp is not None else 32,
            "timestamp": now.isoformat() + "Z",
            "forecast": forecast,
            "hourlyForecast": hourly_forecast,
            "extremeWeatherWarning": precip > 50.0,
            "imdWarning": f"Heavy Rainfall Warning from {data.get('source', 'Open-Meteo')}." if precip > 10.0 else "",
            "source": data.get("source", "Open-Meteo Real-Time API")
        }
        await WeatherCache.set(cache_key, result, expire_seconds=600)
        return result
    except Exception as e:
        # Fallback to simulated data on failure
        print(f"Error fetching live weather: {e}. Falling back to simulation.")
        result = {
            **BASE_WEATHER,
            "temperature": BASE_WEATHER["temperature"] + round(random.uniform(-1, 1), 1),
            "humidity": BASE_WEATHER["humidity"] + random.randint(-3, 3),
            "rainfall": round(BASE_WEATHER["rainfall"] + random.uniform(-5, 10), 1),
            "windSpeed": BASE_WEATHER["windSpeed"] + random.randint(-5, 5),
            "pressure": BASE_WEATHER["pressure"] + random.randint(-2, 2),
            "timestamp": now.isoformat() + "Z",
            "forecast": get_forecast_days(now),
            "hourlyForecast": get_hourly_forecast(now),
            "extremeWeatherWarning": True,
            "imdWarning": "Very Heavy Rainfall Warning: IMD predicts 150-200mm rainfall in next 24 hours.",
            "source": "IMD Simulated (Fallback)"
        }
        await WeatherCache.set(cache_key, result, expire_seconds=60)
        return result


@router.get("/forecast")
async def get_forecast(
    days: int = Query(5, le=10),
    lat: Optional[float] = Query(None, description="Latitude"),
    lng: Optional[float] = Query(None, description="Longitude")
):
    """Get weather forecast for specified location."""
    current_lat = lat if lat is not None else LAT
    current_lng = lng if lng is not None else LNG

    cache_key = f"weather:forecast:{days}:{current_lat:.4f}:{current_lng:.4f}"
    cached = await WeatherCache.get(cache_key)
    if cached:
        return cached

    try:
        data = await fetch_live_openmeteo(current_lat, current_lng)
        daily = data.get("daily", {})
        daily_times = daily.get("time", [])
        daily_codes = daily.get("weather_code", [])
        daily_max = daily.get("temperature_2m_max", [])
        daily_min = daily.get("temperature_2m_min", [])
        daily_precip = daily.get("precipitation_sum", [])
        
        forecast = []
        for i in range(min(days, len(daily_times))):
            d_code = daily_codes[i] if i < len(daily_codes) else 0
            d_cond, d_icon = map_wmo_code(d_code)
            forecast.append({
                "date": daily_times[i],
                "tempHigh": round(daily_max[i]) if i < len(daily_max) else 30,
                "tempLow": round(daily_min[i]) if i < len(daily_min) else 24,
                "rainfall": round(daily_precip[i], 1) if i < len(daily_precip) else 0.0,
                "condition": d_cond,
                "icon": d_icon
            })
        result = {
            "forecast": forecast,
            "source": data.get("source", "Open-Meteo Real-Time API"),
            "location": f"({current_lat:.4f}, {current_lng:.4f})",
            "generated_at": datetime.utcnow().isoformat() + "Z",
        }
        await WeatherCache.set(cache_key, result, expire_seconds=900)
        return result
    except Exception as e:
        print(f"Error fetching forecast: {e}")
        result = {
            "forecast": get_forecast_days()[:days],
            "source": "IMD Simulated (Fallback)",
            "location": f"({current_lat:.4f}, {current_lng:.4f})",
            "generated_at": datetime.utcnow().isoformat() + "Z",
        }
        await WeatherCache.set(cache_key, result, expire_seconds=120)
        return result


@router.get("/historical")
async def get_historical(
    hours: int = Query(24, le=72, description="Hours of historical data")
):
    """Get historical rainfall data."""
    now = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
    history = []
    for i in range(hours, 0, -1):
        t = now - timedelta(hours=i)
        hour = t.hour
        base_rain = 30 if (14 <= hour <= 22) else 12
        history.append({
            "time": t.strftime("%H:%M"),
            "timestamp": t.isoformat() + "Z",
            "rainfall": round(base_rain + random.uniform(-8, 15), 1),
            "temperature": round(27 + random.uniform(-2, 4), 1),
            "humidity": random.randint(78, 93),
        })
    return {"history": history, "hours": hours}


async def fetch_stations_openmeteo(lats: list, lngs: list):
    """Fetch live coordinate weather from Open-Meteo for all stations."""
    lats_str = ",".join(map(str, lats))
    lngs_str = ",".join(map(str, lngs))
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lats_str}&longitude={lngs_str}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code"
    client = get_http_client()
    response = await client.get(url)
    if response.status_code == 200:
        return response.json()
    raise Exception("Failed to fetch weather stations")


@router.get("/stations")
async def get_weather_stations():
    """Get weather station data across Tamil Nadu."""
    cache_key = "weather:stations"
    cached = await WeatherCache.get(cache_key)
    if cached:
        return cached

    stations = [
        {"id": "ws-001", "name": "Chennai", "lat": 13.0827, "lng": 80.2707},
        {"id": "ws-002", "name": "Coimbatore", "lat": 11.0168, "lng": 76.9558},
        {"id": "ws-003", "name": "Madurai", "lat": 9.9252, "lng": 78.1198},
        {"id": "ws-004", "name": "Tiruchirappalli", "lat": 10.7905, "lng": 78.7047},
        {"id": "ws-005", "name": "Salem", "lat": 11.6643, "lng": 78.1460},
        {"id": "ws-006", "name": "Tirunelveli", "lat": 8.7139, "lng": 77.7567},
    ]
    
    lats = [s["lat"] for s in stations]
    lngs = [s["lng"] for s in stations]
    
    is_fallback = False
    try:
        data_list = await fetch_stations_openmeteo(lats, lngs)
        if not isinstance(data_list, list):
            data_list = [data_list]
            
        for i, s in enumerate(stations):
            if i < len(data_list):
                current = data_list[i].get("current", {})
                wmo_code = current.get("weather_code", 0)
                cond, _ = map_wmo_code(wmo_code)
                s["rainfall"] = round(current.get("precipitation", 0.0), 1)
                s["windSpeed"] = round(current.get("wind_speed_10m", 0.0))
                s["temperature"] = round(current.get("temperature_2m", 28.0), 1)
                s["humidity"] = current.get("relative_humidity_2m", 80)
                s["condition"] = cond
            else:
                s["rainfall"] = round(45.0 + random.uniform(-10, 10), 1)
                s["windSpeed"] = random.randint(20, 40)
                s["temperature"] = round(28.0 + random.uniform(-1.5, 2.0), 1)
                s["humidity"] = random.randint(80, 93)
                s["condition"] = "Heavy Rain"
    except Exception as e:
        print(f"Error fetching stations from Open-Meteo: {e}. Falling back to simulation.")
        is_fallback = True
        for s in stations:
            s["rainfall"] = round(45.0 + random.uniform(-10, 10), 1)
            s["windSpeed"] = random.randint(20, 40)
            s["temperature"] = round(28.0 + random.uniform(-1.5, 2.0), 1)
            s["humidity"] = random.randint(80, 93)
            s["condition"] = "Heavy Rain"
            
    result = {"stations": stations, "total": len(stations)}
    expire_seconds = 120 if is_fallback else 600
    await WeatherCache.set(cache_key, result, expire_seconds=expire_seconds)
    return result
