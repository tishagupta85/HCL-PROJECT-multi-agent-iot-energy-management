from datetime import datetime
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from app.config import settings
from .base_agent import BaseAgent
from .monitoring_agent import MonitoringAgent
from .forecasting_agent import ForecastingAgent
from .anomaly_agent import AnomalyDetectionAgent
from .optimization_agent import OptimizationAgent

class CoordinatorAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Coordinator Agent",
            description="Master multi-agent orchestrator that synthesizes inputs from all agents, resolves trade-offs, and issues coordinated decisions."
        )
        self.monitoring_agent = MonitoringAgent()
        self.forecasting_agent = ForecastingAgent()
        self.anomaly_agent = AnomalyDetectionAgent()
        self.optimization_agent = OptimizationAgent()

    def execute(self, db: Session, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        workflow_start = datetime.utcnow()
        agent_results = {}

        # 1. Run Monitoring Agent
        mon_res = self.monitoring_agent.run(db, context)
        agent_results["monitoring"] = mon_res

        # 2. Run Forecasting Agent
        fc_res = self.forecasting_agent.run(db, context)
        agent_results["forecasting"] = fc_res

        # 3. Run Anomaly Detection Agent
        anom_res = self.anomaly_agent.run(db, context)
        agent_results["anomaly_detection"] = anom_res

        # 4. Run Optimization Agent
        opt_res = self.optimization_agent.run(db, context)
        agent_results["optimization"] = opt_res

        # --- Multi-Agent Synthesis & Decision Arbitration ---
        sensor_health = mon_res.get("data", {}).get("sensor_health_score", 100.0)
        current_kw = mon_res.get("data", {}).get("total_active_power_kw", 0.0)
        grid_limit_kw = settings.GRID_CAPACITY_LIMIT_KW
        anomalies_count = anom_res.get("data", {}).get("anomalies_detected_count", 0)
        peak_forecast_kw = fc_res.get("data", {}).get("projected_peak_kw", 0.0)

        # Compute Grid Stability Index (0 - 100%)
        # Penalized by high load ratio, low sensor health, and active anomalies
        load_ratio = current_kw / max(grid_limit_kw, 0.1)
        load_score = max(0.0, 1.0 - max(0.0, load_ratio - 0.7) * 2.0) # drops if load > 70% of limit
        stability_score = (
            (sensor_health * 0.35) +
            (load_score * 100.0 * 0.40) +
            (max(0.0, 100.0 - anomalies_count * 25.0) * 0.25)
        )
        stability_score = round(max(10.0, min(100.0, stability_score)), 1)

        # Efficiency Grade
        if stability_score >= 90.0 and anomalies_count == 0:
            system_grade = "A+"
            health_status = "Optimal"
        elif stability_score >= 80.0:
            system_grade = "A"
            health_status = "Good"
        elif stability_score >= 65.0:
            system_grade = "B"
            health_status = "Moderate Attention"
        elif stability_score >= 50.0:
            system_grade = "C"
            health_status = "Degraded"
        else:
            system_grade = "CRITICAL"
            health_status = "Grid Risk"

        # Coordinated Decisions & Actions
        decisions: List[str] = []

        if anomalies_count > 0:
            decisions.append(
                f"[SAFETY INTERVENTION] {anomalies_count} active electrical anomalies isolated. Prioritizing diagnostic alerts over routine efficiency."
            )

        if peak_forecast_kw > (grid_limit_kw * 0.85):
            decisions.append(
                f"[GRID RELIEF] Forecasted peak demand of {peak_forecast_kw} kW exceeds 85% capacity. Pre-clearing flexible loads (water heating, washing machine)."
            )
        else:
            decisions.append(
                f"[DISPATCH STABLE] Peak demand forecast ({peak_forecast_kw} kW) remains comfortably within grid threshold ({grid_limit_kw} kW)."
            )

        opt_count = opt_res.get("data", {}).get("recommendations_count", 0)
        savings_kwh = opt_res.get("data", {}).get("total_potential_kwh_savings", 0.0)
        savings_usd = opt_res.get("data", {}).get("total_potential_cost_savings", 0.0)
        if opt_count > 0:
            decisions.append(
                f"[OPTIMIZATION ARBITRATION] Approved {opt_count} energy conservation measures totaling {savings_kwh} kWh/day (${savings_usd}/day)."
            )

        summary = (
            f"Multi-Agent orchestration cycle complete. System Grade: {system_grade} "
            f"(Stability: {stability_score}%). Executed {len(decisions)} coordinated management directives."
        )

        return {
            "summary": summary,
            "system_grade": system_grade,
            "health_status": health_status,
            "grid_stability_index": stability_score,
            "coordinated_decisions": decisions,
            "current_load_kw": current_kw,
            "grid_limit_kw": grid_limit_kw,
            "forecasted_peak_kw": peak_forecast_kw,
            "active_anomalies_count": anomalies_count,
            "agent_summaries": {
                "monitoring": mon_res.get("summary"),
                "forecasting": fc_res.get("summary"),
                "anomaly_detection": anom_res.get("summary"),
                "optimization": opt_res.get("summary"),
            },
            "subagent_executions": agent_results,
        }
