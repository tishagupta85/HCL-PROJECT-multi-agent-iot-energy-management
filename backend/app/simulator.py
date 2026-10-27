import math
import random
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from models import Device, IoTReading
from app.config import settings

# 8 Realistic Appliances Specification
APPLIANCE_DEFAULTS = [
    {
        "name": "Living Room AC",
        "device_type": "HVAC",
        "room": "Living Room",
        "rated_watts": 1500.0,
        "is_on": True,
        "is_controllable": True,
        "priority": 2,
        "base_pf": 0.88,
    },
    {
        "name": "Kitchen Refrigerator",
        "device_type": "Refrigeration",
        "room": "Kitchen",
        "rated_watts": 300.0,
        "is_on": True,
        "is_controllable": False,  # Critical: do not auto-shutoff
        "priority": 1,
        "base_pf": 0.85,
    },
    {
        "name": "Washing Machine",
        "device_type": "Laundry",
        "room": "Utility Room",
        "rated_watts": 1200.0,
        "is_on": True,
        "is_controllable": True,
        "priority": 3,  # Flexible load: ideal for peak shaving
        "base_pf": 0.87,
    },
    {
        "name": "Water Heater (Geyser)",
        "device_type": "Water Heating",
        "room": "Bathroom",
        "rated_watts": 2000.0,
        "is_on": True,
        "is_controllable": True,
        "priority": 3,  # Flexible load
        "base_pf": 0.99,
    },
    {
        "name": "Smart TV & Soundbar",
        "device_type": "Entertainment",
        "room": "Living Room",
        "rated_watts": 200.0,
        "is_on": True,
        "is_controllable": True,
        "priority": 2,
        "base_pf": 0.94,
    },
    {
        "name": "Home Office Lighting",
        "device_type": "Lighting",
        "room": "Office",
        "rated_watts": 100.0,
        "is_on": True,
        "is_controllable": True,
        "priority": 2,
        "base_pf": 0.95,
    },
    {
        "name": "Workstation Laptop & Monitors",
        "device_type": "Computing",
        "room": "Office",
        "rated_watts": 65.0,
        "is_on": True,
        "is_controllable": True,
        "priority": 2,
        "base_pf": 0.96,
    },
    {
        "name": "Kitchen Microwave",
        "device_type": "Cooking",
        "room": "Kitchen",
        "rated_watts": 1000.0,
        "is_on": True,
        "is_controllable": True,
        "priority": 2,
        "base_pf": 0.97,
    },
]

