import React, { useEffect, useState } from "react"
import { Zap, CheckCircle2, DollarSign, Clock, ArrowRight, ShieldCheck, X } from "lucide-react"
import { api } from "../services/api"
import type { Recommendation } from "../types"

export const Optimization: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [statusFilter, setStatusFilter] = useState<string>("PENDING")
  const [loading, setLoading] = useState(true)

  const loadRecs = async () => {
    try {
      const data = await api.getOptimizations(statusFilter === "ALL" ? undefined : statusFilter)
      setRecommendations(data)
    } catch (err) {
      console.error("Failed to load recommendations:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRecs()
  }, [statusFilter])

  const handleApply = async (id: number) => {
    try {
      await api.applyOptimization(id)
      loadRecs()
    } catch (err) {
      console.error("Failed to apply recommendation:", err)
    }
  }

  const handleDismiss = async (id: number) => {
    try {
      await api.dismissOptimization(id)
      loadRecs()
    } catch (err) {
      console.error("Failed to dismiss recommendation:", err)
    }
  }

  const pendingRecs = recommendations.filter((r) => r.status === "PENDING")
  const totalPendingKwh = pendingRecs.reduce((acc, r) => acc + r.potential_kwh_savings, 0)
  const totalPendingCost = pendingRecs.reduce((acc, r) => acc + r.potential_cost_savings, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-teal-400" />
            <span>Energy Savings & Load Curtailment</span>
          </h2>
          <p className="text-xs text-slate-400">
            Algorithmic peak shaving, tariff arbitrage, and automated thermostat setpoint optimization
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-700 text-xs">
          {["PENDING", "APPLIED", "DISMISSED", "ALL"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded font-medium transition ${
                statusFilter === s
                  ? "bg-[#1C2541] text-teal-300 border border-teal-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Savings Summary Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-teal-500/15 via-[#1C2541] to-[#1C2541] border border-teal-500/30 p-6 shadow-xl backdrop-blur flex flex-wrap items-center justify-between gap-6">
        <div>
          <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">
            Available Curtailment Potential
          </span>
          <h3 className="text-2xl font-bold text-white mt-1">
            Save up to {totalPendingKwh.toFixed(1)} kWh / Day
          </h3>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Applying the recommended load-shifting and phantom-draw actions lowers peak grid demand and saves an estimated ${totalPendingCost.toFixed(2)} on daily utility tariffs.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/80 text-center">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Est. Cost Savings</span>
            <span className="text-xl font-bold text-emerald-400">${totalPendingCost.toFixed(2)}</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/80 text-center">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Energy Trim</span>
            <span className="text-xl font-bold text-teal-400">{totalPendingKwh.toFixed(1)} kWh</span>
          </div>
        </div>
      </div>

      {/* Recommendations Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {recommendations.length === 0 ? (
          <div className="col-span-2 p-12 text-center rounded-2xl bg-[#1C2541]/80 border border-[#2A3B5C]">
            <CheckCircle2 className="w-10 h-10 text-teal-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-white">No actions in this category</h4>
            <p className="text-xs text-slate-400 mt-1">Check other filter tabs or run the Optimization Agent.</p>
          </div>
        ) : (
          recommendations.map((rec) => {
            const isPending = rec.status === "PENDING"
            const isApplied = rec.status === "APPLIED"

            return (
              <div
                key={rec.id}
                className={`rounded-xl border p-5 shadow-lg flex flex-col justify-between transition-all duration-200 ${
                  isApplied
                    ? "bg-[#1C2541]/80 border-emerald-500/30"
                    : "bg-[#1C2541]/95 border-[#2A3B5C] hover:border-teal-500/40"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40 uppercase">
                      {rec.action_type.replace(/_/g, " ")}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        isApplied
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : rec.priority === "HIGH"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      {rec.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white">{rec.title}</h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">{rec.description}</p>
                </div>

                <div className="mt-5 pt-4 border-t border-[#2A3B5C]/60 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-emerald-400 font-bold block">
                      Save ~{rec.potential_kwh_savings} kWh (${rec.potential_cost_savings})
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Target: {rec.device_name || "Whole Home"}
                    </span>
                  </div>

                  {isPending && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDismiss(rec.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                        title="Dismiss"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleApply(rec.id)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 transition shadow-sm"
                      >
                        Apply Action
                      </button>
                    </div>
                  )}

                  {isApplied && (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Active</span>
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
