"""
GeoGuard AI - Citizen Reports API (MongoDB Atlas / Beanie ODM)
"""
from fastapi import APIRouter, Query, Form, Depends, HTTPException, File, UploadFile
from typing import Optional
from datetime import datetime
import os
import uuid

from app.core.config import settings
from app.models.models import CitizenReport, User
from app.core.security import get_current_user
from app.ml.vision.classifier import DisasterCVClassifier

router = APIRouter()


@router.get("/")
async def list_reports(
    report_type: Optional[str] = Query(None),
    verified: Optional[bool] = Query(None),
    min_severity: Optional[int] = Query(None),
    limit: int = Query(50, le=100)
):
    """List citizen reports from MongoDB Atlas with filtering."""
    query = CitizenReport.find_all()
    if report_type:
        query = query.find(CitizenReport.type == report_type)
    if verified is not None:
        query = query.find(CitizenReport.verified == verified)
    if min_severity:
        query = query.find(CitizenReport.severity >= min_severity)
        
    reports = await query.sort(-CitizenReport.created_at).limit(limit).to_list()
    
    # Pre-fetch users for name resolution
    users = await User.find_all().to_list()
    user_map = {u.id: u.name for u in users}
    
    response = []
    for r in reports:
        lat = r.latitude if r.latitude is not None else 13.0
        lng = r.longitude if r.longitude is not None else 80.0
        user_name = user_map.get(r.user_id, "Anonymous")
        response.append({
            "id": r.id,
            "userId": r.user_id,
            "userName": user_name,
            "type": r.type,
            "description": r.description,
            "severity": r.severity,
            "imageUrl": r.image_url or "/demo/flood-1.jpg",
            "verified": r.verified,
            "location": {"lat": lat, "lng": lng},
            "address": f"Chennai ({lat:.3f}, {lng:.3f})",
            "createdAt": r.created_at.isoformat() + "Z" if r.created_at else None,
            "upvotes": 0
        })
        
    return {"reports": response, "total": len(response)}


@router.post("/")
async def create_report(
    report_type: str = Form(...),
    description: str = Form(...),
    severity: int = Form(...),
    lat: float = Form(...),
    lng: float = Form(...),
    image: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    """Submit a citizen report with optional CV image classification into MongoDB Atlas."""
    image_url = None
    cv_metadata = None
    
    if image is not None:
        try:
            file_ext = image.filename.split(".")[-1] if "." in image.filename else "jpg"
            file_name = f"{uuid.uuid4()}.{file_ext}"
            file_path = os.path.join(settings.UPLOAD_DIR, file_name)
            
            with open(file_path, "wb") as buffer:
                buffer.write(await image.read())
                
            classifier = DisasterCVClassifier()
            cv_type, cv_severity, conf = classifier.classify_image(file_path, description)
            
            type_mapping = {
                "flood": "flood",
                "fire": "fire",
                "road blockage": "blocked_road",
                "fallen trees": "blocked_road",
            }
            report_type = type_mapping.get(cv_type, "other")
            severity = cv_severity
            image_url = f"/uploads/{file_name}"
            cv_metadata = f"Classified by YOLOv8: {cv_type} (conf: {conf:.2f})"
        except Exception as e:
            print(f"Error handling report file upload: {e}")

    new_report = CitizenReport(
        user_id=current_user["id"],
        type=report_type,
        description=description + (f"\n\n[{cv_metadata}]" if cv_metadata else ""),
        severity=severity,
        image_url=image_url,
        verified=False,
        latitude=lat,
        longitude=lng,
        created_at=datetime.utcnow()
    )
    await new_report.insert()
    
    user = await User.find_one(User.id == current_user["id"])
    user_name = user.name if user else "User"
    
    return {
        "status": "submitted",
        "report": {
            "id": new_report.id,
            "userId": new_report.user_id,
            "userName": user_name,
            "type": new_report.type,
            "description": new_report.description,
            "severity": new_report.severity,
            "imageUrl": new_report.image_url or "/demo/flood-1.jpg",
            "verified": new_report.verified,
            "location": {"lat": lat, "lng": lng},
            "address": f"Tamil Nadu ({lat:.3f}, {lng:.3f})",
            "createdAt": new_report.created_at.isoformat() + "Z",
            "upvotes": 0
        }
    }


@router.put("/{report_id}/verify")
async def verify_report(
    report_id: str
):
    """Verify a citizen report in MongoDB Atlas."""
    report = await CitizenReport.find_one(CitizenReport.id == report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    report.verified = True
    await report.save()
    
    user = await User.find_one(User.id == report.user_id)
    user_name = user.name if user else "Anonymous"
    lat = report.latitude if report.latitude is not None else 13.0
    lng = report.longitude if report.longitude is not None else 80.0
    
    return {
        "status": "verified",
        "report": {
            "id": report.id,
            "userId": report.user_id,
            "userName": user_name,
            "type": report.type,
            "description": report.description,
            "severity": report.severity,
            "verified": report.verified,
            "location": {"lat": lat, "lng": lng},
            "address": f"Chennai ({lat:.3f}, {lng:.3f})",
            "createdAt": report.created_at.isoformat() + "Z",
            "upvotes": 0
        }
    }


@router.get("/heatmap")
async def report_heatmap():
    """Get report density heatmap."""
    reports = await CitizenReport.find_all().to_list()
    
    points = []
    for r in reports:
        lat = r.latitude if r.latitude is not None else 13.0
        lng = r.longitude if r.longitude is not None else 80.0
        points.append({
            "lat": lat,
            "lng": lng,
            "intensity": r.severity / 5
        })
    return {"points": points}
