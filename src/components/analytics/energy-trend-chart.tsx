'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Zap } from 'lucide-react'

interface EnergyTrendChartProps {
  sessions: Array<{
    account: {
      energyConsumedWh: { toNumber: () => number }
      startTime: { toNumber: () => number }
      isActive: boolean
    }
  }>
}

export function EnergyTrendChart({ sessions }: EnergyTrendChartProps) {
  const chartData = useMemo(() => {
    // Group sessions by hour
    const hourlyData: Record<string, number> = {}

    sessions.forEach((session) => {
      const timestamp = session.account.startTime.toNumber() * 1000
      const date = new Date(timestamp)
      const hour = date.getHours()
      const key = `${hour}:00`

      if (!hourlyData[key]) {
        hourlyData[key] = 0
      }
      hourlyData[key] += session.account.energyConsumedWh.toNumber() / 1000 // Convert to kWh
    })

    // Convert to array and sort
    return Object.entries(hourlyData)
      .map(([hour, energy]) => ({
        hour,
        energy: parseFloat(energy.toFixed(2)),
      }))
      .sort((a, b) => {
        const aHour = parseInt(a.hour.split(':')[0])
        const bHour = parseInt(b.hour.split(':')[0])
        return aHour - bHour
      })
      .slice(-12) // Last 12 hours
  }, [sessions])

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Energy Consumption Trend
          </CardTitle>
          <CardDescription>Hourly energy usage across the network</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No data available yet
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Energy Consumption Trend
        </CardTitle>
        <CardDescription>Hourly energy usage across the network</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="hour"
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              label={{ value: 'kWh', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number) => [`${value.toFixed(2)} kWh`, 'Energy']}
            />
            <Bar dataKey="energy" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
