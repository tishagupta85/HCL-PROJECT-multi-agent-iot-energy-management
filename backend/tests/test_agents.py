import pytest
from app.database import Base, engine, SessionLocal
from app.seed_data import seed_database
from agents import (
    MonitoringAgent,
    ForecastingAgent,
    AnomalyDetectionAgent,
    OptimizationAgent,
    CoordinatorAgent,
)

@pytest.fixture(scope="module")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_database(db)
    yield db
    db.close()

def test_monitoring_agent(db_session):
    agent = MonitoringAgent()
    result = agent.run(db_session)
    assert result["status"] == "SUCCESS"
    assert "sensor_health_score" in result["data"]
    assert 0 <= result["data"]["sensor_health_score"] <= 100
    assert result["data"]["total_active_power_kw"] >= 0

def test_forecasting_agent(db_session):
    agent = ForecastingAgent()
    result = agent.run(db_session)
    assert result["status"] == "SUCCESS"
    data = result["data"]
    assert "forecast_24h" in data
    assert len(data["forecast_24h"]) == 24
    assert data["projected_peak_kw"] > 0
    # Check confidence interval bounds
    first_hour = data["forecast_24h"][0]
    assert first_hour["lower_ci_kw"] <= first_hour["predicted_kw"] <= first_hour["upper_ci_kw"]

def test_anomaly_detection_agent(db_session):
    agent = AnomalyDetectionAgent()
    result = agent.run(db_session)
    assert result["status"] == "SUCCESS"
    assert "anomalies_detected_count" in result["data"]
    assert result["data"]["anomalies_detected_count"] >= 0

def test_optimization_agent(db_session):
    agent = OptimizationAgent()
    result = agent.run(db_session)
    assert result["status"] == "SUCCESS"
    data = result["data"]
    assert "total_potential_kwh_savings" in data
    assert data["total_potential_kwh_savings"] >= 0

def test_coordinator_agent(db_session):
    coordinator = CoordinatorAgent()
    result = coordinator.run(db_session)
    assert result["status"] == "SUCCESS"
    data = result["data"]
    assert "system_grade" in data
    assert data["system_grade"] in ["A+", "A", "B", "C", "D", "CRITICAL"]
    assert "grid_stability_index" in data
    assert 0 <= data["grid_stability_index"] <= 100
    assert len(data["coordinated_decisions"]) > 0
