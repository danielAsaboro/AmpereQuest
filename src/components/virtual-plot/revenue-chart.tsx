'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp, DollarSign } from 'lucide-react'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'

interface RevenueChartProps {
  plots: Array<{
    account: {
      plotId: number
      totalRevenue: { toNumber: () => number }
      totalSessions: { toNumber: () => number }
      chargerPowerKw: number
      isOperational: boolean
    }
    publicKey: { toString: () => string }
  }>
}

export function RevenueChart({ plots }: RevenueChartProps) {
  const chartData = useMemo(() => {
    // Generate revenue per plot
    return plots
      .map((plot) => ({
        plotId: `Plot ${plot.account.plotId}`,
        revenue: plot.account.totalRevenue.toNumber() / LAMPORTS_PER_SOL,
        sessions: plot.account.totalSessions.toNumber(),
        power: plot.account.chargerPowerKw,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10) // Top 10 plots
  }, [plots])

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Revenue by Plot
          </CardTitle>
          <CardDescription>Track earnings across your virtual charging network</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No plots yet. Purchase your first plot to start earning!
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
          Revenue by Plot
        </CardTitle>
        <CardDescription>
          Top {chartData.length} plot{chartData.length !== 1 ? 's' : ''} by revenue
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="plotId"
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              label={{ value: 'SOL', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number, name: string) => {
                if (name === 'revenue') return [`${value.toFixed(6)} SOL`, 'Revenue']
                if (name === 'sessions') return [value, 'Sessions']
                if (name === 'power') return [`${value} kW`, 'Charger Power']
                return [value, name]
              }}
            />
            <Bar dataKey="revenue" fill="hsl(var(--chart-1))" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function RevenueOverTimeChart({ plots }: RevenueChartProps) {
  // Simulated revenue over time data
  // In a real app, this would come from historical session data
  const chartData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const totalRevenue = plots.reduce((sum, p) => sum + p.account.totalRevenue.toNumber(), 0)

    // Simulate daily revenue distribution
    return days.map((day, index) => {
      const dayRevenue = (totalRevenue / days.length) * (0.8 + Math.random() * 0.4)
      const daySessions = plots.reduce((sum, p) => sum + p.account.totalSessions.toNumber(), 0) / days.length

      return {
        day,
        revenue: dayRevenue / LAMPORTS_PER_SOL,
        sessions: Math.floor(daySessions * (0.8 + Math.random() * 0.4)),
      }
    })
  }, [plots])

  if (plots.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Revenue Trend
          </CardTitle>
          <CardDescription>Track your earnings over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No revenue data yet
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Revenue Trend
        </CardTitle>
        <CardDescription>Estimated weekly distribution of earnings</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="day"
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis
              yAxisId="left"
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              label={{ value: 'SOL', angle: -90, position: 'insideLeft' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              label={{ value: 'Sessions', angle: 90, position: 'insideRight' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number, name: string) => {
                if (name === 'revenue') return [`${value.toFixed(6)} SOL`, 'Revenue']
                if (name === 'sessions') return [value, 'Sessions']
                return [value, name]
              }}
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--chart-1))' }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="sessions"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--chart-2))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
