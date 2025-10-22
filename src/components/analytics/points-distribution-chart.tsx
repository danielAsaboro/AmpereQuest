'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { TrendingUp } from 'lucide-react'

interface PointsDistributionChartProps {
  sessions: Array<{
    account: {
      user: { toString: () => string }
      pointsEarned: { toNumber: () => number }
    }
  }>
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
]

export function PointsDistributionChart({ sessions }: PointsDistributionChartProps) {
  const chartData = useMemo(() => {
    // Group points by user
    const userPoints: Record<string, number> = {}

    sessions.forEach((session) => {
      const user = session.account.user.toString()
      const shortUser = `${user.slice(0, 4)}...${user.slice(-4)}`

      if (!userPoints[shortUser]) {
        userPoints[shortUser] = 0
      }
      userPoints[shortUser] += session.account.pointsEarned.toNumber()
    })

    // Get top 5 users
    const sorted = Object.entries(userPoints)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    // Calculate others
    const topUsersTotal = sorted.reduce((sum, [_, points]) => sum + points, 0)
    const allTotal = Object.values(userPoints).reduce((sum, points) => sum + points, 0)
    const others = allTotal - topUsersTotal

    const data = sorted.map(([user, points]) => ({
      name: user,
      value: points,
    }))

    if (others > 0) {
      data.push({ name: 'Others', value: others })
    }

    return data
  }, [sessions])

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Points Distribution
          </CardTitle>
          <CardDescription>Top earners across the network</CardDescription>
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
          <TrendingUp className="w-5 h-5" />
          Points Distribution
        </CardTitle>
        <CardDescription>Top earners across the network</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number) => [`${value.toLocaleString()} points`, 'Earned']}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
