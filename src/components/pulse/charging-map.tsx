'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, Tooltip } from 'react-leaflet'
import { LatLngExpression, Icon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { ChargingSession, getAllChargePoints, type ChargePoint } from '@/lib/simulation'

// Custom icons for different statuses
const createIcon = (status: 'active' | 'charging' | 'maintenance' | 'offline', isActive?: boolean) => {
  const colors: Record<string, string> = {
    active: '#22c55e', // green
    charging: '#3b82f6', // blue
    maintenance: '#f59e0b', // amber
    offline: '#6b7280', // gray
  }

  const color = colors[status]
  const size = isActive ? 40 : 32
  const adjustedAnchor = isActive ? 20 : 16

  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" fill="${color}" opacity="0.9"/>
      <circle cx="16" cy="16" r="8" fill="white"/>
      ${status === 'charging' ? '<circle cx="16" cy="16" r="14" fill="none" stroke="' + color + '" stroke-width="2" opacity="0.5"/>' : ''}
    </svg>
  `

  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svg)}`,
    iconSize: [size, size],
    iconAnchor: [adjustedAnchor, adjustedAnchor * 2],
    popupAnchor: [0, -adjustedAnchor * 2],
    shadowSize: [41, 41],
  })
}

interface ChargingMapProps {
  sessions: ChargingSession[]
  showChargePoints?: boolean
  showSessions?: boolean
}

export function ChargingMap({
  sessions,
  showChargePoints = true,
  showSessions = true,
}: ChargingMapProps) {
  const [chargePoints, setChargePoints] = useState<ChargePoint[]>([])
  const [center, setCenter] = useState<LatLngExpression>([20.5937, 78.9629]) // Center of India

  useEffect(() => {
    setChargePoints(getAllChargePoints())
  }, [])

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-border relative group">
      {/* Map Legend - Fixed Position, Always Visible */}
      <div className="absolute bottom-4 left-4 bg-white/95 dark:bg-slate-900/95 rounded-lg border border-border shadow-lg p-4 max-w-sm z-50 pointer-events-auto">
        <h3 className="font-semibold text-sm mb-3 text-gray-900 dark:text-white">Map Legend</h3>

        <div className="space-y-3 text-xs mb-4">
          <div>
            <p className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Charge Points</p>
            <div className="space-y-1.5 ml-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500 opacity-90 border-2 border-white shadow-sm"></div>
                <span className="text-gray-700 dark:text-gray-300">Active & Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-amber-500 opacity-90 border-2 border-white shadow-sm"></div>
                <span className="text-gray-700 dark:text-gray-300">Under Maintenance</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gray-500 opacity-90 border-2 border-white shadow-sm"></div>
                <span className="text-gray-700 dark:text-gray-300">Offline</span>
              </div>
            </div>
          </div>

          <div>
            <p className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Live Sessions</p>
            <div className="ml-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-sm animate-pulse"></div>
                <span className="text-gray-700 dark:text-gray-300">Active Charging</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 ml-6 mt-1">Real-time sessions (larger marker)</p>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-3 text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <p>✨ <strong>Hover</strong> over markers for quick info</p>
          <p>👆 <strong>Click</strong> for detailed information</p>
          <p>📍 Shows pricing, power, & live progress</p>
        </div>
      </div>

      <MapContainer
        center={center}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <ZoomControl position="bottomright" />

        {/* Charge Points */}
        {showChargePoints &&
          chargePoints.map((chargePoint) => (
            <Marker
              key={chargePoint.code}
              position={[chargePoint.location.latitude, chargePoint.location.longitude]}
              icon={createIcon(chargePoint.status)}
              opacity={0.7}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
                <div className="text-xs font-medium">
                  <p className="font-bold">{chargePoint.name}</p>
                  <p className="text-gray-700">{chargePoint.location.city}</p>
                </div>
              </Tooltip>
              <Popup>
                <div className="min-w-[220px]">
                  <div className="mb-2">
                    <h3 className="font-bold text-sm">{chargePoint.name}</h3>
                    <p className="text-xs text-gray-500">{chargePoint.code}</p>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">{chargePoint.location.address}</p>

                  <div className="bg-gray-50 p-2 rounded mb-3">
                    <div className="text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="font-semibold">Status:</span>
                        <span className={`capitalize px-2 py-1 rounded text-white text-xs font-medium ${
                          chargePoint.status === 'active' ? 'bg-green-500' :
                          chargePoint.status === 'maintenance' ? 'bg-amber-500' :
                          'bg-gray-500'
                        }`}>
                          {chargePoint.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold">Power:</span>
                        <span className="text-blue-600 font-bold">{chargePoint.connectors[0]?.power_kw}kW</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold">Connectors:</span>
                        <span>{chargePoint.no_of_connectors}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold">Type:</span>
                        <span className="text-xs">{chargePoint.connectors[0]?.type}</span>
                      </div>
                      <div className="border-t pt-1.5 mt-1.5">
                        <div className="font-bold text-gray-700 mb-1">Pricing</div>
                        <div className="flex justify-between text-xs">
                          <span>Per kWh:</span>
                          <span className="text-green-600 font-bold">₹{chargePoint.pricing.energy_based.rate}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Per min:</span>
                          <span className="text-green-600 font-bold">₹{chargePoint.pricing.time_based.rate}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Active Sessions */}
        {showSessions &&
          sessions
            .filter((s) => s.isActive)
            .map((session) => {
              const chargePoint = chargePoints.find((cp) => cp.code === session.chargerCode)
              if (!chargePoint) return null

              return (
                <Marker
                  key={`session-${session.id}`}
                  position={[chargePoint.location.latitude, chargePoint.location.longitude]}
                  icon={createIcon('charging', true)}
                  opacity={1}
                >
                  <Tooltip direction="top" offset={[0, -15]} opacity={0.95}>
                    <div className="text-xs font-medium">
                      <p className="font-bold text-blue-600">🔵 LIVE SESSION</p>
                      <p>{session.user}</p>
                      <p className="text-gray-600">{session.progress}% complete</p>
                    </div>
                  </Tooltip>
                  <Popup>
                    <div className="min-w-[240px]">
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-block w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></span>
                          <h3 className="font-bold text-sm text-blue-600">Active Session</h3>
                        </div>
                        <p className="text-xs text-gray-500">Live charging in progress</p>
                      </div>

                      <div className="bg-blue-50 p-2.5 rounded mb-3 border border-blue-200">
                        <div className="text-xs space-y-2">
                          <div className="flex justify-between">
                            <span className="font-semibold">Driver:</span>
                            <span className="text-blue-600 font-medium">{session.user}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold">Charger:</span>
                            <span>{session.chargerCode}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold">Location:</span>
                            <span className="text-right">{session.location}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold">Power:</span>
                            <span className="text-red-600 font-bold">{session.powerKw}kW</span>
                          </div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs font-semibold">Progress</span>
                          <span className="text-xs font-bold text-blue-600">{session.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-400 to-blue-600 h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${session.progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="bg-gray-50 p-2.5 rounded border border-gray-200">
                        <div className="text-xs space-y-1.5">
                          <div className="flex justify-between">
                            <span className="font-semibold">Energy:</span>
                            <span className="text-green-600 font-bold">{session.energyConsumedKwh.toFixed(2)} kWh</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold">Points Earned:</span>
                            <span className="text-yellow-600 font-bold">{session.pointsEarned}</span>
                          </div>
                          <div className="flex justify-between text-gray-600">
                            <span className="text-xs">Started:</span>
                            <span className="text-xs">{new Date(session.startTime).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )
            })}
      </MapContainer>
    </div>
  )
}
