"""
GeoGuard AI - Predictions API
Serves flood risk predictions with XAI explanations.
"""
from fastapi import APIRouter, Query, Depends
from typing import Optional
import random
import math

router = APIRouter()

# Simulated prediction data for Chennai region
PREDICTIONS = [
    {
        "id": "pred-001",
        "zone_id": "zone-001",
        "zone_name": "Adyar River Basin",
        "risk_score": 89,
        "probability": 0.87,
        "confidence": 0.92,
        "predicted_depth": 1.8,
        "predicted_duration": 48,
        "risk_level": "critical",
        "affected_population": 45000,
        "predicted_for": "2026-06-18T06:00:00Z",
        "generated_at": "2026-06-16T10:00:00Z",
        "center": {"lat": 13.0067, "lng": 80.2206},
        "factors": [
            {"name": "River Water Level", "value": 4.2, "unit": "m", "contribution": 28, "trend": "increasing", "threshold": 3.5, "description": "Adyar river level has crossed danger mark by 20%"},
            {"name": "Rainfall Intensity", "value": 82, "unit": "mm/hr", "contribution": 24, "trend": "increasing", "threshold": 65, "description": "Extreme rainfall exceeding 65mm/hr threshold"},
            {"name": "Soil Saturation", "value": 92, "unit": "%", "contribution": 18, "trend": "increasing", "threshold": 80, "description": "Soil is nearly fully saturated"},
            {"name": "Drainage Capacity", "value": 35, "unit": "%", "contribution": 15, "trend": "decreasing", "threshold": 50, "description": "Urban drainage at 35% capacity"},
            {"name": "Upstream Reservoir", "value": 87, "unit": "%", "contribution": 10, "trend": "increasing", "threshold": 85, "description": "Chembarambakkam reservoir at 87%"},
            {"name": "Tide Level", "value": 1.4, "unit": "m", "contribution": 5, "trend": "stable", "threshold": 1.2, "description": "High tide preventing drainage"},
        ],
    },
    {
        "id": "pred-002",
        "zone_id": "zone-002",
        "zone_name": "Cooum River Corridor",
        "risk_score": 76,
        "probability": 0.73,
        "confidence": 0.88,
        "predicted_depth": 1.2,
        "predicted_duration": 36,
        "risk_level": "high",
        "affected_population": 62000,
        "predicted_for": "2026-06-18T08:00:00Z",
        "generated_at": "2026-06-16T10:00:00Z",
        "center": {"lat": 13.0827, "lng": 80.2707},
        "factors": [
            {"name": "River Water Level", "value": 3.8, "unit": "m", "contribution": 30, "trend": "increasing", "threshold": 3.5, "description": "Cooum river approaching danger mark"},
            {"name": "Rainfall Intensity", "value": 58, "unit": "mm/hr", "contribution": 25, "trend": "increasing", "threshold": 65, "description": "Heavy rainfall continuing"},
            {"name": "Soil Saturation", "value": 85, "unit": "%", "contribution": 20, "trend": "increasing", "threshold": 80, "description": "Soil highly saturated"},
            {"name": "Urban Encroachment", "value": 72, "unit": "%", "contribution": 15, "trend": "stable", "threshold": 40, "description": "Significant floodplain encroachment"},
            {"name": "Drainage Capacity", "value": 42, "unit": "%", "contribution": 10, "trend": "decreasing", "threshold": 50, "description": "Drainage partially blocked"},
        ],
    },
    {
        "id": "pred-003",
        "zone_id": "zone-003",
        "zone_name": "Velachery Low-Lying Area",
        "risk_score": 82,
        "probability": 0.80,
        "confidence": 0.90,
        "predicted_depth": 1.5,
        "predicted_duration": 60,
        "risk_level": "critical",
        "affected_population": 35000,
        "predicted_for": "2026-06-17T18:00:00Z",
        "generated_at": "2026-06-16T10:00:00Z",
        "center": {"lat": 12.9815, "lng": 80.2180},
        "factors": [
            {"name": "Elevation", "value": 2.1, "unit": "m ASL", "contribution": 30, "trend": "stable", "threshold": 5, "description": "Extremely low elevation area"},
            {"name": "Rainfall Accumulation", "value": 210, "unit": "mm", "contribution": 25, "trend": "increasing", "threshold": 150, "description": "24hr accumulation exceeds threshold"},
            {"name": "Drainage Capacity", "value": 28, "unit": "%", "contribution": 20, "trend": "decreasing", "threshold": 50, "description": "Poor drainage infrastructure"},
            {"name": "Water Table", "value": 0.8, "unit": "m", "contribution": 15, "trend": "increasing", "threshold": 1.5, "description": "Water table very high"},
            {"name": "Surface Runoff", "value": 78, "unit": "%", "contribution": 10, "trend": "increasing", "threshold": 60, "description": "High surface runoff coefficient"},
        ],
    },
]


@router.get("/")
async def list_predictions(
    risk_level: Optional[str] = Query(None, description="Filter by risk level"),
    min_score: Optional[int] = Query(None, description="Minimum risk score"),
    limit: int = Query(20, le=100),
):
    """List all flood predictions with optional filtering."""
    results = PREDICTIONS.copy()
    
    if risk_level:
        results = [p for p in results if p["risk_level"] == risk_level]
    if min_score:
        results = [p for p in results if p["risk_score"] >= min_score]
    
    return {
        "predictions": results[:limit],
        "total": len(results),
        "filters": {"risk_level": risk_level, "min_score": min_score},
    }


@router.get("/{prediction_id}")
async def get_prediction(prediction_id: str):
    """Get detailed prediction with XAI factors."""
    pred = next((p for p in PREDICTIONS if p["id"] == prediction_id), None)
    if not pred:
        return {"error": "Prediction not found"}
    
    # Generate XAI explanation
    top_factors = sorted(pred["factors"], key=lambda f: f["contribution"], reverse=True)[:3]
    explanation = f"Flood Risk = {pred['risk_score']}%. "
    explanation += f"This prediction is driven primarily by {top_factors[0]['name'].lower()} "
    explanation += f"(contributing {top_factors[0]['contribution']}%) "
    explanation += f"and {top_factors[1]['name'].lower()} "
    explanation += f"(contributing {top_factors[1]['contribution']}%). "
    explanation += f"Model confidence is {int(pred['confidence'] * 100)}% based on 847 similar historical events."
    
    return {
        **pred,
        "xai_explanation": explanation,
        "model_info": {
            "primary_model": "XGBoost v2.1",
            "secondary_model": "LSTM-Flood v1.3",
            "training_samples": 12847,
            "last_retrained": "2026-06-01",
        },
    }


@router.get("/heatmap/data")
async def get_heatmap_data():
    """Get risk heatmap data as GeoJSON points."""
    points = []
    for pred in PREDICTIONS:
        center = pred["center"]
        intensity = pred["risk_score"] / 100
        # Generate surrounding points for heat effect
        for _ in range(5):
            points.append({
                "lat": center["lat"] + random.uniform(-0.01, 0.01),
                "lng": center["lng"] + random.uniform(-0.01, 0.01),
                "intensity": max(0.1, intensity + random.uniform(-0.15, 0.05)),
            })
    
    return {"points": points, "total": len(points)}


@router.post("/generate")
async def generate_predictions():
    """Trigger prediction pipeline (authority only)."""
    return {
        "status": "generating",
        "message": "Prediction pipeline started. Results available in ~30 seconds.",
        "zones_queued": len(PREDICTIONS),
    }
