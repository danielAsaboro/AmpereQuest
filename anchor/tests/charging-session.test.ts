import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { ChargingSession } from '../target/types/charging_session'

describe('charging_session', () => {
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)

  const program = anchor.workspace.ChargingSession as Program<ChargingSession>
  const payer = provider.wallet as anchor.Wallet

  let userAccountPda: anchor.web3.PublicKey
  let sessionPda: anchor.web3.PublicKey
  const timestamp = Math.floor(Date.now() / 1000)

  beforeAll(async () => {
    // Derive user account PDA
    ;[userAccountPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('user'), payer.publicKey.toBuffer()],
      program.programId
    )

    // Derive session PDA
    ;[sessionPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from('session'),
        payer.publicKey.toBuffer(),
        Buffer.from(new anchor.BN(timestamp).toArray('le', 8)),
      ],
      program.programId
    )
  })

  it('initializes user account', async () => {
    await program.methods
      .initializeUser()
      .accounts({
        userAccount: userAccountPda,
        authority: payer.publicKey,
      })
      .rpc()

    const userAccount = await program.account.userAccount.fetch(userAccountPda)
    expect(userAccount.authority.equals(payer.publicKey)).toBe(true)
    expect(userAccount.totalPoints.toNumber()).toBe(0)
    expect(userAccount.availablePoints.toNumber()).toBe(0)
    expect(userAccount.totalEnergyKwh.toNumber()).toBe(0)
    expect(userAccount.totalSessions.toNumber()).toBe(0)
  })

  it('starts a charging session', async () => {
    await program.methods
      .startSession('CHG-001', 7, new anchor.BN(1_000_000), new anchor.BN(timestamp))
      .accounts({
        session: sessionPda,
        user: payer.publicKey,
      })
      .rpc()

    const session = await program.account.chargingSession.fetch(sessionPda)
    expect(session.user.equals(payer.publicKey)).toBe(true)
    expect(session.chargerCode).toBe('CHG-001')
    expect(session.chargerPowerKw).toBe(7)
    expect(session.pricingPerKwh.toNumber()).toBe(1_000_000)
    expect(session.energyConsumedWh.toNumber()).toBe(0)
    expect(session.pointsEarned.toNumber()).toBe(0)
    expect(session.isActive).toBe(true)
  })

  it('updates session with energy consumed', async () => {
    // Simulate 5000 Wh (5 kWh) consumed
    const energyIncrement = 5000

    await program.methods
      .updateSession(new anchor.BN(energyIncrement))
      .accounts({
        session: sessionPda,
        user: payer.publicKey,
      })
      .rpc()

    const session = await program.account.chargingSession.fetch(sessionPda)
    expect(session.energyConsumedWh.toNumber()).toBe(energyIncrement)
    // 1 point per 100 Wh, so 5000 Wh = 50 points
    expect(session.pointsEarned.toNumber()).toBe(50)
  })

  it('updates session multiple times', async () => {
    // Add another 3000 Wh
    const energyIncrement = 3000

    await program.methods
      .updateSession(new anchor.BN(energyIncrement))
      .accounts({
        session: sessionPda,
        user: payer.publicKey,
      })
      .rpc()

    const session = await program.account.chargingSession.fetch(sessionPda)
    expect(session.energyConsumedWh.toNumber()).toBe(8000) // 5000 + 3000
    expect(session.pointsEarned.toNumber()).toBe(80) // 50 + 30
  })

  it('ends charging session and credits points to user', async () => {
    await program.methods
      .endSession()
      .accounts({
        session: sessionPda,
        userAccount: userAccountPda,
        user: payer.publicKey,
      })
      .rpc()

    const session = await program.account.chargingSession.fetch(sessionPda)
    expect(session.isActive).toBe(false)
    expect(session.endTime).not.toBeNull()

    const userAccount = await program.account.userAccount.fetch(userAccountPda)
    expect(userAccount.totalPoints.toNumber()).toBe(80)
    expect(userAccount.totalEnergyKwh.toNumber()).toBe(8) // 8000 Wh = 8 kWh
    expect(userAccount.totalSessions.toNumber()).toBe(1)
  })

  it('fails to update an inactive session', async () => {
    try {
      await program.methods
        .updateSession(new anchor.BN(1000))
        .accounts({
          session: sessionPda,
          user: payer.publicKey,
        })
        .rpc()

      fail('Should have failed to update inactive session')
    } catch (error: any) {
      expect(error.message).toContain('SessionNotActive')
    }
  })
})
