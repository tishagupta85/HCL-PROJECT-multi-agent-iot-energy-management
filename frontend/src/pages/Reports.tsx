import React, { useEffect, useState } from "react"
import { FileText, Download, ShieldCheck, Award, Zap, DollarSign, Leaf } from "lucide-react"
import { api } from "../services/api"
import type { ReportSummary } from "../types"

export const Reports: React.FC = () => {
  const [report, setReport] = useState<ReportSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const data = await api.getReportSummary()
        setReport(data)
      } catch (err) {
        console.error("Failed to load report summary:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchReport()
  }, [])

  const handleDownloadJson = () => {
    if (!report) return
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `energy_audit_${report.report_id}.json`
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* Header & Export Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-400" />
            <span>Energy Audit & Executive Performance Reports</span>
          </h2>
          <p className="text-xs text-slate-400">
            Multi-agent system validation reports, carbon accounting, and historical telemetry exports
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadJson}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <Download className="w-4 h-4 text-teal-400" />
            <span>Download JSON</span>
          </button>

          <a
            href={api.getExportUrl()}
            download
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 transition shadow-md shadow-cyan-950/40"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV Telemetry</span>
          </a>
        </div>
      </div>

      {/* Official Audit Report Card */}
      <div className="rounded-2xl bg-[#1C2541]/90 border border-[#2A3B5C] p-6 shadow-xl backdrop-blur space-y-6">
        {/* Report Header Bar */}
        <div className="flex flex-wrap items-center justify-between pb-4 border-b border-[#2A3B5C] gap-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-teal-400">
              AUDIT ID: {report?.report_id ?? "RPT-PENDING"}
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5">Comprehensive IoT Energy Efficiency Audit</h3>
            <span className="text-xs text-slate-400">Interval: {report?.period ?? "Last 7 Days"} • {report?.devices_count ?? 8} Monitored Appliances</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase">Efficiency Grade</span>
              <span className="text-2xl font-black text-teal-300">
                {report?.energy_efficiency_grade ?? "A"}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400">
              <Award className="w-7 h-7" />
            </div>
          </div>
        </div>

        {/* 4 Metric Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs text-slate-400">7-Day Energy Consumption</span>
            <div className="text-xl font-bold text-white mt-1">
              {report?.total_consumption_kwh ?? 0} kWh
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs text-slate-400">Peak Demand Load</span>
            <div className="text-xl font-bold text-amber-400 mt-1">
              {report?.peak_demand_kw ?? 0} kW
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs text-slate-400">Utility Cost Total</span>
            <div className="text-xl font-bold text-emerald-400 mt-1">
              ${report?.total_cost_usd ?? 0}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs text-slate-400">Carbon Emissions</span>
            <div className="text-xl font-bold text-cyan-400 mt-1">
              {report?.carbon_footprint_kg ?? 0} kg CO₂
            </div>
          </div>
        </div>

        {/* Multi-Agent System Audit Breakdown */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-4">
          <h4 className="font-bold text-white uppercase tracking-wider text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Autonomous Multi-Agent System Validation</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-[#1C2541]/70 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Optimization Realized</span>
              <span className="text-base font-bold text-emerald-400 mt-0.5 block">
                {report?.total_applied_savings_kwh ?? 0} kWh (${report?.total_applied_savings_usd ?? 0})
              </span>
              <span className="text-[10px] text-slate-500">Savings achieved from applied AI actions</span>
            </div>

            <div className="p-3 rounded-lg bg-[#1C2541]/70 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Anomalies Resolution</span>
              <span className="text-base font-bold text-teal-300 mt-0.5 block">
                {report?.alerts_summary.resolution_rate_pct ?? 100}%
              </span>
              <span className="text-[10px] text-slate-500">
                {report?.alerts_summary.resolved ?? 0} of {report?.alerts_summary.total_detected ?? 0} faults cleared
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#1C2541]/70 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Agent Health Status</span>
              <span className="text-base font-bold text-emerald-400 mt-0.5 block">
                {report?.agents_summary.system_health ?? "OPTIMAL"}
              </span>
              <span className="text-[10px] text-slate-500">
                {report?.agents_summary.total_orchestration_cycles ?? 0} execution cycles logged
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
