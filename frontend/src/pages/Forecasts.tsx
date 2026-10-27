import React, { useEffect, useState } from "react"
import { TrendingUp, Sparkles, BrainCircuit, Calendar, CheckCircle2, RefreshCw } from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { api } from "../services/api"
import type { ForecastResult } from "../types"

export const Forecasts: React.FC = () => {
  const [forecast, setForecast] = useState<ForecastResult | null>(null)
  const [loading, setLoading] = useState(true)

  const loadForecast = async () => {
    setLoading(true)
    try {
      const data = await api.getForecast24h()
      setForecast(data)
    } catch (err) {
      console.error("Failed to load forecast:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadForecast()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-400" />
            <span>AI Demand Forecasting (24h Ahead)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Machine Learning Ridge Regression with cyclical Fourier time features and 95% confidence intervals
          </p>
        </div>

        <button
          onClick={loadForecast}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Retrain Model</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#1C2541]/90 border border-[#2A3B5C] shadow-lg">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Projected Peak Demand
          </span>
          <div className="text-2xl font-bold text-white mt-1">
            {forecast?.projected_peak_kw ?? "--"} <span className="text-sm font-normal text-slate-400">kW</span>
          </div>
          <div className="text-xs text-amber-400 font-medium mt-1">
            Forecasted at {forecast?.projected_peak_hour ?? "--"}:00
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#1C2541]/90 border border-[#2A3B5C] shadow-lg">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            24h Projected Energy
          </span>
          <div className="text-2xl font-bold text-teal-400 mt-1">
            {forecast?.projected_24h_kwh ?? "--"} <span className="text-sm font-normal text-slate-400">kWh</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Sum of next 24 hourly periods
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#1C2541]/90 border border-[#2A3B5C] shadow-lg">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            7-Day Projected Total
          </span>
          <div className="text-2xl font-bold text-cyan-400 mt-1">
            {forecast?.projected_7d_kwh ?? "--"} <span className="text-sm font-normal text-slate-400">kWh</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Weekly demand trend extrapolation
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#1C2541]/90 border border-[#2A3B5C] shadow-lg">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            ML Model Uncertainty
          </span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            ±{forecast?.residual_std_kw ?? 0.25} <span className="text-sm font-normal text-slate-400">kW</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Residual Standard Deviation (σ)
          </div>
        </div>
      </div>

      {/* Main Forecast Line Chart with Confidence Bounds */}
      <div className="rounded-xl bg-[#1C2541]/90 border border-[#2A3B5C] p-5 shadow-lg backdrop-blur">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              24-Hour Forward Predictive Load Curve
            </h3>
            <p className="text-xs text-slate-400">
              Shaded band indicates 95% Confidence Interval (± 1.96 × σ) around the predicted mean
            </p>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecast?.forecast_24h ?? []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="ciGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A3B5C" vertical={false} />
              <XAxis dataKey="hour" stroke="#64748B" fontSize={11} tickFormatter={(h) => `${h}:00`} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={11} tickLine={false} unit=" kW" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0B132B",
                  borderColor: "#2A3B5C",
                  borderRadius: "0.5rem",
                  color: "#F8FAFC",
                  fontSize: "12px",
                }}
                formatter={(val: any, name: any) => [
                  `${val} kW`,
                  name === "predicted_kw"
                    ? "Predicted Demand"
                    : name === "upper_ci_kw"
                    ? "Upper 95% CI"
                    : "Lower 95% CI",
                ]}
                labelFormatter={(h) => `Hour ${h}:00`}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconSize={10}
                wrapperStyle={{ fontSize: "11px", paddingBottom: "10px" }}
              />
              <Area
                type="monotone"
                dataKey="upper_ci_kw"
                name="Upper Bound (95%)"
                stroke="#38BDF8"
                strokeDasharray="4 4"
                fill="url(#ciGrad)"
              />
              <Area
                type="monotone"
                dataKey="predicted_kw"
                name="Predicted Mean (kW)"
                stroke="#5BC0BE"
                strokeWidth={3}
                fill="none"
              />
              <Area
                type="monotone"
                dataKey="lower_ci_kw"
                name="Lower Bound (95%)"
                stroke="#64748B"
                strokeDasharray="4 4"
                fill="none"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Model Technical Summary */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/70 text-xs text-slate-300 flex items-start gap-3">
        <BrainCircuit className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white block mb-0.5">Machine Learning Architecture</span>
          <p className="text-slate-400">
            {forecast?.summary || "Ridge Regression model trained on historical telemetry."} Features include cyclical harmonic sine/cosine encodings of diurnal hour of day, day of week, and weekend indicators.
          </p>
        </div>
      </div>
    </div>
  )
}
