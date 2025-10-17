'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChargingSession } from '@/lib/simulation'
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface EnergyChartsProps {
  sessions: ChargingSession[]
}

export function EnergyCharts({ sessions }: EnergyChartsProps) {
  // Prepare energy consumption over time
  const energyOverTime = useMemo(() => {
    const sorted = [...sessions].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    let cumulativeEnergy = 0
    let cumulativePoints = 0

    return sorted.map((session, idx) => {
      cumulativeEnergy += session.energyConsumedKwh
      cumulativePoints += session.pointsEarned
      return {
        id: idx,
        time: new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        energy: parseFloat(cumulativeEnergy.toFixed(2)),
        points: cumulativePoints,
      }
    })
  }, [sessions])

  // Prepare power distribution (by charger power levels)
  const powerDistribution = useMemo(() => {
    const distribution: Record<string, number> = {}

    sessions.forEach((session) => {
      const powerBucket = `${Math.round(session.powerKw)}kW`
      distribution[powerBucket] = (distribution[powerBucket] || 0) + 1
    })

    return Object.entries(distribution).map(([name, value]) => ({
      name,
      value,
    }))
  }, [sessions])

  // Prepare charger usage
  const chargerUsage = useMemo(() => {
    const usage: Record<string, { sessions: number; energy: number }> = {}

    sessions.forEach((session) => {
      const code = session.chargerCode
      if (!usage[code]) {
        usage[code] = { sessions: 0, energy: 0 }
      }
      usage[code].sessions += 1
      usage[code].energy += session.energyConsumedKwh
    })

    return Object.entries(usage)
      .map(([name, data]) => ({
        name: name.substring(0, 8),
        sessions: data.sessions,
        energy: parseFloat(data.energy.toFixed(1)),
      }))
      .slice(0, 10) // Top 10
  }, [sessions])

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
          <CardDescription>No data yet. Start a charging session to see charts!</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Energy Over Time */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
        <Card>
          <CardHeader>
            <CardTitle>Energy Consumption Over Time</CardTitle>
            <CardDescription>Cumulative energy and points earned</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={energyOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" />
                <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="energy"
                  stroke="#3b82f6"
                  name="Energy (kWh)"
                  dot={false}
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="points"
                  stroke="#10b981"
                  name="Points"
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Power Distribution */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader>
              <CardTitle>Sessions by Charger Power</CardTitle>
              <CardDescription>Distribution of charging sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={powerDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {powerDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Chargers */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader>
              <CardTitle>Top Chargers Used</CardTitle>
              <CardDescription>Sessions & energy consumed</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chargerUsage} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                  <YAxis type="category" dataKey="name" width={60} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                    }}
                  />
                  <Bar dataKey="energy" fill="#3b82f6" name="Energy (kWh)" />
                  <Bar dataKey="sessions" fill="#10b981" name="Sessions" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
