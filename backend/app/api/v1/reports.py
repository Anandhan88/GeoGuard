"""
GeoGuard AI - Citizen Reports API
"""
from fastapi import APIRouter, Query, Form, Depends, HTTPException
from typing import Optional
from datetime import datetime
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.core.database import get_db
from app.models.models import CitizenReport, User
from app.core.security import get_current_user

router = APIRouter()


@router.get("/")
async def list_reports(
    report_type: Optional[str] = Query(None),
    verified: Optional[bool] = Query(None),
    min_severity: Optional[int] = Query(None),
    limit: int = Query(50, le=100),
    db: AsyncSession = Depends(get_db)
):
    """List citizen reports with filtering."""
    query = select(CitizenReport).options(joinedload(CitizenReport.user))
    if report_type:
        query = query.filter(CitizenReport.type == report_type)
    if verified is not None:
        query = query.filter(CitizenReport.verified == verified)
    if min_severity:
        query = query.filter(CitizenReport.severity >= min_severity)
        
    query = query.order_by(CitizenReport.created_at.desc())
    result = await db.execute(query)
    reports = result.scalars().unique().all()
    
    response = []
    for r in reports:
        lat = r.latitude if hasattr(r, 'latitude') and r.latitude is not None else 13.0
        lng = r.longitude if hasattr(r, 'longitude') and r.longitude is not None else 80.0
        user_name = r.user.name if r.user else "Anonymous"
        response.append({
            "id": r.id,
            "userId": r.user_id,
            "userName": user_name,
            "type": r.type,
            "description": r.description,
            "severity": r.severity,
            "imageUrl": r.image_url or "/demo/flood-1.jpg",
            "verified": r.verified,
            "location": {"lat": lat, "lng": lng},
            "address": f"Chennai ({lat:.3f}, {lng:.3f})",
            "createdAt": r.created_at.isoformat() + "Z" if r.created_at else None,
            "upvotes": 0
        })
        
    return {"reports": response[:limit], "total": len(response)}


@router.post("/")
async def create_report(
    report_type: str = Form(...),
    description: str = Form(...),
    severity: int = Form(...),
    lat: float = Form(...),
    lng: float = Form(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Submit a citizen report."""
    new_report = CitizenReport(
        user_id=current_user["id"],
        type=report_type,
        description=description,
        severity=severity,
        verified=False,
        created_at=datetime.utcnow()
    )
    if hasattr(new_report, 'latitude'):
        new_report.latitude = lat
        new_report.longitude = lng
        
    db.add(new_report)
    await db.commit()
    await db.refresh(new_report)
    
    # Reload with user relationship
    query = select(CitizenReport).options(joinedload(CitizenReport.user)).filter(CitizenReport.id == new_report.id)
    res = await db.execute(query)
    r = res.scalars().first()
    
    r_lat = r.latitude if hasattr(r, 'latitude') and r.latitude is not None else lat
    r_lng = r.longitude if hasattr(r, 'longitude') and r.longitude is not None else lng
    user_name = r.user.name if r.user else current_user.get("name", "User")
    
    return {
        "status": "submitted",
        "report": {
            "id": r.id,
            "userId": r.user_id,
            "userName": user_name,
            "type": r.type,
            "description": r.description,
            "severity": r.severity,
            "verified": r.verified,
            "location": {"lat": r_lat, "lng": r_lng},
            "address": f"Chennai ({r_lat:.3f}, {r_lng:.3f})",
            "createdAt": r.created_at.isoformat() + "Z",
            "upvotes": 0
        }
    }


@router.put("/{report_id}/verify")
async def verify_report(
    report_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Verify a citizen report (authority only)."""
    query = select(CitizenReport).options(joinedload(CitizenReport.user)).filter(CitizenReport.id == report_id)
    result = await db.execute(query)
    report = result.scalars().first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    report.verified = True
    await db.commit()
    await db.refresh(report)
    
    lat = report.latitude if hasattr(report, 'latitude') and report.latitude is not None else 13.0
    lng = report.longitude if hasattr(report, 'longitude') and report.longitude is not None else 80.0
    user_name = report.user.name if report.user else "Anonymous"
    
    return {
        "status": "verified",
        "report": {
            "id": report.id,
            "userId": report.user_id,
            "userName": user_name,
            "type": report.type,
            "description": report.description,
            "severity": report.severity,
            "verified": report.verified,
            "location": {"lat": lat, "lng": lng},
            "address": f"Chennai ({lat:.3f}, {lng:.3f})",
            "createdAt": report.created_at.isoformat() + "Z",
            "upvotes": 0
        }
    }


@router.get("/heatmap")
async def report_heatmap(db: AsyncSession = Depends(get_db)):
    """Get report density heatmap."""
    query = select(CitizenReport)
    result = await db.execute(query)
    reports = result.scalars().all()
    
    points = []
    for r in reports:
        lat = r.latitude if hasattr(r, 'latitude') and r.latitude is not None else 13.0
        lng = r.longitude if hasattr(r, 'longitude') and r.longitude is not None else 80.0
        points.append({
            "lat": lat,
            "lng": lng,
            "intensity": r.severity / 5
        })
    return {"points": points}
