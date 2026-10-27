import { useState } from "react"
import { Layout } from "./components/Layout"
import type { NavItemKey } from "./components/Sidebar"
import { Overview } from "./pages/Overview"
import { LiveMonitoring } from "./pages/LiveMonitoring"
import { Devices } from "./pages/Devices"
import { Analytics } from "./pages/Analytics"
import { Forecasts } from "./pages/Forecasts"
import { AnomalyAlerts } from "./pages/AnomalyAlerts"
import { Optimization } from "./pages/Optimization"
import { AIAgents } from "./pages/AIAgents"
import { Reports } from "./pages/Reports"
import { Settings } from "./pages/Settings"

export function App() {
  const [currentTab, setCurrentTab] = useState<NavItemKey>("overview")

  const renderContent = () => {
    switch (currentTab) {
      case "overview":
        return <Overview onNavigateTab={setCurrentTab} />
      case "monitoring":
        return <LiveMonitoring />
      case "devices":
        return <Devices />
      case "analytics":
        return <Analytics />
      case "forecasts":
        return <Forecasts />
      case "anomalies":
        return <AnomalyAlerts />
      case "optimization":
        return <Optimization />
      case "agents":
        return <AIAgents />
      case "reports":
        return <Reports />
      case "settings":
        return <Settings />
      default:
        return <Overview onNavigateTab={setCurrentTab} />
    }
  }

  return (
    <Layout currentTab={currentTab} onSelectTab={setCurrentTab}>
      {renderContent()}
    </Layout>
  )
}

export default App
