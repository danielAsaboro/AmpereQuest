'use client'

import { motion } from 'framer-motion'
import { Battery, MapPin, Zap, Award } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { ChargingSession } from '@/lib/simulation'

interface ChargingSessionCardProps {
  session: ChargingSession
  index: number
}

export function ChargingSessionCard({ session, index }: ChargingSessionCardProps) {
  const isActive = session.isActive

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className={`overflow-hidden ${isActive ? 'border-green-500' : 'border-gray-500'}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                <h3 className="font-semibold text-sm">{session.user}</h3>
              </div>

              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  <span>{session.chargerName} ({session.powerKw}kW)</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span className="line-clamp-1">{session.location}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center gap-1 text-sm font-semibold text-green-600">
                <Award className="w-4 h-4" />
                <span>{session.pointsEarned}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">points</div>
            </div>
          </div>

          {/* Energy consumption meter */}
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="flex items-center gap-1">
                <Battery className="w-3 h-3" />
                {session.energyConsumedKwh.toFixed(2)} kWh
              </span>
              <span>{session.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-green-400 to-green-600"
                initial={{ width: 0 }}
                animate={{ width: `${session.progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {!isActive && (
            <div className="mt-2 text-xs text-green-600 font-medium">
              ✓ Charging complete
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
