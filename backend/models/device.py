from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from app.database import Base

class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    device_type = Column(String(50), nullable=False)
    room = Column(String(50), nullable=False)
    rated_watts = Column(Float, nullable=False)
    is_on = Column(Boolean, default=True)
    is_controllable = Column(Boolean, default=True)
    priority = Column(Integer, default=2)  # 1: Critical (Fridge), 2: Normal, 3: Flexible (Water heater, EV)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "device_type": self.device_type,
            "room": self.room,
            "rated_watts": self.rated_watts,
            "is_on": self.is_on,
            "is_controllable": self.is_controllable,
            "priority": self.priority,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
