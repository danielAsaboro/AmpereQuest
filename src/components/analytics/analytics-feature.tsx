'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  TrendingUp,
  Users,
  Zap,
  DollarSign,
  Map,
  BarChart3,
  Calendar,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useChargingSessionProgram } from '../charging-session/charging-session-data-access'
import { usePointsMarketplaceProgram } from '../marketplace/marketplace-data-access'
import { useVirtualPlotProgram } from '../virtual-plot/virtual-plot-data-access'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { NetworkStats } from './network-stats'
import { EnergyTrendChart } from './energy-trend-chart'
import { PointsDistributionChart } from './points-distribution-chart'
import { PlotMapVisualization } from './plot-map-visualization'
import { TopUsersTable } from './top-users-table'

export function AnalyticsFeature() {
  const { accounts: sessions } = useChargingSessionProgram()
  const { listings } = usePointsMarketplaceProgram()
  const { plots } = useVirtualPlotProgram()

  // Calculate network-wide statistics
  const stats = useMemo(() => {
    // Sessions stats
    const allSessions = sessions.data || []
    const activeSessions = allSessions.filter((s) => s.account.isActive)
    const completedSessions = allSessions.filter((s) => !s.account.isActive)

    const totalEnergy = allSessions.reduce(
      (sum, s) => sum + s.account.energyConsumedWh.toNumber(),
      0
    )
    const totalPoints = allSessions.reduce((sum, s) => sum + s.account.pointsEarned.toNumber(), 0)

    // Marketplace stats
    const totalTraded = 0 // Would come from marketplace account if initialized
    const activeListings = (listings.data || []).filter((l) => l.account.isActive).length

    // Plot stats
    const allPlots = plots.data || []
    const totalPlots = allPlots.length
    const plotsWithChargers = allPlots.filter((p) => p.account.chargerPowerKw > 0).length
    const totalRevenue = allPlots.reduce(
      (sum, p) => sum + p.account.totalRevenue.toNumber(),
      0
    )

    // User stats
    const uniqueUsers = new Set(allSessions.map((s) => s.account.user.toString())).size

    return {
      // Sessions
      totalSessions: allSessions.length,
      activeSessions: activeSessions.length,
      completedSessions: completedSessions.length,
      totalEnergyWh: totalEnergy,
      totalEnergyKwh: totalEnergy / 1000,
      totalPoints,
      uniqueUsers,

      // Marketplace
      totalPointsTraded: totalTraded,
      activeListings,

      // Plots
      totalPlots,
      plotsWithChargers,
      totalRevenueLamports: totalRevenue,
      totalRevenueSol: totalRevenue / LAMPORTS_PER_SOL,

      // Calculated metrics
      avgEnergyPerSession: allSessions.length > 0 ? totalEnergy / allSessions.length / 1000 : 0,
      avgPointsPerSession: allSessions.length > 0 ? totalPoints / allSessions.length : 0,
    }
  }, [sessions.data, listings.data, plots.data])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Network Analytics</h1>
        <p className="text-muted-foreground">
          Comprehensive statistics across the AmpereQuest ecosystem
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSessions}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeSessions} active, {stats.completedSessions} completed
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Energy</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEnergyKwh.toFixed(1)} kWh</div>
              <p className="text-xs text-muted-foreground">
                {stats.avgEnergyPerSession.toFixed(1)} kWh avg per session
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Points Minted</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPoints.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalPointsTraded.toLocaleString()} traded
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
              <p className="text-xs text-muted-foreground">Unique participants</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Virtual Plots</CardTitle>
              <Map className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPlots}</div>
              <p className="text-xs text-muted-foreground">
                {stats.plotsWithChargers} with chargers installed
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Plot Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRevenueSol.toFixed(4)} SOL</div>
              <p className="text-xs text-muted-foreground">
                {(stats.totalRevenueLamports / 1_000_000).toFixed(1)}M lamports total
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Marketplace</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeListings}</div>
              <p className="text-xs text-muted-foreground">Active listings</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Network Health Indicator */}
      <NetworkStats stats={stats} />

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <EnergyTrendChart sessions={sessions.data || []} />
        <PointsDistributionChart sessions={sessions.data || []} />
      </div>

      {/* Plot Visualization */}
      {stats.totalPlots > 0 && plots.data && <PlotMapVisualization plots={plots.data} />}

      {/* Top Users */}
      <TopUsersTable sessions={sessions.data || []} />

      {/* Info Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="bg-blue-500 p-3 rounded-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Real-Time Data</h3>
              <p className="text-sm text-muted-foreground">
                All statistics are calculated from on-chain data. In demo mode, data is simulated
                for visualization. Switch to blockchain mode to see real smart contract data.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
