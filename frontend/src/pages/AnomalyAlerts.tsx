import React, { useEffect, useState } from "react"
import { AlertTriangle, ShieldCheck, CheckCircle2, Clock, Filter, AlertOctagon } from "lucide-react"
import { api } from "../services/api"
import type { Alert } from "../types"

export const AnomalyAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL")
  const [showResolved, setShowResolved] = useState<boolean>(false)
  const [loading, setLoading] = useState(true)

  const loadAlerts = async () => {
    try {
      const data = await api.getAnomalies(
        showResolved ? undefined : false,
        filterSeverity === "ALL" ? undefined : filterSeverity
      )
      setAlerts(data)
    } catch (err) {
      console.error("Failed to load alerts:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAlerts()
    const timer = setInterval(loadAlerts, 4000)
    return () => clearInterval(timer)
  }, [filterSeverity, showResolved])

  const handleResolve = async (id: number) => {
    try {
      await api.resolveAnomaly(id)
      loadAlerts()
    } catch (err) {
      console.error("Failed to resolve alert:", err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <span>Anomaly Detection & Fault Diagnostics</span>
          </h2>
          <p className="text-xs text-slate-400">
            Machine Learning Isolation Forest and rolling Z-score detection of power surges, voltage sags, and continuous over-draw
          </p>
        </div>

        {/* Severity Filters */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-700 text-xs">
            {["ALL", "CRITICAL", "WARNING", "INFO"].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-2.5 py-1 rounded font-medium transition ${
                  filterSeverity === sev
                    ? "bg-[#1C2541] text-white border border-teal-500/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-300 ml-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showResolved}
              onChange={(e) => setShowResolved(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-teal-500 focus:ring-0"
            />
            <span>Include Resolved</span>
          </label>
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3.5">
        {alerts.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#1C2541]/80 border border-[#2A3B5C] shadow-lg">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">All Clear — No Active Anomalies</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              The Anomaly Detection Agent continuously inspects all 8 appliances. To simulate a fault, use the top control bar to inject an anomaly!
            </p>
          </div>
        ) : (
          alerts.map((alert) => {
            const isCrit = alert.severity === "CRITICAL"
            const isWarn = alert.severity === "WARNING"

            return (
              <div
                key={alert.id}
                className={`rounded-xl border p-5 shadow-lg transition-all duration-200 ${
                  alert.is_resolved
                    ? "bg-slate-900/40 border-slate-800 opacity-60"
                    : isCrit
                    ? "bg-[#1C2541]/95 border-rose-500/40 hover:border-rose-500"
                    : isWarn
                    ? "bg-[#1C2541]/95 border-amber-500/40 hover:border-amber-500"
                    : "bg-[#1C2541]/95 border-blue-500/40 hover:border-blue-500"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                          isCrit
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                            : isWarn
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                        }`}
                      >
                        {alert.severity}
                      </span>

                      <span className="text-xs font-mono text-slate-400">
                        {alert.alert_type}
                      </span>

                      {alert.is_resolved && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          RESOLVED
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white">{alert.title}</h3>
                    <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                      {alert.message}
                    </p>
                  </div>

                  {!alert.is_resolved && (
                    <button
                      onClick={() => handleResolve(alert.id)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white border border-slate-700 hover:border-emerald-500 transition shadow-sm"
                    >
                      Acknowledge & Resolve
                    </button>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-[#2A3B5C]/60 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
                  <div className="flex items-center gap-4">
                    <span>
                      Device: <strong className="text-slate-200">{alert.device_name || "Grid Main"}</strong>
                    </span>
                    {alert.metric_value !== null && (
                      <span>
                        Measured: <strong className="text-rose-400">{alert.metric_value}</strong>
                      </span>
                    )}
                    {alert.threshold_value !== null && (
                      <span>
                        Threshold: <strong className="text-slate-300">{alert.threshold_value}</strong>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(alert.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
