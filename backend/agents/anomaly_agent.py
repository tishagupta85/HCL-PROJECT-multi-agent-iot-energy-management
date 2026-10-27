import numpy as np
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import desc
from sklearn.ensemble import IsolationForest
from models import Device, IoTReading, Alert
from app.config import settings
from .base_agent import BaseAgent

class AnomalyDetectionAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Anomaly Detection Agent",
            description="Identifies unusual power consumption, equipment faults, and grid voltage anomalies using Isolation Forest and statistical Z-Score."
        )

    def execute(self, db: Session, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        devices = db.query(Device).all()
        device_map = {d.id: d for d in devices}

        # Look at the most recent window of readings (last 50 readings)
        recent_readings = (
            db.query(IoTReading)
            .order_by(desc(IoTReading.timestamp))
            .limit(100)
            .all()
        )

        if not recent_readings:
            return {"summary": "No telemetry readings available for anomaly analysis.", "anomalies_detected": 0}

        # Build feature matrix for Isolation Forest
        feature_rows = []
        valid_readings = []
        for r in recent_readings:
            feature_rows.append([r.power_w, r.voltage_v, r.current_a, r.power_factor])
            valid_readings.append(r)

        X = np.array(feature_rows)
        
        # Fit Isolation Forest
        clf = IsolationForest(
            contamination=settings.ANOMALY_CONTAMINATION,
            random_state=42,
            n_estimators=50
        )
        preds = clf.fit_predict(X)  # -1 is anomaly, 1 is normal
        scores = clf.decision_function(X)

        new_alerts = []
        detected_details = []

        # Check for un-alerted anomalies in the most recent readings
        for idx, (pred, r) in enumerate(zip(preds, valid_readings)):
            is_ml_anomaly = (pred == -1)
            dev = device_map.get(r.device_id)
            dev_name = dev.name if dev else f"Device #{r.device_id}"
            rated_w = dev.rated_watts if dev else 1000.0

            # Domain Rule Checks
            is_voltage_sag = r.voltage_v < (settings.VOLTAGE_NOMINAL * 0.92)
            is_voltage_surge = r.voltage_v > (settings.VOLTAGE_NOMINAL * 1.08)
            is_severe_overload = r.power_w > (rated_w * 1.5)
            is_severe_pf_drop = (r.power_w > 100.0 and r.power_factor < 0.70)

            should_flag = is_ml_anomaly or is_voltage_sag or is_voltage_surge or is_severe_overload or is_severe_pf_drop or r.is_anomaly

            if should_flag:
                # Mark reading as anomaly
                r.is_anomaly = True

                # Determine Alert Details
                severity = "WARNING"
                alert_type = "ANOMALY_SPIKE"
                title = f"Unusual Consumption in {dev_name}"
                message = f"Telemetry deviated significantly from baseline: {r.power_w:.1f}W drawn."

                if is_severe_overload:
                    severity = "CRITICAL"
                    alert_type = "OVERLOAD"
                    title = f"Equipment Overload: {dev_name}"
                    message = f"Power consumption reached {r.power_w:.1f}W, exceeding rated maximum of {rated_w:.0f}W (+{((r.power_w/rated_w)-1)*100:.1f}%)."
                elif is_voltage_sag:
                    severity = "CRITICAL"
                    alert_type = "VOLTAGE_SAG"
                    title = f"Severe Grid Voltage Sag ({r.voltage_v:.1f}V)"
                    message = f"Bus voltage fell to {r.voltage_v:.1f}V, below safety threshold of 211.6V."
                elif is_voltage_surge:
                    severity = "WARNING"
                    alert_type = "VOLTAGE_SURGE"
                    title = f"Grid Voltage Surge ({r.voltage_v:.1f}V)"
                    message = f"Bus voltage spiked to {r.voltage_v:.1f}V, exceeding safety threshold of 248.4V."
                elif is_severe_pf_drop:
                    severity = "WARNING"
                    alert_type = "POOR_POWER_FACTOR"
                    title = f"Poor Power Factor: {dev_name}"
                    message = f"Power factor degraded to {r.power_factor:.2f}. Potential inductive loss or motor stress."

                # Avoid duplicate alert if identical alert exists in the last 15 minutes
                recent_duplicate = (
                    db.query(Alert)
                    .filter(
                        Alert.device_id == r.device_id,
                        Alert.alert_type == alert_type,
                        Alert.timestamp >= datetime.utcnow() - timedelta(minutes=15)
                    )
                    .first()
                )

                if not recent_duplicate and len(new_alerts) < 3:
                    alert = Alert(
                        timestamp=datetime.utcnow(),
                        device_id=r.device_id,
                        severity=severity,
                        alert_type=alert_type,
                        title=title,
                        message=message,
                        metric_value=r.power_w if "OVERLOAD" in alert_type else r.voltage_v,
                        threshold_value=rated_w if "OVERLOAD" in alert_type else settings.VOLTAGE_NOMINAL,
                        is_resolved=False,
                    )
                    db.add(alert)
                    new_alerts.append(alert)

                detected_details.append({
                    "device": dev_name,
                    "power_w": r.power_w,
                    "voltage_v": r.voltage_v,
                    "anomaly_score": round(float(scores[idx]), 3),
                    "reason": alert_type,
                    "severity": severity,
                })

        db.commit()

        summary = (
            f"Analyzed {len(valid_readings)} recent telemetry data points with Isolation Forest. "
            f"Identified {len(detected_details)} anomalous patterns; dispatched {len(new_alerts)} new alerts."
        )

        return {
            "summary": summary,
            "anomalies_detected_count": len(detected_details),
            "new_alerts_created": len(new_alerts),
            "anomaly_samples": detected_details[:5],
        }
