"""
GeoGuard AI - Flood Depth Prediction Model (Module 2)
Simulates an LSTM network forecasting flood water depth over a 48-hour horizon.
"""
from typing import List, Dict, Any
from datetime import datetime, timedelta


class FloodModel:
    def __init__(self):
        pass

    def predict_depth_timeline(self, initial_depth: float, rainfall_forecast: List[float]) -> List[Dict[str, Any]]:
        """
        Predicts flood water depth at 3-hour intervals up to 24 hours and 6-hour intervals up to 48 hours.
        Inputs:
            initial_depth: Current flood depth (m)
            rainfall_forecast: Expected rainfall (mm/hr) for the upcoming time blocks
        """
        timeline = []
        current_depth = initial_depth
        
        # We will forecast for the next 8 time blocks (3h, 6h, 9h, 12h, 18h, 24h, 36h, 48h)
        intervals = [3, 6, 9, 12, 18, 24, 36, 48]
        
        now = datetime.utcnow()
        
        for i, hours in enumerate(intervals):
            # Fetch rainfall for this block (default to 10mm/hr if not enough data)
            rain = rainfall_forecast[i] if i < len(rainfall_forecast) else 10.0
            
            # Simple hydrology simulation:
            # - High rainfall increases depth: depth += rain * coefficient
            # - Soil saturation and drainage absorb water: absorption = 15mm/hr equivalent (reduces depth)
            water_added = (rain * 0.015)  # 1.5cm depth rise per mm rain
            water_drained = 0.05          # 5cm drainage per interval
            
            # Accumulate depth
            current_depth = max(0.0, current_depth + water_added - water_drained)
            
            # Add some randomness for realistic forecasting curves
            if rain > 50:
                current_depth += 0.08  # flash flood surge
            
            target_time = now + timedelta(hours=hours)
            
            timeline.append({
                "hours_ahead": hours,
                "time": target_time.isoformat() + "Z",
                "predicted_depth": round(current_depth, 2),
                "rainfall_intensity": rain,
                "confidence_interval": {
                    "min": round(max(0.0, current_depth * 0.8 - 0.1), 2),
                    "max": round(current_depth * 1.2 + 0.15, 2)
                }
            })

        return timeline
