// Simulation engine for EV charging sessions
import chargePointsData from '../data/charge_point_sample.json'

export interface ChargePoint {
  code: string
  name: string
  no_of_connectors: number
  location: {
    city: string
    address: string
    latitude: number
    longitude: number
  }
  status: 'active' | 'maintenance' | 'offline'
  pricing: {
    time_based: {
      rate: number
      unit: string
    }
    energy_based: {
      rate: number
      unit: string
    }
  }
  connectors: Array<{
    id: string
    type: string
    power_kw: number
    status: 'available' | 'occupied' | 'maintenance' | 'offline'
  }>
}

export interface ChargingSession {
  id: string
  chargerCode: string
  chargerName: string
  location: string
  powerKw: number
  startTime: Date
  energyConsumedKwh: number
  pointsEarned: number
  isActive: boolean
  user: string // Anonymous identifier
  progress: number // 0-100
}

export interface SessionUpdate {
  sessionId: string
  energyConsumedKwh: number
  pointsEarned: number
  progress: number
  isComplete: boolean
}

// Generate anonymous user IDs
const generateUserId = (): string => {
  const adjectives = ['Swift', 'Eco', 'Green', 'Silent', 'Quick', 'Smart', 'Turbo', 'Clean']
  const nouns = ['Driver', 'Charger', 'Rider', 'Cruiser', 'Commuter', 'Voyager', 'Traveler', 'Explorer']
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const number = Math.floor(Math.random() * 9999)
  return `${adjective}${noun}${number}`
}

// Calculate points earned based on energy consumed
// 1 point per 0.1 kWh (100 Wh)
export const calculatePoints = (energyKwh: number): number => {
  return Math.floor(energyKwh * 10)
}

// Get random active charge point
const getRandomChargePoint = (): ChargePoint | null => {
  const activePoints = chargePointsData.charge_points.filter(
    (cp) => cp.status === 'active'
  )
  if (activePoints.length === 0) return null
  return activePoints[Math.floor(Math.random() * activePoints.length)] as ChargePoint
}

