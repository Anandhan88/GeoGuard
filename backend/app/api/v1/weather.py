"""
GeoGuard AI - Weather Data API
Simulates real-time weather and forecast data for Chennai.
"""
from fastapi import APIRouter, Query
from typing import Optional
from datetime import datetime, timedelta, timezone
import random

router = APIRouter()

# Base weather conditions for Chennai during monsoon
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
        # Simulate monsoon rainfall pattern: peaks late afternoon/evening
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


@router.get("/current")
async def get_current_weather():
    """Get current weather conditions for Chennai."""
    now = datetime.utcnow()
    # Add some randomness to simulate live data
    weather = {
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
        "imdWarning": "Very Heavy Rainfall Warning: IMD predicts 150-200mm rainfall in next 24 hours for Chennai district.",
    }
    return weather


@router.get("/forecast")
async def get_forecast(days: int = Query(5, le=10)):
    """Get weather forecast."""
    return {
        "forecast": get_forecast_days(),
        "source": "IMD Simulated",
        "location": "Chennai Metropolitan Area",
        "generated_at": datetime.utcnow().isoformat() + "Z",
    }


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


@router.get("/stations")
async def get_weather_stations():
    """Get weather station data across Chennai."""
    stations = [
        {"id": "ws-001", "name": "Chennai Airport (Meenambakkam)", "lat": 12.9941, "lng": 80.1709, "rainfall": 52.4, "windSpeed": 38},
        {"id": "ws-002", "name": "Nungambakkam", "lat": 13.0604, "lng": 80.2496, "rainfall": 48.1, "windSpeed": 29},
        {"id": "ws-003", "name": "Adyar", "lat": 13.0067, "lng": 80.2206, "rainfall": 61.3, "windSpeed": 35},
        {"id": "ws-004", "name": "Velachery", "lat": 12.9815, "lng": 80.2180, "rainfall": 71.8, "windSpeed": 31},
        {"id": "ws-005", "name": "Tambaram", "lat": 12.9249, "lng": 80.1000, "rainfall": 39.2, "windSpeed": 26},
    ]
    for s in stations:
        s["rainfall"] = round(s["rainfall"] + random.uniform(-5, 8), 1)
        s["humidity"] = random.randint(80, 93)
        s["temperature"] = round(28 + random.uniform(-1.5, 2), 1)
        s["condition"] = "Heavy Rain"
    return {"stations": stations, "total": len(stations)}
