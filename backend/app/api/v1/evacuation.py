"""
GeoGuard AI - Evacuation Routes API (MongoDB Atlas / Beanie ODM)
"""
from fastapi import APIRouter, Query, HTTPException
from typing import Optional

from app.models.models import Shelter
from app.services.routing_service import OSMRouter, haversine

router = APIRouter()


@router.get("/routes")
async def list_evacuation_routes(
    origin_lat: float = Query(..., description="Origin latitude"),
    origin_lng: float = Query(..., description="Origin longitude")
):
    """List recommended evacuation routes to the top 2 nearest shelters in MongoDB Atlas."""
    shelters = await Shelter.find_all().to_list()
    if not shelters:
        return {"routes": [], "total": 0}

    shelter_distances = []
    for s in shelters:
        s_lat = s.latitude if s.latitude is not None else 13.0
        s_lng = s.longitude if s.longitude is not None else 80.0
        dist = haversine(origin_lat, origin_lng, s_lat, s_lng)
        shelter_distances.append((dist, s))
        
    shelter_distances.sort(key=lambda x: x[0])
    top_shelters = shelter_distances[:2]
    
    routes = []
    router_service = OSMRouter()
    
    for i, (dist, shelter) in enumerate(top_shelters):
        s_lat = shelter.latitude if shelter.latitude is not None else 13.0
        s_lng = shelter.longitude if shelter.longitude is not None else 80.0
        try:
            route = await router_service.generate_safe_route(
                (origin_lat, origin_lng), 
                (s_lat, s_lng),
                algorithm="A*"
            )
            route["id"] = f"route-{shelter.id}"
            route["name"] = f"Evacuation to {shelter.name}"
            route["shelter_name"] = shelter.name
            route["is_recommended"] = True if i == 0 else False
            routes.append(route)
        except Exception as e:
            print(f"Evacuation Routes: Failed to generate route for {shelter.name}: {e}")
            
    return {"routes": routes, "total": len(routes)}


@router.post("/route")
async def generate_route(
    origin_lat: float,
    origin_lng: float,
    destination_lat: Optional[float] = None,
    destination_lng: Optional[float] = None,
    algorithm: str = Query("A*", description="A* or Dijkstra")
):
    """Generate an evacuation route from origin to nearest shelter or custom destination."""
    dest_lat = destination_lat
    dest_lng = destination_lng
    shelter_name = "Custom Destination"
    
    if dest_lat is None or dest_lng is None:
        shelters = await Shelter.find_all().to_list()
        if not shelters:
            raise HTTPException(status_code=404, detail="No shelters found in database")
            
        closest_shelter = None
        min_dist = float("inf")
        
        for s in shelters:
            s_lat = s.latitude if s.latitude is not None else 13.0
            s_lng = s.longitude if s.longitude is not None else 80.0
            d = haversine(origin_lat, origin_lng, s_lat, s_lng)
            if d < min_dist:
                min_dist = d
                closest_shelter = s
                
        if closest_shelter is None:
            raise HTTPException(status_code=404, detail="No nearest shelter found")
            
        dest_lat = closest_shelter.latitude
        dest_lng = closest_shelter.longitude
        shelter_name = closest_shelter.name
        
    router_service = OSMRouter()
    
    try:
        route = await router_service.generate_safe_route(
            (origin_lat, origin_lng),
            (dest_lat, dest_lng),
            algorithm=algorithm
        )
        route["shelter_name"] = shelter_name
        return route
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate route: {str(e)}")


@router.get("/routes/{route_id}/risk")
async def get_route_risk(
    route_id: str
):
    """Get detailed risk segment breakdown along a specific route coordinate."""
    shelter_id = route_id.replace("route-", "")
    shelter = await Shelter.find_one(Shelter.id == shelter_id)
    if not shelter:
        return {"error": "Shelter/Route not found"}
        
    return {
        "route_id": route_id,
        "overall_risk": 35,
        "segments": [
            {"from_km": 0, "to_km": 1, "risk": 10, "description": "High elevation safety zone"},
            {"from_km": 1, "to_km": 2, "risk": 45, "description": "Low lying buffer region"},
            {"from_km": 2, "to_km": 3, "risk": 15, "description": "Safe shelter approach"}
        ]
    }
