import React, { useEffect, useState } from "react"
import { Tv, Plus, Search, Power, CheckCircle, Sliders, X } from "lucide-react"
import { api } from "../services/api"
import type { Device } from "../types"

export const Devices: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([])
  const [search, setSearch] = useState("")
  const [roomFilter, setRoomFilter] = useState("ALL")
  const [showAddModal, setShowAddModal] = useState(false)
  const [newDevice, setNewDevice] = useState({
    name: "",
    device_type: "Appliance",
    room: "Living Room",
    rated_watts: 500,
    is_controllable: true,
    priority: 2,
  })

  const loadDevices = async () => {
    try {
      const data = await api.getDevices()
      setDevices(data)
    } catch (err) {
      console.error("Failed to load devices:", err)
    }
  }

  useEffect(() => {
    loadDevices()
    const timer = setInterval(loadDevices, 3000)
    return () => clearInterval(timer)
  }, [])

  const handleToggle = async (id: number) => {
    try {
      await api.toggleDevice(id)
      loadDevices()
    } catch (err) {
      console.error("Failed to toggle device:", err)
    }
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.createDevice(newDevice)
      setShowAddModal(false)
      setNewDevice({
        name: "",
        device_type: "Appliance",
        room: "Living Room",
        rated_watts: 500,
        is_controllable: true,
        priority: 2,
      })
      loadDevices()
    } catch (err) {
      console.error("Failed to create device:", err)
    }
  }

  const rooms = ["ALL", ...Array.from(new Set(devices.map((d) => d.room)))]

  const filteredDevices = devices.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.device_type.toLowerCase().includes(search.toLowerCase())
    const matchesRoom = roomFilter === "ALL" || d.room === roomFilter
    return matchesSearch && matchesRoom
  })

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Tv className="w-5 h-5 text-teal-400" />
            <span>Connected Appliances & Sub-Meters</span>
          </h2>
          <p className="text-xs text-slate-400">
            Hardware registry, rated specifications, and real-time remote curtailment
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-md shadow-cyan-950/40 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Appliance</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-[#1C2541]/90 border border-[#2A3B5C] flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search appliance by name or type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-teal-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Room Filter:</span>
          <select
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-teal-400"
          >
            {rooms.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Devices Table */}
      <div className="rounded-xl bg-[#1C2541]/90 border border-[#2A3B5C] overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-[#2A3B5C]">
              <tr>
                <th className="px-5 py-3">Device Name</th>
                <th className="px-5 py-3">Type & Room</th>
                <th className="px-5 py-3">Rated Power</th>
                <th className="px-5 py-3">Current Draw</th>
                <th className="px-5 py-3">Grid Priority</th>
                <th className="px-5 py-3">Controllable</th>
                <th className="px-5 py-3 text-right">Power State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredDevices.map((dev) => (
                <tr key={dev.id} className="hover:bg-slate-800/40 transition">
                  <td className="px-5 py-4 font-bold text-white">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full ${dev.is_on ? "bg-emerald-400" : "bg-slate-600"}`} />
                      <span>{dev.name}</span>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="font-medium text-slate-200">{dev.device_type}</div>
                    <div className="text-[10px] text-teal-400">{dev.room}</div>
                  </td>

                  <td className="px-5 py-4 font-mono text-slate-300">
                    {dev.rated_watts} W
                  </td>

                  <td className="px-5 py-4">
                    <span className="font-bold text-white">
                      {dev.is_on ? dev.current_power_w ?? 0 : 0} W
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      {dev.current_voltage_v ?? 230}V • {dev.current_amperes ?? 0}A
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        dev.priority === 1
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : dev.priority === 3
                          ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                          : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      {dev.priority === 1 ? "Critical (P1)" : dev.priority === 3 ? "Flexible (P3)" : "Normal (P2)"}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span className="text-[11px] text-slate-400">
                      {dev.is_controllable ? "Smart Switchable" : "Locked (Safety)"}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => handleToggle(dev.id)}
                      disabled={!dev.is_controllable}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                        dev.is_on
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-sm"
                          : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                      } ${!dev.is_controllable ? "opacity-40 cursor-not-allowed" : ""}`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{dev.is_on ? "ON" : "OFF"}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Device Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#1C2541] border border-[#2A3B5C] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#2A3B5C]">
              <h3 className="text-base font-bold text-white">Register New IoT Appliance</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Appliance Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Electric Vehicle Charger"
                  value={newDevice.name}
                  onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category / Type</label>
                  <input
                    type="text"
                    required
                    value={newDevice.device_type}
                    onChange={(e) => setNewDevice({ ...newDevice, device_type: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Room Location</label>
                  <input
                    type="text"
                    required
                    value={newDevice.room}
                    onChange={(e) => setNewDevice({ ...newDevice, room: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Rated Power (Watts)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newDevice.rated_watts}
                    onChange={(e) => setNewDevice({ ...newDevice, rated_watts: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Grid Priority</label>
                  <select
                    value={newDevice.priority}
                    onChange={(e) => setNewDevice({ ...newDevice, priority: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-400"
                  >
                    <option value={1}>P1: Critical (No Shed)</option>
                    <option value={2}>P2: Normal</option>
                    <option value={3}>P3: Flexible (Peak Shed)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="controllable"
                  checked={newDevice.is_controllable}
                  onChange={(e) => setNewDevice({ ...newDevice, is_controllable: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-teal-500 focus:ring-0"
                />
                <label htmlFor="controllable" className="text-slate-300">
                  Allow AI Agents to automate power state
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg font-bold bg-teal-500 hover:bg-teal-400 text-slate-950"
                >
                  Save Appliance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
