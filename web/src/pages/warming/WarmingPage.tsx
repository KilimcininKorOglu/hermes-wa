import { useEffect, useState, useCallback } from "react"
import { Card } from "../../components/ui/Card"
import { Button } from "../../components/ui/Button"
import { Badge } from "../../components/ui/Badge"
import { Input } from "../../components/ui/Input"
import {
  Flame,
  Plus,
  Trash2,
  Play,
  Pause,
  Square,
  RotateCcw,
  ScrollText,
  FileText,
  RefreshCw,
  X,
} from "lucide-react"
import api from "../../lib/api"
import type { ApiResponse, WarmingRoom, WarmingScript, WarmingLog } from "../../lib/types"
import toast from "react-hot-toast"

type Tab = "rooms" | "scripts" | "logs"

const statusVariant = (s: string) => {
  if (s === "ACTIVE") return "success"
  if (s === "PAUSE") return "warning"
  if (s === "FINISHED") return "info"
  return "muted"
}

export function WarmingPage() {
  const [tab, setTab] = useState<Tab>("rooms")

  // Rooms
  const [rooms, setRooms] = useState<WarmingRoom[]>([])
  const [roomsLoading, setRoomsLoading] = useState(true)

  // Scripts
  const [scripts, setScripts] = useState<WarmingScript[]>([])
  const [scriptsLoading, setScriptsLoading] = useState(false)
  const [showCreateScript, setShowCreateScript] = useState(false)
  const [newScript, setNewScript] = useState({ title: "", description: "", category: "casual" })

  // Logs
  const [logs, setLogs] = useState<WarmingLog[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [logRoomId, setLogRoomId] = useState("")

  const fetchRooms = useCallback(async () => {
    setRoomsLoading(true)
    try {
      const res = await api.get<ApiResponse<WarmingRoom[] | { rooms: WarmingRoom[] }>>("/api/warming/rooms")
      if (res.data.success && res.data.data) {
        const data = res.data.data
        setRooms(Array.isArray(data) ? data : data.rooms || [])
      }
    } catch { /* ignore */ } finally { setRoomsLoading(false) }
  }, [])

  const fetchScripts = useCallback(async () => {
    setScriptsLoading(true)
    try {
      const res = await api.get<ApiResponse<WarmingScript[] | { scripts: WarmingScript[] }>>("/api/warming/scripts?q=&category=")
      if (res.data.success && res.data.data) {
        const data = res.data.data
        setScripts(Array.isArray(data) ? data : data.scripts || [])
      }
    } catch { /* ignore */ } finally { setScriptsLoading(false) }
  }, [])

  const fetchLogs = useCallback(async () => {
    if (!logRoomId) return
    setLogsLoading(true)
    try {
      const res = await api.get<ApiResponse<WarmingLog[]>>(`/api/warming/logs?roomId=${logRoomId}&status=&limit=50`)
      if (res.data.success && res.data.data) {
        setLogs(res.data.data)
      }
    } catch { /* ignore */ } finally { setLogsLoading(false) }
  }, [logRoomId])

  useEffect(() => {
    if (tab === "rooms") fetchRooms()
    if (tab === "scripts") fetchScripts()
    if (tab === "logs") fetchLogs()
  }, [tab, fetchRooms, fetchScripts, fetchLogs])

  const updateRoomStatus = async (roomId: string, status: string) => {
    try {
      await api.patch(`/api/warming/rooms/${roomId}/status`, { status })
      toast.success(`Room ${status.toLowerCase()}`)
      fetchRooms()
    } catch { toast.error("Failed to update status") }
  }

  const restartRoom = async (roomId: string) => {
    try {
      await api.post(`/api/warming/rooms/${roomId}/restart`)
      toast.success("Room restarted")
      fetchRooms()
    } catch { toast.error("Failed to restart") }
  }

  const deleteRoom = async (roomId: string) => {
    if (!confirm("Delete this room?")) return
    try {
      await api.delete(`/api/warming/rooms/${roomId}`)
      toast.success("Room deleted")
      fetchRooms()
    } catch { toast.error("Failed to delete") }
  }

  const createScript = async () => {
    try {
      await api.post("/api/warming/scripts", newScript)
      toast.success("Script created")
      setShowCreateScript(false)
      setNewScript({ title: "", description: "", category: "casual" })
      fetchScripts()
    } catch { toast.error("Failed to create script") }
  }

  const deleteScript = async (scriptId: number) => {
    if (!confirm("Delete this script?")) return
    try {
      await api.delete(`/api/warming/scripts/${scriptId}`)
      toast.success("Script deleted")
      fetchScripts()
    } catch { toast.error("Failed to delete") }
  }

  const tabClass = (t: Tab) =>
    `px-4 py-2 text-sm font-mono cursor-pointer border-b-2 transition-colors ${
      tab === t
        ? "border-cyber-green text-cyber-green"
        : "border-transparent text-cyber-green-muted hover:text-cyber-green"
    }`

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-cyber-green flex items-center gap-2">
          <Flame size={20} /> Warming System
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-6">
        <button onClick={() => setTab("rooms")} className={tabClass("rooms")}>
          <Flame size={14} className="inline mr-1.5" />Rooms
        </button>
        <button onClick={() => setTab("scripts")} className={tabClass("scripts")}>
          <ScrollText size={14} className="inline mr-1.5" />Scripts
        </button>
        <button onClick={() => setTab("logs")} className={tabClass("logs")}>
          <FileText size={14} className="inline mr-1.5" />Logs
        </button>
      </div>

      {/* ROOMS TAB */}
      {tab === "rooms" && (
        <div>
          <div className="flex justify-end mb-4">
            <Button variant="ghost" size="sm" onClick={fetchRooms}>
              <RefreshCw size={14} className="mr-1.5" /> Refresh
            </Button>
          </div>
          {roomsLoading ? (
            <Card className="animate-pulse"><div className="h-32 bg-bg-hover rounded" /></Card>
          ) : rooms.length === 0 ? (
            <Card><p className="text-cyber-green-muted text-sm text-center py-8">No warming rooms. Create one via API.</p></Card>
          ) : (
            <div className="space-y-2">
              {rooms.map((room) => (
                <Card key={room.id} className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-cyber-green">{room.name}</p>
                      <Badge variant={statusVariant(room.status)}>{room.status}</Badge>
                      <Badge variant="muted">{room.roomType}</Badge>
                    </div>
                    <p className="text-xs text-cyber-green-muted mt-1">
                      Sender: {room.senderInstanceId}
                      {room.receiverInstanceId && ` → Receiver: ${room.receiverInstanceId}`}
                      {" | "}Interval: {room.intervalMinSeconds}-{room.intervalMaxSeconds}s
                      {" | "}Seq: {room.currentSequence}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {room.status !== "ACTIVE" && (
                      <Button variant="outline" size="sm" onClick={() => updateRoomStatus(room.id, "ACTIVE")}>
                        <Play size={13} />
                      </Button>
                    )}
                    {room.status === "ACTIVE" && (
                      <Button variant="outline" size="sm" onClick={() => updateRoomStatus(room.id, "PAUSE")}>
                        <Pause size={13} />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => updateRoomStatus(room.id, "STOPPED")}>
                      <Square size={13} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => restartRoom(room.id)}>
                      <RotateCcw size={13} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setLogRoomId(room.id); setTab("logs") }}>
                      <FileText size={13} />
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => deleteRoom(room.id)}>
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SCRIPTS TAB */}
      {tab === "scripts" && (
        <div>
          <div className="flex justify-end gap-2 mb-4">
            <Button variant="ghost" size="sm" onClick={fetchScripts}>
              <RefreshCw size={14} className="mr-1.5" /> Refresh
            </Button>
            <Button size="sm" onClick={() => setShowCreateScript(true)}>
              <Plus size={14} className="mr-1.5" /> New Script
            </Button>
          </div>

          {showCreateScript && (
            <Card className="mb-4 border-cyber-green/20">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-cyber-green-dim uppercase">Create Script</h3>
                <button onClick={() => setShowCreateScript(false)} className="text-cyber-green-muted hover:text-cyber-green cursor-pointer">
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-3">
                <Input label="Title" value={newScript.title} onChange={(e) => setNewScript({ ...newScript, title: e.target.value })} />
                <Input label="Description" value={newScript.description} onChange={(e) => setNewScript({ ...newScript, description: e.target.value })} />
                <Input label="Category" value={newScript.category} onChange={(e) => setNewScript({ ...newScript, category: e.target.value })} placeholder="casual, business, sales" />
                <Button onClick={createScript} disabled={!newScript.title}>Create</Button>
              </div>
            </Card>
          )}

          {scriptsLoading ? (
            <Card className="animate-pulse"><div className="h-32 bg-bg-hover rounded" /></Card>
          ) : scripts.length === 0 ? (
            <Card><p className="text-cyber-green-muted text-sm text-center py-8">No scripts yet.</p></Card>
          ) : (
            <div className="space-y-2">
              {scripts.map((script) => (
                <Card key={script.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-cyber-green">{script.title}</p>
                    <p className="text-xs text-cyber-green-muted mt-0.5">
                      {script.description} <Badge variant="muted">{script.category}</Badge>
                    </p>
                  </div>
                  <Button variant="danger" size="sm" onClick={() => deleteScript(script.id)}>
                    <Trash2 size={13} />
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* LOGS TAB */}
      {tab === "logs" && (
        <div>
          <div className="flex gap-3 mb-4">
            <Input
              placeholder="Room ID"
              value={logRoomId}
              onChange={(e) => setLogRoomId(e.target.value)}
              className="flex-1"
            />
            <Button onClick={fetchLogs} disabled={!logRoomId}>
              Load Logs
            </Button>
          </div>

          {logsLoading ? (
            <Card className="animate-pulse"><div className="h-32 bg-bg-hover rounded" /></Card>
          ) : logs.length === 0 ? (
            <Card>
              <p className="text-cyber-green-muted text-sm text-center py-8">
                {logRoomId ? "No logs found for this room." : "Enter a Room ID to view logs."}
              </p>
            </Card>
          ) : (
            <Card className="p-0 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-cyber-green-muted uppercase">
                    <th className="text-left px-3 py-2">Status</th>
                    <th className="text-left px-3 py-2">Message</th>
                    <th className="text-right px-3 py-2">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-border/50 hover:bg-bg-hover">
                      <td className="px-3 py-2">
                        <Badge variant={log.status === "SUCCESS" ? "success" : log.status === "FAILED" ? "danger" : "muted"}>
                          {log.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-cyber-green-muted max-w-md truncate">{log.messageContent}</td>
                      <td className="px-3 py-2 text-right text-cyber-green-muted">
                        {new Date(log.executedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
