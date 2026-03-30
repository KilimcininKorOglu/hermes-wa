import { Card } from "../../components/ui/Card"

export function DashboardPage() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-6 text-cyber-green">Dashboard</h2>
      <div className="grid grid-cols-3 gap-4">
        <Card glow>
          <p className="text-xs text-cyber-green-muted uppercase">Total Instances</p>
          <p className="text-3xl font-bold mt-1">--</p>
        </Card>
        <Card glow>
          <p className="text-xs text-cyber-green-muted uppercase">Connected</p>
          <p className="text-3xl font-bold mt-1">--</p>
        </Card>
        <Card glow>
          <p className="text-xs text-cyber-green-muted uppercase">Active Workers</p>
          <p className="text-3xl font-bold mt-1">--</p>
        </Card>
      </div>
      <p className="text-cyber-green-muted text-sm mt-8">
        Dashboard statistics will load from /api/admin/stats
      </p>
    </div>
  )
}
