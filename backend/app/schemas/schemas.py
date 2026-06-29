"""
GeoGuard AI - Pydantic Schemas
Handles request validation and response serialization.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


# --- Auth & User Schemas ---

class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: str = "citizen"
    phone: Optional[str] = None
    language_pref: str = "en"
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    name: str


class TokenData(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None


# --- Weather Schemas ---

class WeatherResponse(BaseModel):
    timestamp: datetime
    temperature: float
    humidity: float
    rainfall: float
    wind_speed: float
    pressure: float
    condition: Optional[str]
    source: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    class Config:
        from_attributes = True


# --- Alert Schemas ---

class AlertBase(BaseModel):
    type: str
    severity: str  # info, moderate, severe, extreme
    message: str
    target_zone_id: Optional[str] = None
    expires_at: datetime
    area_json: Optional[Dict[str, Any]] = None


class AlertCreate(AlertBase):
    pass


class AlertResponse(AlertBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- Citizen Report Schemas ---

class CitizenReportBase(BaseModel):
    type: str
    description: str
    severity: int = Field(1, ge=1, le=5)
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class CitizenReportCreate(CitizenReportBase):
    pass


class CitizenReportResponse(CitizenReportBase):
    id: str
    user_id: str
    image_url: Optional[str] = None
    verified: bool
    created_at: datetime
    user_name: Optional[str] = None  # Populated from relationship or join

    class Config:
        from_attributes = True


# --- Risk Zone Schemas ---

class RiskZoneResponse(BaseModel):
    id: str
    name: str
    risk_level: str
    population: int
    vulnerability_score: float
    boundary_json: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


# --- Prediction Schemas ---

class XAIFactor(BaseModel):
    name: str
    value: float
    unit: str
    contribution: float
    trend: str
    threshold: float
    description: str


class FloodPredictionResponse(BaseModel):
    id: str
    zone_id: str
    zone_name: Optional[str] = None
    risk_score: float
    probability: float
    confidence: float
    factors_json: Optional[List[Dict[str, Any]]] = None
    predicted_depth: float
    predicted_duration: float
    predicted_for: datetime
    generated_at: datetime
    latitude: Optional[float] = None  # Zone center latitude
    longitude: Optional[float] = None  # Zone center longitude

    class Config:
        from_attributes = True


# --- Shelter Schemas ---

class ShelterBase(BaseModel):
    name: str
    address: Optional[str] = None
    capacity: int
    current_occupancy: int
    type: str
    amenities_json: Optional[List[str]] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class ShelterResponse(ShelterBase):
    id: str

    class Config:
        from_attributes = True


class ShelterOccupancyUpdate(BaseModel):
    current_occupancy: int = Field(..., ge=0)


# --- Evacuation Route Schemas ---

class RouteCoordinate(BaseModel):
    lat: float
    lng: float


class EvacuationRouteResponse(BaseModel):
    id: str
    name: str
    origin: RouteCoordinate
    destination: RouteCoordinate
    path: List[RouteCoordinate]
    distance_km: float
    duration_minutes: float
    risk_level: str  # safe, moderate, risky
    alternative_routes_count: int


# --- Impact Schemas ---

class ImpactSummaryResponse(BaseModel):
    active_alerts: int
    population_affected: int
    shelters_active: int
    citizen_reports: int


class ZoneImpactDetail(BaseModel):
    zone_id: str
    zone_name: str
    population_at_risk: int
    buildings_affected: int
    schools_affected: int
    hospitals_affected: int
    infrastructure_damage_score: float


class SatelliteImageResponse(BaseModel):
    id: str
    source: str
    capture_date: datetime
    analysis_result_json: Optional[Dict[str, Any]] = None
    image_url: str
    bounds_json: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

