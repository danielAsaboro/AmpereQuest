'use client'

import { useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet'
import { LatLngExpression, Icon, DivIcon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Zap, MapPin, TrendingUp, ArrowUpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'

const CHARGER_POWERS = [3, 7, 11, 22, 30] as const
const CHARGER_BASE_COST = 0.05 * LAMPORTS_PER_SOL

// Create marker icon based on plot status
const createPlotMarker = (hasCharger: boolean, isOperational: boolean) => {
  let color = '#ef4444' // Red - no charger
  let innerSymbol = ''

  if (hasCharger && isOperational) {
    color = '#22c55e' // Green - operational
    // Lightning bolt symbol
    innerSymbol = '<path d="M16 6 L13 16 L19 16 L16 26" fill="white" stroke="white" stroke-width="1" stroke-linejoin="round"/>'
  } else if (hasCharger && !isOperational) {
    color = '#eab308' // Yellow - not operational
    // Warning exclamation mark
    innerSymbol = '<circle cx="16" cy="20" r="1.5" fill="white"/><rect x="15" y="10" width="2" height="8" rx="1" fill="white"/>'
  } else {
    // No charger - just a pin shape
    innerSymbol = '<circle cx="16" cy="16" r="4" fill="white"/>'
  }

  const svg = `
    <svg width="40" height="40" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" fill="${color}" opacity="0.9" stroke="white" stroke-width="2"/>
      ${innerSymbol}
    </svg>
  `

  // Use encodeURIComponent instead of btoa to avoid Latin1 encoding issues
  return new Icon({
    iconUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  })
}

interface PlotData {
  publicKey: string
  account: {
    plotId: number
    latitude: number
    longitude: number
    chargerPowerKw: number
    isOperational: boolean
    totalRevenue: { toNumber: () => number }
    totalSessions: { toString: () => string }
  }
}

interface PlotManagementMapProps {
  plots: PlotData[]
  selectedPlotForCharger: number | null
  setSelectedPlotForCharger: (plotId: number | null) => void
  selectedPower: number
  setSelectedPower: (power: number) => void
  onInstallCharger: (plotId: number) => void
  onUpgradeCharger: (plotId: number, currentPower: number) => void
  onWithdrawRevenue: (plotId: number, amount: number) => void
}

export function PlotManagementMap({
  plots,
  selectedPlotForCharger,
  setSelectedPlotForCharger,
  selectedPower,
  setSelectedPower,
  onInstallCharger,
  onUpgradeCharger,
  onWithdrawRevenue,
}: PlotManagementMapProps) {
  // Calculate center of all plots
  const center: LatLngExpression = plots.length > 0
    ? [
        plots.reduce((sum, p) => sum + p.account.latitude, 0) / plots.length / 1_000_000,
        plots.reduce((sum, p) => sum + p.account.longitude, 0) / plots.length / 1_000_000,
      ]
    : [20.5937, 78.9629] // Default to India center

  const zoom = plots.length > 0 ? 6 : 5

  return (
    <div className="w-full h-[600px] rounded-lg overflow-hidden border border-border relative">
      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white/95 dark:bg-slate-900/95 rounded-lg border border-border shadow-lg p-3 z-[1000] pointer-events-none">
        <div className="text-xs space-y-2">
          <div className="font-semibold mb-2">Plot Status</div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow-sm"></div>
            <span className="text-gray-700 dark:text-gray-300">Operational</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-white shadow-sm"></div>
            <span className="text-gray-700 dark:text-gray-300">Not Operational</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-sm"></div>
            <span className="text-gray-700 dark:text-gray-300">No Charger</span>
          </div>
        </div>
      </div>

      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <ZoomControl position="topright" />

        {plots.map((plot) => {
          const plotData = plot.account
          const hasCharger = plotData.chargerPowerKw > 0
          const isManaging = selectedPlotForCharger === plotData.plotId

          return (
            <Marker
              key={plot.publicKey}
              position={[
                plotData.latitude / 1_000_000,
                plotData.longitude / 1_000_000,
              ]}
              icon={createPlotMarker(hasCharger, plotData.isOperational)}
            >
              <Popup className="custom-popup" maxWidth={300}>
                <div className="p-2 min-w-[280px]">
                  {/* Header */}
                  <div className="mb-3 pb-2 border-b">
                    <div className="font-bold text-base flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Plot #{plotData.plotId}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {(plotData.latitude / 1_000_000).toFixed(6)},{' '}
                      {(plotData.longitude / 1_000_000).toFixed(6)}
                    </div>
                  </div>

                  {/* Charger Status */}
                  {hasCharger && (
                    <div className="mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium">
                        {plotData.chargerPowerKw}kW Charger
                      </span>
                      {plotData.isOperational && (
                        <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">
                          Operational
                        </span>
                      )}
                    </div>
                  )}

                  {/* Revenue Stats */}
                  <div className="mb-3 pb-3 border-b">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <TrendingUp className="w-3 h-3" />
                        <span>Revenue</span>
                      </div>
                      <span className="font-semibold">
                        {(plotData.totalRevenue.toNumber() / LAMPORTS_PER_SOL).toFixed(4)} SOL
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {plotData.totalSessions.toString()} charging sessions
                    </div>
                  </div>

                  {/* Management Controls */}
                  {isManaging ? (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Charger Power</Label>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {CHARGER_POWERS.map((power) => (
                            <Button
                              key={power}
                              size="sm"
                              className="text-xs px-2 py-1 h-7"
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
                            size="sm"
                            className="flex-1 text-xs"
                            onClick={() => onUpgradeCharger(plotData.plotId, plotData.chargerPowerKw)}
                            disabled={selectedPower <= plotData.chargerPowerKw}
                          >
                            <ArrowUpCircle className="w-3 h-3 mr-1" />
                            Upgrade
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="flex-1 text-xs"
                            onClick={() => onInstallCharger(plotData.plotId)}
                          >
                            <Zap className="w-3 h-3 mr-1" />
                            Install
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => setSelectedPlotForCharger(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
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
                          className="w-full text-xs"
                          onClick={() =>
                            onWithdrawRevenue(plotData.plotId, plotData.totalRevenue.toNumber())
                          }
                        >
                          Withdraw Revenue
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
