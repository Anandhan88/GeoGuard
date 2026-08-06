"""
GeoGuard AI - Database Seeding (MongoDB Atlas / Beanie ODM)
Seeds users, risk zones, predictions, alerts, shelters, reports, and satellite imagery into MongoDB Atlas.
"""
from datetime import datetime, timedelta
from app.models.models import User, RiskZone, FloodPrediction, Alert, Shelter, CitizenReport, SatelliteImage
from app.core.security import hash_password


async def seed_all():
    """Seed all mock data if it does not exist in MongoDB Atlas collections."""
    # 1. Seed Users
    admin_user = await User.find_one(User.email == "anand.settu2006@gmail.com")
    if not admin_user:
        admin_user = User(
            id="admin-anand",
            email="anand.settu2006@gmail.com",
            name="Anand Settu (Admin)",
            role="admin",
            hashed_password=hash_password("1234567890"),
            phone="+91-9876543212",
            language_pref="en",
            latitude=13.0827,
            longitude=80.2707,
        )
        await admin_user.insert()
    else:
        admin_user.role = "admin"
        admin_user.hashed_password = hash_password("1234567890")
        await admin_user.save()

    citizen = await User.find_one(User.email == "citizen@demo.com")
    if not citizen:
        citizen = User(
            id="demo-citizen",
            email="citizen@demo.com",
            name="Rajesh Kumar",
            role="citizen",
            hashed_password=hash_password("demo123"),
            phone="+91-9876543210",
            language_pref="en",
            latitude=13.0060,
            longitude=80.2550,
        )
        await citizen.insert()

    authority = await User.find_one(User.email == "authority@demo.com")
    if not authority:
        authority = User(
            id="demo-authority",
            email="authority@demo.com",
            name="Dr. Priya IAS",
            role="authority",
            hashed_password=hash_password("demo123"),
            phone="+91-9876543211",
            language_pref="en",
            latitude=13.0827,
            longitude=80.2707,
        )
        await authority.insert()

    # 2. Seed Risk Zones
    zone_count = await RiskZone.count()
    if zone_count == 0:
        zones = [
            RiskZone(
                id="zone-001",
                name="Chennai Basin",
                risk_level="critical",
                population=4500000,
                vulnerability_score=82.5,
                boundary_json={"type": "Polygon", "coordinates": [[[13.00, 80.20], [13.10, 80.20], [13.10, 80.30], [13.00, 80.30], [13.00, 80.20]]]}
            ),
            RiskZone(
                id="zone-002",
                name="Cauvery River Basin, Trichy",
                risk_level="high",
                population=1200000,
                vulnerability_score=75.0,
                boundary_json={"type": "Polygon", "coordinates": [[[10.75, 78.65], [10.85, 78.65], [10.85, 78.75], [10.75, 78.75], [10.75, 78.65]]]}
            ),
            RiskZone(
                id="zone-003",
                name="Vaigai River Basin, Madurai",
                risk_level="critical",
                population=1400000,
                vulnerability_score=89.0,
                boundary_json={"type": "Polygon", "coordinates": [[[9.88, 78.08], [9.98, 78.08], [9.98, 78.18], [9.88, 78.18], [9.88, 78.08]]]}
            ),
            RiskZone(
                id="zone-004",
                name="Bhavani River Corridor, Coimbatore",
                risk_level="low",
                population=1800000,
                vulnerability_score=40.0,
                boundary_json={"type": "Polygon", "coordinates": [[[10.96, 76.90], [11.06, 76.90], [11.06, 77.00], [10.96, 77.00], [10.96, 76.90]]]}
            ),
            RiskZone(
                id="zone-005",
                name="Thamirabarani Basin, Tirunelveli",
                risk_level="medium",
                population=500000,
                vulnerability_score=50.0,
                boundary_json={"type": "Polygon", "coordinates": [[[8.66, 77.70], [8.76, 77.70], [8.76, 77.80], [8.66, 77.80], [8.66, 77.70]]]}
            )
        ]
        for z in zones:
            await z.insert()

    # 3. Seed Predictions
    pred_count = await FloodPrediction.count()
    if pred_count == 0:
        factors_adyar = [
            {"name": "River Water Level", "value": 4.2, "unit": "m", "contribution": 28, "trend": "increasing", "threshold": 3.5, "description": "Chennai basin river levels have crossed danger mark by 20%"},
            {"name": "Rainfall Intensity", "value": 82.0, "unit": "mm/hr", "contribution": 24, "trend": "increasing", "threshold": 65.0, "description": "Extreme rainfall exceeding 65mm/hr threshold"},
            {"name": "Soil Saturation", "value": 92.0, "unit": "%", "contribution": 18, "trend": "increasing", "threshold": 80.0, "description": "Soil is nearly fully saturated"},
            {"name": "Drainage Capacity", "value": 35.0, "unit": "%", "contribution": 15, "trend": "decreasing", "threshold": 50.0, "description": "Urban drainage at 35% capacity"},
        ]
        factors_cooum = [
            {"name": "River Water Level", "value": 3.8, "unit": "m", "contribution": 30, "trend": "increasing", "threshold": 3.5, "description": "Cauvery river approaching danger mark in Trichy"},
            {"name": "Rainfall Intensity", "value": 58.0, "unit": "mm/hr", "contribution": 25, "trend": "increasing", "threshold": 65.0, "description": "Heavy rainfall continuing"},
            {"name": "Soil Saturation", "value": 85.0, "unit": "%", "contribution": 20, "trend": "increasing", "threshold": 80.0, "description": "Soil highly saturated"},
        ]
        factors_velachery = [
            {"name": "Elevation", "value": 2.1, "unit": "m ASL", "contribution": 30, "trend": "stable", "threshold": 5.0, "description": "Low elevation area near Vaigai river"},
            {"name": "Rainfall Accumulation", "value": 210.0, "unit": "mm", "contribution": 25, "trend": "increasing", "threshold": 150.0, "description": "24hr accumulation exceeds threshold"},
            {"name": "Drainage Capacity", "value": 28.0, "unit": "%", "contribution": 20, "trend": "decreasing", "threshold": 50.0, "description": "Poor drainage infrastructure"},
        ]

        predictions = [
            FloodPrediction(
                id="pred-001",
                zone_id="zone-001",
                risk_score=89.0,
                probability=0.87,
                confidence=0.92,
                factors_json=factors_adyar,
                predicted_depth=1.8,
                predicted_duration=48.0,
                predicted_for=datetime.utcnow() + timedelta(days=1),
                area_json={"type": "Polygon", "coordinates": []},
                generated_at=datetime.utcnow()
            ),
            FloodPrediction(
                id="pred-002",
                zone_id="zone-002",
                risk_score=76.0,
                probability=0.73,
                confidence=0.88,
                factors_json=factors_cooum,
                predicted_depth=1.2,
                predicted_duration=36.0,
                predicted_for=datetime.utcnow() + timedelta(days=1),
                area_json={"type": "Polygon", "coordinates": []},
                generated_at=datetime.utcnow()
            ),
            FloodPrediction(
                id="pred-003",
                zone_id="zone-003",
                risk_score=82.0,
                probability=0.80,
                confidence=0.90,
                factors_json=factors_velachery,
                predicted_depth=1.5,
                predicted_duration=60.0,
                predicted_for=datetime.utcnow() + timedelta(hours=12),
                area_json={"type": "Polygon", "coordinates": []},
                generated_at=datetime.utcnow()
            )
        ]
        for p in predictions:
            await p.insert()

    # 4. Seed Alerts
    existing_alerts = await Alert.find_all().to_list()
    if not existing_alerts:
        alerts = [
            Alert(
                id="alert-001",
                type="Flood Warning",
                severity="extreme",
                message="RED ALERT: Severe Flooding Expected - Chennai Basin. Extreme rainfall combined with rising river levels expected to cause severe flooding. Immediate evacuation recommended.",
                target_zone_id="zone-001",
                area_json={"type": "Polygon", "coordinates": []},
                created_at=datetime.utcnow() - timedelta(hours=2),
                expires_at=datetime.utcnow() + timedelta(days=30)
            ),
            Alert(
                id="alert-002",
                type="Flood Warning",
                severity="severe",
                message="ORANGE ALERT: Flooding Risk - Vaigai Area. Significant water accumulation expected in Vaigai low-lying areas. Move valuables to upper floors.",
                target_zone_id="zone-003",
                area_json={"type": "Polygon", "coordinates": []},
                created_at=datetime.utcnow() - timedelta(hours=1),
                expires_at=datetime.utcnow() + timedelta(days=30)
            ),
            Alert(
                id="alert-003",
                type="Heavy Rainfall",
                severity="severe",
                message="ORANGE ALERT: Very Heavy Rainfall Warning. IMD has issued very heavy rainfall warning for Tamil Nadu. Expected 150-200mm in next 24 hours.",
                target_zone_id=None,
                area_json={"type": "Polygon", "coordinates": []},
                created_at=datetime.utcnow() - timedelta(hours=3),
                expires_at=datetime.utcnow() + timedelta(days=30)
            )
        ]
        for a in alerts:
            await a.insert()
    else:
        for a in existing_alerts:
            if a.expires_at and a.expires_at < datetime.utcnow():
                a.expires_at = datetime.utcnow() + timedelta(days=30)
                await a.save()

    # 5. Seed Shelters
    shelter_count = await Shelter.count()
    if shelter_count == 0:
        shelters = [
            Shelter(id="shelter-001", name="Chennai Central Relief Camp", type="government", capacity=500, current_occupancy=187, amenities_json=["Water", "Food", "Medical Aid", "Blankets", "Charging Points"], address="Chennai", latitude=13.0827, longitude=80.2707),
            Shelter(id="shelter-002", name="Trichy District Govt School", type="school", capacity=300, current_occupancy=245, amenities_json=["Water", "Food", "Blankets"], address="Trichy", latitude=10.7905, longitude=78.7047),
            Shelter(id="shelter-003", name="Madurai Community Hall", type="community_hall", capacity=200, current_occupancy=198, amenities_json=["Water", "Food", "Medical Aid"], address="Madurai", latitude=9.9252, longitude=78.1198),
            Shelter(id="shelter-004", name="Coimbatore Temple Hall", type="temple", capacity=150, current_occupancy=42, amenities_json=["Water", "Food", "Blankets", "First Aid"], address="Coimbatore", latitude=11.0168, longitude=76.9558),
            Shelter(id="shelter-005", name="Tirunelveli Sports Complex", type="stadium", capacity=800, current_occupancy=310, amenities_json=["Water", "Food", "Medical Aid", "Blankets", "Charging Points", "Toilets"], address="Tirunelveli", latitude=8.7139, longitude=77.7567)
        ]
        for s in shelters:
            await s.insert()

    # 6. Seed Citizen Reports
    report_count = await CitizenReport.count()
    if report_count == 0:
        reports = [
            CitizenReport(id="report-001", user_id="demo-citizen", type="flood", description="Water level rising rapidly near Chennai bridge. 2 feet on road.", severity=5, verified=True, latitude=13.0827, longitude=80.2707, created_at=datetime.utcnow() - timedelta(hours=4)),
            CitizenReport(id="report-002", user_id="demo-citizen", type="road_blocked", description="Road blocked due to fallen tree and waterlogging.", severity=4, verified=True, latitude=10.7905, longitude=78.7047, created_at=datetime.utcnow() - timedelta(hours=3)),
            CitizenReport(id="report-003", user_id="demo-citizen", type="power_outage", description="Power outage since 6 AM. Transformer submerged.", severity=4, verified=False, latitude=9.9252, longitude=78.1198, created_at=datetime.utcnow() - timedelta(hours=2))
        ]
        for r in reports:
            await r.insert()

    # 7. Seed Satellite Images
    sat_count = await SatelliteImage.count()
    if sat_count == 0:
        river_coords = [
            [80.2207, 13.0727], [80.2307, 13.0747], [80.2407, 13.0707], [80.2507, 13.0757],
            [80.2607, 13.0727], [80.2707, 13.0737], [80.2807, 13.0717], [80.2907, 13.0767],
            [80.2907, 13.0807], [80.2807, 13.0757], [80.2707, 13.0777], [80.2607, 13.0767],
            [80.2507, 13.0797], [80.2407, 13.0747], [80.2307, 13.0787], [80.2207, 13.0727]
        ]
        pool_coords = [
            [80.2657, 13.0857], [80.2707, 13.0897], [80.2757, 13.0857], [80.2707, 13.0817], [80.2657, 13.0857]
        ]
        sat_images = [
            SatelliteImage(
                id="sat-001",
                source="Sentinel-2",
                capture_date=datetime.utcnow() - timedelta(days=1),
                image_url="http://localhost:8000/uploads/satellite/sentinel2_chennai_post_rain.tif",
                analysis_result_json={
                    "flooded_area_km": 14.8,
                    "water_spread_pct": 34.0,
                    "severity": "Critical",
                    "risk_level": "Critical",
                    "ndwi_score": 0.82,
                    "coverage_pct": 94,
                    "anomaly_detected": True,
                    "analysis": "Large-scale inundation detected in Adyar river floodplain. Water body extent has expanded by 340% compared to baseline. U-Net model confidence: 94%. Immediate action recommended.",
                    "polygons": [
                        {
                            "type": "Feature",
                            "properties": {"id": "river-flood-corridor", "type": "river_overflow", "severity": "Critical"},
                            "geometry": {"type": "Polygon", "coordinates": [river_coords]}
                        },
                        {
                            "type": "Feature",
                            "properties": {"id": "flood-patch-1", "type": "urban_inundation", "severity": "High"},
                            "geometry": {"type": "Polygon", "coordinates": [pool_coords]}
                        }
                    ]
                },
                bounds_json={"type": "Polygon", "coordinates": []}
            ),
            SatelliteImage(
                id="sat-002",
                source="Landsat-9",
                capture_date=datetime.utcnow() - timedelta(days=2),
                image_url="http://localhost:8000/uploads/satellite/landsat9_velachery_overflow.tif",
                analysis_result_json={
                    "flooded_area_km": 8.2,
                    "water_spread_pct": 21.0,
                    "severity": "High",
                    "risk_level": "High",
                    "ndwi_score": 0.71,
                    "coverage_pct": 89,
                    "anomaly_detected": True,
                    "analysis": "Velachery lake overflow extending into residential areas. Pallikaranai marshland at 85% saturation. Road network disruption visible in SE quadrant.",
                    "polygons": [
                        {
                            "type": "Feature",
                            "properties": {"id": "flood-patch-2", "type": "urban_inundation", "severity": "High"},
                            "geometry": {"type": "Polygon", "coordinates": [pool_coords]}
                        }
                    ]
                },
                bounds_json={"type": "Polygon", "coordinates": []}
            )
        ]
        for img in sat_images:
            await img.insert()