class IoTSimulator:
    def __init__(self):
        self.is_running = True
        self.tick_speed_multiplier = 1.0
        self.active_injected_anomaly: Optional[Dict[str, Any]] = None
        self.last_tick_time: Optional[datetime] = None
        self.tick_count = 0

    def get_time_of_day_factor(self, dt: datetime, device_name: str) -> float:
        """Calculates realistic appliance load factor (0.0 to 1.1) based on diurnal cycles."""
        hour = dt.hour + dt.minute / 60.0

        if "Refrigerator" in device_name:
            cycle = 0.5 + 0.3 * math.sin(hour * math.pi * 2 / 1.5)
            day_lift = 0.2 if 8 <= hour <= 21 else 0.0
            return max(0.15, min(1.0, cycle + day_lift))

        elif "AC" in device_name:
            if 12 <= hour <= 22:
                peak_factor = math.sin((hour - 12) / 10.0 * math.pi)
                return 0.6 + 0.4 * peak_factor + random.uniform(-0.05, 0.05)
            elif 22 < hour or hour < 7:
                return 0.3 + random.uniform(-0.05, 0.05)
            else:
                return 0.2 + random.uniform(-0.05, 0.05)

        elif "Water Heater" in device_name:
            if 6 <= hour <= 9:
                return 0.85 + random.uniform(0.0, 0.15)
            elif 19 <= hour <= 21:
                return 0.75 + random.uniform(0.0, 0.15)
            else:
                return 0.08 if int(hour * 2) % 4 == 0 else 0.01

        elif "Washing Machine" in device_name:
            if (9 <= hour <= 11) or (18 <= hour <= 20):
                return 0.7 + 0.3 * math.sin(hour * 3.0)
            return 0.02

        elif "Smart TV" in device_name:
            if 18 <= hour <= 23:
                return 0.85 + random.uniform(-0.05, 0.1)
            elif 12 <= hour <= 14:
                return 0.4
            return 0.015

        elif "Lighting" in device_name:
            if 18 <= hour <= 23:
                return 0.95
            elif 6 <= hour <= 8:
                return 0.5
            return 0.0

        elif "Workstation" in device_name:
            if 9 <= hour <= 18:
                return 0.8 + random.uniform(-0.1, 0.15)
            return 0.08

        elif "Microwave" in device_name:
            if (7.0 <= hour <= 8.5) or (12.5 <= hour <= 13.5) or (19.5 <= hour <= 21.0):
                return 0.9 if random.random() < 0.4 else 0.01
            return 0.005

        return 0.5

    def generate_reading_for_device(
        self,
        device: Device,
        sim_time: datetime,
        delta_seconds: float = 2.0
    ) -> Dict[str, Any]:
        """Generates realistic physical electrical telemetry for a device."""
        rated_watts = device.rated_watts
        base_pf = 0.92

        if not device.is_on:
            return {
                "power_w": 0.0,
                "voltage_v": round(random.gauss(230.0, 0.8), 2),
                "current_a": 0.0,
                "power_factor": 1.0,
                "energy_kwh": 0.0,
                "is_anomaly": False,
            }

        factor = self.get_time_of_day_factor(sim_time, device.name)
        power_w = rated_watts * factor
        noise = random.gauss(0, max(2.0, rated_watts * 0.02))
        power_w = max(1.0, power_w + noise)

        voltage_v = random.gauss(230.0, 2.0)
        pf = min(0.99, max(0.70, base_pf + random.uniform(-0.02, 0.02)))
        is_anomaly = False

        # Injected anomaly handling
        if self.active_injected_anomaly:
            anom_type = self.active_injected_anomaly.get("type")
            target_device_id = self.active_injected_anomaly.get("device_id")

            if target_device_id is None or target_device_id == device.id:
                if anom_type == "AC_OVERLOAD" and "AC" in device.name:
                    power_w = rated_watts * 2.1  # 3150W spike
                    pf = 0.62  # Severe reactive drop
                    is_anomaly = True
                elif anom_type == "HEATER_RUNAWAY" and "Heater" in device.name:
                    power_w = rated_watts * 1.35  # Thermostat bypass runaway
                    is_anomaly = True
                elif anom_type == "VOLTAGE_SAG":
                    voltage_v = 192.5 + random.uniform(-2, 2)  # Severe grid sag
                    is_anomaly = True
                elif anom_type == "PHANTOM_DRAIN":
                    power_w += 320.0  # Parasitic load
                    is_anomaly = True

        voltage_v = round(voltage_v, 2)
        power_w = round(power_w, 2)
        current_a = round(power_w / (max(voltage_v * pf, 1.0)), 3)
        energy_kwh = round((power_w * (delta_seconds / 3600.0)) / 1000.0, 6)

        return {
            "power_w": power_w,
            "voltage_v": voltage_v,
            "current_a": current_a,
            "power_factor": round(pf, 3),
            "energy_kwh": energy_kwh,
            "is_anomaly": is_anomaly,
        }

    def tick(self, db: Session, sim_time: Optional[datetime] = None) -> List[IoTReading]:
        """Executes a simulation step across all registered devices."""
        if not self.is_running:
            return []

        now = sim_time or datetime.utcnow()
        devices = db.query(Device).all()
        if not devices:
            return []

        delta_sec = settings.SIMULATOR_INTERVAL_SECONDS * self.tick_speed_multiplier
        readings = []

        for dev in devices:
            data = self.generate_reading_for_device(dev, now, delta_seconds=delta_sec)
            reading = IoTReading(
                timestamp=now,
                device_id=dev.id,
                power_w=data["power_w"],
                voltage_v=data["voltage_v"],
                current_a=data["current_a"],
                power_factor=data["power_factor"],
                energy_kwh=data["energy_kwh"],
                is_anomaly=data["is_anomaly"],
            )
            db.add(reading)
            readings.append(reading)

        db.commit()
        self.last_tick_time = now
        self.tick_count += 1
        return readings

    def inject_anomaly(self, anomaly_type: str, device_id: Optional[int] = None, duration_ticks: int = 15):
        """Arms an anomaly injection for live demonstration."""
        self.active_injected_anomaly = {
            "type": anomaly_type,
            "device_id": device_id,
            "remaining_ticks": duration_ticks,
        }

    def clear_anomaly(self):
        self.active_injected_anomaly = None

simulator = IoTSimulator()
