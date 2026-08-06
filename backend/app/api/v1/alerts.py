"""
GeoGuard AI - Alerts API (MongoDB Atlas / Beanie ODM)
"""
from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from app.models.models import Alert, RiskZone

router = APIRouter()

class AlertCreateRequest(BaseModel):
    alert_type: str
    severity: str
    message: str
    target_zone: Optional[str] = None
    expires_in_hours: int = 48


@router.get("/")
async def list_alerts(
    severity: Optional[str] = Query(None),
    is_active: bool = Query(True),
    limit: int = Query(50, le=100)
):
    """List active alerts from MongoDB Atlas."""
    query = Alert.find_all()
    if severity:
        query = query.find(Alert.severity == severity)
    if is_active:
        query = query.find(Alert.expires_at > datetime.utcnow())
        
    alerts = await query.limit(limit).to_list()
    
    # Pre-fetch zones map for resolution
    zones = await RiskZone.find_all().to_list()
    zone_map = {z.id: z.name for z in zones}
    
    response = []
    for a in alerts:
        target_name = zone_map.get(a.target_zone_id, "Chennai Metropolitan") if a.target_zone_id else "Chennai Metropolitan"
        response.append({
            "id": a.id,
            "type": a.type,
            "severity": a.severity,
            "title": a.type,
            "message": a.message,
            "targetZone": target_name,
            "issuedAt": a.created_at.isoformat() + "Z" if a.created_at else None,
            "expiresAt": a.expires_at.isoformat() + "Z" if a.expires_at else None,
            "isActive": a.expires_at > datetime.utcnow()
        })
        
    return {"alerts": response, "total": len(response)}


@router.get("/for-location")
async def get_alerts_for_location(
    lat: float = Query(...),
    lng: float = Query(...),
    name: str = Query("")
):
    """Generate dynamic alert messages for any search coordinate based on weather conditions."""
    from app.services.weather_service import fetch_open_meteo_weather
    
    try:
        weather_data = await fetch_open_meteo_weather(lat, lng)
        current = weather_data.get("current", {})
        rainfall = current.get("precipitation", 0.0)
        wind_speed = current.get("wind_speed_10m", 0.0)
    except Exception as e:
        print(f"Dynamic Alerts: Weather fetch failed: {e}")
        rainfall = 10.0
        wind_speed = 15.0

    alerts = []
    zone_name = name.split(",")[0] if name else "Searched Area"

    if rainfall > 50.0:
        alerts.append({
            "id": "alert-dyn-flood-ext",
            "type": "Flood Warning",
            "severity": "extreme",
            "title": "Extreme Flood Warning",
            "message": f"RED ALERT: Severe Flooding expected in {zone_name}. Heavy rainfall accumulation of {rainfall}mm/hr detected. High risk of waterlogging and rising local water bodies. Immediate evacuation of low-lying areas recommended.",
            "targetZone": zone_name,
            "issuedAt": datetime.utcnow().isoformat() + "Z",
            "expiresAt": (datetime.utcnow() + timedelta(days=2)).isoformat() + "Z",
            "isActive": True
        })
    elif rainfall > 15.0:
        alerts.append({
            "id": "alert-dyn-flood-sev",
            "type": "Flood Warning",
            "severity": "severe",
            "title": "Severe Flood Warning",
            "message": f"ORANGE ALERT: Potential Flooding in {zone_name}. Moderate to heavy rainfall of {rainfall}mm/hr recorded. Waterlogging is expected on streets and in low-lying subways. Relocate vehicles and secure valuables.",
            "targetZone": (datetime.utcnow() - timedelta(hours=1)).isoformat() + "Z",
            "expiresAt": (datetime.utcnow() + timedelta(days=1)).isoformat() + "Z",
            "isActive": True
        })
    elif rainfall > 1.0:
        alerts.append({
            "id": "alert-dyn-rain",
            "type": "Heavy Rainfall",
            "severity": "moderate",
            "title": "Rainfall Alert",
            "message": f"YELLOW WATCH: Rain showers of {rainfall}mm/hr in {zone_name}. Drive carefully as roads may be slippery and visibility reduced. Keep track of weather updates.",
            "targetZone": zone_name,
            "issuedAt": (datetime.utcnow() - timedelta(hours=2)).isoformat() + "Z",
            "expiresAt": (datetime.utcnow() + timedelta(hours=12)).isoformat() + "Z",
            "isActive": True
        })

    if wind_speed > 35.0:
        alerts.append({
            "id": "alert-dyn-storm",
            "type": "Storm Warning",
            "severity": "severe",
            "title": "High Wind Warning",
            "message": f"Gale winds of {wind_speed}km/h reported in {zone_name}. Risk of structural damage, uprooted trees, and power line damage. Avoid traveling and stay indoors.",
            "targetZone": zone_name,
            "issuedAt": datetime.utcnow().isoformat() + "Z",
            "expiresAt": (datetime.utcnow() + timedelta(hours=24)).isoformat() + "Z",
            "isActive": True
        })

    if not alerts:
        alerts.append({
            "id": "alert-dyn-watch",
            "type": "Weather Watch",
            "severity": "minor",
            "title": "Normal Weather Watch",
            "message": f"Situational Awareness: Stable conditions reported in {zone_name}. Winds at {wind_speed}km/h and precipitation at {rainfall}mm. No active early warning threats.",
            "targetZone": zone_name,
            "issuedAt": (datetime.utcnow() - timedelta(hours=4)).isoformat() + "Z",
            "expiresAt": (datetime.utcnow() + timedelta(hours=24)).isoformat() + "Z",
            "isActive": True
        })

    return {"alerts": alerts, "total": len(alerts)}


