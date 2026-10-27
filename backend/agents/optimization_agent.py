from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import desc
from models import Device, IoTReading, Recommendation
from app.config import settings
from .base_agent import BaseAgent

class OptimizationAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Optimization Agent",
            description="Recommends energy-saving actions, peak-shaving schedules, and load curtailment based on tariff pricing and flexible devices."
        )

    def execute(self, db: Session, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        now = datetime.utcnow()
        current_hour = now.hour
        is_peak_tariff = (14 <= current_hour <= 20)
        current_rate = settings.TARIFF_PEAK_RATE if is_peak_tariff else settings.TARIFF_OFF_PEAK_RATE

        devices = db.query(Device).all()
        device_map = {d.id: d for d in devices}

        recommendations_generated = []
        total_potential_kwh = 0.0
        total_potential_cost = 0.0

        # Check latest device consumption
        for dev in devices:
            latest = (
                db.query(IoTReading)
                .filter(IoTReading.device_id == dev.id)
                .order_by(desc(IoTReading.timestamp))
                .first()
            )
            power_w = latest.power_w if latest else 0.0

            # 1. Flexible Load Shifting during Peak Tariff Hours
            if dev.priority == 3 and dev.is_on and power_w > 400.0:
                # Device is running high power flexible load (e.g. Washer or Water Heater)
                kwh_per_cycle = round((power_w * 1.5) / 1000.0, 2)
                cost_diff = (settings.TARIFF_PEAK_RATE - settings.TARIFF_OFF_PEAK_RATE) * kwh_per_cycle

                rec = self._create_or_update_rec(
                    db=db,
                    device_id=dev.id,
                    action_type="PEAK_SHAVING",
                    title=f"Shift {dev.name} to Off-Peak Hours",
                    description=(
                        f"{dev.name} is consuming {power_w:.0f}W during high-tariff period (${current_rate}/kWh). "
                        f"Delaying operation until 21:00 (${settings.TARIFF_OFF_PEAK_RATE}/kWh) saves money without compromising convenience."
                    ),
                    kwh_savings=kwh_per_cycle,
                    cost_savings=round(max(0.10, cost_diff), 2),
                    priority="HIGH" if is_peak_tariff else "MEDIUM",
                )
                recommendations_generated.append(rec)
                total_potential_kwh += rec.potential_kwh_savings
                total_potential_cost += rec.potential_cost_savings

            # 2. HVAC Smart Temperature Setback
            if "AC" in dev.name and dev.is_on and power_w > 800.0:
                kwh_savings = round((power_w * 0.15 * 4.0) / 1000.0, 2) # 15% reduction over 4 hours
                cost_savings = round(kwh_savings * current_rate, 2)
                rec = self._create_or_update_rec(
                    db=db,
                    device_id=dev.id,
                    action_type="THERMOSTAT_ADJUST",
                    title="Activate AC Dynamic Eco Setpoint (+1.5°C)",
                    description=(
                        f"Raise {dev.name} setpoint by 1.5°C during current high heat index. "
                        f"Maintains 98% thermal comfort score while trimming compressor cycling by 15%."
                    ),
                    kwh_savings=kwh_savings,
                    cost_savings=cost_savings,
                    priority="HIGH",
                )
                recommendations_generated.append(rec)
                total_potential_kwh += rec.potential_kwh_savings
                total_potential_cost += rec.potential_cost_savings

            # 3. Phantom Load / Vampire Draw Elimination
            if ("TV" in dev.name or "Workstation" in dev.name) and (power_w > 15.0 and (current_hour >= 23 or current_hour <= 5)):
                kwh_savings = round((power_w * 7.0) / 1000.0, 2)
                cost_savings = round(kwh_savings * settings.TARIFF_OFF_PEAK_RATE, 2)
                rec = self._create_or_update_rec(
                    db=db,
                    device_id=dev.id,
                    action_type="PHANTOM_POWER_CUT",
                    title=f"Cut Vampire Draw on {dev.name}",
                    description=(
                        f"{dev.name} is consuming {power_w:.0f}W idle standby power overnight. "
                        f"Engage smart plug deep-sleep shutdown."
                    ),
                    kwh_savings=kwh_savings,
                    cost_savings=cost_savings,
                    priority="LOW",
                )
                recommendations_generated.append(rec)
                total_potential_kwh += rec.potential_kwh_savings
                total_potential_cost += rec.potential_cost_savings

        db.commit()

        summary = (
            f"Generated {len(recommendations_generated)} energy-saving recommendations. "
            f"Total potential daily reduction: {total_potential_kwh:.2f} kWh (${total_potential_cost:.2f}/day)."
        )

        return {
            "summary": summary,
            "recommendations_count": len(recommendations_generated),
            "total_potential_kwh_savings": round(total_potential_kwh, 2),
            "total_potential_cost_savings": round(total_potential_cost, 2),
            "current_tariff_window": "PEAK" if is_peak_tariff else "OFF_PEAK",
            "current_tariff_rate": current_rate,
        }

    def _create_or_update_rec(
        self,
        db: Session,
        device_id: int,
        action_type: str,
        title: str,
        description: str,
        kwh_savings: float,
        cost_savings: float,
        priority: str
    ) -> Recommendation:
        existing = (
            db.query(Recommendation)
            .filter(
                Recommendation.device_id == device_id,
                Recommendation.action_type == action_type,
                Recommendation.status == "PENDING"
            )
            .first()
        )
        if existing:
            existing.title = title
            existing.description = description
            existing.potential_kwh_savings = kwh_savings
            existing.potential_cost_savings = cost_savings
            existing.priority = priority
            return existing

        new_rec = Recommendation(
            timestamp=datetime.utcnow(),
            device_id=device_id,
            action_type=action_type,
            title=title,
            description=description,
            potential_kwh_savings=kwh_savings,
            potential_cost_savings=cost_savings,
            priority=priority,
            status="PENDING",
        )
        db.add(new_rec)
        return new_rec
