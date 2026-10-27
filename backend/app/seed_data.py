from datetime import datetime, timedelta
import random
from sqlalchemy.orm import Session
from models import Device, IoTReading, Alert, Recommendation, AgentLog
from app.simulator import APPLIANCE_DEFAULTS, simulator

def seed_database(db: Session):
    """Seeds 8 devices, 7 days of historical readings, and sample alerts/recommendations."""
    # 1. Seed Devices
    existing_devices = db.query(Device).all()
    if not existing_devices:
        print("[SEED] Creating 8 realistic appliances...")
        for dev_spec in APPLIANCE_DEFAULTS:
            dev = Device(
                name=dev_spec["name"],
                device_type=dev_spec["device_type"],
                room=dev_spec["room"],
                rated_watts=dev_spec["rated_watts"],
                is_on=dev_spec["is_on"],
                is_controllable=dev_spec["is_controllable"],
                priority=dev_spec["priority"],
            )
            db.add(dev)
        db.commit()
        existing_devices = db.query(Device).all()

    device_map = {d.name: d for d in existing_devices}

    # 2. Seed 7 Days of Historical Telemetry (Hourly)
    reading_count = db.query(IoTReading).count()
    if reading_count < 100:
        print("[SEED] Generating 7 days (168 hours) of baseline telemetry...")
        now = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
        start_time = now - timedelta(days=7)
        
        batch = []
        current = start_time
        while current <= now:
            for dev in existing_devices:
                # 1 hour = 3600 seconds
                data = simulator.generate_reading_for_device(dev, current, delta_seconds=3600.0)
                
                # Occasionally insert a realistic historical anomaly
                is_hist_anomaly = False
                if dev.name == "Living Room AC" and current.hour == 16 and (now - current).days == 2:
                    data["power_w"] = 2850.0 # historical spike
                    data["is_anomaly"] = True
                    is_hist_anomaly = True

                reading = IoTReading(
                    timestamp=current,
                    device_id=dev.id,
                    power_w=data["power_w"],
                    voltage_v=data["voltage_v"],
                    current_a=data["current_a"],
                    power_factor=data["power_factor"],
                    energy_kwh=data["energy_kwh"],
                    is_anomaly=is_hist_anomaly,
                )
                batch.append(reading)
            current += timedelta(hours=1)
        
        db.bulk_save_objects(batch)
        db.commit()
        print(f"[SEED] Seeded {len(batch)} historical readings.")

    # 3. Seed Sample Alerts
    alert_count = db.query(Alert).count()
    if alert_count == 0:
        print("[SEED] Seeding realistic sample anomaly alerts...")
        ac_dev = device_map.get("Living Room AC")
        heater_dev = device_map.get("Water Heater (Geyser)")

        sample_alerts = [
            Alert(
                timestamp=datetime.utcnow() - timedelta(hours=3),
                device_id=ac_dev.id if ac_dev else None,
                severity="CRITICAL",
                alert_type="ANOMALY_SPIKE",
                title="Compressor Power Surge Detected",
                message="Living Room AC power spiked to 2,850W (+90% above 1500W rated capacity). Power factor degraded to 0.64.",
                metric_value=2850.0,
                threshold_value=1800.0,
                is_resolved=False,
            ),
            Alert(
                timestamp=datetime.utcnow() - timedelta(hours=8),
                device_id=heater_dev.id if heater_dev else None,
                severity="WARNING",
                alert_type="CONTINUOUS_LEAK",
                title="Extended High Duty Cycle",
                message="Water Heater maintained active 2,000W load for over 180 continuous minutes during non-peak window.",
                metric_value=2000.0,
                threshold_value=1200.0,
                is_resolved=False,
            ),
            Alert(
                timestamp=datetime.utcnow() - timedelta(days=1),
                device_id=None,
                severity="INFO",
                alert_type="VOLTAGE_SAG",
                title="Grid Voltage Fluctuation",
                message="Main grid feed experienced transient sag to 208.4V. Nominal voltage restored within 42 seconds.",
                metric_value=208.4,
                threshold_value=211.6,
                is_resolved=True,
                resolved_at=datetime.utcnow() - timedelta(days=1) + timedelta(minutes=45),
            )
        ]
        db.add_all(sample_alerts)
        db.commit()

    # 4. Seed Optimization Recommendations
    rec_count = db.query(Recommendation).count()
    if rec_count == 0:
        print("[SEED] Seeding energy-saving optimization actions...")
        washer_dev = device_map.get("Washing Machine")
        heater_dev = device_map.get("Water Heater (Geyser)")
        ac_dev = device_map.get("Living Room AC")

        sample_recs = [
            Recommendation(
                timestamp=datetime.utcnow() - timedelta(hours=2),
                device_id=washer_dev.id if washer_dev else None,
                action_type="PEAK_SHAVING",
                title="Shift Laundry Cycle Outside Peak Tariff",
                description="Reschedule Washing Machine operation from peak rate (17:00 - 20:00 @ $0.28/kWh) to night off-peak window (22:00 @ $0.12/kWh).",
                potential_kwh_savings=1.8,
                potential_cost_savings=0.45,
                priority="HIGH",
                status="PENDING",
            ),
            Recommendation(
                timestamp=datetime.utcnow() - timedelta(hours=1),
                device_id=ac_dev.id if ac_dev else None,
                action_type="THERMOSTAT_ADJUST",
                title="Smart AC Pre-Cooling & Eco Setpoint",
                description="Raise AC setpoint by +1.5°C between 14:00 - 18:00 with pre-cooling at 13:00. Reduces peak compressor draw while maintaining thermal comfort.",
                potential_kwh_savings=3.4,
                potential_cost_savings=0.95,
                priority="HIGH",
                status="PENDING",
            ),
            Recommendation(
                timestamp=datetime.utcnow() - timedelta(hours=4),
                device_id=heater_dev.id if heater_dev else None,
                action_type="ECO_MODE",
                title="Water Heater Smart Schedule",
                description="Activate smart thermostat timer to suppress heating between 10:00 - 17:00 when home is unoccupied.",
                potential_kwh_savings=2.6,
                potential_cost_savings=0.72,
                priority="MEDIUM",
                status="APPLIED",
                applied_at=datetime.utcnow() - timedelta(hours=1),
            ),
        ]
        db.add_all(sample_recs)
        db.commit()
