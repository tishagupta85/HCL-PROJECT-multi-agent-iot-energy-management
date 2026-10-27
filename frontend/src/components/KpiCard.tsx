import React from "react"
import type { LucideIcon } from "lucide-react"

interface KpiCardProps {
  title: string
  value: string | number
  unit?: string
  trend?: {
    value: number
    isPositiveGood?: boolean
    label?: string
  }
  icon: LucideIcon
  colorScheme?: "teal" | "blue" | "amber" | "emerald" | "rose"
  subtitle?: string
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  unit,
  trend,
  icon: Icon,
  colorScheme = "teal",
  subtitle,
}) => {
  const schemeStyles = {
    teal: "from-teal-500/20 to-teal-500/5 border-teal-500/30 text-teal-400",
    blue: "from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-400",
    amber: "from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-400",
    emerald: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400",
    rose: "from-rose-500/20 to-rose-500/5 border-rose-500/30 text-rose-400",
  }[colorScheme]

  return (
    <div className="relative overflow-hidden rounded-xl bg-[#1C2541]/90 border border-[#2A3B5C] p-5 shadow-lg backdrop-blur transition-all duration-200 hover:border-[#5BC0BE]/50 hover:shadow-cyan-950/20">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
          {title}
        </span>
        <div className={`p-2.5 rounded-lg bg-gradient-to-br ${schemeStyles} border`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-white">{value}</span>
        {unit && <span className="text-sm font-medium text-slate-400">{unit}</span>}
      </div>

      {(trend || subtitle) && (
        <div className="mt-3 flex items-center justify-between text-xs">
          {trend && (
            <span
              className={`inline-flex items-center font-medium ${
                trend.value < 0 ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {trend.value > 0 ? "+" : ""}
              {trend.value}% {trend.label || "vs yesterday"}
            </span>
          )}
          {subtitle && <span className="text-slate-400">{subtitle}</span>}
        </div>
      )}
    </div>
  )
}
