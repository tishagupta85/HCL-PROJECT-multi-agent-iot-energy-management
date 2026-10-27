import React, { useEffect, useState } from "react"
import { Cpu, Bell, Activity, Clock } from "lucide-react"

interface HeaderProps {
  unresolvedAlertsCount: number
  efficiencyScore?: number
  onNavigateToAlerts?: () => void
}

export const Header: React.FC<HeaderProps> = ({
  unresolvedAlertsCount,
  efficiencyScore = 92.5,
  onNavigateToAlerts,
}) => {
  const [timeStr, setTimeStr] = useState("")

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTimeStr(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      )
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <header className="bg-[#0B132B] border-b border-[#2A3B5C] px-6 py-4 flex items-center justify-between">
      {/* Brand & Subtitle */}
      <div className="flex items-center gap-3.5">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-500/20 via-cyan-500/10 to-transparent border border-teal-500/30 text-teal-400 shadow-md shadow-cyan-950/20">
          <Cpu className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <span>Multi-Agent AI System</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300">
              IoT Energy Hub
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Autonomous Telemetry Validation • Demand Forecasting • Anomaly Detection • Peak Optimization
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* System Efficiency Metric */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1C2541] border border-[#2A3B5C] text-xs">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-400">System Health:</span>
          <span className="font-bold text-emerald-400">{efficiencyScore}%</span>
        </div>

        {/* Live Clock */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1C2541] border border-[#2A3B5C] text-xs font-mono text-slate-300">
          <Clock className="w-3.5 h-3.5 text-teal-400" />
          <span>{timeStr}</span>
        </div>

        {/* Alert Bell */}
        <button
          onClick={onNavigateToAlerts}
          className="relative p-2 rounded-lg bg-[#1C2541] hover:bg-slate-800 border border-[#2A3B5C] text-slate-300 hover:text-white transition"
          title="View Anomaly Alerts"
        >
          <Bell className="w-5 h-5" />
          {unresolvedAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow">
              {unresolvedAlertsCount}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
