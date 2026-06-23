"""
GeoGuard AI - Impact Assessment API
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.core.database import get_db
from app.models.models import RiskZone, FloodPrediction

router = APIRouter()


async def get_live_impact_assessments(db: AsyncSession):
    # Query all predictions and join risk zones
    query = select(FloodPrediction).options(joinedload(FloodPrediction.zone))
    result = await db.execute(query)
    predictions = result.scalars().unique().all()
    
    assessments = []
    for pred in predictions:
        zone = pred.zone
        
        # Calculate dynamic impact fields
        risk_factor = pred.risk_score / 100.0
        pop_affected = int(zone.population * risk_factor)
        buildings = int(pop_affected / 12) if pop_affected > 0 else 0
        schools = max(0, int(buildings / 250))
        hospitals = max(0, int(buildings / 1200))
        agri = int(pred.predicted_depth * 45)
        loss = int(buildings * 1.25)
        human_risk = int(zone.vulnerability_score * 0.3 + pred.risk_score * 0.7)
        
        assessments.append({
            "zoneId": zone.id,
            "zone_id": zone.id, # support both casing styles
            "zoneName": zone.name,
            "zone_name": zone.name,
            "population_affected": pop_affected,
            "populationAffected": pop_affected,
            "buildings_at_risk": buildings,
            "buildingsAtRisk": buildings,
            "schools_affected": schools,
            "schoolsAffected": schools,
            "hospitals_affected": hospitals,
            "hospitalsAffected": hospitals,
            "agricultural_area_ha": agri,
            "agriculturalAreaHa": agri,
            "impact_score": int(pred.risk_score),
            "impactScore": int(pred.risk_score),
            "economic_loss_estimate_lakhs": loss,
            "economicLossEstimate": loss,
            "human_risk_index": human_risk,
            "humanRiskIndex": human_risk,
            "infrastructure_damage": {
                "roads_km": int(pred.predicted_depth * 8),
                "bridges": int(pred.predicted_depth * 1.5),
                "power_substations": int(pred.predicted_depth * 0.8)
            }
        })
    return assessments


@router.get("/")
async def list_impact_assessments(db: AsyncSession = Depends(get_db)):
    """List all impact assessments."""
    assessments = await get_live_impact_assessments(db)
    if not assessments:
        return {"assessments": [], "summary": {"total_population_affected": 0, "total_economic_loss_lakhs": 0, "total_zones_affected": 0, "avg_impact_score": 0}}
        
    total_pop = sum(a["population_affected"] for a in assessments)
    total_loss = sum(a["economic_loss_estimate_lakhs"] for a in assessments)
    
    return {
        "assessments": assessments,
        "summary": {
            "total_population_affected": total_pop,
            "total_economic_loss_lakhs": total_loss,
            "total_zones_affected": len(assessments),
            "avg_impact_score": round(sum(a["impact_score"] for a in assessments) / len(assessments), 1),
        },
    }


@router.get("/{zone_id}")
async def get_impact_assessment(zone_id: str, db: AsyncSession = Depends(get_db)):
    """Get detailed impact assessment for a zone."""
    query = select(FloodPrediction).options(joinedload(FloodPrediction.zone)).filter(FloodPrediction.zone_id == zone_id)
    result = await db.execute(query)
    pred = result.scalars().first()
    if not pred:
        raise HTTPException(status_code=404, detail="Assessment not found")
        
    zone = pred.zone
    risk_factor = pred.risk_score / 100.0
    pop_affected = int(zone.population * risk_factor)
    buildings = int(pop_affected / 12) if pop_affected > 0 else 0
    schools = max(0, int(buildings / 250))
    hospitals = max(0, int(buildings / 1200))
    agri = int(pred.predicted_depth * 45)
    loss = int(buildings * 1.25)
    human_risk = int(zone.vulnerability_score * 0.3 + pred.risk_score * 0.7)
    
    return {
        "zoneId": zone.id,
        "zone_id": zone.id,
        "zoneName": zone.name,
        "zone_name": zone.name,
        "population_affected": pop_affected,
        "populationAffected": pop_affected,
        "buildings_at_risk": buildings,
        "buildingsAtRisk": buildings,
        "schools_affected": schools,
        "schoolsAffected": schools,
        "hospitals_affected": hospitals,
        "hospitalsAffected": hospitals,
        "agricultural_area_ha": agri,
        "agriculturalAreaHa": agri,
        "impact_score": int(pred.risk_score),
        "impactScore": int(pred.risk_score),
        "economic_loss_estimate_lakhs": loss,
        "economicLossEstimate": loss,
        "human_risk_index": human_risk,
        "humanRiskIndex": human_risk,
        "infrastructure_damage": {
            "roads_km": int(pred.predicted_depth * 8),
            "bridges": int(pred.predicted_depth * 1.5),
            "power_substations": int(pred.predicted_depth * 0.8)
        }
    }


@router.get("/summary/aggregate")
async def get_aggregate_impact(db: AsyncSession = Depends(get_db)):
    """Get aggregate impact across all zones."""
    assessments = await get_live_impact_assessments(db)
    if not assessments:
        return {
            "total_population_affected": 0,
            "total_buildings_at_risk": 0,
            "total_schools_affected": 0,
            "total_hospitals_affected": 0,
            "total_economic_loss_lakhs": 0,
            "total_agricultural_area_ha": 0,
            "avg_impact_score": 0,
            "avg_human_risk_index": 0,
        }
        
    return {
        "total_population_affected": sum(a["population_affected"] for a in assessments),
        "total_buildings_at_risk": sum(a["buildings_at_risk"] for a in assessments),
        "total_schools_affected": sum(a["schools_affected"] for a in assessments),
        "total_hospitals_affected": sum(a["hospitals_affected"] for a in assessments),
        "total_economic_loss_lakhs": sum(a["economic_loss_estimate_lakhs"] for a in assessments),
        "total_agricultural_area_ha": sum(a["agricultural_area_ha"] for a in assessments),
        "avg_impact_score": round(sum(a["impact_score"] for a in assessments) / len(assessments), 1),
        "avg_human_risk_index": round(sum(a["human_risk_index"] for a in assessments) / len(assessments), 1),
    }
