"""
GeoGuard AI - Database Models (MongoDB Atlas / Beanie ODM)
Defines all 12 core document collections with native GeoJSON & spatial index support.
"""
import uuid
from datetime import datetime
from typing import Optional, Any, List, Dict
from beanie import Document, Indexed
from pydantic import Field


class User(Document):
    """User accounts and roles stored in MongoDB Atlas."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: Indexed(str, unique=True)
    name: str
    hashed_password: str
    role: str = "citizen"  # citizen, responder, authority, admin
    phone: Optional[str] = None
    language_pref: str = "en"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"


class RiskZone(Document):
    """Defined geographic risk zones."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    risk_level: str = "low"  # low, medium, high, critical
    population: int = 0
    vulnerability_score: float = 0.0  # 0 to 100
    boundary_json: Optional[Any] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "risk_zones"


class CitizenReport(Document):
    """Disaster and hazard reports submitted by citizens."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    type: str  # flood, water_logging, blocked_road, fire, other
    description: str
    severity: int = 1  # 1 to 5
    image_url: Optional[str] = None
    verified: bool = False
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "citizen_reports"


class WeatherData(Document):
    """Historical and real-time weather readings."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    temperature: float
    humidity: float
    rainfall: float = 0.0  # mm/hr
    wind_speed: float = 0.0
    pressure: float = 1013.25
    condition: Optional[str] = None
    source: str = "simulated"
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    class Settings:
        name = "weather_data"


class FloodPrediction(Document):
    """AI/ML predictive outputs per risk zone."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    zone_id: str
    risk_score: float = 0.0  # 0 to 100
    probability: float = 0.0  # 0 to 1
    confidence: float = 0.0  # 0 to 1
    factors_json: Optional[Any] = None
    predicted_depth: float = 0.0  # in meters
    predicted_duration: float = 0.0  # in hours
    predicted_for: datetime
    area_json: Optional[Any] = None
    generated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "flood_predictions"


class Shelter(Document):
    """Relief camps, shelters, and assembly points."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    address: Optional[str] = None
    capacity: int = 100
    current_occupancy: int = 0
    type: str = "temporary"
    amenities_json: Optional[Any] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "shelters"


class Road(Document):
    """Road network segments for routing analysis."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    road_type: Optional[str] = None
    is_blocked: bool = False
    flood_risk: float = 0.0  # 0 to 100
    geometry_json: Optional[Any] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "roads"


class Village(Document):
    """Villages / Sub-districts for demographic calculations."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    district: str
    population: int = 0
    elevation: float = 0.0
    geometry_json: Optional[Any] = None

    class Settings:
        name = "villages"


class ResourceCenter(Document):
    """Emergency supply storage points."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: Optional[str] = None
    resources_json: Optional[Any] = None
    contact: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    class Settings:
        name = "resource_centers"


class Alert(Document):
    """Emergency alerts."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str
    severity: str = "moderate"
    message: str
    target_zone_id: Optional[str] = None
    area_json: Optional[Any] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime

    class Settings:
        name = "alerts"


class SatelliteImage(Document):
    """Satellite image records with analytical overlay metadata."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    source: str
    capture_date: datetime
    analysis_result_json: Optional[Any] = None
    image_url: str
    bounds_json: Optional[Any] = None

    class Settings:
        name = "satellite_images"


class DamageReport(Document):
    """Structural/Infrastructural damage calculated by computer vision."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    before_image: Optional[str] = None
    after_image: Optional[str] = None
    damage_pct: float = 0.0
    repair_cost: float = 0.0
    priority: int = 1
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "damage_reports"


all_models = [
    User,
    RiskZone,
    CitizenReport,
    WeatherData,
    FloodPrediction,
    Shelter,
    Road,
    Village,
    ResourceCenter,
    Alert,
    SatelliteImage,
    DamageReport,
]
