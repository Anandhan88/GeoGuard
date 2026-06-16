"""
GeoGuard AI - Prediction & Alert Pipeline Service
Orchestrates RiskEngine, FloodModel, and DataSimulator to update database state and trigger alerts.
"""
import json
from datetime import datetime, timedelta, timezone
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import RiskZone, FloodPrediction, Alert, WeatherData
from app.ml.prediction import RiskEngine, FloodModel, DataSimulator
from app.ml.explainability import XAIEngine


class PredictionService:
    def __init__(self):
        self.simulator = DataSimulator()
        self.risk_engine = RiskEngine()
        self.flood_model = FloodModel()

    async def seed_initial_risk_zones(self, db: AsyncSession) -> list[RiskZone]:
        """Ensures default risk zones are present in the database."""
        result = await db.execute(select(RiskZone))
        zones = result.scalars().all()
        if not zones:
            default_zones = [
                RiskZone(id="zone-001", name="Adyar River Basin", risk_level="critical", population=45000, vulnerability_score=82.5, boundary_json={"type": "Polygon", "coordinates": [[[13.00, 80.20], [13.02, 80.20], [13.02, 80.23], [13.00, 80.23], [13.00, 80.20]]]}),
                RiskZone(id="zone-002", name="Cooum River Corridor", risk_level="high", population=62000, vulnerability_score=75.0, boundary_json={"type": "Polygon", "coordinates": [[[13.06, 80.25], [13.09, 80.25], [13.09, 80.28], [13.06, 80.28], [13.06, 80.25]]]}),
                RiskZone(id="zone-003", name="Velachery Low-Lying Area", risk_level="critical", population=35000, vulnerability_score=89.0, boundary_json={"type": "Polygon", "coordinates": [[[12.97, 80.20], [12.99, 80.20], [12.99, 80.23], [12.97, 80.23], [12.97, 80.20]]]}),
                RiskZone(id="zone-004", name="Mylapore Coastal Zone", risk_level="low", population=28000, vulnerability_score=40.0, boundary_json={"type": "Polygon", "coordinates": [[[13.02, 80.25], [13.04, 80.25], [13.04, 80.28], [13.02, 80.28], [13.02, 80.25]]]}),
                RiskZone(id="zone-005", name="Tambaram Sector", risk_level="medium", population=15000, vulnerability_score=50.0, boundary_json={"type": "Polygon", "coordinates": [[[12.91, 80.09], [12.93, 80.09], [12.93, 80.11], [12.91, 80.11], [12.91, 80.09]]]})
            ]
            for z in default_zones:
                db.add(z)
            await db.commit()
            return default_zones
        return zones

    async def run_prediction_pipeline(self, db: AsyncSession, severity_factor: float = 1.0) -> dict:
        """
        Runs the full prediction pipeline.
        Generates simulated weather conditions, evaluates risks per zone,
        persists outputs, and triggers automated alerts if risk exceeds threshold.
        """
        # 1. Seed zones if needed
        zones = await self.seed_initial_risk_zones(db)

        # 2. Simulate current weather
        weather_sim = self.simulator.generate_weather_data(severity_factor)
        weather = WeatherData(
            timestamp=datetime.utcnow(),
            temperature=weather_sim["temperature"],
            humidity=weather_sim["humidity"],
            rainfall=weather_sim["rainfall"],
            wind_speed=weather_sim["wind_speed"],
            pressure=weather_sim["pressure"],
            condition=weather_sim["condition"],
            source=weather_sim["source"]
        )
        if hasattr(weather, 'latitude'):
            weather.latitude = 13.0827
            weather.longitude = 80.2707
        db.add(weather)

        predictions_run = []
        alerts_triggered = []

        # 3. Predict for each zone
        for zone in zones:
            # Generate inputs based on rain
            inputs = self.simulator.generate_zone_inputs(zone.name, weather.rainfall)
            
            # Run risk engine
            risk_res = self.risk_engine.predict_risk(inputs)
            
            # Predict depth timeline (LSTM)
            rain_forecast = [weather.rainfall * random_decay for random_decay in [1.0, 0.9, 0.8, 0.7, 0.5, 0.3, 0.1, 0.0]]
            initial_depth = 0.5 if risk_res["risk_score"] > 70 else 0.0
            timeline = self.flood_model.predict_depth_timeline(initial_depth, rain_forecast)
            
            # Primary depth prediction (maximum depth from forecast)
            max_depth = max(t["predicted_depth"] for t in timeline)
            
            # Create prediction record
            pred = FloodPrediction(
                zone_id=zone.id,
                risk_score=risk_res["risk_score"],
                probability=risk_res["probability"],
                confidence=risk_res["confidence"],
                factors_json=risk_res["factors"],
                predicted_depth=max_depth,
                predicted_duration=48.0,
                predicted_for=datetime.utcnow() + timedelta(hours=24),
                generated_at=datetime.utcnow()
            )
            
            # If coordinates / area are emulated
            if not hasattr(pred, 'area'):
                pred.area_json = zone.boundary_json

            db.add(pred)

            # Update zone risk level in DB
            zone.risk_level = risk_res["risk_level"]
            db.add(zone)

            predictions_run.append({
                "zone_name": zone.name,
                "risk_score": risk_res["risk_score"],
                "risk_level": risk_res["risk_level"],
                "max_predicted_depth": max_depth
            })

            # 4. Trigger alert if risk exceeds threshold (>= 60)
            if risk_res["risk_score"] >= 60:
                # Check if alert already active for this zone to avoid duplicate spamming
                active_alert_query = await db.execute(
                    select(Alert).filter(
                        Alert.target_zone_id == zone.id,
                        Alert.expires_at > datetime.utcnow()
                    )
                )
                existing_alert = active_alert_query.scalars().first()
                
                if not existing_alert:
                    severity = "extreme" if risk_res["risk_score"] >= 80 else "severe"
                    explanation = XAIEngine.generate_natural_language_explanation(
                        risk_res["risk_score"], risk_res["confidence"], risk_res["factors"]
                    )
                    
                    alert = Alert(
                        type="Flood Warning",
                        severity=severity,
                        message=f"WARNING: High flood risk prediction for {zone.name}. {explanation}",
                        target_zone_id=zone.id,
                        created_at=datetime.utcnow(),
                        expires_at=datetime.utcnow() + timedelta(days=2)
                    )
                    
                    if not hasattr(alert, 'area'):
                        alert.area_json = zone.boundary_json
                        
                    db.add(alert)
                    alerts_triggered.append({
                        "zone_name": zone.name,
                        "severity": severity,
                        "message": alert.message
                    })

        await db.commit()

        return {
            "status": "success",
            "weather": weather_sim,
            "predictions_count": len(predictions_run),
            "predictions": predictions_run,
            "alerts_triggered_count": len(alerts_triggered),
            "alerts_triggered": alerts_triggered
        }
