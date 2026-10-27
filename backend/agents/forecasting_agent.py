import math
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from sklearn.linear_model import Ridge
from models import IoTReading
from .base_agent import BaseAgent

class ForecastingAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Forecasting Agent",
            description="Predicts 24-hour ahead and 7-day electrical demand using Machine Learning and cyclical feature engineering."
        )

    def _extract_features(self, dt: datetime) -> List[float]:
        """Extracts cyclical trigonometric features for hour and day of week."""
        hour = dt.hour + dt.minute / 60.0
        dow = dt.weekday()
        return [
            math.sin(2 * math.pi * hour / 24.0),
            math.cos(2 * math.pi * hour / 24.0),
            math.sin(4 * math.pi * hour / 24.0), # Harmonic for semi-diurnal shifts
            math.cos(4 * math.pi * hour / 24.0),
            math.sin(2 * math.pi * dow / 7.0),
            math.cos(2 * math.pi * dow / 7.0),
            1.0 if dow >= 5 else 0.0, # Weekend indicator
        ]

    def execute(self, db: Session, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        # Fetch historical readings aggregated hourly
        # Query total power per hour
        readings = (
            db.query(
                IoTReading.timestamp,
                func.sum(IoTReading.power_w).label("total_power_w")
            )
            .group_by(IoTReading.timestamp)
            .order_by(IoTReading.timestamp.asc())
            .all()
        )

        if not readings or len(readings) < 24:
            # Fallback default baseline if insufficient data
            now = datetime.utcnow()
            forecast_24h = []
            for h in range(24):
                future_time = now + timedelta(hours=h + 1)
                hour = future_time.hour
                # Nominal diurnal baseline in kW
                base_kw = 1.2 + 1.4 * math.sin((hour - 8) / 16.0 * math.pi) if 8 <= hour <= 23 else 0.8
                forecast_24h.append({
                    "timestamp": future_time.isoformat(),
                    "hour": hour,
                    "predicted_kw": round(max(0.5, base_kw), 2),
                    "lower_ci_kw": round(max(0.3, base_kw * 0.85), 2),
                    "upper_ci_kw": round(base_kw * 1.15, 2),
                })

            peak_forecast = max(forecast_24h, key=lambda x: x["predicted_kw"])
            return {
                "summary": f"Baseline forecast generated. Projected peak: {peak_forecast['predicted_kw']} kW at {peak_forecast['hour']}:00.",
                "forecast_24h": forecast_24h,
                "projected_peak_kw": peak_forecast["predicted_kw"],
                "projected_peak_hour": peak_forecast["hour"],
                "projected_24h_kwh": round(sum(f["predicted_kw"] for f in forecast_24h), 2),
                "model_trained": False,
            }

        # Format historical data for ML training
        X_train = []
        y_train = []
        for r in readings:
            features = self._extract_features(r.timestamp)
            kw = (r.total_power_w or 0.0) / 1000.0
            X_train.append(features)
            y_train.append(kw)

        X_mat = np.array(X_train)
        y_vec = np.array(y_train)

        # Train Ridge Regression Model
        model = Ridge(alpha=1.0)
        model.fit(X_mat, y_vec)

        # Calculate residual standard error for confidence intervals
        preds = model.predict(X_mat)
        residuals = y_vec - preds
        std_err = float(np.std(residuals)) if len(residuals) > 0 else 0.25

        # Generate 24-hour Ahead Forecast
        now = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
        forecast_24h = []
        for h in range(1, 25):
            future_dt = now + timedelta(hours=h)
            feat = np.array([self._extract_features(future_dt)])
            pred_kw = float(model.predict(feat)[0])
            pred_kw = max(0.4, pred_kw) # Physical lower bound
            
            # 95% Confidence Interval (± 1.96 * std_err)
            lower_kw = max(0.2, pred_kw - 1.96 * std_err)
            upper_kw = pred_kw + 1.96 * std_err

            forecast_24h.append({
                "timestamp": future_dt.isoformat(),
                "hour": future_dt.hour,
                "day": future_dt.strftime("%a"),
                "predicted_kw": round(pred_kw, 2),
                "lower_ci_kw": round(lower_kw, 2),
                "upper_ci_kw": round(upper_kw, 2),
            })

        peak_item = max(forecast_24h, key=lambda x: x["predicted_kw"])
        total_24h_kwh = round(sum(f["predicted_kw"] for f in forecast_24h), 2)
        projected_7d_kwh = round(total_24h_kwh * 7.1, 1)

        summary = (
            f"Trained Ridge regression on {len(readings)} historical hourly observations. "
            f"Predicted 24h demand: {total_24h_kwh} kWh. Peak demand: {peak_item['predicted_kw']} kW "
            f"forecasted at {peak_item['hour']:02d}:00."
        )

        return {
            "summary": summary,
            "forecast_24h": forecast_24h,
            "projected_peak_kw": peak_item["predicted_kw"],
            "projected_peak_hour": peak_item["hour"],
            "projected_24h_kwh": total_24h_kwh,
            "projected_7d_kwh": projected_7d_kwh,
            "residual_std_kw": round(std_err, 3),
            "model_trained": True,
        }
