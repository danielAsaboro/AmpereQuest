'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChargingSession } from '@/lib/simulation'
import { Zap, Flame, Clock, Award } from 'lucide-react'

interface UserStatsCardProps {
  sessions: ChargingSession[]
  userAccount?: any
}

export function UserStatsCard({ sessions, userAccount }: UserStatsCardProps) {
  // Calculate stats from sessions
  const totalPoints = sessions.reduce((sum, s) => sum + s.pointsEarned, 0)
  const totalEnergy = sessions.reduce((sum, s) => sum + s.energyConsumedKwh, 0)
  const completedSessions = sessions.filter((s) => !s.isActive).length
  const activeSessions = sessions.filter((s) => s.isActive).length

  // Calculate average session duration
  const avgDuration =
    completedSessions > 0
      ? sessions.reduce((sum, s) => {
          if (!s.isActive) {
            const duration = new Date().getTime() - new Date(s.startTime).getTime()
            return sum + duration
          }
          return sum
        }, 0) / completedSessions / 1000 / 60 // in minutes
      : 0

  // Calculate current streak (simplified - same day)
  const today = new Date().toDateString()
  const sessionsToday = sessions.filter((s) => new Date(s.startTime).toDateString() === today)
  const hasSessionToday = sessionsToday.length > 0

  const stats = [
    {
      label: 'Total Points',
      value: totalPoints.toLocaleString(),
      icon: Award,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      delay: 0,
    },
    {
      label: 'Energy Consumed',
      value: totalEnergy.toFixed(1),
      unit: 'kWh',
      icon: Zap,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      delay: 0.1,
    },
    {
      label: 'Sessions',
      value: completedSessions,
      unit: `${activeSessions} active`,
      icon: Clock,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      delay: 0.2,
    },
    {
      label: 'Streak',
      value: hasSessionToday ? '🔥' : '0',
      unit: 'days',
      icon: Flame,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      delay: 0.3,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Performance</CardTitle>
        <CardDescription>Lifetime statistics & achievements</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4">
          {stats.map((stat, idx) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: stat.delay }}
              >
                <div className={`${stat.bgColor} p-4 rounded-lg border border-border`}>
                  <div className="flex items-center gap-3 mb-3">
                    <Icon className={`${stat.color} w-5 h-5`} />
                    <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <p className="text-2xl font-bold">{stat.value}</p>
                    {stat.unit && <p className="text-xs text-muted-foreground">{stat.unit}</p>}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Additional Stats */}
        {completedSessions > 0 && (
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground mb-3">SESSION INSIGHTS</p>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">Avg Duration</p>
                <p className="text-lg font-semibold">{Math.round(avgDuration)} min</p>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">Points/Session</p>
                <p className="text-lg font-semibold">{(totalPoints / completedSessions).toFixed(0)}</p>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">Efficiency</p>
                <p className="text-lg font-semibold">{(totalPoints / (totalEnergy || 1)).toFixed(1)} pts/kWh</p>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">Rank</p>
                <p className="text-lg font-semibold">#1 (Demo)</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
