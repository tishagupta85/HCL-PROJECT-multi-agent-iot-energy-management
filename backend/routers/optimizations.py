from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime
from typing import Optional
from app.database import get_db
from models import Recommendation, Device

router = APIRouter(prefix="/api/optimizations", tags=["optimizations"])

@router.get("")
def get_optimizations(
    status: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(Recommendation)
    if status:
        query = query.filter(Recommendation.status == status.upper())

    recs = query.order_by(desc(Recommendation.timestamp)).limit(limit).all()
    devices = {d.id: d.name for d in db.query(Device).all()}

    results = []
    for r in recs:
        r_dict = r.to_dict()
        r_dict["device_name"] = devices.get(r.device_id, "Whole Home / System")
        results.append(r_dict)

    return results

@router.post("/{rec_id}/apply")
def apply_optimization(rec_id: int, db: Session = Depends(get_db)):
    rec = db.query(Recommendation).filter(Recommendation.id == rec_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    rec.status = "APPLIED"
    rec.applied_at = datetime.utcnow()

    # If action is load shift or phantom power cut, simulate smart device control
    if rec.device_id:
        dev = db.query(Device).filter(Device.id == rec.device_id).first()
        if dev and rec.action_type in ["PHANTOM_POWER_CUT", "PEAK_SHAVING"]:
            dev.is_on = False # Smart eco power down

    db.commit()
    db.refresh(rec)
    return {
        "success": True,
        "recommendation_id": rec.id,
        "status": rec.status,
        "applied_at": rec.applied_at.isoformat(),
        "message": f"Successfully applied: {rec.title}"
    }

@router.post("/{rec_id}/dismiss")
def dismiss_optimization(rec_id: int, db: Session = Depends(get_db)):
    rec = db.query(Recommendation).filter(Recommendation.id == rec_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    rec.status = "DISMISSED"
    db.commit()
    return {
        "success": True,
        "recommendation_id": rec.id,
        "status": rec.status
    }
