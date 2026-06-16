"""
GeoGuard AI - Alerts API
"""
from fastapi import APIRouter, Query
from typing import Optional
from datetime import datetime

router = APIRouter()

ALERTS = [
    {
        "id": "alert-001",
        "type": "Flood Warning",
        "severity": "critical",
        "title": "RED ALERT: Severe Flooding Expected - Adyar River Basin",
        "message": "Extreme rainfall combined with rising river levels expected to cause severe flooding in Adyar river basin areas within 24-48 hours. Immediate evacuation recommended.",
        "target_zone": "Adyar River Basin",
        "issued_at": "2026-06-16T06:00:00Z",
        "expires_at": "2026-06-18T18:00:00Z",
        "is_active": True,
    },
    {
        "id": "alert-002",
        "type": "Flood Warning",
        "severity": "severe",
        "title": "ORANGE ALERT: Flooding Risk - Velachery Area",
        "message": "Significant water accumulation expected in Velachery low-lying areas. Move valuables to upper floors.",
        "target_zone": "Velachery Low-Lying Area",
        "issued_at": "2026-06-16T07:00:00Z",
        "expires_at": "2026-06-18T12:00:00Z",
        "is_active": True,
    },
    {
        "id": "alert-003",
        "type": "Heavy Rainfall",
        "severity": "severe",
        "title": "ORANGE ALERT: Very Heavy Rainfall Warning",
        "message": "IMD has issued very heavy rainfall warning for Chennai. Expected 150-200mm in next 24 hours.",
        "target_zone": "Chennai Metropolitan",
        "issued_at": "2026-06-16T05:30:00Z",
        "expires_at": "2026-06-17T18:00:00Z",
        "is_active": True,
    },
    {
        "id": "alert-004",
        "type": "Reservoir Alert",
        "severity": "moderate",
        "title": "Chembarambakkam Reservoir at 87% Capacity",
        "message": "Water level rising. Controlled release may be initiated. Downstream areas should prepare.",
        "target_zone": "Adyar River Basin",
        "issued_at": "2026-06-16T08:00:00Z",
        "expires_at": "2026-06-17T20:00:00Z",
        "is_active": True,
    },
    {
        "id": "alert-005",
        "type": "Traffic Advisory",
        "severity": "advisory",
        "title": "Road Closures - Multiple Locations",
        "message": "Several roads closed due to waterlogging: Velachery Main Road, Adyar Bridge, OMR Perungudi stretch.",
        "target_zone": "Chennai Metropolitan",
        "issued_at": "2026-06-16T09:00:00Z",
        "expires_at": "2026-06-17T06:00:00Z",
        "is_active": True,
    },
]


@router.get("/")
async def list_alerts(
    severity: Optional[str] = Query(None),
    is_active: bool = Query(True),
    limit: int = Query(50, le=100),
):
    """List active alerts."""
    results = ALERTS.copy()
    if severity:
        results = [a for a in results if a["severity"] == severity]
    if is_active:
        results = [a for a in results if a["is_active"]]
    return {"alerts": results[:limit], "total": len(results)}


@router.get("/{alert_id}")
async def get_alert(alert_id: str):
    """Get alert details."""
    alert = next((a for a in ALERTS if a["id"] == alert_id), None)
    if not alert:
        return {"error": "Alert not found"}
    return alert


@router.post("/")
async def create_alert(
    alert_type: str,
    severity: str,
    title: str,
    message: str,
    target_zone: str,
):
    """Create a new alert (authority only)."""
    new_alert = {
        "id": f"alert-{len(ALERTS) + 1:03d}",
        "type": alert_type,
        "severity": severity,
        "title": title,
        "message": message,
        "target_zone": target_zone,
        "issued_at": datetime.utcnow().isoformat() + "Z",
        "expires_at": "2026-06-20T00:00:00Z",
        "is_active": True,
    }
    ALERTS.append(new_alert)
    return {"status": "created", "alert": new_alert}
