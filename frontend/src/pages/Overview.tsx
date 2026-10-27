import React, { useEffect, useState } from "react"
import {
  Zap,
  Activity,
  DollarSign,
  ShieldAlert,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { KpiCard } from "../components/KpiCard"
import { api } from "../services/api"
import type {
  KpiMetrics,
  HourlyTrendItem,
  DeviceBreakdownItem,
  Alert,
  Recommendation,
} from "../types"

const COLORS = ["#5BC0BE", "#3A506B", "#6FFFE9", "#38BDF8", "#818CF8", "#F59E0B", "#10B981", "#EC4899"]

interface OverviewProps {
  onNavigateTab: (tab: any) => void
}

export const Overview: React.FC<OverviewProps> = ({ onNavigateTab }) => {
  const [kpis, setKpis] = useState<KpiMetrics | null>(null)
  const [trends, setTrends] = useState<HourlyTrendItem[]>([])
  const [breakdown, setBreakdown] = useState<DeviceBreakdownItem[]>([])
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const [kpiRes, trendRes, breakRes, alertRes, recRes] = await Promise.all([
        api.getKpiMetrics(),
        api.getHourlyTrend(),
        api.getDeviceBreakdown(),
        api.getAnomalies(false),
        api.getOptimizations("PENDING"),
      ])
      setKpis(kpiRes)
      setTrends(trendRes)
      setBreakdown(breakRes)
      setRecentAlerts(alertRes.slice(0, 3))
      setRecommendations(recRes.slice(0, 3))
    } catch (err) {
      console.error("Failed to load overview data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleApplyRec = async (id: number) => {
    try {
      await api.applyOptimization(id)
      loadData()
    } catch (err) {
      console.error("Failed to apply recommendation:", err)
    }
  }

  const handleResolveAlert = async (id: number) => {
    try {
      await api.resolveAnomaly(id)
      loadData()
    } catch (err) {
      console.error("Failed to resolve alert:", err)
    }
  }

  return (
    <div className="space-y-6">
      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          title="Total Consumption"
          value={kpis?.total_consumption_kwh ?? "--"}
          unit="kWh"
          trend={{
            value: kpis?.consumption_change_pct ?? 0,
            label: "vs yesterday",
          }}
          icon={Zap}
          colorScheme="teal"
          subtitle="Cumulative today"
        />

        <KpiCard
          title="Current Demand"
          value={kpis?.current_demand_kw ?? "--"}
          unit="kW"
          icon={Activity}
          colorScheme="blue"
          subtitle={`Peak: ${kpis?.peak_demand_kw ?? 0} kW (Limit: ${kpis?.grid_limit_kw ?? 6.0} kW)`}
        />

        <KpiCard
          title="Cost Today"
          value={`$${kpis?.cost_today_usd ?? "--"}`}
          unit="USD"
          icon={DollarSign}
          colorScheme="emerald"
          subtitle={`Yesterday: $${kpis?.cost_yesterday_usd ?? 0}`}
        />

        <KpiCard
          title="System Health"
          value={`${kpis?.efficiency_score ?? "--"}%`}
          icon={ShieldAlert}
          colorScheme={
            (kpis?.unresolved_alerts_count ?? 0) > 0 ? "rose" : "emerald"
          }
          subtitle={`${kpis?.unresolved_alerts_count ?? 0} active anomaly alert(s)`}
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: 24-Hour Energy Consumption Curve */}
        <div className="lg:col-span-2 rounded-xl bg-[#1C2541]/90 border border-[#2A3B5C] p-5 shadow-lg backdrop-blur">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                24-Hour Energy Demand Profile
              </h2>
              <p className="text-xs text-slate-400">
                Active electrical load (kW) across hourly diurnal intervals
              </p>
            </div>
            <button
              onClick={() => onNavigateTab("analytics")}
              className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 font-semibold"
            >
              Analytics Details <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5BC0BE" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#5BC0BE" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A3B5C" vertical={false} />
                <XAxis dataKey="time_label" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} unit=" kW" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0B132B",
                    borderColor: "#2A3B5C",
                    borderRadius: "0.5rem",
                    color: "#F8FAFC",
                    fontSize: "12px",
                  }}
                  formatter={(val: any) => [`${val} kW`, "Demand"]}
                />
                <Area
                  type="monotone"
                  dataKey="demand_kw"
                  stroke="#5BC0BE"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#energyGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Device Breakdown Donut Chart */}
        <div className="rounded-xl bg-[#1C2541]/90 border border-[#2A3B5C] p-5 shadow-lg backdrop-blur">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Device Energy Share
              </h2>
              <p className="text-xs text-slate-400">Share of total consumption</p>
            </div>
            <button
              onClick={() => onNavigateTab("devices")}
              className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 font-semibold"
            >
              All Devices <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-72 w-full flex items-center justify-center">
            {breakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={breakdown}
                    dataKey="kwh"
                    nameKey="device_name"
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {breakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0B132B",
                      borderColor: "#2A3B5C",
                      borderRadius: "0.5rem",
                      color: "#F8FAFC",
                      fontSize: "12px",
                    }}
                    formatter={(val: any) => [`${val} kWh`, "Energy"]}
                  />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400">No telemetry data recorded yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Alerts & Priority Optimization Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Alerts */}
        <div className="rounded-xl bg-[#1C2541]/90 border border-[#2A3B5C] p-5 shadow-lg backdrop-blur">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Recent Anomaly Alerts
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab("anomalies")}
              className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 font-semibold"
            >
              View All Alerts <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentAlerts.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                No active anomalies detected. Grid operations normal.
              </div>
            ) : (
              recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/70 flex items-start justify-between gap-3 hover:border-slate-600 transition"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          alert.severity === "CRITICAL"
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        {alert.severity}
                      </span>
                      <span className="text-xs font-semibold text-white">{alert.title}</span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">{alert.message}</p>
                    <div className="mt-1.5 text-[10px] text-slate-400">
                      {alert.device_name || "Grid"} • {new Date(alert.timestamp).toLocaleTimeString()}
                    </div>
                  </div>

                  <button
                    onClick={() => handleResolveAlert(alert.id)}
                    className="shrink-0 px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                  >
                    Resolve
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Priority Optimizations */}
        <div className="rounded-xl bg-[#1C2541]/90 border border-[#2A3B5C] p-5 shadow-lg backdrop-blur">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-teal-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Recommended Energy Actions
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab("optimization")}
              className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 font-semibold"
            >
              All Actions <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recommendations.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400">
                <CheckCircle2 className="w-6 h-6 text-teal-400 mx-auto mb-2" />
                All energy optimization measures are currently applied!
              </div>
            ) : (
              recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/70 flex items-start justify-between gap-3 hover:border-slate-600 transition"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                        {rec.action_type.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs font-semibold text-white">{rec.title}</span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">{rec.description}</p>
                    <div className="mt-1.5 flex items-center gap-3 text-[11px] font-medium text-emerald-400">
                      <span>Save ~{rec.potential_kwh_savings} kWh</span>
                      <span>•</span>
                      <span>Save ~${rec.potential_cost_savings}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleApplyRec(rec.id)}
                    className="shrink-0 px-3 py-1.5 text-xs font-bold rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-sm transition"
                  >
                    Apply
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
