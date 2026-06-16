"""
GeoGuard AI - Shelters API
"""
from fastapi import APIRouter, Query
from typing import Optional
import math

router = APIRouter()

SHELTERS = [
    {"id": "shelter-001", "name": "Anna University Convention Centre", "type": "government", "capacity": 500, "current_occupancy": 187, "amenities": ["Water", "Food", "Medical Aid", "Blankets", "Charging Points"], "contact": "+91-44-2235-8888", "location": {"lat": 13.0127, "lng": 80.2352}, "address": "Anna University Campus, Guindy", "is_open": True},
    {"id": "shelter-002", "name": "Govt Higher Secondary School - Adyar", "type": "school", "capacity": 300, "current_occupancy": 245, "amenities": ["Water", "Food", "Blankets"], "contact": "+91-44-2441-5500", "location": {"lat": 13.0060, "lng": 80.2570}, "address": "Gandhi Nagar, Adyar", "is_open": True},
    {"id": "shelter-003", "name": "Velachery Community Hall", "type": "community_hall", "capacity": 200, "current_occupancy": 198, "amenities": ["Water", "Food", "Medical Aid"], "contact": "+91-44-2243-7700", "location": {"lat": 12.9840, "lng": 80.2190}, "address": "Velachery Main Road", "is_open": True},
    {"id": "shelter-004", "name": "Kapaleeshwarar Temple Hall", "type": "temple", "capacity": 150, "current_occupancy": 42, "amenities": ["Water", "Food", "Blankets", "First Aid"], "contact": "+91-44-2464-1670", "location": {"lat": 13.0339, "lng": 80.2697}, "address": "Mylapore", "is_open": True},
    {"id": "shelter-005", "name": "YMCA Nandanam Sports Complex", "type": "stadium", "capacity": 800, "current_occupancy": 310, "amenities": ["Water", "Food", "Medical Aid", "Blankets", "Charging Points", "Toilets"], "contact": "+91-44-2432-0700", "location": {"lat": 13.0300, "lng": 80.2400}, "address": "Nandanam", "is_open": True},
    {"id": "shelter-006", "name": "Tambaram Municipality Hall", "type": "government", "capacity": 250, "current_occupancy": 75, "amenities": ["Water", "Food", "Medical Aid", "Blankets"], "contact": "+91-44-2226-3300", "location": {"lat": 12.9260, "lng": 80.1020}, "address": "Tambaram East", "is_open": True},
]


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
):
    """Find nearest shelters with distance calculation."""
    shelters_with_distance = []
    for s in SHELTERS:
        if not s["is_open"]:
            continue
        dist = haversine(lat, lng, s["location"]["lat"], s["location"]["lng"])
        if dist <= max_distance_km:
            shelters_with_distance.append({**s, "distance_km": round(dist, 2)})
    
    shelters_with_distance.sort(key=lambda x: x["distance_km"])
    return {"shelters": shelters_with_distance[:limit]}


@router.get("/")
async def list_shelters(is_open: bool = Query(True)):
    """List all shelters."""
    results = [s for s in SHELTERS if s["is_open"] == is_open] if is_open else SHELTERS
    return {"shelters": results, "total": len(results)}


@router.get("/{shelter_id}")
async def get_shelter(shelter_id: str):
    """Get shelter details."""
    shelter = next((s for s in SHELTERS if s["id"] == shelter_id), None)
    if not shelter:
        return {"error": "Shelter not found"}
    return shelter


@router.put("/{shelter_id}/occupancy")
async def update_occupancy(shelter_id: str, occupancy: int):
    """Update shelter occupancy count."""
    shelter = next((s for s in SHELTERS if s["id"] == shelter_id), None)
    if not shelter:
        return {"error": "Shelter not found"}
    shelter["current_occupancy"] = min(occupancy, shelter["capacity"])
    return {"status": "updated", "shelter": shelter}
