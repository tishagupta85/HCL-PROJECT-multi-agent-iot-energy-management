import React, { useEffect, useState } from "react"
import { BarChart3, TrendingUp, DollarSign, Leaf, Zap, Clock } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { api } from "../services/api"
import type { HourlyTrendItem, KpiMetrics } from "../types"

export const Analytics: React.FC = () => {
  const [trends, setTrends] = useState<HourlyTrendItem[]>([])
  const [kpis, setKpis] = useState<KpiMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [trendData, kpiData] = await Promise.all([
          api.getHourlyTrend(),
          api.getKpiMetrics(),
        ])
        setTrends(trendData)
        setKpis(kpiData)
      } catch (err) {
        console.error("Failed to fetch analytics:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  // Process data for Tariff Tier Bar Chart
  const chartData = trends.map((t) => ({
    time: t.time_label,
    peak_demand: t.is_peak_tariff ? t.demand_kw : 0,
    off_peak_demand: !t.is_peak_tariff ? t.demand_kw : 0,
    voltage: t.voltage_v,
    rate: `$${t.tariff_rate}`,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-teal-400" />
          <span>Energy Analytics & Tariff Analysis</span>
        </h2>
        <p className="text-xs text-slate-400">
          Load profiles, dynamic tariff windows, carbon metrics, and peak demand characterization
        </p>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-xl bg-[#1C2541]/90 border border-[#2A3B5C] shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Peak Hour Tariff Tier</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">
            $0.28 <span className="text-xs text-slate-400">/ kWh</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Active window: 14:00 - 20:00. Off-peak: $0.12/kWh.
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#1C2541]/90 border border-[#2A3B5C] shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Carbon Footprint</span>
            <Leaf className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {kpis?.carbon_footprint_kg ?? 0} <span className="text-xs text-slate-400">kg CO₂e</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Based on 0.42 kg CO₂ / kWh regional grid factor
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#1C2541]/90 border border-[#2A3B5C] shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Peak Demand Recorded</span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400">
            {kpis?.peak_demand_kw ?? 0} <span className="text-xs text-slate-400">kW</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Grid safe threshold: {kpis?.grid_limit_kw ?? 6.0} kW
          </div>
        </div>
      </div>

      {/* Tariff-Categorized Hourly Consumption Bar Chart */}
      <div className="rounded-xl bg-[#1C2541]/90 border border-[#2A3B5C] p-5 shadow-lg backdrop-blur">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Hourly Load Breakdown: Peak vs Off-Peak Tariffs
            </h3>
            <p className="text-xs text-slate-400">
              Yellow bars represent high-rate peak hours ($0.28/kWh); Teal bars represent off-peak hours ($0.12/kWh)
            </p>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A3B5C" vertical={false} />
              <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={11} tickLine={false} unit=" kW" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0B132B",
                  borderColor: "#2A3B5C",
                  borderRadius: "0.5rem",
                  color: "#F8FAFC",
                  fontSize: "12px",
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconSize={10}
                wrapperStyle={{ fontSize: "11px", paddingBottom: "10px" }}
              />
              <Bar dataKey="off_peak_demand" name="Off-Peak ($0.12/kWh)" fill="#5BC0BE" radius={[4, 4, 0, 0]} />
              <Bar dataKey="peak_demand" name="Peak Tariff ($0.28/kWh)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
