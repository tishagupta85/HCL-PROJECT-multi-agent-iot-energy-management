import pytest
from datetime import datetime
from app.database import Base, engine, SessionLocal
from models import Device, IoTReading
from app.simulator import simulator, APPLIANCE_DEFAULTS
from app.seed_data import seed_database

@pytest.fixture(scope="module")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_database(db)
    yield db
    db.close()

def test_eight_appliances_exist(db_session):
    devices = db_session.query(Device).all()
    assert len(devices) >= 8
    names = [d.name for d in devices]
    assert "Living Room AC" in names
    assert "Kitchen Refrigerator" in names
    assert "Washing Machine" in names
    assert "Water Heater (Geyser)" in names

def test_simulator_reading_physics(db_session):
    ac_device = db_session.query(Device).filter(Device.name == "Living Room AC").first()
    assert ac_device is not None
    
    # Test reading with device ON
    ac_device.is_on = True
    now = datetime(2026, 6, 15, 14, 0, 0) # 2 PM peak afternoon
    reading = simulator.generate_reading_for_device(ac_device, now, delta_seconds=2.0)
    
    assert reading["power_w"] > 0
    assert 200.0 <= reading["voltage_v"] <= 260.0
    assert 0.70 <= reading["power_factor"] <= 1.0
    # Verify physical current I = P / (V * PF)
    expected_i = reading["power_w"] / (reading["voltage_v"] * reading["power_factor"])
    assert abs(reading["current_a"] - round(expected_i, 3)) < 0.05

def test_simulator_device_off(db_session):
    tv_device = db_session.query(Device).filter(Device.name == "Smart TV & Soundbar").first()
    tv_device.is_on = False
    reading = simulator.generate_reading_for_device(tv_device, datetime.utcnow(), delta_seconds=2.0)
    assert reading["power_w"] == 0.0
    assert reading["current_a"] == 0.0
    # Restore
    tv_device.is_on = True

def test_simulator_anomaly_injection(db_session):
    ac_device = db_session.query(Device).filter(Device.name == "Living Room AC").first()
    simulator.inject_anomaly("AC_OVERLOAD", device_id=ac_device.id)
    
    reading = simulator.generate_reading_for_device(ac_device, datetime.utcnow())
    assert reading["is_anomaly"] is True
    assert reading["power_w"] > ac_device.rated_watts * 1.5
    
    simulator.clear_anomaly()
    assert simulator.active_injected_anomaly is None
