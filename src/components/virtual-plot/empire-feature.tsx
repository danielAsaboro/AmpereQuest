'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { motion } from 'framer-motion'
import { Map, Zap, TrendingUp, MapPin, Wallet, Plus, ArrowUpCircle, Navigation } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useVirtualPlotProgram, useVirtualPlotActions } from './virtual-plot-data-access'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import { RevenueChart, RevenueOverTimeChart } from './revenue-chart'

// Dynamically import Leaflet-based components to avoid SSR issues
const PlotSelectionMap = dynamic(
  () => import('./plot-selection-map').then((mod) => mod.PlotSelectionMap),
  { ssr: false }
)

const PlotManagementMap = dynamic(
  () => import('./plot-management-map').then((mod) => mod.PlotManagementMap),
  { ssr: false }
)

const CHARGER_POWERS = [3, 7, 11, 22, 30] as const
const PLOT_PRICE = 0.1 * LAMPORTS_PER_SOL // 0.1 SOL per plot
const CHARGER_BASE_COST = 0.05 * LAMPORTS_PER_SOL // Base cost for charger installation

export function EmpireFeature() {
  const { publicKey, connected } = useWallet()
  const { plots } = useVirtualPlotProgram()
  // Use placeholder key when wallet not connected (hook must always be called)
  const placeholderKey = new PublicKey('11111111111111111111111111111111')
  const virtualPlotActions = useVirtualPlotActions({ owner: publicKey || placeholderKey })

  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [latitudeInput, setLatitudeInput] = useState('')
  const [longitudeInput, setLongitudeInput] = useState('')
  const [selectedPlotForCharger, setSelectedPlotForCharger] = useState<number | null>(null)
  const [selectedPower, setSelectedPower] = useState<number>(3)
  const [useMapSelection, setUseMapSelection] = useState(true)
  const [plotsView, setPlotsView] = useState<'list' | 'map'>('list')

  const userPlots = plots.data?.filter((plot) => publicKey && plot.account.owner.equals(publicKey)) || []
  const totalRevenue = userPlots.reduce((sum, plot) => sum + plot.account.totalRevenue.toNumber(), 0)
  const totalSessions = userPlots.reduce((sum, plot) => sum + plot.account.totalSessions.toNumber(), 0)

  // Generate a unique random u32 plot ID
  const generateUniquePlotId = (): number => {
    const existingIds = new Set(plots.data?.map((p) => p.account.plotId) || [])
    const maxU32 = 4294967295 // Max value for u32

    let plotId: number
    let attempts = 0
    const maxAttempts = 100

    do {
      // Generate random u32
      plotId = Math.floor(Math.random() * maxU32)
      attempts++
    } while (existingIds.has(plotId) && attempts < maxAttempts)

    // Fallback: if random fails, use sequential
    if (existingIds.has(plotId)) {
      plotId = 1
      while (existingIds.has(plotId)) {
        plotId++
      }
    }

    return plotId
  }

  const handlePurchasePlot = async () => {
    if (!virtualPlotActions || !latitudeInput || !longitudeInput) return

    const plotId = generateUniquePlotId()

    await virtualPlotActions.purchasePlot.mutateAsync({
      plotId,
      latitude: parseFloat(latitudeInput),
      longitude: parseFloat(longitudeInput),
      priceLamports: PLOT_PRICE,
    })

    setLatitudeInput('')
    setLongitudeInput('')
    setShowPurchaseModal(false)
  }

  const handleLocationSelect = (lat: number, lng: number) => {
    setLatitudeInput(lat.toFixed(6))
    setLongitudeInput(lng.toFixed(6))
  }

  // Transform user plots for map display
  const existingPlotsForMap = userPlots.map((plot) => ({
    plotId: plot.account.plotId,
    latitude: plot.account.latitude / 1_000_000,
    longitude: plot.account.longitude / 1_000_000,
  }))

  const handleInstallCharger = async (plotId: number) => {
    if (!publicKey) return

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

      {/* Revenue Charts - Show if user has plots */}
      {userPlots.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          <RevenueChart plots={userPlots} />
          <RevenueOverTimeChart plots={userPlots} />
        </div>
      )}

      {/* Purchase Plot */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Virtual Plot</CardTitle>
          <CardDescription>Buy a location to install your virtual charger</CardDescription>
        </CardHeader>
        <CardContent>
          {showPurchaseModal ? (
            <div className="space-y-4">
              {/* Info about auto-generated ID */}
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  📍 Select a location on the map or enter coordinates manually. A unique Plot ID will be generated automatically.
                </p>
              </div>

              {/* Toggle between map and manual input */}
              <div className="flex items-center gap-2">
                <Button
                  variant={useMapSelection ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUseMapSelection(true)}
                >
                  <Map className="w-4 h-4 mr-2" />
                  Map Selection
                </Button>
                <Button
                  variant={!useMapSelection ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUseMapSelection(false)}
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Manual Input
                </Button>
              </div>

              {/* Map or Manual Input */}
              {useMapSelection ? (
                <div className="space-y-4">
                  <PlotSelectionMap
                    selectedLat={latitudeInput ? parseFloat(latitudeInput) : null}
                    selectedLng={longitudeInput ? parseFloat(longitudeInput) : null}
                    onLocationSelect={handleLocationSelect}
                    existingPlots={existingPlotsForMap}
                  />
                  {latitudeInput && longitudeInput && (
                    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Selected Coordinates:
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        Latitude: {parseFloat(latitudeInput).toFixed(6)} | Longitude: {parseFloat(longitudeInput).toFixed(6)}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
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
              )}

              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  Purchase Cost
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {(PLOT_PRICE / LAMPORTS_PER_SOL).toFixed(2)} SOL
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handlePurchasePlot}
                  disabled={!latitudeInput || !longitudeInput}
                  className="flex-1"
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Plots</CardTitle>
              <CardDescription>Manage your virtual charging network</CardDescription>
            </div>
            {/* View Toggle Tabs */}
            {userPlots.length > 0 && (
              <div className="flex gap-1 bg-muted p-1 rounded-lg">
                <Button
                  size="sm"
                  variant={plotsView === 'list' ? 'default' : 'ghost'}
                  onClick={() => setPlotsView('list')}
                  className="text-xs"
                >
                  List View
                </Button>
                <Button
                  size="sm"
                  variant={plotsView === 'map' ? 'default' : 'ghost'}
                  onClick={() => setPlotsView('map')}
                  className="text-xs"
                >
                  <Map className="w-3 h-3 mr-1" />
                  Map View
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {userPlots.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Map className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>You don&apos;t own any plots yet. Purchase one to get started!</p>
            </div>
          ) : plotsView === 'map' ? (
            <PlotManagementMap
              plots={userPlots.map((plot) => ({
                publicKey: plot.publicKey.toString(),
                account: plot.account,
              }))}
              selectedPlotForCharger={selectedPlotForCharger}
              setSelectedPlotForCharger={setSelectedPlotForCharger}
              selectedPower={selectedPower}
              setSelectedPower={setSelectedPower}
              onInstallCharger={handleInstallCharger}
              onUpgradeCharger={handleUpgradeCharger}
              onWithdrawRevenue={(plotId, amount) =>
                virtualPlotActions?.withdrawRevenue.mutateAsync({ plotId, amount })
              }
            />
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
