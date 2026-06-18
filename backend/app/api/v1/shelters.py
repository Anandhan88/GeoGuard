"""
GeoGuard AI - Shelters API
"""
from fastapi import APIRouter, Query, Depends, HTTPException
from typing import Optional
import math
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.models import Shelter

router = APIRouter()


def haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance between two points in km."""
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng/2)**2
    return R * 2 * math.asin(math.sqrt(a))


@router.get("/nearby")
async def find_nearby_shelters(
    lat: float = Query(..., description="User latitude"),
    lng: float = Query(..., description="User longitude"),
    max_distance_km: float = Query(10, description="Maximum distance in km"),
    limit: int = Query(5),
    db: AsyncSession = Depends(get_db)
):
    """Find nearest shelters with distance calculation."""
    query = select(Shelter)
    result = await db.execute(query)
    shelters = result.scalars().all()
    
    shelters_with_distance = []
    for s in shelters:
        s_lat = s.latitude if hasattr(s, 'latitude') else 13.0
        s_lng = s.longitude if hasattr(s, 'longitude') else 80.0
        dist = haversine(lat, lng, s_lat, s_lng)
        if dist <= max_distance_km:
            shelters_with_distance.append({
                "id": s.id,
                "name": s.name,
                "type": s.type,
                "capacity": s.capacity,
                "currentOccupancy": s.current_occupancy,
                "amenities": s.amenities_json or [],
                "contact": "+91-44-2235-8888",
                "location": {"lat": s_lat, "lng": s_lng},
                "address": s.address or "Chennai",
                "isOpen": True,
                "distance_km": round(dist, 2)
            })
            
    shelters_with_distance.sort(key=lambda x: x["distance_km"])
    return {"shelters": shelters_with_distance[:limit]}


@router.get("/")
async def list_shelters(
    db: AsyncSession = Depends(get_db)
):
    """List all shelters."""
    query = select(Shelter)
    result = await db.execute(query)
    shelters = result.scalars().all()
    
    response = []
    for s in shelters:
        s_lat = s.latitude if hasattr(s, 'latitude') else 13.0
        s_lng = s.longitude if hasattr(s, 'longitude') else 80.0
        response.append({
            "id": s.id,
            "name": s.name,
            "type": s.type,
            "capacity": s.capacity,
            "currentOccupancy": s.current_occupancy,
            "amenities": s.amenities_json or [],
            "contact": "+91-44-2235-8888",
            "location": {"lat": s_lat, "lng": s_lng},
            "address": s.address or "Chennai",
            "isOpen": True
        })
        
    return {"shelters": response, "total": len(response)}


@router.get("/{shelter_id}")
async def get_shelter(shelter_id: str, db: AsyncSession = Depends(get_db)):
    """Get shelter details."""
    query = select(Shelter).filter(Shelter.id == shelter_id)
    result = await db.execute(query)
    s = result.scalars().first()
    if not s:
        raise HTTPException(status_code=404, detail="Shelter not found")
        
    s_lat = s.latitude if hasattr(s, 'latitude') else 13.0
    s_lng = s.longitude if hasattr(s, 'longitude') else 80.0
    return {
        "id": s.id,
        "name": s.name,
        "type": s.type,
        "capacity": s.capacity,
        "currentOccupancy": s.current_occupancy,
        "amenities": s.amenities_json or [],
        "contact": "+91-44-2235-8888",
        "location": {"lat": s_lat, "lng": s_lng},
        "address": s.address or "Chennai",
        "isOpen": True
    }


@router.put("/{shelter_id}/occupancy")
async def update_occupancy(
    shelter_id: str,
    occupancy: int,
    db: AsyncSession = Depends(get_db)
):
    """Update shelter occupancy count."""
    query = select(Shelter).filter(Shelter.id == shelter_id)
    result = await db.execute(query)
    s = result.scalars().first()
    if not s:
        raise HTTPException(status_code=404, detail="Shelter not found")
        
    s.current_occupancy = min(max(0, occupancy), s.capacity)
    await db.commit()
    await db.refresh(s)
    
    s_lat = s.latitude if hasattr(s, 'latitude') else 13.0
    s_lng = s.longitude if hasattr(s, 'longitude') else 80.0
    return {
        "status": "updated",
        "shelter": {
            "id": s.id,
            "name": s.name,
            "type": s.type,
            "capacity": s.capacity,
            "currentOccupancy": s.current_occupancy,
            "amenities": s.amenities_json or [],
            "contact": "+91-44-2235-8888",
            "location": {"lat": s_lat, "lng": s_lng},
            "address": s.address or "Chennai",
            "isOpen": True
        }
    }
