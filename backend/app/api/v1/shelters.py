"""
GeoGuard AI - Shelters API (MongoDB Atlas / Beanie ODM)
"""
from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List
from pydantic import BaseModel
import math

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
    limit: int = Query(5)
):
    """Find nearest shelters with distance and travel time calculation from MongoDB Atlas."""
    shelters = await Shelter.find_all().to_list()
    
    shelters_with_distance = []
    for s in shelters:
        s_lat = s.latitude if s.latitude is not None else 13.0
        s_lng = s.longitude if s.longitude is not None else 80.0
        dist = haversine(lat, lng, s_lat, s_lng)
        if dist <= max_distance_km:
            travel_time = max(1, round(dist * 12.0))
            shelters_with_distance.append({
                "id": s.id,
                "name": s.name,
                "type": s.type,
                "capacity": s.capacity,
                "currentOccupancy": s.current_occupancy,
                "amenities": s.amenities_json or [],
                "contact": "+91-44-2235-8888",
                "location": {"lat": s_lat, "lng": s_lng},
                "address": s.address or "Tamil Nadu",
                "isOpen": True,
                "distance_km": round(dist, 2),
                "travelTime": travel_time
            })
            
    shelters_with_distance.sort(key=lambda x: x["distance_km"])
    return {"shelters": shelters_with_distance[:limit]}


@router.get("/")
async def list_shelters():
    """List all shelters."""
    shelters = await Shelter.find_all().to_list()
    
    response = []
    for s in shelters:
        s_lat = s.latitude if s.latitude is not None else 13.0
        s_lng = s.longitude if s.longitude is not None else 80.0
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
async def get_shelter(shelter_id: str):
    """Get shelter details."""
    s = await Shelter.find_one(Shelter.id == shelter_id)
    if not s:
        raise HTTPException(status_code=404, detail="Shelter not found")
        
    s_lat = s.latitude if s.latitude is not None else 13.0
    s_lng = s.longitude if s.longitude is not None else 80.0
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
    occupancy: int
):
    """Update shelter occupancy count."""
    s = await Shelter.find_one(Shelter.id == shelter_id)
    if not s:
        raise HTTPException(status_code=404, detail="Shelter not found")
        
    s.current_occupancy = min(max(0, occupancy), s.capacity)
    await s.save()
    
    s_lat = s.latitude if s.latitude is not None else 13.0
    s_lng = s.longitude if s.longitude is not None else 80.0
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


class ShelterCreateRequest(BaseModel):
    name: str
    type: str
    capacity: int
    latitude: float
    longitude: float
    address: str
    amenities: List[str] = []


@router.post("/")
async def create_shelter(request: ShelterCreateRequest):
    """Create a new emergency shelter."""
    new_shelter = Shelter(
        name=request.name,
        type=request.type,
        capacity=request.capacity,
        current_occupancy=0,
        latitude=request.latitude,
        longitude=request.longitude,
        address=request.address,
        amenities_json=request.amenities
    )
    await new_shelter.insert()
    return new_shelter
