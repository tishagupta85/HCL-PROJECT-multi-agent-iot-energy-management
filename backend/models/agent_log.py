from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from app.database import Base

class AgentLog(Base):
    __tablename__ = 'agent_executions'

    id = Column(Integer, primary_key=True, index=True)
    agent_name = Column(String(50), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    status = Column(String(20), nullable=False)  # SUCCESS, WARNING, FAILED
    execution_time_ms = Column(Float, nullable=False)
    summary = Column(String(255), nullable=False)
    details_json = Column(Text, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'agent_name': self.agent_name,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'status': self.status,
            'execution_time_ms': round(self.execution_time_ms, 2),
            'summary': self.summary,
            'details_json': self.details_json,
        }
