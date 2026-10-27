from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from agents import ForecastingAgent

router = APIRouter(prefix="/api/forecasts", tags=["forecasts"])
fc_agent = ForecastingAgent()

@router.get("/24h")
def get_24h_forecast(db: Session = Depends(get_db)):
    result = fc_agent.run(db)
    return result.get("data", {})
