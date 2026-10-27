from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from app.database import Base

class Alert(Base):
    __tablename__ = 'alerts'

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    device_id = Column(Integer, ForeignKey('devices.id'), nullable=True)
    severity = Column(String(20), nullable=False)  # CRITICAL, WARNING, INFO
    alert_type = Column(String(50), nullable=False) # ANOMALY_SPIKE, OVERLOAD, VOLTAGE_SAG, CONTINUOUS_LEAK
    title = Column(String(150), nullable=False)
    message = Column(String(500), nullable=False)
    metric_value = Column(Float, nullable=True)
    threshold_value = Column(Float, nullable=True)
    is_resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'device_id': self.device_id,
            'severity': self.severity,
            'alert_type': self.alert_type,
            'title': self.title,
            'message': self.message,
            'metric_value': round(self.metric_value, 2) if self.metric_value is not None else None,
            'threshold_value': round(self.threshold_value, 2) if self.threshold_value is not None else None,
            'is_resolved': self.is_resolved,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
        }
