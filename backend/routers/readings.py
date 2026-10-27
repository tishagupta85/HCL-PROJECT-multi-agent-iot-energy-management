from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from datetime import datetime, timedelta
from typing import Optional, List
from app.database import get_db
from models import IoTReading, Device

router = APIRouter(prefix="/api/readings", tags=["readings"])

@router.get("/latest")
def get_latest_readings(db: Session = Depends(get_db)):
    devices = db.query(Device).all()
    results = []
    for d in devices:
        latest = (
            db.query(IoTReading)
            .filter(IoTReading.device_id == d.id)
            .order_by(desc(IoTReading.timestamp))
            .first()
        )
        if latest:
            item = latest.to_dict()
            item["device_name"] = d.name
            item["room"] = d.room
            item["is_on"] = d.is_on
            results.append(item)
    return results

@router.get("/live-aggregate")
def get_live_aggregate(db: Session = Depends(get_db)):
    devices = db.query(Device).all()
    total_w = 0.0
    total_a = 0.0
    voltages = []
    pfs = []

    for d in devices:
        latest = (
            db.query(IoTReading)
            .filter(IoTReading.device_id == d.id)
            .order_by(desc(IoTReading.timestamp))
            .first()
        )
        if latest:
            total_w += latest.power_w
            total_a += latest.current_a
            voltages.append(latest.voltage_v)
            pfs.append(latest.power_factor)

    avg_v = sum(voltages) / max(len(voltages), 1) if voltages else 230.0
    avg_pf = sum(pfs) / max(len(pfs), 1) if pfs else 0.95

    return {
        "timestamp": datetime.utcnow().isoformat(),
        "total_power_kw": round(total_w / 1000.0, 3),
        "total_power_w": round(total_w, 1),
        "total_current_a": round(total_a, 2),
        "average_voltage_v": round(avg_v, 1),
        "average_power_factor": round(avg_pf, 3),
        "device_count": len(devices),
    }

@router.get("/history")
def get_reading_history(
    hours: int = Query(24, ge=1, le=168),
    device_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    since = datetime.utcnow() - timedelta(hours=hours)
    query = db.query(IoTReading).filter(IoTReading.timestamp >= since)
    
    if device_id:
        query = query.filter(IoTReading.device_id == device_id)
        
    readings = query.order_by(IoTReading.timestamp.asc()).all()
    return [r.to_dict() for r in readings]
