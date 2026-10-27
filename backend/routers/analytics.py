from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from app.database import get_db
from models import Device, IoTReading, Alert
from app.config import settings

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/kpi")
def get_kpi_metrics(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    start_of_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    start_of_yesterday = start_of_today - timedelta(days=1)

    # Today's total energy in kWh
    today_kwh_sum = (
        db.query(func.sum(IoTReading.energy_kwh))
        .filter(IoTReading.timestamp >= start_of_today)
        .scalar()
    ) or 0.0

    # Yesterday's total energy in kWh
    yesterday_kwh_sum = (
        db.query(func.sum(IoTReading.energy_kwh))
        .filter(
            IoTReading.timestamp >= start_of_yesterday,
            IoTReading.timestamp < start_of_today
        )
        .scalar()
    ) or 0.0

    # Current instantaneous demand (kW)
    devices = db.query(Device).all()
    current_power_w = 0.0
    for d in devices:
        latest = (
            db.query(IoTReading)
            .filter(IoTReading.device_id == d.id)
            .order_by(desc(IoTReading.timestamp))
            .first()
        )
        if latest and d.is_on:
            current_power_w += latest.power_w

    current_demand_kw = round(current_power_w / 1000.0, 2)

    # Peak demand today
    today_peak_w = (
        db.query(func.max(IoTReading.power_w))
        .filter(IoTReading.timestamp >= start_of_today)
        .scalar()
    ) or current_power_w
    peak_demand_kw = round(today_peak_w / 1000.0, 2)

    # Cost Calculation: blended approx $0.18/kWh
    blended_rate = (settings.TARIFF_PEAK_RATE + settings.TARIFF_OFF_PEAK_RATE) / 2.0
    cost_today = round(today_kwh_sum * blended_rate, 2)
    cost_yesterday = round(yesterday_kwh_sum * blended_rate, 2)

    # Carbon Footprint (Avg grid emission factor: 0.42 kg CO2 / kWh)
    carbon_kg_today = round(today_kwh_sum * 0.42, 2)

    # Efficiency Score based on active alerts and load factor
    unresolved_alerts = db.query(Alert).filter(Alert.is_resolved == False).count()
    efficiency_score = max(50.0, min(98.0, 95.0 - (unresolved_alerts * 6.5)))

    # % changes
    kwh_change_pct = (
        round(((today_kwh_sum - yesterday_kwh_sum) / max(yesterday_kwh_sum, 0.1)) * 100.0, 1)
        if yesterday_kwh_sum > 0 else 0.0
    )

    return {
        "total_consumption_kwh": round(today_kwh_sum, 2),
        "consumption_change_pct": kwh_change_pct,
        "current_demand_kw": current_demand_kw,
        "peak_demand_kw": peak_demand_kw,
        "cost_today_usd": cost_today,
        "cost_yesterday_usd": cost_yesterday,
        "carbon_footprint_kg": carbon_kg_today,
        "efficiency_score": round(efficiency_score, 1),
        "unresolved_alerts_count": unresolved_alerts,
        "grid_limit_kw": settings.GRID_CAPACITY_LIMIT_KW,
    }

@router.get("/device-breakdown")
def get_device_breakdown(db: Session = Depends(get_db)):
    devices = db.query(Device).all()
    since = datetime.utcnow() - timedelta(days=1)
    
    breakdown = []
    total_all = 0.0

    for d in devices:
        dev_kwh = (
            db.query(func.sum(IoTReading.energy_kwh))
            .filter(IoTReading.device_id == d.id, IoTReading.timestamp >= since)
            .scalar()
        ) or 0.0
        total_all += dev_kwh
        breakdown.append({
            "device_id": d.id,
            "device_name": d.name,
            "room": d.room,
            "device_type": d.device_type,
            "kwh": round(dev_kwh, 2),
        })

    # Add percentages
    for item in breakdown:
        pct = (item["kwh"] / max(total_all, 0.001)) * 100.0
        item["percentage"] = round(pct, 1)

    breakdown.sort(key=lambda x: x["kwh"], reverse=True)
    return breakdown

@router.get("/hourly-trend")
def get_hourly_trend(db: Session = Depends(get_db)):
    since = datetime.utcnow() - timedelta(hours=24)
    readings = (
        db.query(
            IoTReading.timestamp,
            func.sum(IoTReading.power_w).label("total_w"),
            func.avg(IoTReading.voltage_v).label("avg_v"),
        )
        .filter(IoTReading.timestamp >= since)
        .group_by(IoTReading.timestamp)
        .order_by(IoTReading.timestamp.asc())
        .all()
    )

    points = []
    for r in readings:
        kw = round((r.total_w or 0.0) / 1000.0, 2)
        hour = r.timestamp.hour
        is_peak = (14 <= hour <= 20)
        points.append({
            "timestamp": r.timestamp.isoformat(),
            "time_label": r.timestamp.strftime("%H:%M"),
            "demand_kw": kw,
            "voltage_v": round(r.avg_v or 230.0, 1),
            "is_peak_tariff": is_peak,
            "tariff_rate": settings.TARIFF_PEAK_RATE if is_peak else settings.TARIFF_OFF_PEAK_RATE,
        })
    return points
