"""
GeoGuard AI - Data Simulator (Module 1/2)
Generates realistic hyperlocal disaster sensor streams for the Chennai region.
"""
import random
from typing import Dict, Any


class DataSimulator:
    def __init__(self):
        # Baseline configurations for different zones in Chennai
        self.zone_profiles = {
            "Adyar River Basin": {
                "base_elevation": 2.5,
                "base_drainage": 45.0,  # poor drainage capacity %
                "river_base": 1.8,       # base river level m
                "reservoir_base": 75.0,  # Chembarambakkam reservoir capacity %
            },
            "Cooum River Corridor": {
                "base_elevation": 3.0,
                "base_drainage": 55.0,
                "river_base": 1.5,
                "reservoir_base": 60.0,
            },
            "Velachery Low-Lying Area": {
                "base_elevation": 1.2,   # extremely low lying elevation ASL m
                "base_drainage": 30.0,   # very poor drainage
                "river_base": 1.0,
                "reservoir_base": 50.0,
            },
            "Mylapore Coastal Zone": {
                "base_elevation": 4.5,
                "base_drainage": 65.0,
                "river_base": 0.5,
                "reservoir_base": 40.0,
            },
            "Tambaram Sector": {
                "base_elevation": 8.0,
                "base_drainage": 70.0,
                "river_base": 1.2,
                "reservoir_base": 80.0,
            }
        }

    def generate_weather_data(self, severity_factor: float = 1.0) -> Dict[str, Any]:
        """
        Generates simulated current weather.
        severity_factor increases rainfall/wind intensities (e.g. during a simulated cyclone).
        """
        rainfall = 0.0
        condition = "Clear"
        
        # Determine condition based on severity
        if severity_factor <= 1.0:
            condition = random.choice(["Clear", "Cloudy", "Light Rain"])
            if condition == "Light Rain":
                rainfall = round(random.uniform(1.0, 15.0), 1)
        elif severity_factor <= 2.0:
            condition = "Heavy Rain"
            rainfall = round(random.uniform(30.0, 75.0), 1)
        else:
            condition = "Extreme Storm"
            rainfall = round(random.uniform(80.0, 150.0), 1)

        temp_base = 32.0 if condition == "Clear" else 26.0
        return {
            "temperature": round(temp_base + random.uniform(-2.0, 2.0), 1),
            "humidity": round(70.0 + random.uniform(0.0, 30.0) if rainfall > 0 else 60.0, 1),
            "rainfall": rainfall,
            "wind_speed": round((10.0 + random.uniform(5.0, 25.0)) * severity_factor, 1),
            "pressure": round(1013.25 - (15.0 * severity_factor) + random.uniform(-2.0, 2.0), 1),
            "condition": condition,
            "source": "simulated_sensor"
        }

    def generate_zone_inputs(self, zone_name: str, rainfall_intensity: float) -> Dict[str, float]:
        """
        Generates sensory inputs for a specific zone based on current rainfall intensity.
        """
        profile = self.zone_profiles.get(
            zone_name, 
            {"base_elevation": 5.0, "base_drainage": 60.0, "river_base": 1.0, "reservoir_base": 50.0}
        )

        # 1. Drainage capacity decreases as rain intensity and accumulation goes up
        drainage_decay = (rainfall_intensity / 10.0) * random.uniform(2.0, 4.0)
        current_drainage = max(10.0, profile["base_drainage"] - drainage_decay)

        # 2. River level rises with heavy rain (more rapidly if reservoir is full)
        reservoir_fill = min(100.0, profile["reservoir_base"] + (rainfall_intensity * 0.15) + random.uniform(-2.0, 5.0))
        river_rise = (rainfall_intensity * 0.02) * (1.0 + (reservoir_fill / 100.0)) + random.uniform(0.0, 0.4)
        current_river_level = round(profile["river_base"] + river_rise, 2)

        # 3. Soil saturation increases directly with rainfall intensity
        soil_saturation = min(100.0, 45.0 + (rainfall_intensity * 0.7) + random.uniform(-5.0, 10.0))

        # 4. Tide level is cyclical/random (max 2.5m storm surge)
        tide_level = round(0.5 + (rainfall_intensity * 0.008) + random.uniform(0.0, 0.6), 2)

        return {
            "river_level": current_river_level,
            "rainfall_intensity": rainfall_intensity,
            "soil_saturation": round(soil_saturation, 1),
            "drainage_capacity": round(current_drainage, 1),
            "upstream_reservoir": round(reservoir_fill, 1),
            "tide_level": tide_level,
            "elevation": profile["base_elevation"]
        }
