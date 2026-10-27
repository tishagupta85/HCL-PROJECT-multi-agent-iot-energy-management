from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.simulator import simulator

router = APIRouter(prefix="/api/simulator", tags=["simulator"])

class InjectAnomalyRequest(BaseModel):
    anomaly_type: str  # AC_OVERLOAD, HEATER_RUNAWAY, VOLTAGE_SAG, PHANTOM_DRAIN
    device_id: Optional[int] = None
    duration_ticks: int = 20

class SpeedRequest(BaseModel):
    multiplier: float

@router.get("/status")
def get_simulator_status():
    return {
        "is_running": simulator.is_running,
        "tick_speed_multiplier": simulator.tick_speed_multiplier,
        "active_anomaly": simulator.active_injected_anomaly,
        "last_tick_time": simulator.last_tick_time.isoformat() if simulator.last_tick_time else None,
        "total_ticks": simulator.tick_count,
    }

@router.post("/toggle")
def toggle_simulator():
    simulator.is_running = not simulator.is_running
    return {
        "is_running": simulator.is_running,
        "message": f"Simulator is now {'RUNNING' if simulator.is_running else 'PAUSED'}"
    }

@router.post("/tick")
def trigger_tick(db: Session = Depends(get_db)):
    readings = simulator.tick(db)
    return {
        "success": True,
        "readings_count": len(readings),
        "tick_count": simulator.tick_count,
    }

@router.post("/inject-anomaly")
def inject_anomaly(payload: InjectAnomalyRequest):
    simulator.inject_anomaly(
        anomaly_type=payload.anomaly_type,
        device_id=payload.device_id,
        duration_ticks=payload.duration_ticks,
    )
    return {
        "success": True,
        "message": f"Armed anomaly injection: {payload.anomaly_type}",
        "active_anomaly": simulator.active_injected_anomaly,
    }

@router.post("/clear-anomaly")
def clear_anomaly():
    simulator.clear_anomaly()
    return {
        "success": True,
        "message": "Anomaly cleared. Normal operation restored.",
    }

@router.post("/speed")
def set_speed(payload: SpeedRequest):
    mult = max(0.2, min(10.0, payload.multiplier))
    simulator.tick_speed_multiplier = mult
    return {
        "success": True,
        "speed_multiplier": mult,
    }
