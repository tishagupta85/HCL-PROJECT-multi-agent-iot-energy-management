import pytest
from starlette.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app.seed_data import seed_database

@pytest.fixture(scope="module")
def client():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_database(db)
    db.close()
    with TestClient(app) as test_client:
        yield test_client

def test_api_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

def test_api_get_devices(client):
    response = client.get("/api/devices")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 8
    assert "name" in data[0]
    assert "current_power_w" in data[0]

def test_api_device_toggle(client):
    devices = client.get("/api/devices").json()
    first_device = devices[0]
    dev_id = first_device["id"]
    initial_state = first_device["is_on"]

    response = client.post(f"/api/devices/{dev_id}/toggle")
    assert response.status_code == 200
    assert response.json()["is_on"] != initial_state

    # Toggle back
    client.post(f"/api/devices/{dev_id}/toggle")

def test_api_analytics_kpi(client):
    response = client.get("/api/analytics/kpi")
    assert response.status_code == 200
    data = response.json()
    assert "total_consumption_kwh" in data
    assert "current_demand_kw" in data
    assert "cost_today_usd" in data
    assert "efficiency_score" in data

def test_api_forecasts_24h(client):
    response = client.get("/api/forecasts/24h")
    assert response.status_code == 200
    data = response.json()
    assert "forecast_24h" in data
    assert len(data["forecast_24h"]) == 24

def test_api_anomalies(client):
    response = client.get("/api/anomalies")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_api_optimizations(client):
    response = client.get("/api/optimizations")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_api_run_coordinator(client):
    response = client.post("/api/agents/run-coordinator")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert "system_grade" in data["data"]
