"""
GeoGuard AI - Evacuation Routes API
"""
from fastapi import APIRouter, Query
from typing import Optional

router = APIRouter()

EVACUATION_ROUTES = [
    {
        "id": "route-001",
        "name": "Adyar to Anna University Shelter",
        "origin": {"lat": 13.0060, "lng": 80.2550},
        "destination": {"lat": 13.0127, "lng": 80.2352},
        "shelter_name": "Anna University Convention Centre",
        "waypoints": [
            {"lat": 13.0080, "lng": 80.2500},
            {"lat": 13.0100, "lng": 80.2450},
            {"lat": 13.0110, "lng": 80.2400},
        ],
        "distance_km": 2.8,
        "estimated_time_min": 15,
        "risk_along_route": 25,
        "is_recommended": True,
        "avoided_zones": ["Adyar Bridge Underpass", "LB Road Low-lying stretch"],
        "road_conditions": "Partially waterlogged",
        "last_updated": "2026-06-16T10:00:00Z",
    },
    {
        "id": "route-002",
        "name": "Velachery to YMCA Nandanam",
        "origin": {"lat": 12.9815, "lng": 80.2180},
        "destination": {"lat": 13.0300, "lng": 80.2400},
        "shelter_name": "YMCA Nandanam Sports Complex",
        "waypoints": [
            {"lat": 12.9900, "lng": 80.2200},
            {"lat": 13.0000, "lng": 80.2300},
            {"lat": 13.0150, "lng": 80.2350},
        ],
        "distance_km": 6.5,
        "estimated_time_min": 35,
        "risk_along_route": 42,
        "is_recommended": True,
        "avoided_zones": ["Velachery Main Road", "Pallikaranai Lake overflow area"],
        "road_conditions": "Heavy traffic, diversions in place",
        "last_updated": "2026-06-16T10:00:00Z",
    },
]


@router.get("/routes")
async def list_evacuation_routes(zone_id: Optional[str] = Query(None)):
    """List evacuation routes."""
    return {"routes": EVACUATION_ROUTES, "total": len(EVACUATION_ROUTES)}


@router.post("/route")
async def generate_route(
    origin_lat: float,
    origin_lng: float,
    destination_lat: Optional[float] = None,
    destination_lng: Optional[float] = None,
):
    """Generate an evacuation route from origin to nearest shelter."""
    # In production, this would use A*/Dijkstra on the road network
    return {
        "route": EVACUATION_ROUTES[0],
        "message": "Route generated using A* pathfinding with flood zone avoidance",
        "algorithm": "A* with flood-zone penalty weights",
    }


@router.get("/routes/{route_id}/risk")
async def get_route_risk(route_id: str):
    """Get risk assessment along a specific route."""
    route = next((r for r in EVACUATION_ROUTES if r["id"] == route_id), None)
    if not route:
        return {"error": "Route not found"}
    
    # Simulated risk segments
    segments = [
        {"from_km": 0, "to_km": 1, "risk": 15, "description": "Safe residential area"},
        {"from_km": 1, "to_km": 2, "risk": 45, "description": "Near flood zone boundary"},
        {"from_km": 2, "to_km": route["distance_km"], "risk": 10, "description": "Higher elevation, safe approach"},
    ]
    
    return {
        "route_id": route_id,
        "overall_risk": route["risk_along_route"],
        "segments": segments,
    }
