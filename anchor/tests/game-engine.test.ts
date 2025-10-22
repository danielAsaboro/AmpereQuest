import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { GameEngine } from '../target/types/game_engine'
import { VirtualPlot } from '../target/types/virtual_plot'

describe('game_engine', () => {
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)

  const gameEngineProgram = anchor.workspace.GameEngine as Program<GameEngine>
  const virtualPlotProgram = anchor.workspace.VirtualPlot as Program<VirtualPlot>
  const payer = provider.wallet as anchor.Wallet

  const plotId = Math.floor(Math.random() * 1000000) // Use random ID to avoid conflicts
  let plotPda: anchor.web3.PublicKey
  let treasuryPda: anchor.web3.PublicKey
  let gameEngineAuthority: anchor.web3.PublicKey

  beforeAll(async () => {
    // Derive plot PDA for virtual_plot
    ;[plotPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('plot'), Buffer.from(new anchor.BN(plotId).toArray('le', 4))],
      virtualPlotProgram.programId
    )

    // Derive treasury PDA for virtual_plot
    ;[treasuryPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('treasury')],
      virtualPlotProgram.programId
    )

    // Derive game engine authority PDA
    ;[gameEngineAuthority] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('game_engine')],
      gameEngineProgram.programId
    )

    // Note: Game engine authority doesn't need to be explicitly initialized
    // It's a PDA that will be automatically handled by the game_engine program
    // when it signs CPI calls via new_with_signer

    // Set up a virtual plot for testing
    await virtualPlotProgram.methods
      .purchasePlot(
        plotId,
        Math.floor(40.7128 * 1_000_000),
        Math.floor(-74.006 * 1_000_000),
        new anchor.BN(100_000_000)
      )
      .accounts({
        plot: plotPda,
        buyer: payer.publicKey,
        treasury: treasuryPda,
      })
      .rpc()

    // Install a charger
    await virtualPlotProgram.methods
      .installCharger(7, new anchor.BN(50_000_000))
      .accounts({
        plot: plotPda,
        owner: payer.publicKey,
        treasury: treasuryPda,
      })
      .rpc()
  })

  it('records a virtual charging session via CPI', async () => {
    const revenueLamports = 1_000_000 // 0.001 SOL

    await gameEngineProgram.methods
      .recordSession(new anchor.BN(revenueLamports))
      .accounts({
        plot: plotPda,
        payer: payer.publicKey,
        authority: gameEngineAuthority,
        virtualPlotProgram: virtualPlotProgram.programId,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc()

    const plot = await virtualPlotProgram.account.virtualPlot.fetch(plotPda)
    expect(plot.totalRevenue.toNumber()).toBe(revenueLamports)
    expect(plot.totalSessions.toNumber()).toBe(1)
  })

  it('records multiple sessions via CPI', async () => {
    const revenueLamports = 2_000_000 // 0.002 SOL

    await gameEngineProgram.methods
      .recordSession(new anchor.BN(revenueLamports))
      .accounts({
        plot: plotPda,
        payer: payer.publicKey,
        authority: gameEngineAuthority,
        virtualPlotProgram: virtualPlotProgram.programId,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc()

    const plot = await virtualPlotProgram.account.virtualPlot.fetch(plotPda)
    expect(plot.totalRevenue.toNumber()).toBe(3_000_000) // 1M + 2M
    expect(plot.totalSessions.toNumber()).toBe(2)
  })

  it('accumulates revenue correctly', async () => {
    const sessionRevenue = 500_000 // 0.0005 SOL
    const numSessions = 5

    for (let i = 0; i < numSessions; i++) {
      await gameEngineProgram.methods
        .recordSession(new anchor.BN(sessionRevenue))
        .accounts({
          plot: plotPda,
          payer: payer.publicKey,
          authority: gameEngineAuthority,
          virtualPlotProgram: virtualPlotProgram.programId,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc()
    }

    const plot = await virtualPlotProgram.account.virtualPlot.fetch(plotPda)
    const expectedRevenue = 3_000_000 + sessionRevenue * numSessions // Previous sessions + new ones
    expect(plot.totalRevenue.toNumber()).toBe(expectedRevenue)
    expect(plot.totalSessions.toNumber()).toBe(2 + numSessions)
  })
})
