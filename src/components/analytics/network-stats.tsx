'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, AlertCircle, Activity } from 'lucide-react'

interface NetworkStatsProps {
  stats: {
    totalSessions: number
    activeSessions: number
    totalEnergyKwh: number
    totalPoints: number
    uniqueUsers: number
    totalPlots: number
  }
}

export function NetworkStats({ stats }: NetworkStatsProps) {
  // Calculate network health score (0-100)
  const healthScore = Math.min(
    100,
    Math.floor(
      (stats.totalSessions * 2 +
        stats.uniqueUsers * 5 +
        stats.totalPlots * 3 +
        stats.activeSessions * 10) /
        2
    )
  )

  const getHealthStatus = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'text-green-500', icon: CheckCircle }
    if (score >= 50) return { label: 'Good', color: 'text-blue-500', icon: Activity }
    return { label: 'Growing', color: 'text-yellow-500', icon: AlertCircle }
  }

  const health = getHealthStatus(healthScore)
  const HealthIcon = health.icon

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HealthIcon className={`w-5 h-5 ${health.color}`} />
            Network Health
          </CardTitle>
          <CardDescription>Overall ecosystem activity and engagement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Health Score */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Health Score</span>
                <span className={`text-2xl font-bold ${health.color}`}>
                  {healthScore}/100
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <motion.div
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${healthScore}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Status: {health.label}</p>
            </div>

            {/* Activity Breakdown */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Session Activity</p>
                <p className="text-2xl font-bold">
                  {stats.totalSessions > 0
                    ? ((stats.activeSessions / stats.totalSessions) * 100).toFixed(0)
                    : 0}
                  %
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.activeSessions} active now
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Plot Utilization</p>
                <p className="text-2xl font-bold">
                  {stats.totalPlots > 0 ? (stats.totalPlots * 10).toFixed(0) : 0}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.totalPlots} plots deployed
                </p>
              </div>
            </div>

            {/* Energy Impact */}
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-1">Total Energy Impact</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold">{stats.totalEnergyKwh.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">kWh consumed</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Equivalent to ~{(stats.totalEnergyKwh * 0.4).toFixed(0)} kg CO₂ offset
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
