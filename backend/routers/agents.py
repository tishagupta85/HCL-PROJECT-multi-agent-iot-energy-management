from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from models import AgentLog
from agents import (
    MonitoringAgent,
    ForecastingAgent,
    AnomalyDetectionAgent,
    OptimizationAgent,
    CoordinatorAgent,
)

router = APIRouter(prefix="/api/agents", tags=["agents"])

mon_agent = MonitoringAgent()
fc_agent = ForecastingAgent()
anom_agent = AnomalyDetectionAgent()
opt_agent = OptimizationAgent()
coord_agent = CoordinatorAgent()

AGENT_MAP = {
    "monitoring": mon_agent,
    "forecasting": fc_agent,
    "anomaly": anom_agent,
    "optimization": opt_agent,
    "coordinator": coord_agent,
}

@router.post("/run-coordinator")
def run_coordinator_workflow(db: Session = Depends(get_db)):
    result = coord_agent.run(db)
    return result

@router.post("/run/{agent_key}")
def run_single_agent(agent_key: str, db: Session = Depends(get_db)):
    agent = AGENT_MAP.get(agent_key.lower())
    if not agent:
        raise HTTPException(
            status_code=404,
            detail=f"Agent '{agent_key}' not found. Available: {list(AGENT_MAP.keys())}"
        )
    return agent.run(db)

@router.get("/status")
def get_agents_status(db: Session = Depends(get_db)):
    agents_info = [
        {"key": "monitoring", "name": "Monitoring Agent", "role": "IoT Ingestion & Telemetry Validation", "priority": 1},
        {"key": "forecasting", "name": "Forecasting Agent", "role": "ML Load & Demand Prediction", "priority": 2},
        {"key": "anomaly", "name": "Anomaly Detection Agent", "role": "Fault & Overconsumption Identification", "priority": 3},
        {"key": "optimization", "name": "Optimization Agent", "role": "Dynamic Peak Shaving & Energy Savings", "priority": 4},
        {"key": "coordinator", "name": "Coordinator Agent", "role": "Multi-Agent Decision Arbiter & Dispatch", "priority": 5},
    ]

    status_list = []
    for a in agents_info:
        last_log = (
            db.query(AgentLog)
            .filter(AgentLog.agent_name.ilike(f"%{a['name'].split()[0]}%"))
            .order_by(desc(AgentLog.timestamp))
            .first()
        )
        status_list.append({
            "key": a["key"],
            "name": a["name"],
            "role": a["role"],
            "priority": a["priority"],
            "last_status": last_log.status if last_log else "IDLE",
            "last_run": last_log.timestamp.isoformat() if last_log else None,
            "last_duration_ms": last_log.execution_time_ms if last_log else None,
            "last_summary": last_log.summary if last_log else "Ready to execute.",
        })
    return status_list

@router.get("/history")
def get_agent_history(limit: int = 50, db: Session = Depends(get_db)):
    logs = (
        db.query(AgentLog)
        .order_by(desc(AgentLog.timestamp))
        .limit(limit)
        .all()
    )
    return [l.to_dict() for l in logs]
