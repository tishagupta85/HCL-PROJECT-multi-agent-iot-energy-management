import React from "react"
import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  Activity,
  Tv,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Zap,
  Bot,
  FileText,
  Settings as SettingsIcon,
} from "lucide-react"

export type NavItemKey =
  | "overview"
  | "monitoring"
  | "devices"
  | "analytics"
  | "forecasts"
  | "anomalies"
  | "optimization"
  | "agents"
  | "reports"
  | "settings"

interface NavItem {
  key: NavItemKey
  label: string
  icon: LucideIcon
  badge?: number | string
  badgeColor?: string
}

interface SidebarProps {
  currentTab: NavItemKey
  onSelectTab: (tab: NavItemKey) => void
  unresolvedAlertsCount: number
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  unresolvedAlertsCount,
}) => {
  const navItems: NavItem[] = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "monitoring", label: "Live Monitoring", icon: Activity },
    { key: "devices", label: "Devices", icon: Tv },
    { key: "analytics", label: "Analytics", icon: BarChart3 },
    { key: "forecasts", label: "Forecasts", icon: TrendingUp },
    {
      key: "anomalies",
      label: "Anomaly Alerts",
      icon: AlertTriangle,
      badge: unresolvedAlertsCount > 0 ? unresolvedAlertsCount : undefined,
      badgeColor: "bg-rose-500",
    },
    { key: "optimization", label: "Optimization", icon: Zap },
    { key: "agents", label: "AI Agents", icon: Bot, badge: 5, badgeColor: "bg-teal-500 text-slate-950 font-bold" },
    { key: "reports", label: "Reports", icon: FileText },
    { key: "settings", label: "Settings", icon: SettingsIcon },
  ]

  return (
    <aside className="w-64 shrink-0 bg-[#0B132B] border-r border-[#2A3B5C] flex flex-col justify-between p-4 min-h-screen">
      <div>
        <div className="px-3 py-3 mb-4 flex items-center gap-2.5 border-b border-[#2A3B5C]/60">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/40 flex items-center justify-center text-teal-400 font-black">
            ⚡
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-white">EnergyManager</div>
            <div className="text-[10px] text-teal-400 uppercase tracking-widest font-semibold">Multi-Agent AI</div>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentTab === item.key

            return (
              <button
                key={item.key}
                onClick={() => onSelectTab(item.key)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition duration-150 ${
                  isActive
                    ? "bg-[#1C2541] text-teal-300 border border-[#5BC0BE]/40 shadow-sm shadow-teal-950/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#1C2541]/50 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-teal-400" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      item.badgeColor || "bg-teal-500 text-slate-950"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      <div className="p-3 rounded-xl bg-[#1C2541]/70 border border-[#2A3B5C] text-xs">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span>Grid Capacity</span>
          <span className="font-bold text-slate-200">6.0 kW</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div className="bg-gradient-to-r from-teal-400 to-cyan-500 h-1.5 rounded-full w-[45%]"></div>
        </div>
        <div className="mt-2 text-[10px] text-slate-400 text-center">
          Smarter Energy for a Greener Future 🌿
        </div>
      </div>
    </aside>
  )
}
