"""
GeoGuard AI - Impact Assessment API
"""
from fastapi import APIRouter, Query
from typing import Optional

router = APIRouter()

IMPACT_ASSESSMENTS = [
    {
        "zone_id": "zone-001", "zone_name": "Adyar River Basin",
        "population_affected": 45000, "buildings_at_risk": 3200,
        "schools_affected": 12, "hospitals_affected": 2,
        "agricultural_area_ha": 85, "impact_score": 87,
        "economic_loss_estimate_lakhs": 4500, "human_risk_index": 82,
        "infrastructure_damage": {"roads_km": 15, "bridges": 3, "power_substations": 2},
    },
    {
        "zone_id": "zone-003", "zone_name": "Velachery Low-Lying Area",
        "population_affected": 35000, "buildings_at_risk": 2800,
        "schools_affected": 8, "hospitals_affected": 1,
        "agricultural_area_ha": 45, "impact_score": 79,
        "economic_loss_estimate_lakhs": 3200, "human_risk_index": 75,
        "infrastructure_damage": {"roads_km": 8, "bridges": 1, "power_substations": 1},
    },
    {
        "zone_id": "zone-002", "zone_name": "Cooum River Corridor",
        "population_affected": 62000, "buildings_at_risk": 4100,
        "schools_affected": 15, "hospitals_affected": 3,
        "agricultural_area_ha": 120, "impact_score": 74,
        "economic_loss_estimate_lakhs": 5800, "human_risk_index": 70,
        "infrastructure_damage": {"roads_km": 22, "bridges": 5, "power_substations": 3},
    },
]


@router.get("/")
async def list_impact_assessments():
    """List all impact assessments."""
    total_pop = sum(a["population_affected"] for a in IMPACT_ASSESSMENTS)
    total_loss = sum(a["economic_loss_estimate_lakhs"] for a in IMPACT_ASSESSMENTS)
    
    return {
        "assessments": IMPACT_ASSESSMENTS,
        "summary": {
            "total_population_affected": total_pop,
            "total_economic_loss_lakhs": total_loss,
            "total_zones_affected": len(IMPACT_ASSESSMENTS),
            "avg_impact_score": round(sum(a["impact_score"] for a in IMPACT_ASSESSMENTS) / len(IMPACT_ASSESSMENTS), 1),
        },
    }


@router.get("/{zone_id}")
async def get_impact_assessment(zone_id: str):
    """Get detailed impact assessment for a zone."""
    assessment = next((a for a in IMPACT_ASSESSMENTS if a["zone_id"] == zone_id), None)
    if not assessment:
        return {"error": "Assessment not found"}
    return assessment


@router.get("/summary/aggregate")
async def get_aggregate_impact():
    """Get aggregate impact across all zones."""
    return {
        "total_population_affected": sum(a["population_affected"] for a in IMPACT_ASSESSMENTS),
        "total_buildings_at_risk": sum(a["buildings_at_risk"] for a in IMPACT_ASSESSMENTS),
        "total_schools_affected": sum(a["schools_affected"] for a in IMPACT_ASSESSMENTS),
        "total_hospitals_affected": sum(a["hospitals_affected"] for a in IMPACT_ASSESSMENTS),
        "total_economic_loss_lakhs": sum(a["economic_loss_estimate_lakhs"] for a in IMPACT_ASSESSMENTS),
        "total_agricultural_area_ha": sum(a["agricultural_area_ha"] for a in IMPACT_ASSESSMENTS),
        "avg_impact_score": round(sum(a["impact_score"] for a in IMPACT_ASSESSMENTS) / len(IMPACT_ASSESSMENTS), 1),
        "avg_human_risk_index": round(sum(a["human_risk_index"] for a in IMPACT_ASSESSMENTS) / len(IMPACT_ASSESSMENTS), 1),
    }
