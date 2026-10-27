import json
import time
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from models import AgentLog

class BaseAgent(ABC):
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description

    @abstractmethod
    def execute(self, db: Session, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Execute the agent's core decision logic."""
        pass

    def run(self, db: Session, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Runs the agent, measures execution time, and persists execution log."""
        start_time = time.perf_counter()
        timestamp = datetime.utcnow()
        status = "SUCCESS"
        summary = ""
        result_data = {}

        try:
            result_data = self.execute(db, context)
            summary = result_data.get("summary", f"{self.name} completed successfully.")
        except Exception as e:
            status = "FAILED"
            summary = f"Execution error in {self.name}: {str(e)}"
            result_data = {"error": str(e)}

        duration_ms = (time.perf_counter() - start_time) * 1000.0

        # Persist log
        try:
            log_entry = AgentLog(
                agent_name=self.name,
                timestamp=timestamp,
                status=status,
                execution_time_ms=duration_ms,
                summary=summary[:255],
                details_json=json.dumps(result_data, default=str),
            )
            db.add(log_entry)
            db.commit()
        except Exception as log_err:
            db.rollback()
            print(f"[AGENT LOG ERROR] Failed to record agent log: {log_err}")

        return {
            "agent_name": self.name,
            "status": status,
            "timestamp": timestamp.isoformat(),
            "execution_time_ms": round(duration_ms, 2),
            "summary": summary,
            "data": result_data,
        }
