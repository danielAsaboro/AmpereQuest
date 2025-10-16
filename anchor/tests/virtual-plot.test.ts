import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { VirtualPlot } from '../target/types/virtual_plot'

describe('virtual_plot', () => {
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)

  const program = anchor.workspace.VirtualPlot as Program<VirtualPlot>
  const payer = provider.wallet as anchor.Wallet

  const plotId = 1
  let plotPda: anchor.web3.PublicKey
  const treasury = anchor.web3.Keypair.generate()

  beforeAll(async () => {
    // Derive plot PDA
    ;[plotPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('plot'), Buffer.from(new anchor.BN(plotId).toArray('le', 4))],
      program.programId
    )

    // Airdrop to treasury
    const signature = await provider.connection.requestAirdrop(
      treasury.publicKey,
      1 * anchor.web3.LAMPORTS_PER_SOL
    )
    await provider.connection.confirmTransaction(signature)
  })

  it('purchases a virtual plot', async () => {
    const latitude = 40.7128 // New York latitude
    const longitude = -74.006 // New York longitude
    const priceLamports = 100_000_000 // 0.1 SOL

    await program.methods
      .purchasePlot(
        plotId,
        Math.floor(latitude * 1_000_000),
        Math.floor(longitude * 1_000_000),
        new anchor.BN(priceLamports)
      )
      .accounts({
        plot: plotPda,
        buyer: payer.publicKey,
        treasury: treasury.publicKey,
      })
      .rpc()

    const plot = await program.account.virtualPlot.fetch(plotPda)
    expect(plot.owner.equals(payer.publicKey)).toBe(true)
    expect(plot.plotId).toBe(plotId)
    expect(plot.latitude).toBe(Math.floor(latitude * 1_000_000))
    expect(plot.longitude).toBe(Math.floor(longitude * 1_000_000))
    expect(plot.purchasePrice.toNumber()).toBe(priceLamports)
    expect(plot.chargerPowerKw).toBe(0)
    expect(plot.isOperational).toBe(false)
  })

  it('installs a charger on the plot', async () => {
    const chargerPowerKw = 7
    const installationCost = 50_000_000 // 0.05 SOL

    await program.methods
      .installCharger(chargerPowerKw, new anchor.BN(installationCost))
      .accounts({
        plot: plotPda,
        owner: payer.publicKey,
        treasury: treasury.publicKey,
      })
      .rpc()

    const plot = await program.account.virtualPlot.fetch(plotPda)
    expect(plot.chargerPowerKw).toBe(chargerPowerKw)
    expect(plot.isOperational).toBe(true)
  })

  it('upgrades the charger', async () => {
    const newPowerKw = 22
    const upgradeCost = 75_000_000 // 0.075 SOL

    await program.methods
      .upgradeCharger(newPowerKw, new anchor.BN(upgradeCost))
      .accounts({
        plot: plotPda,
        owner: payer.publicKey,
        treasury: treasury.publicKey,
      })
      .rpc()

    const plot = await program.account.virtualPlot.fetch(plotPda)
    expect(plot.chargerPowerKw).toBe(newPowerKw)
  })

  it('fails to upgrade to lower power', async () => {
    try {
      await program.methods
        .upgradeCharger(11, new anchor.BN(50_000_000))
        .accounts({
          plot: plotPda,
          owner: payer.publicKey,
          treasury: treasury.publicKey,
        })
        .rpc()

      fail('Should have failed to downgrade charger')
    } catch (error: any) {
      expect(error.message).toContain('InvalidUpgrade')
    }
  })

  it('records a virtual charging session', async () => {
    // Use a different keypair as authority (game engine)
    const gameEngine = anchor.web3.Keypair.generate()
    const sessionPayer = anchor.web3.Keypair.generate()

    // Airdrop to game engine and session payer
    const sig1 = await provider.connection.requestAirdrop(
      gameEngine.publicKey,
      1 * anchor.web3.LAMPORTS_PER_SOL
    )
    await provider.connection.confirmTransaction(sig1)

    const sig2 = await provider.connection.requestAirdrop(
      sessionPayer.publicKey,
      1 * anchor.web3.LAMPORTS_PER_SOL
    )
    await provider.connection.confirmTransaction(sig2)

    const revenueLamports = 1_000_000 // 0.001 SOL revenue

    await program.methods
      .recordSession(new anchor.BN(revenueLamports))
      .accounts({
        plot: plotPda,
        payer: sessionPayer.publicKey,
        authority: gameEngine.publicKey,
      })
      .signers([sessionPayer, gameEngine])
      .rpc()

    const plot = await program.account.virtualPlot.fetch(plotPda)
    expect(plot.totalRevenue.toNumber()).toBe(revenueLamports)
    expect(plot.totalSessions.toNumber()).toBe(1)
  })

  it('records multiple sessions', async () => {
    const gameEngine = anchor.web3.Keypair.generate()
    const sessionPayer = anchor.web3.Keypair.generate()

    const sig1 = await provider.connection.requestAirdrop(
      gameEngine.publicKey,
      1 * anchor.web3.LAMPORTS_PER_SOL
    )
    await provider.connection.confirmTransaction(sig1)

    const sig2 = await provider.connection.requestAirdrop(
      sessionPayer.publicKey,
      1 * anchor.web3.LAMPORTS_PER_SOL
    )
    await provider.connection.confirmTransaction(sig2)

    const revenueLamports = 2_000_000 // 0.002 SOL

    await program.methods
      .recordSession(new anchor.BN(revenueLamports))
      .accounts({
        plot: plotPda,
        payer: sessionPayer.publicKey,
        authority: gameEngine.publicKey,
      })
      .signers([sessionPayer, gameEngine])
      .rpc()

    const plot = await program.account.virtualPlot.fetch(plotPda)
    expect(plot.totalRevenue.toNumber()).toBe(3_000_000) // 1M + 2M
    expect(plot.totalSessions.toNumber()).toBe(2)
  })

  it('withdraws revenue from plot', async () => {
    const plot = await program.account.virtualPlot.fetch(plotPda)
    const revenueToWithdraw = plot.totalRevenue

    await program.methods
      .withdrawRevenue(revenueToWithdraw)
      .accounts({
        plot: plotPda,
        owner: payer.publicKey,
      })
      .rpc()

    const updatedPlot = await program.account.virtualPlot.fetch(plotPda)
    expect(updatedPlot.totalRevenue.toNumber()).toBe(0)
  })

  it('fails to install charger with invalid power', async () => {
    const newPlotId = 2
    const [newPlotPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('plot'), Buffer.from(new anchor.BN(newPlotId).toArray('le', 4))],
      program.programId
    )

    // Purchase new plot
    await program.methods
      .purchasePlot(newPlotId, 35_000_000, -118_000_000, new anchor.BN(100_000_000))
      .accounts({
        plot: newPlotPda,
        buyer: payer.publicKey,
        treasury: treasury.publicKey,
      })
      .rpc()

    // Try to install charger with invalid power (not 3, 7, 11, 22, or 30)
    try {
      await program.methods
        .installCharger(15, new anchor.BN(50_000_000))
        .accounts({
          plot: newPlotPda,
          owner: payer.publicKey,
          treasury: treasury.publicKey,
        })
        .rpc()

      fail('Should have failed with invalid charger power')
    } catch (error: any) {
      expect(error.message).toContain('InvalidChargerPower')
    }
  })
})
