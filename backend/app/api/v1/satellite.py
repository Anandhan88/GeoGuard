"""
GeoGuard AI - Satellite Imagery API (MongoDB Atlas / Beanie ODM)
Exposes endpoints to list processed satellite images, check background analysis status, and trigger runs.
"""
from fastapi import APIRouter, Query, HTTPException
from typing import List

from app.models.models import SatelliteImage
from app.schemas.schemas import SatelliteImageResponse
from services.satellite import satellite_manager

router = APIRouter()


@router.get("/", response_model=List[SatelliteImageResponse])
async def list_satellite_images(
    limit: int = Query(10, le=50)
):
    """Retrieve history of processed satellite images from MongoDB Atlas."""
    try:
        images = await SatelliteImage.find_all().sort("-capture_date").limit(limit).to_list()
        if not images:
            from app.core.seeding import seed_all
            await seed_all()
            images = await SatelliteImage.find_all().sort("-capture_date").limit(limit).to_list()
        return images
    except Exception as e:
        print(f"Error fetching satellite images: {e}")
        return []


@router.get("/status")
async def get_satellite_status():
    """Retrieve current background satellite imagery download and analysis status."""
    return satellite_manager.get_status()


@router.post("/trigger")
async def trigger_satellite_analysis(
    lat: float = Query(13.0827),
    lng: float = Query(80.2707)
):
    """Manually trigger background search, download, and processing of latest satellite imagery."""
    current_status = satellite_manager.get_status()
    if current_status.get("status") in ["Searching", "Downloading", "Processing"]:
        raise HTTPException(
            status_code=400,
            detail=f"An analysis pipeline is already active ({current_status.get('status')})."
        )
        
    satellite_manager.trigger_manual_run(lat, lng)
    return {"status": "success", "message": f"Satellite analysis pipeline manually triggered for lat={lat}, lng={lng}"}