@router.get("/{alert_id}")
async def get_alert(alert_id: str):
    """Get alert details."""
    a = await Alert.find_one(Alert.id == alert_id)
    if not a:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    target_name = "Chennai Metropolitan"
    if a.target_zone_id:
        z = await RiskZone.find_one(RiskZone.id == a.target_zone_id)
        if z:
            target_name = z.name

    return {
        "id": a.id,
        "type": a.type,
        "severity": a.severity,
        "title": a.type,
        "message": a.message,
        "targetZone": target_name,
        "issuedAt": a.created_at.isoformat() + "Z" if a.created_at else None,
        "expiresAt": a.expires_at.isoformat() + "Z" if a.expires_at else None,
        "isActive": a.expires_at > datetime.utcnow()
    }


@router.post("/")
async def create_alert(request: AlertCreateRequest):
    """Create a new alert in MongoDB Atlas."""
    zone_id = None
    if request.target_zone:
        z = await RiskZone.find_one(RiskZone.id == request.target_zone)
        if not z:
            z = await RiskZone.find_one(RiskZone.name == request.target_zone)
        if z:
            zone_id = z.id
                
    new_alert = Alert(
        type=request.alert_type,
        severity=request.severity,
        message=request.message,
        target_zone_id=zone_id,
        created_at=datetime.utcnow(),
        expires_at=datetime.utcnow() + timedelta(hours=request.expires_in_hours)
    )
    await new_alert.insert()

    target_name = "Chennai Metropolitan"
    if zone_id:
        z = await RiskZone.find_one(RiskZone.id == zone_id)
        if z:
            target_name = z.name
    
    try:
        from app.main import manager
        alert_data = {
            "id": new_alert.id,
            "type": new_alert.type,
            "severity": new_alert.severity,
            "title": new_alert.type,
            "message": new_alert.message,
            "targetZone": target_name,
            "issuedAt": new_alert.created_at.isoformat() + "Z" if new_alert.created_at else None,
            "expiresAt": new_alert.expires_at.isoformat() + "Z" if new_alert.expires_at else None,
            "isActive": True
        }
        await manager.broadcast({
            "type": "new_alert",
            "alert": alert_data
        })
    except Exception as e:
        print(f"Failed to broadcast websocket alert: {e}")
        
    return {
        "status": "created",
        "alert": {
            "id": new_alert.id,
            "type": new_alert.type,
            "severity": new_alert.severity,
            "title": new_alert.type,
            "message": new_alert.message,
            "targetZone": target_name,
            "issuedAt": new_alert.created_at.isoformat() + "Z" if new_alert.created_at else None,
            "expiresAt": new_alert.expires_at.isoformat() + "Z" if new_alert.expires_at else None,
            "isActive": True
        }
    }
