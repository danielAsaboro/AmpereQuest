'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { motion } from 'framer-motion'
import { Map, Zap, TrendingUp, MapPin, Wallet, Plus, ArrowUpCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useVirtualPlotProgram, useVirtualPlotActions } from './virtual-plot-data-access'
import { useState } from 'react'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'

const CHARGER_POWERS = [3, 7, 11, 22, 30] as const
const PLOT_PRICE = 0.1 * LAMPORTS_PER_SOL // 0.1 SOL per plot
const CHARGER_BASE_COST = 0.05 * LAMPORTS_PER_SOL // Base cost for charger installation

export function EmpireFeature() {
  const { publicKey, connected } = useWallet()
  const { plots } = useVirtualPlotProgram()
  const virtualPlotActions = publicKey
    ? useVirtualPlotActions({ owner: publicKey })
    : null

  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [plotIdInput, setPlotIdInput] = useState('')
  const [latitudeInput, setLatitudeInput] = useState('')
  const [longitudeInput, setLongitudeInput] = useState('')
  const [selectedPlotForCharger, setSelectedPlotForCharger] = useState<number | null>(null)
  const [selectedPower, setSelectedPower] = useState<number>(3)

  const userPlots = plots.data?.filter((plot) => publicKey && plot.account.owner.equals(publicKey)) || []
  const totalRevenue = userPlots.reduce((sum, plot) => sum + plot.account.totalRevenue.toNumber(), 0)
  const totalSessions = userPlots.reduce((sum, plot) => sum + plot.account.totalSessions.toNumber(), 0)

  const handlePurchasePlot = async () => {
    if (!virtualPlotActions || !plotIdInput || !latitudeInput || !longitudeInput) return

    await virtualPlotActions.purchasePlot.mutateAsync({
      plotId: parseInt(plotIdInput),
      latitude: parseFloat(latitudeInput),
      longitude: parseFloat(longitudeInput),
      priceLamports: PLOT_PRICE,
    })

    setPlotIdInput('')
    setLatitudeInput('')
    setLongitudeInput('')
    setShowPurchaseModal(false)
  }

  const handleInstallCharger = async (plotId: number) => {
    if (!virtualPlotActions) return

    const cost = CHARGER_BASE_COST * (selectedPower / 3)
    await virtualPlotActions.installCharger.mutateAsync({
      plotId,
      chargerPowerKw: selectedPower,
      installationCost: cost,
    })

    setSelectedPlotForCharger(null)
  }

  const handleUpgradeCharger = async (plotId: number, currentPower: number) => {
    if (!virtualPlotActions || selectedPower <= currentPower) return

    const cost = CHARGER_BASE_COST * ((selectedPower - currentPower) / 3)
    await virtualPlotActions.upgradeCharger.mutateAsync({
      plotId,
      newPowerKw: selectedPower,
      upgradeCost: cost,
    })

    setSelectedPlotForCharger(null)
  }

  if (!connected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Wallet Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Please connect your Solana wallet to build your charging empire.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">The Empire</h1>
        <p className="text-muted-foreground">
          Build your virtual charging network and earn revenue from drivers
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Plots</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userPlots.length}</div>
              <p className="text-xs text-muted-foreground">NFT-based ownership</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(totalRevenue / LAMPORTS_PER_SOL).toFixed(4)} SOL
              </div>
              <p className="text-xs text-muted-foreground">From {totalSessions} sessions</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Chargers</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {userPlots.filter((p) => p.account.isOperational).length}
              </div>
              <p className="text-xs text-muted-foreground">Currently earning</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Purchase Plot */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Virtual Plot</CardTitle>
          <CardDescription>Buy a location to install your virtual charger</CardDescription>
        </CardHeader>
        <CardContent>
          {showPurchaseModal ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="plotId">Plot ID (unique number)</Label>
                <Input
                  id="plotId"
                  type="number"
                  value={plotIdInput}
                  onChange={(e) => setPlotIdInput(e.target.value)}
                  placeholder="e.g. 1, 2, 3..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="0.000001"
                    value={latitudeInput}
                    onChange={(e) => setLatitudeInput(e.target.value)}
                    placeholder="e.g. 40.7128"
                  />
                </div>
                <div>
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="0.000001"
                    value={longitudeInput}
                    onChange={(e) => setLongitudeInput(e.target.value)}
                    placeholder="e.g. -74.0060"
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Cost: {(PLOT_PRICE / LAMPORTS_PER_SOL).toFixed(2)} SOL
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handlePurchasePlot}
                  disabled={!plotIdInput || !latitudeInput || !longitudeInput}
                >
                  Purchase Plot
                </Button>
                <Button variant="outline" onClick={() => setShowPurchaseModal(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setShowPurchaseModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Purchase New Plot
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Your Plots */}
      <Card>
        <CardHeader>
          <CardTitle>Your Plots</CardTitle>
          <CardDescription>Manage your virtual charging network</CardDescription>
        </CardHeader>
        <CardContent>
          {userPlots.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Map className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>You don't own any plots yet. Purchase one to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {userPlots.map((plot) => {
                const plotData = plot.account
                const isManaging = selectedPlotForCharger === plotData.plotId
                const hasCharger = plotData.chargerPowerKw > 0

                return (
                  <Card key={plot.publicKey.toString()} className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="font-semibold text-lg">Plot #{plotData.plotId}</div>
                        <div className="text-sm text-muted-foreground">
                          Location: {(plotData.latitude / 1_000_000).toFixed(6)},{' '}
                          {(plotData.longitude / 1_000_000).toFixed(6)}
                        </div>
                        {hasCharger && (
                          <div className="flex items-center gap-2 mt-2">
                            <Zap className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium">
                              {plotData.chargerPowerKw}kW Charger
                            </span>
                            {plotData.isOperational && (
                              <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                                Operational
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {(plotData.totalRevenue.toNumber() / LAMPORTS_PER_SOL).toFixed(4)} SOL
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {plotData.totalSessions.toString()} sessions
                        </div>
                      </div>
                    </div>

                    {isManaging ? (
                      <div className="space-y-4 pt-4 border-t">
                        <div>
                          <Label>Charger Power</Label>
                          <div className="flex gap-2 mt-2">
                            {CHARGER_POWERS.map((power) => (
                              <Button
                                key={power}
                                size="sm"
                                variant={selectedPower === power ? 'default' : 'outline'}
                                onClick={() => setSelectedPower(power)}
                                disabled={hasCharger && power <= plotData.chargerPowerKw}
                              >
                                {power}kW
                              </Button>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {hasCharger ? (
                            <Button
                              onClick={() => handleUpgradeCharger(plotData.plotId, plotData.chargerPowerKw)}
                              disabled={selectedPower <= plotData.chargerPowerKw}
                            >
                              <ArrowUpCircle className="w-4 h-4 mr-2" />
                              Upgrade Charger
                            </Button>
                          ) : (
                            <Button onClick={() => handleInstallCharger(plotData.plotId)}>
                              <Zap className="w-4 h-4 mr-2" />
                              Install Charger
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            onClick={() => setSelectedPlotForCharger(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-4 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPlotForCharger(plotData.plotId)
                            setSelectedPower(hasCharger ? plotData.chargerPowerKw + 1 : 3)
                          }}
                        >
                          {hasCharger ? 'Upgrade Charger' : 'Install Charger'}
                        </Button>
                        {plotData.totalRevenue.toNumber() > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="ml-2"
                            onClick={() =>
                              virtualPlotActions?.withdrawRevenue.mutateAsync({
                                plotId: plotData.plotId,
                                amount: plotData.totalRevenue.toNumber(),
                              })
                            }
                          >
                            Withdraw Revenue
                          </Button>
                        )}
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="bg-blue-500 p-3 rounded-lg">
              <Map className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">How The Empire Works</h3>
              <p className="text-sm text-muted-foreground">
                Purchase virtual plots as NFTs, install chargers with varying power levels (3kW - 30kW),
                and earn revenue as virtual EVs charge at your stations. Higher power chargers cost more
                but earn faster!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
