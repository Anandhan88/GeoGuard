"""
GeoGuard AI - Database Models
Defines all 12 core tables with dynamic spatial support for SQLite and PostgreSQL/PostGIS.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.core.config import settings

# Detect database provider
IS_POSTGRES = settings.DATABASE_URL.startswith("postgresql")

if IS_POSTGRES:
    from geoalchemy2 import Geometry


class User(Base):
    """User accounts and roles."""
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="citizen")  # citizen, responder, authority, admin
    phone = Column(String(50), nullable=True)
    language_pref = Column(String(10), default="en")
    created_at = Column(DateTime, default=datetime.utcnow)

    if IS_POSTGRES:
        location = Column(Geometry(geometry_type='POINT', srid=4326), nullable=True)
    else:
        latitude = Column(Float, nullable=True)
        longitude = Column(Float, nullable=True)

    # Relationships
    reports = relationship("CitizenReport", back_populates="user")


class RiskZone(Base):
    """Defined geographic risk zones (e.g. river basins, low-lying sectors)."""
    __tablename__ = "risk_zones"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    risk_level = Column(String(50), default="low")  # low, medium, high, critical
    population = Column(Integer, default=0)
    vulnerability_score = Column(Float, default=0.0)  # 0 to 100
    created_at = Column(DateTime, default=datetime.utcnow)

    if IS_POSTGRES:
        boundary = Column(Geometry(geometry_type='POLYGON', srid=4326), nullable=True)
    else:
        # Stored as serialized geojson or bounds bounding box representation
        boundary_json = Column(JSON, nullable=True)

    # Relationships
    predictions = relationship("FloodPrediction", back_populates="zone")
    alerts = relationship("Alert", back_populates="zone")


class CitizenReport(Base):
    """Disaster and hazard reports submitted by citizens."""
    __tablename__ = "citizen_reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    type = Column(String(100), nullable=False)  # flood, water_logging, blocked_road, fire, other
    description = Column(Text, nullable=False)
    severity = Column(Integer, default=1)  # 1 to 5
    image_url = Column(String(512), nullable=True)
    verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    if IS_POSTGRES:
        location = Column(Geometry(geometry_type='POINT', srid=4326), nullable=True)
    else:
        latitude = Column(Float, nullable=True)
        longitude = Column(Float, nullable=True)

    # Relationships
    user = relationship("User", back_populates="reports")


class WeatherData(Base):
    """Historical and real-time weather readings."""
    __tablename__ = "weather_data"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    temperature = Column(Float, nullable=False)
    humidity = Column(Float, nullable=False)
    rainfall = Column(Float, default=0.0)  # mm/hr
    wind_speed = Column(Float, default=0.0)
    pressure = Column(Float, default=1013.25)
    condition = Column(String(100), nullable=True)  # Rain, Stormy, Cloudy, etc.
    source = Column(String(100), default="simulated")

    if IS_POSTGRES:
        location = Column(Geometry(geometry_type='POINT', srid=4326), nullable=True)
    else:
        latitude = Column(Float, nullable=True)
        longitude = Column(Float, nullable=True)


class FloodPrediction(Base):
    """AI/ML predictive outputs per risk zone."""
    __tablename__ = "flood_predictions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    zone_id = Column(String(36), ForeignKey("risk_zones.id"), nullable=False)
    risk_score = Column(Float, default=0.0)  # 0 to 100
    probability = Column(Float, default=0.0)  # 0 to 1
    confidence = Column(Float, default=0.0)  # 0 to 1
    factors_json = Column(JSON, nullable=True)  # SHAP/XAI contribution factors
    predicted_depth = Column(Float, default=0.0)  # in meters
    predicted_duration = Column(Float, default=0.0)  # in hours
    predicted_for = Column(DateTime, nullable=False)
    generated_at = Column(DateTime, default=datetime.utcnow)

    if IS_POSTGRES:
        area = Column(Geometry(geometry_type='POLYGON', srid=4326), nullable=True)
    else:
        area_json = Column(JSON, nullable=True)

    # Relationships
    zone = relationship("RiskZone", back_populates="predictions")


class Shelter(Base):
    """Relief camps, shelters, and assembly points."""
    __tablename__ = "shelters"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    address = Column(String(512), nullable=True)
    capacity = Column(Integer, default=100)
    current_occupancy = Column(Integer, default=0)
    type = Column(String(100), default="temporary")  # school, community_center, stadium, temporary
    amenities_json = Column(JSON, nullable=True)  # List of amenities e.g. ["medical", "food", "power"]
    created_at = Column(DateTime, default=datetime.utcnow)

    if IS_POSTGRES:
        location = Column(Geometry(geometry_type='POINT', srid=4326), nullable=True)
    else:
        latitude = Column(Float, nullable=True)
        longitude = Column(Float, nullable=True)


class Road(Base):
    """Road network segments for routing analysis."""
    __tablename__ = "roads"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    road_type = Column(String(100), nullable=True)  # primary, secondary, residential
    is_blocked = Column(Boolean, default=False)
    flood_risk = Column(Float, default=0.0)  # 0 to 100 risk score
    updated_at = Column(DateTime, default=datetime.utcnow)

    if IS_POSTGRES:
        geometry = Column(Geometry(geometry_type='LINESTRING', srid=4326), nullable=True)
    else:
        geometry_json = Column(JSON, nullable=True)


class Village(Base):
    """Villages / Sub-districts for hyperlocal demographic calculations."""
    __tablename__ = "villages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    district = Column(String(255), nullable=False)
    population = Column(Integer, default=0)
    elevation = Column(Float, default=0.0)  # elevation above sea level in meters

    if IS_POSTGRES:
        geometry = Column(Geometry(geometry_type='POLYGON', srid=4326), nullable=True)
    else:
        geometry_json = Column(JSON, nullable=True)


class ResourceCenter(Base):
    """Storage points for emergency supplies (boats, lifejackets, medical kits, food)."""
    __tablename__ = "resource_centers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    type = Column(String(100), nullable=True)  # fire_station, hospital, ngo, rescue_hq
    resources_json = Column(JSON, nullable=True)  # e.g. {"boats": 5, "food_kits": 500, "medics": 12}
    contact = Column(String(100), nullable=True)

    if IS_POSTGRES:
        location = Column(Geometry(geometry_type='POINT', srid=4326), nullable=True)
    else:
        latitude = Column(Float, nullable=True)
        longitude = Column(Float, nullable=True)


class Alert(Base):
    """Emergency alerts triggered by authority or automated ML rules."""
    __tablename__ = "alerts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    type = Column(String(100), nullable=False)  # Flood Warning, Cyclone Alert, Evacuation Order
    severity = Column(String(50), default="moderate")  # info, moderate, severe, extreme
    message = Column(Text, nullable=False)
    target_zone_id = Column(String(36), ForeignKey("risk_zones.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)

    if IS_POSTGRES:
        area = Column(Geometry(geometry_type='POLYGON', srid=4326), nullable=True)
    else:
        area_json = Column(JSON, nullable=True)

    # Relationships
    zone = relationship("RiskZone", back_populates="alerts")


class SatelliteImage(Base):
    """Satellite image records with analytical overlay metadata."""
    __tablename__ = "satellite_images"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source = Column(String(100), nullable=False)  # Sentinel-2, Landsat-9, etc.
    capture_date = Column(DateTime, nullable=False)
    analysis_result_json = Column(JSON, nullable=True)  # details of flooding detection
    image_url = Column(String(512), nullable=False)

    if IS_POSTGRES:
        bounds = Column(Geometry(geometry_type='POLYGON', srid=4326), nullable=True)
    else:
        bounds_json = Column(JSON, nullable=True)


class DamageReport(Base):
    """Computer-vision calculated structural or infrastructural damage."""
    __tablename__ = "damage_reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    before_image = Column(String(512), nullable=True)
    after_image = Column(String(512), nullable=True)
    damage_pct = Column(Float, default=0.0)  # 0 to 100
    repair_cost = Column(Float, default=0.0)  # in local currency estimate
    priority = Column(Integer, default=1)  # 1 to 5 priority score
    created_at = Column(DateTime, default=datetime.utcnow)

    if IS_POSTGRES:
        location = Column(Geometry(geometry_type='POINT', srid=4326), nullable=True)
    else:
        latitude = Column(Float, nullable=True)
        longitude = Column(Float, nullable=True)
