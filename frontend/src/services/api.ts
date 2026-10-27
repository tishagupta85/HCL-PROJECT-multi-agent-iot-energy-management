import type {
  Device,
  IoTReading,
  LiveAggregate,
  Alert,
  Recommendation,
  AgentStatus,
  AgentLog,
  KpiMetrics,
  DeviceBreakdownItem,
  HourlyTrendItem,
  ForecastResult,
  SimulatorStatus,
  ReportSummary,
} from "../types"

const API_BASE = "/api"

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unknown error")
    throw new Error(`API Error ${res.status}: ${errorText}`)
  }
  return res.json()
}

export const api = {
  // Devices
  getDevices: () => fetchJson<Device[]>("/devices"),
  toggleDevice: (id: number) => fetchJson<{ success: boolean; is_on: boolean; message: string }>(`/devices/${id}/toggle`, { method: "POST" }),
  createDevice: (payload: { name: string; device_type: string; room: string; rated_watts: number; is_controllable?: boolean; priority?: number }) =>
    fetchJson<Device>("/devices", { method: "POST", body: JSON.stringify(payload) }),

  // Readings
  getLatestReadings: () => fetchJson<IoTReading[]>("/readings/latest"),
  getLiveAggregate: () => fetchJson<LiveAggregate>("/readings/live-aggregate"),
  getReadingHistory: (hours: number = 24, deviceId?: number) =>
    fetchJson<IoTReading[]>(`/readings/history?hours=${hours}${deviceId ? `&device_id=${deviceId}` : ""}`),

  // Analytics
  getKpiMetrics: () => fetchJson<KpiMetrics>("/analytics/kpi"),
  getDeviceBreakdown: () => fetchJson<DeviceBreakdownItem[]>("/analytics/device-breakdown"),
  getHourlyTrend: () => fetchJson<HourlyTrendItem[]>("/analytics/hourly-trend"),

  // Forecasts
  getForecast24h: () => fetchJson<ForecastResult>("/forecasts/24h"),

  // Anomalies
  getAnomalies: (isResolved?: boolean, severity?: string) => {
    const params = new URLSearchParams()
    if (isResolved !== undefined) params.append("is_resolved", String(isResolved))
    if (severity) params.append("severity", severity)
    return fetchJson<Alert[]>(`/anomalies?${params.toString()}`)
  },
  resolveAnomaly: (id: number) => fetchJson<{ success: boolean; alert_id: number; is_resolved: boolean }>(`/anomalies/${id}/resolve`, { method: "POST" }),

  // Optimizations
  getOptimizations: (status?: string) => {
    const params = status ? `?status=${status}` : ""
    return fetchJson<Recommendation[]>(`/optimizations${params}`)
  },
  applyOptimization: (id: number) =>
    fetchJson<{ success: boolean; recommendation_id: number; status: string; message: string }>(`/optimizations/${id}/apply`, { method: "POST" }),
  dismissOptimization: (id: number) =>
    fetchJson<{ success: boolean; recommendation_id: number; status: string }>(`/optimizations/${id}/dismiss`, { method: "POST" }),

  // Agents
  getAgentsStatus: () => fetchJson<AgentStatus[]>("/agents/status"),
  runCoordinator: () => fetchJson<any>("/agents/run-coordinator", { method: "POST" }),
  runAgent: (agentKey: string) => fetchJson<any>(`/agents/run/${agentKey}`, { method: "POST" }),
  getAgentHistory: (limit: number = 50) => fetchJson<AgentLog[]>(`/agents/history?limit=${limit}`),

  // Simulator
  getSimulatorStatus: () => fetchJson<SimulatorStatus>("/simulator/status"),
  toggleSimulator: () => fetchJson<{ is_running: boolean; message: string }>("/simulator/toggle", { method: "POST" }),
  triggerTick: () => fetchJson<{ success: boolean; readings_count: number; tick_count: number }>("/simulator/tick", { method: "POST" }),
  injectAnomaly: (anomalyType: string, deviceId?: number, durationTicks: number = 20) =>
    fetchJson<{ success: boolean; message: string; active_anomaly: any }>("/simulator/inject-anomaly", {
      method: "POST",
      body: JSON.stringify({ anomaly_type: anomalyType, device_id: deviceId, duration_ticks: durationTicks }),
    }),
  clearAnomaly: () => fetchJson<{ success: boolean; message: string }>("/simulator/clear-anomaly", { method: "POST" }),
  setSimulatorSpeed: (multiplier: number) =>
    fetchJson<{ success: boolean; speed_multiplier: number }>("/simulator/speed", {
      method: "POST",
      body: JSON.stringify({ multiplier }),
    }),

  // Reports
  getReportSummary: () => fetchJson<ReportSummary>("/reports/summary"),
  getExportUrl: () => `${API_BASE}/reports/export`,
}
