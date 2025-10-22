'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMapEvents } from 'react-leaflet'
import { LatLngExpression, Icon, LeafletMouseEvent } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin, CheckCircle2 } from 'lucide-react'

// Custom icon for selected location
const createSelectedIcon = () => {
  const svg = `
    <svg width="40" height="40" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" fill="#3b82f6" opacity="0.9"/>
      <circle cx="16" cy="16" r="8" fill="white"/>
      <circle cx="16" cy="16" r="14" fill="none" stroke="#3b82f6" stroke-width="2" opacity="0.5"/>
    </svg>
  `

  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svg)}`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  })
}

// Custom icon for existing plots
const createPlotIcon = () => {
  const svg = `
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" fill="#22c55e" opacity="0.8"/>
      <circle cx="16" cy="16" r="8" fill="white"/>
    </svg>
  `

  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svg)}`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  })
}

interface ExistingPlot {
  plotId: number
  latitude: number
  longitude: number
}

interface PlotSelectionMapProps {
  selectedLat: number | null
  selectedLng: number | null
  onLocationSelect: (lat: number, lng: number) => void
  existingPlots?: ExistingPlot[]
}

// Component to handle map click events
function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e: LeafletMouseEvent) => {
      const { lat, lng } = e.latlng
      onLocationSelect(lat, lng)
    },
  })
  return null
}

export function PlotSelectionMap({
  selectedLat,
  selectedLng,
  onLocationSelect,
  existingPlots = [],
}: PlotSelectionMapProps) {
  const [center] = useState<LatLngExpression>([20.5937, 78.9629]) // Center of India

  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden border border-border relative">
      {/* Instructions overlay */}
      <div className="absolute top-4 left-4 bg-white/95 dark:bg-slate-900/95 rounded-lg border border-border shadow-lg p-3 max-w-xs z-[1000] pointer-events-none">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-semibold text-gray-900 dark:text-white mb-1">
              Click anywhere on the map
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              Select a location to place your virtual charging station
            </p>
          </div>
        </div>
        {selectedLat && selectedLng && (
          <div className="mt-2 pt-2 border-t border-border flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-3 h-3" />
            <span className="font-medium">Location selected!</span>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white/95 dark:bg-slate-900/95 rounded-lg border border-border shadow-lg p-3 z-[1000] pointer-events-none">
        <div className="text-xs space-y-2">
          {selectedLat && selectedLng && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-sm"></div>
              <span className="text-gray-700 dark:text-gray-300">Selected Location</span>
            </div>
          )}
          {existingPlots.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow-sm"></div>
              <span className="text-gray-700 dark:text-gray-300">Your Existing Plots</span>
            </div>
          )}
        </div>
      </div>

      <MapContainer
        center={center}
        zoom={5}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <ZoomControl position="topright" />

        <MapClickHandler onLocationSelect={onLocationSelect} />

        {/* Existing plots */}
        {existingPlots.map((plot) => (
          <Marker
            key={plot.plotId}
            position={[plot.latitude, plot.longitude]}
            icon={createPlotIcon()}
          >
            <Popup>
              <div className="text-xs">
                <p className="font-bold">Plot #{plot.plotId}</p>
                <p className="text-gray-600 text-xs">
                  {plot.latitude.toFixed(6)}, {plot.longitude.toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Selected location marker */}
        {selectedLat && selectedLng && (
          <Marker
            position={[selectedLat, selectedLng]}
            icon={createSelectedIcon()}
          >
            <Popup>
              <div className="text-xs">
                <p className="font-bold text-blue-600">New Plot Location</p>
                <p className="text-gray-600 text-xs">
                  Lat: {selectedLat.toFixed(6)}
                </p>
                <p className="text-gray-600 text-xs">
                  Lng: {selectedLng.toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  )
}
