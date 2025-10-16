// Simulation engine for EV charging sessions
import chargePointsData from '../../resources/charge_point_sample.json'

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
