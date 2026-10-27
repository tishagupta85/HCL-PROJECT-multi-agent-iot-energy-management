from datetime import datetime
from sqlalchemy import Column, Integer, Float, Boolean, DateTime, ForeignKey, Index
from app.database import Base

class IoTReading(Base):
    __tablename__ = "iot_readings"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=False, index=True)
    power_w = Column(Float, nullable=False)
    voltage_v = Column(Float, nullable=False)
    current_a = Column(Float, nullable=False)
    power_factor = Column(Float, default=0.95)
    energy_kwh = Column(Float, default=0.0)
    is_anomaly = Column(Boolean, default=False)

    __table_args__ = (
        Index("idx_device_timestamp", "device_id", "timestamp"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "device_id": self.device_id,
            "power_w": round(self.power_w, 2),
            "voltage_v": round(self.voltage_v, 2),
            "current_a": round(self.current_a, 3),
            "power_factor": round(self.power_factor, 3),
            "energy_kwh": round(self.energy_kwh, 4),
            "is_anomaly": self.is_anomaly,
        }
