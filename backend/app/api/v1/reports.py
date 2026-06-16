"""
GeoGuard AI - Citizen Reports API
"""
from fastapi import APIRouter, Query, UploadFile, File, Form
from typing import Optional
from datetime import datetime

router = APIRouter()

REPORTS = [
    {
        "id": "report-001", "user_id": "user-101", "user_name": "Rajesh Kumar",
        "type": "flood", "description": "Water level rising rapidly near Adyar bridge. 2 feet on road.",
        "severity": 5, "verified": True, "location": {"lat": 13.0060, "lng": 80.2550},
        "address": "Adyar Bridge, Chennai", "created_at": "2026-06-16T08:30:00Z", "upvotes": 142,
    },
    {
        "id": "report-002", "user_id": "user-102", "user_name": "Priya Lakshmi",
        "type": "road_blocked", "description": "Road blocked due to fallen tree and waterlogging.",
        "severity": 4, "verified": True, "location": {"lat": 12.9830, "lng": 80.2200},
        "address": "Velachery Main Road", "created_at": "2026-06-16T09:15:00Z", "upvotes": 98,
    },
    {
        "id": "report-003", "user_id": "user-103", "user_name": "Murugan S",
        "type": "power_outage", "description": "Power outage since 6 AM. Transformer submerged.",
        "severity": 4, "verified": False, "location": {"lat": 13.0850, "lng": 80.2700},
        "address": "Chetpet, Chennai", "created_at": "2026-06-16T09:45:00Z", "upvotes": 67,
    },
]


@router.get("/")
async def list_reports(
    report_type: Optional[str] = Query(None),
    verified: Optional[bool] = Query(None),
    min_severity: Optional[int] = Query(None),
    limit: int = Query(50, le=100),
):
    """List citizen reports with filtering."""
    results = REPORTS.copy()
    if report_type:
        results = [r for r in results if r["type"] == report_type]
    if verified is not None:
        results = [r for r in results if r["verified"] == verified]
    if min_severity:
        results = [r for r in results if r["severity"] >= min_severity]
    return {"reports": results[:limit], "total": len(results)}


@router.post("/")
async def create_report(
    report_type: str = Form(...),
    description: str = Form(...),
    severity: int = Form(...),
    lat: float = Form(...),
    lng: float = Form(...),
    address: Optional[str] = Form(None),
):
    """Submit a citizen report."""
    new_report = {
        "id": f"report-{len(REPORTS) + 1:03d}",
        "user_id": "current-user",
        "user_name": "Current User",
        "type": report_type,
        "description": description,
        "severity": severity,
        "verified": False,
        "location": {"lat": lat, "lng": lng},
        "address": address,
        "created_at": datetime.utcnow().isoformat() + "Z",
        "upvotes": 0,
    }
    REPORTS.append(new_report)
    return {"status": "submitted", "report": new_report}


@router.put("/{report_id}/verify")
async def verify_report(report_id: str):
    """Verify a citizen report (authority only)."""
    report = next((r for r in REPORTS if r["id"] == report_id), None)
    if not report:
        return {"error": "Report not found"}
    report["verified"] = True
    return {"status": "verified", "report": report}


@router.get("/heatmap")
async def report_heatmap():
    """Get report density heatmap."""
    points = [{"lat": r["location"]["lat"], "lng": r["location"]["lng"], "intensity": r["severity"] / 5} for r in REPORTS]
    return {"points": points}
