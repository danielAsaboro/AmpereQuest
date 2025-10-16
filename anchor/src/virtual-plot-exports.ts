// Here we export some useful types and functions for interacting with the VirtualPlot Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import VirtualPlotIDL from '../target/idl/virtual_plot.json'
import type { VirtualPlot } from '../target/types/virtual_plot'

// Re-export the generated IDL and type
export { VirtualPlot, VirtualPlotIDL }

// The programId is imported from the program IDL.
export const VIRTUAL_PLOT_PROGRAM_ID = new PublicKey(VirtualPlotIDL.address)

// This is a helper function to get the VirtualPlot Anchor program.
export function getVirtualPlotProgram(provider: AnchorProvider, address?: PublicKey): Program<VirtualPlot> {
  return new Program({ ...VirtualPlotIDL, address: address ? address.toBase58() : VirtualPlotIDL.address } as VirtualPlot, provider)
}

// This is a helper function to get the program ID for the VirtualPlot program depending on the cluster.
export function getVirtualPlotProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
    case 'mainnet-beta':
    default:
      return VIRTUAL_PLOT_PROGRAM_ID
  }
}
