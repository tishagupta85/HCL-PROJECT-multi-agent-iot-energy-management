from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from app.database import Base

class Recommendation(Base):
    __tablename__ = 'recommendations'

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    device_id = Column(Integer, ForeignKey('devices.id'), nullable=True)
    action_type = Column(String(50), nullable=False) # PEAK_SHAVING, LOAD_SHIFT, THERMOSTAT_ADJUST, PHANTOM_POWER_CUT, ECO_MODE
    title = Column(String(150), nullable=False)
    description = Column(String(500), nullable=False)
    potential_kwh_savings = Column(Float, default=0.0)
    potential_cost_savings = Column(Float, default=0.0)
    priority = Column(String(20), default='MEDIUM') # HIGH, MEDIUM, LOW
    status = Column(String(20), default='PENDING')   # PENDING, APPLIED, DISMISSED
    applied_at = Column(DateTime, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'device_id': self.device_id,
            'action_type': self.action_type,
            'title': self.title,
            'description': self.description,
            'potential_kwh_savings': round(self.potential_kwh_savings, 2),
            'potential_cost_savings': round(self.potential_cost_savings, 2),
            'priority': self.priority,
            'status': self.status,
            'applied_at': self.applied_at.isoformat() if self.applied_at else None,
        }
