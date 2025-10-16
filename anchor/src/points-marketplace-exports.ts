// Here we export some useful types and functions for interacting with the PointsMarketplace Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import PointsMarketplaceIDL from '../target/idl/points_marketplace.json'
import type { PointsMarketplace } from '../target/types/points_marketplace'

// Re-export the generated IDL and type
export { PointsMarketplace, PointsMarketplaceIDL }

// The programId is imported from the program IDL.
export const POINTS_MARKETPLACE_PROGRAM_ID = new PublicKey(PointsMarketplaceIDL.address)

// This is a helper function to get the PointsMarketplace Anchor program.
export function getPointsMarketplaceProgram(provider: AnchorProvider, address?: PublicKey): Program<PointsMarketplace> {
  return new Program({ ...PointsMarketplaceIDL, address: address ? address.toBase58() : PointsMarketplaceIDL.address } as PointsMarketplace, provider)
}

// This is a helper function to get the program ID for the PointsMarketplace program depending on the cluster.
export function getPointsMarketplaceProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
    case 'mainnet-beta':
    default:
      return POINTS_MARKETPLACE_PROGRAM_ID
  }
}
