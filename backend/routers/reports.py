import io
import csv
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.database import get_db
from models import Device, IoTReading, Alert, Recommendation, AgentLog
from app.config import settings

router = APIRouter(prefix="/api/reports", tags=["reports"])

@router.get("/summary")
def get_report_summary(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    last_7d = now - timedelta(days=7)

    # 7-day stats
    total_7d_kwh = (
        db.query(func.sum(IoTReading.energy_kwh))
        .filter(IoTReading.timestamp >= last_7d)
        .scalar()
    ) or 0.0

    peak_w = (
        db.query(func.max(IoTReading.power_w))
        .filter(IoTReading.timestamp >= last_7d)
        .scalar()
    ) or 0.0

    blended_rate = (settings.TARIFF_PEAK_RATE + settings.TARIFF_OFF_PEAK_RATE) / 2.0
    cost_7d = round(total_7d_kwh * blended_rate, 2)
    carbon_kg = round(total_7d_kwh * 0.42, 2)

    # Applied savings
    applied_recs = db.query(Recommendation).filter(Recommendation.status == "APPLIED").all()
    kwh_saved = sum(r.potential_kwh_savings for r in applied_recs)
    cost_saved = sum(r.potential_cost_savings for r in applied_recs)

    alerts_total = db.query(Alert).filter(Alert.timestamp >= last_7d).count()
    alerts_resolved = db.query(Alert).filter(Alert.timestamp >= last_7d, Alert.is_resolved == True).count()

    agent_runs_count = db.query(AgentLog).filter(AgentLog.timestamp >= last_7d).count()

    devices = db.query(Device).all()

    return {
        "report_id": f"RPT-{now.strftime('%Y%m%d%H%M')}",
        "generated_at": now.isoformat(),
        "period": "Last 7 Days",
        "total_consumption_kwh": round(total_7d_kwh, 2),
        "peak_demand_kw": round(peak_w / 1000.0, 2),
        "total_cost_usd": cost_7d,
        "carbon_footprint_kg": carbon_kg,
        "energy_efficiency_grade": "A" if total_7d_kwh < 200 else "B+",
        "total_applied_savings_kwh": round(kwh_saved, 2),
        "total_applied_savings_usd": round(cost_saved, 2),
        "alerts_summary": {
            "total_detected": alerts_total,
            "resolved": alerts_resolved,
            "resolution_rate_pct": round((alerts_resolved / max(alerts_total, 1)) * 100.0, 1),
        },
        "agents_summary": {
            "total_orchestration_cycles": agent_runs_count,
            "system_health": "OPTIMAL",
        },
        "devices_count": len(devices),
    }

@router.get("/export")
def export_telemetry_csv(limit: int = 500, db: Session = Depends(get_db)):
    readings = (
        db.query(IoTReading)
        .order_by(IoTReading.timestamp.desc())
        .limit(limit)
        .all()
    )

    devices = {d.id: d.name for d in db.query(Device).all()}

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Timestamp", "Device Name", "Power (W)", "Voltage (V)", "Current (A)", "Power Factor", "Energy (kWh)", "Is Anomaly"])

    for r in readings:
        writer.writerow([
            r.id,
            r.timestamp.isoformat() if r.timestamp else "",
            devices.get(r.device_id, f"Device {r.device_id}"),
            r.power_w,
            r.voltage_v,
            r.current_a,
            r.power_factor,
            r.energy_kwh,
            "YES" if r.is_anomaly else "NO"
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=iot_energy_telemetry_{datetime.utcnow().strftime('%Y%m%d')}.csv"}
    )
