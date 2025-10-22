'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Zap, TrendingUp } from 'lucide-react'

interface TopUsersTableProps {
  sessions: Array<{
    account: {
      user: { toString: () => string }
      pointsEarned: { toNumber: () => number }
      energyConsumedWh: { toNumber: () => number }
    }
  }>
}

export function TopUsersTable({ sessions }: TopUsersTableProps) {
  const topUsers = useMemo(() => {
    // Aggregate user stats
    const userStats: Record<
      string,
      { points: number; energy: number; sessions: number }
    > = {}

    sessions.forEach((session) => {
      const user = session.account.user.toString()
      if (!userStats[user]) {
        userStats[user] = { points: 0, energy: 0, sessions: 0 }
      }
      userStats[user].points += session.account.pointsEarned.toNumber()
      userStats[user].energy += session.account.energyConsumedWh.toNumber() / 1000 // kWh
      userStats[user].sessions += 1
    })

    // Convert to array and sort by points
    return Object.entries(userStats)
      .map(([user, stats]) => ({
        user,
        shortUser: `${user.slice(0, 4)}...${user.slice(-4)}`,
        ...stats,
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 10)
  }, [sessions])

  if (topUsers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Top Drivers
          </CardTitle>
          <CardDescription>Highest point earners across the network</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            No user data available yet
          </div>
        </CardContent>
      </Card>
    )
  }

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Top Drivers
        </CardTitle>
        <CardDescription>Highest point earners across the network</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {topUsers.map((user, index) => (
            <div
              key={user.user}
              className="flex items-center gap-4 p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
            >
              <div className="text-2xl font-bold w-10 text-center">
                {getMedalEmoji(index + 1)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono font-medium truncate">{user.shortUser}</p>
                <p className="text-sm text-muted-foreground">
                  {user.sessions} session{user.sessions !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex gap-6 text-right">
                <div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <TrendingUp className="w-3 h-3" />
                    Points
                  </div>
                  <p className="text-lg font-bold">{user.points.toLocaleString()}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Zap className="w-3 h-3" />
                    Energy
                  </div>
                  <p className="text-lg font-bold">{user.energy.toFixed(1)} kWh</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
