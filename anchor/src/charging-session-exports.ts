// Here we export some useful types and functions for interacting with the ChargingSession Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import ChargingSessionIDL from '../target/idl/charging_session.json'
import type { ChargingSession } from '../target/types/charging_session'

// Re-export the generated IDL and type
export { ChargingSession, ChargingSessionIDL }

// The programId is imported from the program IDL.
export const CHARGING_SESSION_PROGRAM_ID = new PublicKey(ChargingSessionIDL.address)

// This is a helper function to get the ChargingSession Anchor program.
export function getChargingSessionProgram(provider: AnchorProvider, address?: PublicKey): Program<ChargingSession> {
  return new Program({ ...ChargingSessionIDL, address: address ? address.toBase58() : ChargingSessionIDL.address } as ChargingSession, provider)
}

// This is a helper function to get the program ID for the ChargingSession program depending on the cluster.
export function getChargingSessionProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
    case 'mainnet-beta':
    default:
      return CHARGING_SESSION_PROGRAM_ID
  }
}
