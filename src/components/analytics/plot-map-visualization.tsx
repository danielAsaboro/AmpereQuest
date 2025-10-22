'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Map } from 'lucide-react'
import { useMemo } from 'react'

interface PlotMapVisualizationProps {
  plots: Array<{
    account: {
      latitude: number
      longitude: number
      chargerPowerKw: number
      totalRevenue: { toNumber: () => number }
      plotId: number
      isOperational: boolean
    }
    publicKey: { toString: () => string }
  }>
}

export function PlotMapVisualization({ plots }: PlotMapVisualizationProps) {
  const plotStats = useMemo(() => {
    const withChargers = plots.filter((p) => p.account.chargerPowerKw > 0)
    const totalRevenue = plots.reduce((sum, p) => sum + p.account.totalRevenue.toNumber(), 0)

    // Group by power level
    const powerDistribution: Record<number, number> = {}
    withChargers.forEach((p) => {
      const power = p.account.chargerPowerKw
      powerDistribution[power] = (powerDistribution[power] || 0) + 1
    })

    return {
      total: plots.length,
      withChargers: withChargers.length,
      totalRevenue,
      powerDistribution,
    }
  }, [plots])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Map className="w-5 h-5" />
          Virtual Plot Distribution
        </CardTitle>
        <CardDescription>
          {plotStats.total} plots deployed, {plotStats.withChargers} with chargers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Plot Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{plotStats.total}</p>
              <p className="text-xs text-muted-foreground">Total Plots</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{plotStats.withChargers}</p>
              <p className="text-xs text-muted-foreground">With Chargers</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">
                {((plotStats.withChargers / Math.max(plotStats.total, 1)) * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-muted-foreground">Utilization</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">
                {(plotStats.totalRevenue / 1_000_000_000).toFixed(4)}
              </p>
              <p className="text-xs text-muted-foreground">SOL Revenue</p>
            </div>
          </div>

          {/* Power Distribution */}
          {Object.keys(plotStats.powerDistribution).length > 0 && (
            <div>
              <h4 className="font-medium mb-3">Charger Power Distribution</h4>
              <div className="space-y-2">
                {Object.entries(plotStats.powerDistribution)
                  .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
                  .map(([power, count]) => {
                    const percentage =
                      (count / Math.max(plotStats.withChargers, 1)) * 100
                    return (
                      <div key={power} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{power} kW</span>
                          <span className="text-muted-foreground">
                            {count} charger{count !== 1 ? 's' : ''} ({percentage.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {/* Plot List */}
          {plots.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">Recent Plots</h4>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {plots.slice(0, 10).map((plot) => {
                  const lat = plot.account.latitude / 1_000_000
                  const lng = plot.account.longitude / 1_000_000
                  return (
                    <div
                      key={plot.publicKey.toString()}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg text-sm"
                    >
                      <div>
                        <p className="font-medium">
                          {lat.toFixed(4)}°, {lng.toFixed(4)}°
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {plot.account.chargerPowerKw > 0
                            ? `${plot.account.chargerPowerKw} kW charger`
                            : 'No charger'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {(plot.account.totalRevenue.toNumber() / 1_000_000_000).toFixed(4)} SOL
                        </p>
                        <p className="text-xs text-muted-foreground">Revenue</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