// Simulate a new charging session
export const createRandomSession = (): ChargingSession | null => {
  const chargePoint = getRandomChargePoint()
  if (!chargePoint) return null

  const connector = chargePoint.connectors[0]
  const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(7)}`

  return {
    id: sessionId,
    chargerCode: chargePoint.code,
    chargerName: chargePoint.name,
    location: `${chargePoint.location.city}, ${chargePoint.location.address}`,
    powerKw: connector.power_kw,
    startTime: new Date(),
    energyConsumedKwh: 0,
    pointsEarned: 0,
    isActive: true,
    user: generateUserId(),
    progress: 0,
  }
}

// Simulate energy consumption over time
// Returns energy increment in kWh for this tick
export const simulateEnergyIncrement = (
  powerKw: number,
  tickIntervalSeconds: number = 1
): number => {
  // Energy (kWh) = Power (kW) * Time (hours)
  // Add some randomness for realistic variation (±15%)
  const baseEnergy = (powerKw * tickIntervalSeconds) / 3600
  const variation = 0.85 + Math.random() * 0.3 // 85% to 115%
  return baseEnergy * variation
}

// Update a session with new energy consumption
export const updateSession = (
  session: ChargingSession,
  tickIntervalSeconds: number = 1
): SessionUpdate => {
  const energyIncrement = simulateEnergyIncrement(session.powerKw, tickIntervalSeconds)
  const newEnergyTotal = session.energyConsumedKwh + energyIncrement
  const newPoints = calculatePoints(newEnergyTotal)

  // Sessions typically charge between 10-50 kWh
  const targetEnergy = 15 + Math.random() * 35
  const progress = Math.min((newEnergyTotal / targetEnergy) * 100, 100)
  const isComplete = progress >= 100

  return {
    sessionId: session.id,
    energyConsumedKwh: newEnergyTotal,
    pointsEarned: newPoints,
    progress: Math.round(progress),
    isComplete,
  }
}

// Simulation class to manage multiple sessions
export class ChargingSimulator {
  private sessions: Map<string, ChargingSession>
  private updateInterval: NodeJS.Timeout | null = null
  private onSessionUpdate?: (session: ChargingSession) => void
  private onSessionComplete?: (session: ChargingSession) => void
  private onNewSession?: (session: ChargingSession) => void

  constructor() {
    this.sessions = new Map()
  }

  // Set callback for session updates
  setCallbacks(callbacks: {
    onSessionUpdate?: (session: ChargingSession) => void
    onSessionComplete?: (session: ChargingSession) => void
    onNewSession?: (session: ChargingSession) => void
  }) {
    this.onSessionUpdate = callbacks.onSessionUpdate
    this.onSessionComplete = callbacks.onSessionComplete
    this.onNewSession = callbacks.onNewSession
  }

  // Start simulation
  start(updateIntervalMs: number = 1000) {
    // Create initial sessions
    for (let i = 0; i < 3; i++) {
      this.createNewSession()
    }

    // Update loop
    this.updateInterval = setInterval(() => {
      this.tick(updateIntervalMs / 1000)

      // Randomly create new sessions (20% chance each tick)
      if (Math.random() < 0.2 && this.sessions.size < 10) {
        this.createNewSession()
      }
    }, updateIntervalMs)
  }

  // Stop simulation
  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
  }

  // Create a new session
  private createNewSession() {
    const session = createRandomSession()
    if (session) {
      this.sessions.set(session.id, session)
      this.onNewSession?.(session)
    }
  }

  // Update all active sessions
  private tick(intervalSeconds: number) {
    this.sessions.forEach((session) => {
      if (!session.isActive) return

      const update = updateSession(session, intervalSeconds)

      // Update session
      session.energyConsumedKwh = update.energyConsumedKwh
      session.pointsEarned = update.pointsEarned
      session.progress = update.progress

      if (update.isComplete) {
        session.isActive = false
        this.onSessionComplete?.(session)
        // Remove completed session after a delay
        setTimeout(() => {
          this.sessions.delete(session.id)
        }, 3000)
      } else {
        this.onSessionUpdate?.(session)
      }
    })
  }

  // Get all active sessions
  getActiveSessions(): ChargingSession[] {
    return Array.from(this.sessions.values()).filter((s) => s.isActive)
  }

  // Get all sessions (including completed)
  getAllSessions(): ChargingSession[] {
    return Array.from(this.sessions.values())
  }
}

// Get all charge points for map display
export const getAllChargePoints = (): ChargePoint[] => {
  return chargePointsData.charge_points as ChargePoint[]
}

// Validation functions for production use

/**
 * Validate charger code exists in database
 * Production: Would check against DeCharge API
 */
export const validateChargerCode = (chargerCode: string): boolean => {
  const chargePoints = getAllChargePoints()
  return chargePoints.some((cp) => cp.code === chargerCode)
}

/**
 * Get charger details by code
 */
export const getChargerByCode = (chargerCode: string): ChargePoint | null => {
  const chargePoints = getAllChargePoints()
  return chargePoints.find((cp) => cp.code === chargerCode) || null
}

/**
 * Validate GPS coordinates are within reasonable bounds
 * Latitude: -90 to +90 (scaled by 1e6: -90000000 to +90000000)
 * Longitude: -180 to +180 (scaled by 1e6: -180000000 to +180000000)
 */
export const validateCoordinates = (latitude: number, longitude: number): boolean => {
  // Check if coordinates are in valid range (scaled by 1e6)
  const isLatValid = latitude >= -90_000_000 && latitude <= 90_000_000
  const isLngValid = longitude >= -180_000_000 && longitude <= 180_000_000
  return isLatValid && isLngValid
}

/**
 * Calculate distance between two GPS coordinates (Haversine formula)
 * Returns distance in meters
 */
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  // Convert from scaled integers to degrees
  const lat1Deg = lat1 / 1_000_000
  const lng1Deg = lng1 / 1_000_000
  const lat2Deg = lat2 / 1_000_000
  const lng2Deg = lng2 / 1_000_000

  const R = 6371e3 // Earth radius in meters
  const φ1 = (lat1Deg * Math.PI) / 180
  const φ2 = (lat2Deg * Math.PI) / 180
  const Δφ = ((lat2Deg - lat1Deg) * Math.PI) / 180
  const Δλ = ((lng2Deg - lng1Deg) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * Validate location is near a registered charger
 * Production: Would verify GPS proof from hardware
 */
export const validateLocationNearCharger = (
  chargerCode: string,
  latitude: number,
  longitude: number,
  maxDistanceMeters: number = 100
): boolean => {
  const charger = getChargerByCode(chargerCode)
  if (!charger) return false

  const chargerLat = Math.round(charger.location.latitude * 1_000_000)
  const chargerLng = Math.round(charger.location.longitude * 1_000_000)

  const distance = calculateDistance(latitude, longitude, chargerLat, chargerLng)
  return distance <= maxDistanceMeters
}

/**
 * Validate charger power rating
 */
export const validateChargerPower = (chargerCode: string, powerKw: number): boolean => {
  const charger = getChargerByCode(chargerCode)
  if (!charger) return false

  // Check if any connector matches the specified power
  return charger.connectors.some((conn) => conn.power_kw === powerKw)
}

/**
 * Get available power levels for a charger
 */
export const getAvailablePowerLevels = (chargerCode: string): number[] => {
  const charger = getChargerByCode(chargerCode)
  if (!charger) return []

  return charger.connectors.map((conn) => conn.power_kw)
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

/**
 * Comprehensive session validation
 * Production: Would be called by oracle before approving session
 */
export const validateSessionStart = (params: {
  chargerCode: string
  powerKw: number
  latitude?: number
  longitude?: number
}): ValidationResult => {
  const errors: string[] = []

  // Validate charger exists
  if (!validateChargerCode(params.chargerCode)) {
    errors.push(`Charger code '${params.chargerCode}' not found in database`)
  }

  // Validate power rating
  if (!validateChargerPower(params.chargerCode, params.powerKw)) {
    const available = getAvailablePowerLevels(params.chargerCode)
    errors.push(
      `Invalid power rating ${params.powerKw}kW for charger. Available: ${available.join(', ')}kW`
    )
  }

  // Validate coordinates if provided
  if (params.latitude !== undefined && params.longitude !== undefined) {
    if (!validateCoordinates(params.latitude, params.longitude)) {
      errors.push(`Invalid GPS coordinates: (${params.latitude}, ${params.longitude})`)
    } else {
      // Validate location is near charger
      if (!validateLocationNearCharger(params.chargerCode, params.latitude, params.longitude)) {
        errors.push(
          `Location (${params.latitude}, ${params.longitude}) is not within 100m of charger ${params.chargerCode}`
        )
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
