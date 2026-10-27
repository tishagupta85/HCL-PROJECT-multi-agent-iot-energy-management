from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime
from typing import Optional
from app.database import get_db
from models import Alert, Device

router = APIRouter(prefix="/api/anomalies", tags=["anomalies"])

@router.get("")
def get_anomalies(
    is_resolved: Optional[bool] = None,
    severity: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(Alert)
    if is_resolved is not None:
        query = query.filter(Alert.is_resolved == is_resolved)
    if severity:
        query = query.filter(Alert.severity == severity.upper())

    alerts = query.order_by(desc(Alert.timestamp)).limit(limit).all()
    devices = {d.id: d.name for d in db.query(Device).all()}

    results = []
    for a in alerts:
        a_dict = a.to_dict()
        a_dict["device_name"] = devices.get(a.device_id, "System / Grid")
        results.append(a_dict)

    return results

@router.post("/{alert_id}/resolve")
def resolve_anomaly(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.is_resolved = True
    alert.resolved_at = datetime.utcnow()
    db.commit()
    db.refresh(alert)
    return {
        "success": True,
        "alert_id": alert.id,
        "is_resolved": True,
        "resolved_at": alert.resolved_at.isoformat()
    }
