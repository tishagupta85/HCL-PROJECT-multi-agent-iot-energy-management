from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from models import Device, IoTReading
from app.config import settings
from .base_agent import BaseAgent

class MonitoringAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Monitoring Agent",
            description="Collects, cleans, and validates IoT sensor telemetry, assessing sensor health and grid voltage integrity."
        )

    def execute(self, db: Session, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        devices = db.query(Device).all()
        if not devices:
            return {"summary": "No devices registered in system.", "sensor_health_score": 100.0}

        device_statuses = []
        total_active_power_w = 0.0
        total_current_a = 0.0
        voltage_violations = []
        pf_warnings = []
        sensor_issues = 0
        total_sensors_checked = len(devices)

        # Look at the latest reading for each device
        for dev in devices:
            latest = (
                db.query(IoTReading)
                .filter(IoTReading.device_id == dev.id)
                .order_by(desc(IoTReading.timestamp))
                .first()
            )

            if not latest:
                sensor_issues += 1
                device_statuses.append({
                    "device_id": dev.id,
                    "name": dev.name,
                    "status": "OFFLINE_NO_DATA",
                    "health": "CRITICAL",
                })
                continue

            # Data Integrity Checks
            issues_found = []
            
            # Voltage check (230V nominal ± 8%)
            min_v = settings.VOLTAGE_NOMINAL * (1.0 - settings.VOLTAGE_TOLERANCE_PCT)
            max_v = settings.VOLTAGE_NOMINAL * (1.0 + settings.VOLTAGE_TOLERANCE_PCT)
            if not (min_v <= latest.voltage_v <= max_v):
                issues_found.append(f"Voltage out of bounds: {latest.voltage_v}V")
                voltage_violations.append({
                    "device": dev.name,
                    "voltage": latest.voltage_v,
                    "nominal": settings.VOLTAGE_NOMINAL,
                })

            # Power Factor check
            if dev.is_on and latest.power_w > 50.0 and latest.power_factor < 0.75:
                issues_found.append(f"Poor power factor: {latest.power_factor}")
                pf_warnings.append({"device": dev.name, "pf": latest.power_factor})

            # Overpower check
            if latest.power_w > dev.rated_watts * 1.8:
                issues_found.append(f"Power exceeded rated maximum: {latest.power_w}W > {dev.rated_watts}W")

            if issues_found:
                sensor_issues += 0.5

            total_active_power_w += latest.power_w
            total_current_a += latest.current_a

            device_statuses.append({
                "device_id": dev.id,
                "name": dev.name,
                "power_w": round(latest.power_w, 1),
                "voltage_v": round(latest.voltage_v, 1),
                "current_a": round(latest.current_a, 2),
                "power_factor": round(latest.power_factor, 2),
                "is_on": dev.is_on,
                "health": "WARNING" if issues_found else "HEALTHY",
                "issues": issues_found,
            })

        # Calculate Sensor Health Score (0 - 100%)
        health_ratio = max(0.0, 1.0 - (sensor_issues / max(total_sensors_checked, 1)))
        sensor_health_score = round(health_ratio * 100.0, 1)

        total_kw = round(total_active_power_w / 1000.0, 3)
        grid_limit_kw = settings.GRID_CAPACITY_LIMIT_KW
        headroom_kw = round(max(0.0, grid_limit_kw - total_kw), 3)

        summary = (
            f"Validated {len(devices)} IoT sensors. Health Score: {sensor_health_score}%. "
            f"Current total load: {total_kw} kW ({round((total_kw / grid_limit_kw)*100, 1)}% of grid capacity)."
        )

        return {
            "summary": summary,
            "sensor_health_score": sensor_health_score,
            "total_active_power_kw": total_kw,
            "total_current_a": round(total_current_a, 2),
            "grid_limit_kw": grid_limit_kw,
            "grid_headroom_kw": headroom_kw,
            "device_statuses": device_statuses,
            "voltage_violations": voltage_violations,
            "pf_warnings": pf_warnings,
        }
