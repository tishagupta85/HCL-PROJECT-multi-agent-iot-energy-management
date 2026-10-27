import React, { useState } from "react"
import { Settings as SettingsIcon, Sliders, DollarSign, Cpu, AlertTriangle, CheckCircle2 } from "lucide-react"
import { api } from "../services/api"

export const Settings: React.FC = () => {
  const [peakRate, setPeakRate] = useState(0.28)
  const [offPeakRate, setOffPeakRate] = useState(0.12)
  const [gridLimit, setGridLimit] = useState(6.0)
  const [contamination, setContamination] = useState(0.05)
  const [saved, setSaved] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-teal-400" />
          <span>System Parameters & Energy Tariff Settings</span>
        </h2>
        <p className="text-xs text-slate-400">
          Configure utility pricing tiers, machine learning sensitivity thresholds, and grid safety limits
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Utility Tariff Section */}
        <div className="rounded-xl bg-[#1C2541]/90 border border-[#2A3B5C] p-5 shadow-lg space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            <span>Time-of-Use (TOU) Tariff Pricing</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Peak Window Tariff ($/kWh)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={peakRate}
                onChange={(e) => setPeakRate(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-400"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Active 14:00 - 20:00</span>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Off-Peak Window Tariff ($/kWh)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={offPeakRate}
                onChange={(e) => setOffPeakRate(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-400"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Active 20:00 - 14:00</span>
            </div>
          </div>
        </div>

        {/* Grid Infrastructure & ML Sensitivity */}
        <div className="rounded-xl bg-[#1C2541]/90 border border-[#2A3B5C] p-5 shadow-lg space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-2">
            <Sliders className="w-4 h-4" />
            <span>Grid Capacity & ML Detection Parameters</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Main Grid Service Capacity (kW)
              </label>
              <input
                type="number"
                step="0.5"
                min="1.0"
                value={gridLimit}
                onChange={(e) => setGridLimit(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-400"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Trips overload warnings when total demand approaches limit
              </span>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Isolation Forest Contamination Rate ({contamination})
              </label>
              <input
                type="range"
                min="0.01"
                max="0.10"
                step="0.01"
                value={contamination}
                onChange={(e) => setContamination(Number(e.target.value))}
                className="w-full accent-teal-400 mt-2"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Higher values increase anomaly alert sensitivity
              </span>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          {saved && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>Settings successfully updated</span>
            </div>
          )}
          {!saved && <div />}

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-md shadow-cyan-950/40 transition"
          >
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  )
}
