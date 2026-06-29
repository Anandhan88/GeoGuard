"""
GeoGuard AI - Satellite Imagery API
Exposes endpoints to list processed satellite images, check background analysis status, and trigger runs.
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db
from app.models.models import SatelliteImage
from app.schemas.schemas import SatelliteImageResponse
from services.satellite import satellite_manager

router = APIRouter()


@router.get("/", response_model=List[SatelliteImageResponse])
async def list_satellite_images(
    limit: int = Query(10, le=50),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve history of processed satellite images."""
    query = select(SatelliteImage).order_by(SatelliteImage.capture_date.desc()).limit(limit)
    result = await db.execute(query)
    images = result.scalars().all()
    return images


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
    # Check if a pipeline is already running to avoid conflict
    current_status = satellite_manager.get_status()
    if current_status.get("status") in ["Searching", "Downloading", "Processing"]:
        raise HTTPException(
            status_code=400,
            detail=f"An analysis pipeline is already active ({current_status.get('status')})."
        )
        
    satellite_manager.trigger_manual_run(lat, lng)
    return {"status": "success", "message": f"Satellite analysis pipeline manually triggered for lat={lat}, lng={lng}"}
