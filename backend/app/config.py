import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "Multi-Agent AI System for IoT Energy Management"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./iot_energy.db")
    SIMULATOR_INTERVAL_SECONDS: float = 2.0
    SIMULATOR_ENABLED: bool = True
    
    # Energy Tariffs ($/kWh)
    TARIFF_PEAK_RATE: float = 0.28   # Peak hours: 14:00 - 20:00
    TARIFF_OFF_PEAK_RATE: float = 0.12 # Off-peak hours
    
    # ML Sensitivity & Thresholds
    ANOMALY_CONTAMINATION: float = 0.05
    VOLTAGE_NOMINAL: float = 230.0
    VOLTAGE_TOLERANCE_PCT: float = 0.08  # ±8% (211.6V - 248.4V)
    
    # System Grid Limit (kW)
    GRID_CAPACITY_LIMIT_KW: float = 6.0

settings = Settings()
