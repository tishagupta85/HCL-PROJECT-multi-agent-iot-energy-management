export interface Device {
  id: number
  name: string
  device_type: string
  room: string
  rated_watts: number
  is_on: boolean
  is_controllable: boolean
  priority: number
  created_at: string
  current_power_w?: number
  current_voltage_v?: number
  current_amperes?: number
  power_factor?: number
  last_updated?: string
}

export interface IoTReading {
  id: number
  timestamp: string
  device_id: number
  device_name?: string
  room?: string
  is_on?: boolean
  power_w: number
  voltage_v: number
  current_a: number
  power_factor: number
  energy_kwh: number
  is_anomaly: boolean
}

export interface LiveAggregate {
  timestamp: string
  total_power_kw: number
  total_power_w: number
  total_current_a: number
  average_voltage_v: number
  average_power_factor: number
  device_count: number
}

export interface Alert {
  id: number
  timestamp: string
  device_id: number | null
  device_name?: string
  severity: "CRITICAL" | "WARNING" | "INFO"
  alert_type: string
  title: string
  message: string
  metric_value: number | null
  threshold_value: number | null
  is_resolved: boolean
  resolved_at: string | null
}

export interface Recommendation {
  id: number
  timestamp: string
  device_id: number | null
  device_name?: string
  action_type: string
  title: string
  description: string
  potential_kwh_savings: number
  potential_cost_savings: number
  priority: "HIGH" | "MEDIUM" | "LOW"
  status: "PENDING" | "APPLIED" | "DISMISSED"
  applied_at: string | null
}

export interface AgentStatus {
  key: string
  name: string
  role: string
  priority: number
  last_status: "SUCCESS" | "WARNING" | "FAILED" | "IDLE"
  last_run: string | null
  last_duration_ms: number | null
  last_summary: string
}

export interface AgentLog {
  id: number
  agent_name: string
  timestamp: string
  status: "SUCCESS" | "WARNING" | "FAILED"
  execution_time_ms: number
  summary: string
  details_json: string | null
}

export interface KpiMetrics {
  total_consumption_kwh: number
  consumption_change_pct: number
  current_demand_kw: number
  peak_demand_kw: number
  cost_today_usd: number
  cost_yesterday_usd: number
  carbon_footprint_kg: number
  efficiency_score: number
  unresolved_alerts_count: number
  grid_limit_kw: number
}

export interface DeviceBreakdownItem {
  device_id: number
  device_name: string
  room: string
  device_type: string
  kwh: number
  percentage: number
}

export interface HourlyTrendItem {
  timestamp: string
  time_label: string
  demand_kw: number
  voltage_v: number
  is_peak_tariff: boolean
  tariff_rate: number
}

export interface ForecastHour {
  timestamp: string
  hour: number
  day: string
  predicted_kw: number
  lower_ci_kw: number
  upper_ci_kw: number
}

export interface ForecastResult {
  summary: string
  forecast_24h: ForecastHour[]
  projected_peak_kw: number
  projected_peak_hour: number
  projected_24h_kwh: number
  projected_7d_kwh: number
  residual_std_kw: number
  model_trained: boolean
}

export interface SimulatorStatus {
  is_running: boolean
  tick_speed_multiplier: number
  active_anomaly: {
    type: string
    device_id: number | null
    remaining_ticks: number
  } | null
  last_tick_time: string | null
  total_ticks: number
}

export interface ReportSummary {
  report_id: string
  generated_at: string
  period: string
  total_consumption_kwh: number
  peak_demand_kw: number
  total_cost_usd: number
  carbon_footprint_kg: number
  energy_efficiency_grade: string
  total_applied_savings_kwh: number
  total_applied_savings_usd: number
  alerts_summary: {
    total_detected: number
    resolved: number
    resolution_rate_pct: number
  }
  agents_summary: {
    total_orchestration_cycles: number
    system_health: string
  }
  devices_count: number
}
