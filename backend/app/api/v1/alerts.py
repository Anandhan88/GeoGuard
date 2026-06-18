"""
GeoGuard AI - Alerts API
"""
from fastapi import APIRouter, Query, Depends, HTTPException
from typing import Optional
from datetime import datetime, timedelta
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from pydantic import BaseModel

from app.core.database import get_db
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
    limit: int = Query(50, le=100),
    db: AsyncSession = Depends(get_db)
):
    """List active alerts."""
    query = select(Alert).options(joinedload(Alert.zone))
    if severity:
        query = query.filter(Alert.severity == severity)
    if is_active:
        query = query.filter(Alert.expires_at > datetime.utcnow())
        
    result = await db.execute(query)
    alerts = result.scalars().unique().all()
    
    response = []
    for a in alerts:
        response.append({
            "id": a.id,
            "type": a.type,
            "severity": a.severity,
            "title": a.type,
            "message": a.message,
            "targetZone": a.zone.name if a.zone else "Chennai Metropolitan",
            "issuedAt": a.created_at.isoformat() + "Z" if a.created_at else None,
            "expiresAt": a.expires_at.isoformat() + "Z" if a.expires_at else None,
            "isActive": a.expires_at > datetime.utcnow()
        })
        
    return {"alerts": response[:limit], "total": len(response)}


@router.get("/{alert_id}")
async def get_alert(alert_id: str, db: AsyncSession = Depends(get_db)):
    """Get alert details."""
    query = select(Alert).options(joinedload(Alert.zone)).filter(Alert.id == alert_id)
    result = await db.execute(query)
    a = result.scalars().first()
    if not a:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    return {
        "id": a.id,
        "type": a.type,
        "severity": a.severity,
        "title": a.type,
        "message": a.message,
        "targetZone": a.zone.name if a.zone else "Chennai Metropolitan",
        "issuedAt": a.created_at.isoformat() + "Z" if a.created_at else None,
        "expiresAt": a.expires_at.isoformat() + "Z" if a.expires_at else None,
        "isActive": a.expires_at > datetime.utcnow()
    }


@router.post("/")
async def create_alert(
    request: AlertCreateRequest,
    db: AsyncSession = Depends(get_db)
):
    """Create a new alert (authority only)."""
    zone_id = None
    if request.target_zone:
        # Try to find a zone by ID or name
        zone_result = await db.execute(select(RiskZone).filter(RiskZone.id == request.target_zone))
        z = zone_result.scalars().first()
        if z:
            zone_id = z.id
        else:
            # Match by name
            zone_name_result = await db.execute(select(RiskZone).filter(RiskZone.name == request.target_zone))
            z = zone_name_result.scalars().first()
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
    db.add(new_alert)
    await db.commit()
    await db.refresh(new_alert)
    
    # Reload with zone relationship if any
    query = select(Alert).options(joinedload(Alert.zone)).filter(Alert.id == new_alert.id)
    res = await db.execute(query)
    a = res.scalars().first()
    
    return {
        "status": "created",
        "alert": {
            "id": a.id,
            "type": a.type,
            "severity": a.severity,
            "title": a.type,
            "message": a.message,
            "targetZone": a.zone.name if a.zone else "Chennai Metropolitan",
            "issuedAt": a.created_at.isoformat() + "Z",
            "expiresAt": a.expires_at.isoformat() + "Z",
            "isActive": True
        }
    }
