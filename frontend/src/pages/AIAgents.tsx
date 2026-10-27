import React, { useEffect, useState } from "react"
import {
  Bot,
  Play,
  RefreshCw,
  CheckCircle2,
  Terminal,
  Activity,
  TrendingUp,
  ShieldAlert,
  Zap,
} from "lucide-react"
import { api } from "../services/api"
import type { AgentStatus, AgentLog } from "../types"

export const AIAgents: React.FC = () => {
  const [agents, setAgents] = useState<AgentStatus[]>([])
  const [logs, setLogs] = useState<AgentLog[]>([])
  const [runningAgentKey, setRunningAgentKey] = useState<string | null>(null)
  const [isCoordinating, setIsCoordinating] = useState(false)
  const [coordinatorResult, setCoordinatorResult] = useState<any>(null)

  const loadData = async () => {
    try {
      const [agentsData, historyData] = await Promise.all([
        api.getAgentsStatus(),
        api.getAgentHistory(30),
      ])
      setAgents(agentsData)
      setLogs(historyData)
    } catch (err) {
      console.error("Failed to load agent statuses:", err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRunSingle = async (key: string) => {
    setRunningAgentKey(key)
    try {
      await api.runAgent(key)
      await loadData()
    } catch (err) {
      console.error(`Failed to run agent ${key}:`, err)
    } finally {
      setRunningAgentKey(null)
    }
  }

  const handleRunCoordinator = async () => {
    setIsCoordinating(true)
    try {
      const res = await api.runCoordinator()
      setCoordinatorResult(res)
      await loadData()
    } catch (err) {
      console.error("Failed to run coordinator:", err)
    } finally {
      setIsCoordinating(false)
    }
  }

  const agentIcons: Record<string, any> = {
    monitoring: Activity,
    forecasting: TrendingUp,
    anomaly: ShieldAlert,
    optimization: Zap,
    coordinator: Bot,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bot className="w-5 h-5 text-teal-400" />
            <span>Multi-Agent AI Coordination Center</span>
          </h2>
          <p className="text-xs text-slate-400">
            Orchestration and execution telemetry for 5 independent autonomous Python AI agents
          </p>
        </div>

        <button
          onClick={handleRunCoordinator}
          disabled={isCoordinating}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-500 to-cyan-400 hover:from-teal-400 hover:to-cyan-300 text-slate-950 shadow-lg shadow-cyan-950/40 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isCoordinating ? "animate-spin" : ""}`} />
          <span>{isCoordinating ? "Orchestrating Workflow..." : "Execute Full Multi-Agent Workflow"}</span>
        </button>
      </div>

      <div className="rounded-2xl bg-[#1C2541]/90 border border-[#2A3B5C] p-6 shadow-xl backdrop-blur">
        <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400 mb-4">
          Autonomous Agent Execution Pipeline
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
          {[
            { step: "1", title: "Monitoring", desc: "Validates & Cleans Telemetry", color: "from-blue-500/20 to-blue-500/5 text-blue-400 border-blue-500/40" },
            { step: "2", title: "Forecasting", desc: "Predicts 24h/7d Demand", color: "from-purple-500/20 to-purple-500/5 text-purple-400 border-purple-500/40" },
            { step: "3", title: "Anomaly Detect", desc: "Isolation Forest & Spikes", color: "from-rose-500/20 to-rose-500/5 text-rose-400 border-rose-500/40" },
            { step: "4", title: "Optimization", desc: "Peak Shaving & Savings", color: "from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/40" },
            { step: "5", title: "Coordinator", desc: "Synthesizes & Dispatches", color: "from-teal-500/20 to-teal-500/5 text-teal-400 border-teal-500/40" },
          ].map((node) => (
            <div key={node.step} className="relative">
              <div className={`p-4 rounded-xl border bg-gradient-to-b ${node.color} text-center shadow-md`}>
                <div className="w-6 h-6 rounded-full bg-slate-900 border border-current text-[11px] font-bold flex items-center justify-center mx-auto mb-2">
                  {node.step}
                </div>
                <div className="font-bold text-white text-xs">{node.title}</div>
                <div className="text-[10px] text-slate-300 mt-1 leading-tight">{node.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {coordinatorResult && (
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-teal-500/40 shadow-xl text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              Latest Multi-Agent Decision Directives
            </span>
            <span className="font-bold text-white px-2.5 py-0.5 rounded-full bg-teal-500/20 border border-teal-500/40">
              Grade: {coordinatorResult.data?.system_grade} (Stability: {coordinatorResult.data?.grid_stability_index}%)
            </span>
          </div>

          <div className="space-y-1.5">
            {coordinatorResult.data?.coordinated_decisions?.map((d: string, idx: number) => (
              <div key={idx} className="p-2 rounded-lg bg-[#1C2541] border border-slate-800 text-slate-200">
                {d}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {agents.map((agent) => {
          const Icon = agentIcons[agent.key] || Bot
          const isRunning = runningAgentKey === agent.key
          const isSuccess = agent.last_status === "SUCCESS"

          return (
            <div
              key={agent.key}
              className="rounded-xl bg-[#1C2541]/90 border border-[#2A3B5C] p-5 shadow-lg flex flex-col justify-between hover:border-teal-500/40 transition duration-200"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{agent.name}</h4>
                      <span className="text-[10px] text-teal-400">{agent.role}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isSuccess
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {agent.last_status}
                  </span>
                </div>

                <p className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-slate-800 leading-relaxed min-h-[64px]">
                  {agent.last_summary}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#2A3B5C]/60 flex items-center justify-between text-xs">
                <div className="text-[11px] text-slate-400">
                  <span>Duration: </span>
                  <strong className="text-slate-200">{agent.last_duration_ms ? `${agent.last_duration_ms} ms` : "--"}</strong>
                </div>

                <button
                  onClick={() => handleRunSingle(agent.key)}
                  disabled={isRunning}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-teal-400 border border-slate-700 transition disabled:opacity-50"
                >
                  <Play className={`w-3 h-3 ${isRunning ? "animate-spin" : ""}`} />
                  <span>{isRunning ? "Running..." : "Run Agent"}</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-xl bg-slate-950 border border-slate-800 p-5 shadow-2xl font-mono text-xs">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-slate-400">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-teal-400" />
            <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              Multi-Agent Execution Terminal & Audit Trail
            </span>
          </div>
          <span className="text-[10px] text-slate-500">{logs.length} logged cycles</span>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-2.5 text-[11px]">
              <span className="text-slate-600 shrink-0">
                [{new Date(log.timestamp).toLocaleTimeString()}]
              </span>
              <span className="text-teal-400 font-bold shrink-0">{log.agent_name}:</span>
              <span className="text-slate-300 flex-1">{log.summary}</span>
              <span className="text-slate-500 shrink-0">{log.execution_time_ms}ms</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
