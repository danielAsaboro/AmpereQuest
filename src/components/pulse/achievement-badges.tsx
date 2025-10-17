'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChargingSession } from '@/lib/simulation'
import { Badge } from '@/components/ui/badge'
import { Trophy, Zap, TrendingUp, Flame, MapPin, Lightbulb } from 'lucide-react'

interface AchievementBadgesProps {
  sessions: ChargingSession[]
}

interface Achievement {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  earned: boolean
  color: string
}

export function AchievementBadges({ sessions }: AchievementBadgesProps) {
  // Calculate achievements
  const totalPoints = sessions.reduce((sum, s) => sum + s.pointsEarned, 0)
  const totalEnergy = sessions.reduce((sum, s) => sum + s.energyConsumedKwh, 0)
  const completedSessions = sessions.filter((s) => !s.isActive).length
  const uniqueChargers = new Set(sessions.map((s) => s.chargerCode)).size

  const achievements: Achievement[] = [
    {
      id: 'first_charge',
      name: 'First Charge',
      description: 'Complete your first charging session',
      icon: <Zap className="w-4 h-4" />,
      earned: completedSessions >= 1,
      color: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/50',
    },
    {
      id: 'power_user',
      name: 'Power User',
      description: 'Earn 100+ points',
      icon: <TrendingUp className="w-4 h-4" />,
      earned: totalPoints >= 100,
      color: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/50',
    },
    {
      id: 'eco_warrior',
      name: 'Eco Warrior',
      description: 'Consume 100+ kWh',
      icon: <Lightbulb className="w-4 h-4" />,
      earned: totalEnergy >= 100,
      color: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/50',
    },
    {
      id: 'speed_racer',
      name: 'Speed Racer',
      description: 'Use a 22kW+ charger',
      icon: <Flame className="w-4 h-4" />,
      earned: sessions.some((s) => s.powerKw >= 22),
      color: 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/50',
    },
    {
      id: 'connector_collector',
      name: 'Collector',
      description: 'Use 5+ different chargers',
      icon: <MapPin className="w-4 h-4" />,
      earned: uniqueChargers >= 5,
      color: 'bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/50',
    },
    {
      id: 'champion',
      name: 'Champion',
      description: 'Earn 500+ points',
      icon: <Trophy className="w-4 h-4" />,
      earned: totalPoints >= 500,
      color: 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/50',
    },
  ]

  const earnedCount = achievements.filter((a) => a.earned).length

  return (
    <Card>
      <CardHeader>
        <CardTitle>Achievements</CardTitle>
        <CardDescription>
          {earnedCount} of {achievements.length} unlocked
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {achievements.map((achievement, idx) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <div
                className={`p-3 rounded-lg border flex items-start gap-3 transition-opacity ${
                  achievement.earned ? achievement.color : 'bg-muted/50 text-muted-foreground opacity-50'
                }`}
              >
                <div className="mt-0.5">{achievement.icon}</div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{achievement.name}</p>
                  <p className="text-xs opacity-75">{achievement.description}</p>
                </div>
                {achievement.earned && <Badge className="ml-2 bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/50">Earned</Badge>}
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
