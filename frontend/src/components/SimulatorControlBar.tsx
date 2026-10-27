import React, { useState } from "react"
import { Play, Pause, FastForward, AlertTriangle, ShieldCheck, Zap, RefreshCw } from "lucide-react"
import type { SimulatorStatus } from "../types"
import { api } from "../services/api"

interface SimulatorControlBarProps {
  status: SimulatorStatus | null
  onStatusChange: () => void
  onRunCoordinator: () => void
  isRunningCoordinator: boolean
}

export const SimulatorControlBar: React.FC<SimulatorControlBarProps> = ({
  status,
  onStatusChange,
  onRunCoordinator,
  isRunningCoordinator,
}) => {
  const [selectedAnomaly, setSelectedAnomaly] = useState("AC_OVERLOAD")
  const [isInjecting, setIsInjecting] = useState(false)

  const handleToggle = async () => {
    try {
      await api.toggleSimulator()
      onStatusChange()
    } catch (err) {
      console.error("Failed to toggle simulator:", err)
    }
  }

  const handleTick = async () => {
    try {
      await api.triggerTick()
      onStatusChange()
    } catch (err) {
      console.error("Failed to tick simulator:", err)
    }
  }

  const handleSpeed = async (mult: number) => {
    try {
      await api.setSimulatorSpeed(mult)
      onStatusChange()
    } catch (err) {
      console.error("Failed to set speed:", err)
    }
  }

  const handleInject = async () => {
    setIsInjecting(true)
    try {
      await api.injectAnomaly(selectedAnomaly, undefined, 20)
      onStatusChange()
    } catch (err) {
      console.error("Failed to inject anomaly:", err)
    } finally {
      setIsInjecting(false)
    }
  }

  const handleClear = async () => {
    try {
      await api.clearAnomaly()
      onStatusChange()
    } catch (err) {
      console.error("Failed to clear anomaly:", err)
    }
  }

  const isRunning = status?.is_running ?? true
  const hasActiveAnomaly = !!status?.active_anomaly

  return (
    <div className="bg-[#1C2541]/95 border-b border-[#2A3B5C] px-6 py-2.5 backdrop-blur shadow-md flex flex-wrap items-center justify-between gap-4">
      {/* Left: Simulator Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            {isRunning ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            )}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Simulator: <strong className={isRunning ? "text-emerald-400" : "text-amber-400"}>{isRunning ? "ACTIVE" : "PAUSED"}</strong>
          </span>
        </div>

        <div className="hidden sm:flex items-center text-xs text-slate-400 pl-3 border-l border-slate-700/60">
          <span>Ticks: <strong className="text-slate-200">{status?.total_ticks ?? 0}</strong></span>
          <span className="mx-2">•</span>
          <span>Speed: <strong className="text-teal-400">{status?.tick_speed_multiplier ?? 1}x</strong></span>
        </div>

        {hasActiveAnomaly && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Active Injected Anomaly: {status?.active_anomaly?.type}</span>
          </div>
        )}
      </div>

      {/* Right: Controls & Anomaly Injection */}
      <div className="flex items-center flex-wrap gap-2.5">
        {/* Toggle Pause/Resume */}
        <button
          onClick={handleToggle}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
            isRunning
              ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600"
              : "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-950/40"
          }`}
        >
          {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{isRunning ? "Pause" : "Resume"}</span>
        </button>

        {/* Step Tick */}
        <button
          onClick={handleTick}
          title="Simulate 1 step immediately"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
        >
          <FastForward className="w-3.5 h-3.5" />
          <span>Step</span>
        </button>

        {/* Speed presets */}
        <div className="flex items-center bg-slate-900/80 rounded-lg p-0.5 border border-slate-700/70 text-xs">
          {[1, 2, 5].map((speed) => (
            <button
              key={speed}
              onClick={() => handleSpeed(speed)}
              className={`px-2 py-1 rounded font-medium transition ${
                (status?.tick_speed_multiplier ?? 1) === speed
                  ? "bg-[#5BC0BE] text-slate-950 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>

        {/* Anomaly Injection Selector */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-slate-700/60">
          <select
            value={selectedAnomaly}
            onChange={(e) => setSelectedAnomaly(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-teal-400"
          >
            <option value="AC_OVERLOAD">AC Overload (3.1 kW Spike)</option>
            <option value="HEATER_RUNAWAY">Heater Runaway (2.7 kW)</option>
            <option value="VOLTAGE_SAG">Grid Voltage Sag (192V)</option>
            <option value="PHANTOM_DRAIN">Phantom Vampire Drain (350W)</option>
          </select>

          {hasActiveAnomaly ? (
            <button
              onClick={handleClear}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 transition"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          ) : (
            <button
              onClick={handleInject}
              disabled={isInjecting}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600/90 hover:bg-rose-500 text-white border border-rose-500/70 transition shadow-sm"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Inject Anomaly</span>
            </button>
          )}
        </div>

        {/* Run All AI Agents */}
        <button
          onClick={onRunCoordinator}
          disabled={isRunningCoordinator}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-teal-500 to-cyan-400 hover:from-teal-400 hover:to-cyan-300 text-slate-950 shadow-md shadow-cyan-950/40 transition disabled:opacity-50"
        >
          {isRunningCoordinator ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Zap className="w-3.5 h-3.5 fill-current" />
          )}
          <span>{isRunningCoordinator ? "Coordinating..." : "Run AI Agents"}</span>
        </button>
      </div>
    </div>
  )
}
