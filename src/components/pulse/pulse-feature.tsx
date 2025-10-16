'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, TrendingUp, Users, Zap, Wallet, Plus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChargingSimulator, type ChargingSession, getAllChargePoints } from '@/lib/simulation'
import { ChargingSessionCard } from './charging-session-card'
import { useChargingSessionProgram, useUserAccount } from '../charging-session/charging-session-data-access'
import { useWallet } from '@solana/wallet-adapter-react'
import { useState as useStateHook } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function PulseFeature() {
  const { publicKey, connected } = useWallet()
  const { accounts } = useChargingSessionProgram()
  const userHooks = publicKey ? useUserAccount({ owner: publicKey }) : null

  const [sessions, setSessions] = useState<ChargingSession[]>([])
  const [stats, setStats] = useState({
    totalEnergy: 0,
    totalPoints: 0,
    activeSessions: 0,
  })
  const simulatorRef = useRef<ChargingSimulator | null>(null)
  const [mode, setMode] = useState<'blockchain' | 'demo'>('blockchain')
  const [showStartSession, setShowStartSession] = useState(false)

  // Convert blockchain sessions to display format
  useEffect(() => {
    if (mode === 'blockchain' && accounts.data) {
      const blockchainSessions: ChargingSession[] = accounts.data.map((account) => {
        const session = account.account
        const energyKwh = session.energyConsumedWh.toNumber() / 1000
        const progress = session.isActive ? 50 : 100 // Simplified progress

        return {
          id: account.publicKey.toString(),
          chargerCode: session.chargerCode,
          chargerName: session.chargerCode,
          location: 'On-chain Session',
          powerKw: session.chargerPowerKw,
          startTime: new Date(session.startTime.toNumber() * 1000),
          energyConsumedKwh: energyKwh,
          pointsEarned: session.pointsEarned.toNumber(),
          isActive: session.isActive,
          user: `${session.user.toString().slice(0, 4)}...${session.user.toString().slice(-4)}`,
          progress,
        }
      })
      setSessions(blockchainSessions)
    }
  }, [accounts.data, mode])

  // Demo mode simulator
  useEffect(() => {
    if (mode !== 'demo') return

    // Initialize simulator
    const simulator = new ChargingSimulator()
    simulatorRef.current = simulator

    simulator.setCallbacks({
      onSessionUpdate: (session) => {
        setSessions((prev) => {
          const index = prev.findIndex((s) => s.id === session.id)
          if (index !== -1) {
            const newSessions = [...prev]
            newSessions[index] = session
            return newSessions
          }
          return prev
        })
      },
      onSessionComplete: (session) => {
        setSessions((prev) => {
          const index = prev.findIndex((s) => s.id === session.id)
          if (index !== -1) {
            const newSessions = [...prev]
            newSessions[index] = session
            return newSessions
          }
          return prev
        })
      },
      onNewSession: (session) => {
        setSessions((prev) => [session, ...prev].slice(0, 20)) // Keep last 20 sessions
      },
    })

    simulator.start(1000) // Update every second

    // Cleanup
    return () => {
      simulator.stop()
    }
  }, [mode])

  // Update stats whenever sessions change
  useEffect(() => {
    const activeSessions = sessions.filter((s) => s.isActive)
    const totalEnergy = sessions.reduce((sum, s) => sum + s.energyConsumedKwh, 0)
    const totalPoints = sessions.reduce((sum, s) => sum + s.pointsEarned, 0)

    setStats({
      totalEnergy,
      totalPoints,
      activeSessions: activeSessions.length,
    })
  }, [sessions])

  const handleStartSession = async () => {
    if (!userHooks) return

    // Get a random charge point
    const chargePoints = getAllChargePoints()
    const randomPoint = chargePoints[Math.floor(Math.random() * chargePoints.length)]

    await userHooks.startSession.mutateAsync({
      chargerCode: randomPoint.code,
      chargerPowerKw: randomPoint.connectors[0].power_kw,
      pricingPerKwh: randomPoint.pricing.energy_based.rate * 1_000_000, // Convert to lamports
    })

    setShowStartSession(false)
  }

  const handleInitializeUser = async () => {
    if (!userHooks) return
    await userHooks.initializeUser.mutateAsync()
  }

  const userAccount = userHooks?.userAccountQuery.data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">The Pulse</h1>
          <p className="text-muted-foreground">
            Live feed of charging sessions across the DeCharge network
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={mode === 'blockchain' ? 'default' : 'outline'}
            onClick={() => setMode('blockchain')}
            size="sm"
          >
            Blockchain
          </Button>
          <Button
            variant={mode === 'demo' ? 'default' : 'outline'}
            onClick={() => setMode('demo')}
            size="sm"
          >
            Demo
          </Button>
        </div>
      </div>

      {/* User initialization alert */}
      {connected && !userAccount && mode === 'blockchain' && (
        <Alert>
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>Initialize your user account to start earning points!</span>
              <Button onClick={handleInitializeUser} size="sm">
                Initialize Account
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Start session button */}
      {connected && userAccount && mode === 'blockchain' && (
        <Card>
          <CardContent className="pt-6">
            {showStartSession ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Start a new charging session. A random charger will be assigned from the network.
                </p>
                <div className="flex gap-2">
                  <Button onClick={handleStartSession}>
                    <Plus className="w-4 h-4 mr-2" />
                    Start Session
                  </Button>
                  <Button variant="outline" onClick={() => setShowStartSession(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={() => setShowStartSession(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Start New Charging Session
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeSessions}</div>
              <p className="text-xs text-muted-foreground">Currently charging</p>
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
              <CardTitle className="text-sm font-medium">Total Energy</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEnergy.toFixed(1)} kWh</div>
              <p className="text-xs text-muted-foreground">Consumed across all sessions</p>
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
              <CardTitle className="text-sm font-medium">Points Earned</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPoints.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">By all drivers</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Live Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live Charging Feed
          </CardTitle>
          <CardDescription>Real-time updates from the network</CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Waiting for charging sessions to begin...</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {sessions.map((session, index) => (
                  <ChargingSessionCard key={session.id} session={session} index={index} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border-green-200 dark:border-green-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="bg-green-500 p-3 rounded-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">How Points Work</h3>
              <p className="text-sm text-muted-foreground">
                Drivers earn 1 point for every 0.1 kWh of energy consumed. These points can be sold
                in the marketplace or used to build your virtual charging empire!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
