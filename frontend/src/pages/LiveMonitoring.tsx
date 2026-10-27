import React, { useEffect, useState } from "react"
import { Activity, Zap, Gauge, Power, Wifi, ShieldCheck, AlertCircle } from "lucide-react"
import { api } from "../services/api"
import type { Device, LiveAggregate } from "../types"

export const LiveMonitoring: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([])
  const [aggregate, setAggregate] = useState<LiveAggregate | null>(null)
  const [powerHistory, setPowerHistory] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLive = async () => {
    try {
      const [devs, agg] = await Promise.all([
        api.getDevices(),
        api.getLiveAggregate(),
      ])
      setDevices(devs)
      setAggregate(agg)
      setPowerHistory((prev) => [...prev.slice(-19), agg.total_power_kw])
    } catch (err) {
      console.error("Failed to fetch live monitoring:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLive()
    const timer = setInterval(fetchLive, 2000)
    return () => clearInterval(timer)
  }, [])

  const handleToggleDevice = async (id: number) => {
    try {
      await api.toggleDevice(id)
      fetchLive()
    } catch (err) {
      console.error("Failed to toggle device:", err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-400" />
            <span>Live IoT Telemetry & Sensor Stream</span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time sub-metering data sampled at 2.0s intervals from all 8 smart appliances
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Live Stream Synchronized</span>
        </div>
      </div>

      {/* Aggregate Telemetry Meters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#1C2541]/90 border border-[#2A3B5C] shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Active Demand</span>
            <Zap className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {aggregate?.total_power_kw ?? 0} <span className="text-sm font-normal text-slate-400">kW</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {aggregate?.total_power_w ?? 0} Watts drawn
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#1C2541]/90 border border-[#2A3B5C] shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Bus Voltage</span>
            <Gauge className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {aggregate?.average_voltage_v ?? 230.0} <span className="text-sm font-normal text-slate-400">V</span>
          </div>
          <div className="text-[11px] text-emerald-400 mt-1">
            Nominal standard: 230V ± 8%
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#1C2541]/90 border border-[#2A3B5C] shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Current</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {aggregate?.total_current_a ?? 0} <span className="text-sm font-normal text-slate-400">A</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Phasor sum across bus
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#1C2541]/90 border border-[#2A3B5C] shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Average Power Factor</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {aggregate?.average_power_factor ?? 0.95}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Target &gt; 0.90 (High Efficiency)
          </div>
        </div>
      </div>

      {/* Live Sparkline */}
      <div className="p-4 rounded-xl bg-[#1C2541]/90 border border-[#2A3B5C] shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Real-time Load Oscilloscope (Last 20 Samples)
          </span>
          <span className="text-xs text-teal-400 font-mono">
            Current: {aggregate?.total_power_kw ?? 0} kW
          </span>
        </div>
        <div className="h-16 flex items-end gap-1.5 pt-2">
          {powerHistory.map((val, i) => {
            const heightPct = Math.min(100, Math.max(10, (val / 6.0) * 100))
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  style={{ height: `${heightPct}%` }}
                  className="w-full rounded-t bg-gradient-to-t from-teal-500/30 to-teal-400 transition-all duration-300"
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* 8 Appliances Live Telemetry Cards */}
      <div>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
          Sub-Metered Appliances ({devices.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {devices.map((dev) => {
            const isCritical = dev.priority === 1
            const isFlexible = dev.priority === 3
            const powerW = dev.current_power_w ?? 0

            return (
              <div
                key={dev.id}
                className={`rounded-xl bg-[#1C2541]/90 border p-4 shadow-lg transition-all duration-200 ${
                  dev.is_on
                    ? "border-[#2A3B5C] hover:border-teal-500/40"
                    : "border-slate-800 opacity-60 bg-slate-900/40"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-teal-400 uppercase tracking-wider">
                      {dev.room}
                    </span>
                    <h4 className="text-sm font-bold text-white mt-0.5">{dev.name}</h4>
                  </div>

                  <button
                    onClick={() => handleToggleDevice(dev.id)}
                    disabled={!dev.is_controllable}
                    title={
                      !dev.is_controllable
                        ? "Critical appliance cannot be remotely turned off"
                        : "Toggle device power"
                    }
                    className={`p-2 rounded-lg border transition ${
                      dev.is_on
                        ? "bg-teal-500/20 text-teal-400 border-teal-500/40 shadow-sm shadow-teal-950/40 hover:bg-teal-500/30"
                        : "bg-slate-800 text-slate-500 border-slate-700 hover:bg-slate-700"
                    } ${!dev.is_controllable ? "cursor-not-allowed opacity-50" : ""}`}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4 pt-3 border-t border-[#2A3B5C]/60 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Active Power</span>
                    <span className="text-base font-bold text-white">
                      {dev.is_on ? powerW : 0} <span className="text-[11px] font-normal text-slate-400">W</span>
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">Voltage</span>
                    <span className="text-sm font-semibold text-slate-200">
                      {dev.current_voltage_v ?? 230.0} V
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">Current</span>
                    <span className="text-sm font-semibold text-slate-200">
                      {dev.current_amperes ?? 0} A
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">Power Factor</span>
                    <span className="text-sm font-semibold text-slate-200">
                      {dev.power_factor ?? 0.95}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800">
                  <span>Rated: {dev.rated_watts}W</span>
                  <span
                    className={`px-1.5 py-0.5 rounded font-bold ${
                      isCritical
                        ? "bg-rose-500/20 text-rose-300"
                        : isFlexible
                        ? "bg-teal-500/20 text-teal-300"
                        : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {isCritical ? "CRITICAL" : isFlexible ? "FLEXIBLE" : "NORMAL"}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
