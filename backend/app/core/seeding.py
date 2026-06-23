"""
GeoGuard AI - Database Seeding
Seeds users, risk zones, predictions, alerts, shelters, and reports.
"""
from datetime import datetime, timedelta, timezone
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import User, RiskZone, FloodPrediction, Alert, Shelter, CitizenReport
from app.core.security import hash_password


async def seed_all(db: AsyncSession):
    """Seed all mock data if it does not exist in the database."""
    # 1. Seed Users
    result = await db.execute(select(User).filter(User.email == "citizen@demo.com"))
    if not result.scalars().first():
        citizen = User(
            id="demo-citizen",
            email="citizen@demo.com",
            name="Rajesh Kumar",
            role="citizen",
            hashed_password=hash_password("demo123"),
            phone="+91-9876543210",
            language_pref="en",
        )
        if hasattr(citizen, 'latitude'):
            citizen.latitude = 13.0060
            citizen.longitude = 80.2550
        db.add(citizen)

    result = await db.execute(select(User).filter(User.email == "authority@demo.com"))
    if not result.scalars().first():
        authority = User(
            id="demo-authority",
            email="authority@demo.com",
            name="Dr. Priya IAS",
            role="authority",
            hashed_password=hash_password("demo123"),
            phone="+91-9876543211",
            language_pref="en",
        )
        if hasattr(authority, 'latitude'):
            authority.latitude = 13.0827
            authority.longitude = 80.2707
        db.add(authority)

    # 2. Seed Risk Zones
    result = await db.execute(select(RiskZone))
    zones = result.scalars().all()
    if not zones:
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
            db.add(z)
        await db.commit()

    # 3. Seed Predictions
    result = await db.execute(select(FloodPrediction))
    if not result.scalars().first():
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
                generated_at=datetime.utcnow()
            )
        ]
        for p in predictions:
            if hasattr(p, 'area_json'):
                p.area_json = {"type": "Polygon", "coordinates": []}
            db.add(p)

    # 4. Seed Alerts
    result = await db.execute(select(Alert))
    existing_alerts = result.scalars().all()
    if not existing_alerts:
        alerts = [
            Alert(
                id="alert-001",
                type="Flood Warning",
                severity="extreme",
                message="RED ALERT: Severe Flooding Expected - Chennai Basin. Extreme rainfall combined with rising river levels expected to cause severe flooding. Immediate evacuation recommended.",
                target_zone_id="zone-001",
                created_at=datetime.utcnow() - timedelta(hours=2),
                expires_at=datetime.utcnow() + timedelta(days=30)
            ),
            Alert(
                id="alert-002",
                type="Flood Warning",
                severity="severe",
                message="ORANGE ALERT: Flooding Risk - Vaigai Area. Significant water accumulation expected in Vaigai low-lying areas. Move valuables to upper floors.",
                target_zone_id="zone-003",
                created_at=datetime.utcnow() - timedelta(hours=1),
                expires_at=datetime.utcnow() + timedelta(days=30)
            ),
            Alert(
                id="alert-003",
                type="Heavy Rainfall",
                severity="severe",
                message="ORANGE ALERT: Very Heavy Rainfall Warning. IMD has issued very heavy rainfall warning for Tamil Nadu. Expected 150-200mm in next 24 hours.",
                target_zone_id=None,
                created_at=datetime.utcnow() - timedelta(hours=3),
                expires_at=datetime.utcnow() + timedelta(days=30)
            )
        ]
        for a in alerts:
            if hasattr(a, 'area_json'):
                a.area_json = {"type": "Polygon", "coordinates": []}
            db.add(a)
    else:
        # Refresh expired alerts — extend to 30 days from now
        for a in existing_alerts:
            if a.expires_at and a.expires_at < datetime.utcnow():
                a.expires_at = datetime.utcnow() + timedelta(days=30)

    # 5. Seed Shelters
    result = await db.execute(select(Shelter))
    if not result.scalars().first():
        shelters = [
            Shelter(id="shelter-001", name="Chennai Central Relief Camp", type="government", capacity=500, current_occupancy=187, amenities_json=["Water", "Food", "Medical Aid", "Blankets", "Charging Points"], address="Chennai"),
            Shelter(id="shelter-002", name="Trichy District Govt School", type="school", capacity=300, current_occupancy=245, amenities_json=["Water", "Food", "Blankets"], address="Trichy"),
            Shelter(id="shelter-003", name="Madurai Community Hall", type="community_hall", capacity=200, current_occupancy=198, amenities_json=["Water", "Food", "Medical Aid"], address="Madurai"),
            Shelter(id="shelter-004", name="Coimbatore Temple Hall", type="temple", capacity=150, current_occupancy=42, amenities_json=["Water", "Food", "Blankets", "First Aid"], address="Coimbatore"),
            Shelter(id="shelter-005", name="Tirunelveli Sports Complex", type="stadium", capacity=800, current_occupancy=310, amenities_json=["Water", "Food", "Medical Aid", "Blankets", "Charging Points", "Toilets"], address="Tirunelveli")
        ]
        for s in shelters:
            if hasattr(s, 'latitude'):
                # assign coords
                coords = {
                    "shelter-001": (13.0827, 80.2707),
                    "shelter-002": (10.7905, 78.7047),
                    "shelter-003": (9.9252, 78.1198),
                    "shelter-004": (11.0168, 76.9558),
                    "shelter-005": (8.7139, 77.7567)
                }
                s.latitude, s.longitude = coords[s.id]
            db.add(s)

    # 6. Seed Citizen Reports
    result = await db.execute(select(CitizenReport))
    if not result.scalars().first():
        reports = [
            CitizenReport(id="report-001", user_id="demo-citizen", type="flood", description="Water level rising rapidly near Chennai bridge. 2 feet on road.", severity=5, verified=True, created_at=datetime.utcnow() - timedelta(hours=4)),
            CitizenReport(id="report-002", user_id="demo-citizen", type="road_blocked", description="Road blocked due to fallen tree and waterlogging.", severity=4, verified=True, created_at=datetime.utcnow() - timedelta(hours=3)),
            CitizenReport(id="report-003", user_id="demo-citizen", type="power_outage", description="Power outage since 6 AM. Transformer submerged.", severity=4, verified=False, created_at=datetime.utcnow() - timedelta(hours=2))
        ]
        for r in reports:
            if hasattr(r, 'latitude'):
                coords = {
                    "report-001": (13.0827, 80.2707), # Chennai
                    "report-002": (10.7905, 78.7047), # Trichy
                    "report-003": (9.9252, 78.1198) # Madurai
                }
                r.latitude, r.longitude = coords[r.id]
            db.add(r)

    await db.commit()
