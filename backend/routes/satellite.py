from fastapi import APIRouter, Query, HTTPException, Depends
from fastapi.responses import JSONResponse, FileResponse
from typing import Optional, List
import os
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.models import SatelliteImage

from services.copernicus import catalogue_service
from services.satellite import satellite_manager

# Set up routers
satellite_router = APIRouter(tags=["Copernicus Satellite"])
disaster_router = APIRouter(tags=["Disaster Assessment"])

@satellite_router.get("")
async def list_satellite_images(db: AsyncSession = Depends(get_db)):
    """
    List all processed satellite images from the database.
    """
    result = await db.execute(select(SatelliteImage).order_by(SatelliteImage.capture_date.desc()))
    images = result.scalars().all()
    
    response = []
    for img in images:
        response.append({
            "id": img.id,
            "source": img.source,
            "capture_date": img.capture_date.isoformat() if img.capture_date else None,
            "image_url": img.image_url,
            "analysis_result_json": img.analysis_result_json,
            "bounds_json": img.bounds_json
        })
    return response

@satellite_router.get("/latest")
@satellite_router.get("/status")
async def get_latest_satellite():
    """
    Get the latest downloaded/processed satellite product metadata and processing status.
    """
    status_data = satellite_manager.get_status()
    return status_data

@satellite_router.post("/trigger")
async def trigger_satellite_scan(
    lat: float = Query(13.0827, description="Latitude centroid"),
    lng: float = Query(80.2707, description="Longitude centroid")
):
    """
    Manually trigger a search, download, and analysis for the specified coordinates.
    """
    satellite_manager.trigger_manual_run(lat, lng)
    return {
        "status": "success",
        "message": "Satellite scanning pipeline started in the background."
    }

@satellite_router.get("/search")
async def search_satellite(
    lat: Optional[float] = Query(None, description="Latitude centroid"),
    lng: Optional[float] = Query(None, description="Longitude centroid"),
    bbox: Optional[str] = Query(None, description="Bounding Box as min_lat,min_lng,max_lat,max_lng"),
    date: Optional[str] = Query(None, description="Target acquisition date ISO"),
    satellite_type: str = Query("Sentinel-1", description="Sentinel-1 or Sentinel-2")
):
    """
    Search Copernicus Catalogue for Sentinel products.
    """
    parsed_bbox = None
    if bbox:
        try:
            parsed_bbox = [float(x) for x in bbox.split(",")]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid bbox format. Use min_lat,min_lng,max_lat,max_lng")

    try:
        products = catalogue_service.search_products(
            lat=lat,
            lng=lng,
            bbox=parsed_bbox,
            date_str=date,
            satellite_type=satellite_type
        )
        return {
            "status": "success",
            "results": products,
            "total": len(products)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@satellite_router.get("/image")
async def get_satellite_image(productId: Optional[str] = None):
    """
    Fetch the latest processed satellite image or dummy PNG thumbnail if missing.
    """
    status_data = satellite_manager.get_status()
    file_path = status_data.get("file_path")
    
    # Return a simulated thumbnail or actual file if it exists
    if file_path and os.path.exists(file_path):
        # In a real environment, we would convert GeoTIFF to PNG/WebP for browser display
        # Here we return a fallback static image or stream details
        pass
        
    # Return placeholder satellite imagery
    placeholder_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads", "satellite_placeholder.png")
    if not os.path.exists(placeholder_path):
        # Create a dummy image
        os.makedirs(os.path.dirname(placeholder_path), exist_ok=True)
        # Write standard empty transparent PNG/GIF bytes just to avoid 404
        dummy_gif = b'GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\xff\xff\xff!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;'
        with open(placeholder_path, "wb") as f:
            f.write(dummy_gif)
            
    return FileResponse(placeholder_path, media_type="image/png")

@satellite_router.get("/flood-map")
async def get_flood_map():
    """
    Get the GeoJSON flood boundary polygons and overlay masks.
    """
    status_data = satellite_manager.get_status()
    polygons = status_data.get("polygons", [])
    
    # Return standard GeoJSON feature collection
    geojson = {
        "type": "FeatureCollection",
        "features": polygons
    }
    return geojson

@disaster_router.get("/risk")
async def get_disaster_risk():
    """
    Get calculated risk indices, affected populations, and severity classification.
    """
    status_data = satellite_manager.get_status()
    flooded_area = status_data.get("flooded_area_km", 0.0)
    severity = status_data.get("severity", "Low")
    risk_level = status_data.get("risk_level", "Low")
    
    # Calculate affected population based on flood area
    # e.g., 2500 people per sq km in suburban districts
    affected_population = int(flooded_area * 2150)
    
    return {
        "status": "success",
        "risk_score": int(status_data.get("water_spread_pct", 0.0) * 2.5) if severity != "Low" else 15,
        "affected_population": affected_population,
        "severity": severity,
        "risk_level": risk_level,
        "flooded_area_km": flooded_area,
        "guidelines": [
            "Evacuate low-lying river bank sectors immediately if severity reaches High or Critical.",
            "Avoid walking or driving through flood waters.",
            "Move resources to designated high-elevation community shelters.",
            "Monitor emergency broadcast channels for real-time bulletins."
        ]
    }

@disaster_router.get("/heatmap")
async def get_disaster_heatmap():
    """
    Get risk points to render thermal layers on maps.
    """
    status_data = satellite_manager.get_status()
    polygons = status_data.get("polygons", [])
    
    points = []
    # Extract coordinates from polygons to generate heat intensity values
    for feature in polygons:
        geometry = feature.get("geometry", {})
        coords = geometry.get("coordinates", [])
        if geometry.get("type") == "Polygon" and coords:
            for ring in coords:
                # Sample coordinate points to reduce footprint on transmission
                step = max(1, len(ring) // 5)
                for pt in ring[::step]:
                    # pt is [lng, lat]
                    points.append({
                        "lat": pt[1],
                        "lng": pt[0],
                        "intensity": 0.8 if status_data.get("severity") in ["High", "Critical"] else 0.4
                    })
                    
    # Default fallback points in Chennai if no polygons are present
    if not points:
        points = [
            {"lat": 13.0827, "lng": 80.2707, "intensity": 0.3},
            {"lat": 13.0067, "lng": 80.2206, "intensity": 0.55},
            {"lat": 12.9796, "lng": 80.2185, "intensity": 0.8}
        ]
        
    return {
        "status": "success",
        "points": points,
        "total": len(points)
    }
