'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChargingSession } from '@/lib/simulation'
import { Medal, Zap, TrendingUp } from 'lucide-react'

interface LeaderboardProps {
  sessions: ChargingSession[]
}

type LeaderboardType = 'points' | 'energy' | 'sessions'

export function Leaderboard({ sessions }: LeaderboardProps) {
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>('points')

  // Calculate user stats
  const userStats = useMemo(() => {
    const stats: Record<string, { user: string; points: number; energy: number; sessions: number }> = {}

    sessions.forEach((session) => {
      const user = session.user
      if (!stats[user]) {
        stats[user] = { user, points: 0, energy: 0, sessions: 0 }
      }
      stats[user].points += session.pointsEarned
      stats[user].energy += session.energyConsumedKwh
      stats[user].sessions += 1
    })

    return Object.values(stats)
  }, [sessions])

  // Sort by leaderboard type
  const sortedUsers = useMemo(() => {
    const sorted = [...userStats]
    switch (leaderboardType) {
      case 'points':
        return sorted.sort((a, b) => b.points - a.points)
      case 'energy':
        return sorted.sort((a, b) => b.energy - a.energy)
      case 'sessions':
        return sorted.sort((a, b) => b.sessions - a.sessions)
    }
  }, [userStats, leaderboardType])

  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇'
      case 2:
        return '🥈'
      case 3:
        return '🥉'
      default:
        return `#${rank}`
    }
  }

  if (userStats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Global Leaderboard</CardTitle>
          <CardDescription>No sessions yet. Start charging to climb the ranks!</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Medal className="w-5 h-5" />
              Global Leaderboard
            </CardTitle>
            <CardDescription>Top drivers across the DeCharge network</CardDescription>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button
            variant={leaderboardType === 'points' ? 'default' : 'outline'}
            onClick={() => setLeaderboardType('points')}
            size="sm"
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            Points
          </Button>
          <Button
            variant={leaderboardType === 'energy' ? 'default' : 'outline'}
            onClick={() => setLeaderboardType('energy')}
            size="sm"
          >
            <Zap className="w-4 h-4 mr-1" />
            Energy
          </Button>
          <Button
            variant={leaderboardType === 'sessions' ? 'default' : 'outline'}
            onClick={() => setLeaderboardType('sessions')}
            size="sm"
          >
            Sessions
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {sortedUsers.slice(0, 10).map((user, idx) => (
            <motion.div
              key={user.user}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="text-lg font-bold w-8 text-center">
                  {getMedalIcon(idx + 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{user.user}</p>
                  <p className="text-xs text-muted-foreground">
                    {user.sessions} session{user.sessions !== 1 ? 's' : ''} •{' '}
                    {user.energy.toFixed(1)} kWh
                  </p>
                </div>
                <div className="text-right">
                  {leaderboardType === 'points' && (
                    <p className="text-lg font-bold">{user.points.toLocaleString()}</p>
                  )}
                  {leaderboardType === 'energy' && (
                    <>
                      <p className="text-lg font-bold">{user.energy.toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">kWh</p>
                    </>
                  )}
                  {leaderboardType === 'sessions' && (
                    <>
                      <p className="text-lg font-bold">{user.sessions}</p>
                      <p className="text-xs text-muted-foreground">sessions</p>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {sortedUsers.length > 10 && (
          <div className="mt-4 pt-4 border-t border-border text-center text-sm text-muted-foreground">
            +{sortedUsers.length - 10} more drivers
          </div>
        )}
      </CardContent>
    </Card>
  )
}
