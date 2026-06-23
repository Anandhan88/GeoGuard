import asyncio
from datetime import datetime
from app.models.models import WeatherData
from app.api.v1.weather import fetch_live_openmeteo, map_wmo_code
from sqlalchemy.ext.asyncio import async_sessionmaker

async def start_weather_updater(db_session_maker: async_sessionmaker):
    """
    Periodically fetches weather for Tamil Nadu stations and saves to database.
    Runs every 15 minutes.
    """
    stations = [
        {"name": "Chennai", "lat": 13.0827, "lng": 80.2707},
        {"name": "Coimbatore", "lat": 11.0168, "lng": 76.9558},
        {"name": "Madurai", "lat": 9.9252, "lng": 78.1198},
        {"name": "Tiruchirappalli", "lat": 10.7905, "lng": 78.7047},
        {"name": "Salem", "lat": 11.6643, "lng": 78.1460},
        {"name": "Tirunelveli", "lat": 8.7139, "lng": 77.7567},
    ]
    
    print("Starting background weather updater task...")
    
    while True:
        try:
            async with db_session_maker() as db:
                for s in stations:
                    try:
                        data = await fetch_live_openmeteo(s["lat"], s["lng"])
                        current = data.get("current", {})
                        wmo_code = current.get("weather_code", 0)
                        cond, _ = map_wmo_code(wmo_code)
                        
                        weather_record = WeatherData(
                            temperature=current.get("temperature_2m", 28.0),
                            humidity=current.get("relative_humidity_2m", 80.0),
                            rainfall=current.get("precipitation", 0.0),
                            wind_speed=current.get("wind_speed_10m", 0.0),
                            pressure=current.get("pressure_msl", 1010.0),
                            condition=cond,
                            source="Open-Meteo Background Fetcher",
                            latitude=s["lat"],
                            longitude=s["lng"]
                        )
                        db.add(weather_record)
                    except Exception as e:
                        print(f"WeatherUpdater failed for {s['name']}: {e}")
                
                await db.commit()
                print(f"WeatherUpdater: Logged weather data for {len(stations)} stations.")
        except Exception as e:
            print(f"WeatherUpdater critical error: {e}")
            
        # Sleep for 15 minutes (900 seconds)
        await asyncio.sleep(900)
