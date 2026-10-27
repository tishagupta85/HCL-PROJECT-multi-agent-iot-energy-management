import React, { useState, useEffect } from "react"
import type { NavItemKey } from "./Sidebar"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { SimulatorControlBar } from "./SimulatorControlBar"
import { api } from "../services/api"
import type { SimulatorStatus, KpiMetrics } from "../types"

interface LayoutProps {
  currentTab: NavItemKey
  onSelectTab: (tab: NavItemKey) => void
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({
  currentTab,
  onSelectTab,
  children,
}) => {
  const [simStatus, setSimStatus] = useState<SimulatorStatus | null>(null)
  const [kpis, setKpis] = useState<KpiMetrics | null>(null)
  const [isCoordinating, setIsCoordinating] = useState(false)

  const refreshStatus = async () => {
    try {
      const [statusData, kpiData] = await Promise.all([
        api.getSimulatorStatus(),
        api.getKpiMetrics(),
      ])
      setSimStatus(statusData)
      setKpis(kpiData)
    } catch (err) {
      console.error("Failed to load header/simulator status:", err)
    }
  }

  useEffect(() => {
    refreshStatus()
    const timer = setInterval(refreshStatus, 3000)
    return () => clearInterval(timer)
  }, [])

  const handleRunCoordinator = async () => {
    setIsCoordinating(true)
    try {
      await api.runCoordinator()
      refreshStatus()
    } catch (err) {
      console.error("Failed to run coordinator:", err)
    } finally {
      setIsCoordinating(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-[#0B132B] text-slate-100">
      <Sidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        unresolvedAlertsCount={kpis?.unresolved_alerts_count ?? 0}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          unresolvedAlertsCount={kpis?.unresolved_alerts_count ?? 0}
          efficiencyScore={kpis?.efficiency_score ?? 92.5}
          onNavigateToAlerts={() => onSelectTab("anomalies")}
        />

        <SimulatorControlBar
          status={simStatus}
          onStatusChange={refreshStatus}
          onRunCoordinator={handleRunCoordinator}
          isRunningCoordinator={isCoordinating}
        />

        <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
