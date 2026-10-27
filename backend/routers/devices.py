from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from pydantic import BaseModel
from app.database import get_db
from models import Device, IoTReading

router = APIRouter(prefix="/api/devices", tags=["devices"])

class DeviceCreate(BaseModel):
    name: str
    device_type: str
    room: str
    rated_watts: float
    is_controllable: bool = True
    priority: int = 2

class DeviceUpdate(BaseModel):
    name: Optional[str] = None
    room: Optional[str] = None
    rated_watts: Optional[float] = None
    is_controllable: Optional[bool] = None
    priority: Optional[int] = None

@router.get("")
def get_devices(db: Session = Depends(get_db)):
    devices = db.query(Device).all()
    results = []
    for d in devices:
        latest = (
            db.query(IoTReading)
            .filter(IoTReading.device_id == d.id)
            .order_by(desc(IoTReading.timestamp))
            .first()
        )
        d_dict = d.to_dict()
        d_dict["current_power_w"] = latest.power_w if latest else 0.0
        d_dict["current_voltage_v"] = latest.voltage_v if latest else 230.0
        d_dict["current_amperes"] = latest.current_a if latest else 0.0
        d_dict["power_factor"] = latest.power_factor if latest else 0.95
        d_dict["last_updated"] = latest.timestamp.isoformat() if latest else None
        results.append(d_dict)
    return results

@router.post("/{device_id}/toggle")
def toggle_device(device_id: int, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    device.is_on = not device.is_on
    db.commit()
    db.refresh(device)
    return {
        "success": True,
        "device_id": device.id,
        "is_on": device.is_on,
        "message": f"{device.name} is now {'ON' if device.is_on else 'OFF'}"
    }

@router.post("")
def create_device(payload: DeviceCreate, db: Session = Depends(get_db)):
    dev = Device(
        name=payload.name,
        device_type=payload.device_type,
        room=payload.room,
        rated_watts=payload.rated_watts,
        is_controllable=payload.is_controllable,
        priority=payload.priority,
        is_on=True,
    )
    db.add(dev)
    db.commit()
    db.refresh(dev)
    return dev.to_dict()

@router.put("/{device_id}")
def update_device(device_id: int, payload: DeviceUpdate, db: Session = Depends(get_db)):
    dev = db.query(Device).filter(Device.id == device_id).first()
    if not dev:
        raise HTTPException(status_code=404, detail="Device not found")
    
    if payload.name is not None:
        dev.name = payload.name
    if payload.room is not None:
        dev.room = payload.room
    if payload.rated_watts is not None:
        dev.rated_watts = payload.rated_watts
    if payload.is_controllable is not None:
        dev.is_controllable = payload.is_controllable
    if payload.priority is not None:
        dev.priority = payload.priority
        
    db.commit()
    db.refresh(dev)
    return dev.to_dict()
