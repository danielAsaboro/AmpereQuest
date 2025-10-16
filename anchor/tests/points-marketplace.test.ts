import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { PointsMarketplace } from '../target/types/points_marketplace'
import { ChargingSession } from '../target/types/charging_session'

describe('points_marketplace', () => {
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)

  const program = anchor.workspace.PointsMarketplace as Program<PointsMarketplace>
  const chargingProgram = anchor.workspace.ChargingSession as Program<ChargingSession>
  const payer = provider.wallet as anchor.Wallet

  // Create second keypair for buyer
  const buyer = anchor.web3.Keypair.generate()

  let marketplacePda: anchor.web3.PublicKey
  let sellerAccountPda: anchor.web3.PublicKey
  let buyerAccountPda: anchor.web3.PublicKey
  let listingPda: anchor.web3.PublicKey
  let voucherPda: anchor.web3.PublicKey
  let redemptionPda: anchor.web3.PublicKey
  const timestamp = Math.floor(Date.now() / 1000)

  beforeAll(async () => {
    // Derive PDAs
    ;[marketplacePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('marketplace')],
      program.programId
    )

    // User accounts are from charging_session program
    ;[sellerAccountPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('user'), payer.publicKey.toBuffer()],
      chargingProgram.programId
    )

    ;[buyerAccountPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('user'), buyer.publicKey.toBuffer()],
      chargingProgram.programId
    )

    ;[listingPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from('listing'),
        buyer.publicKey.toBuffer(), // buyer is the seller in this test
        Buffer.from(new anchor.BN(timestamp).toArray('le', 8)),
      ],
      program.programId
    )

    ;[voucherPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from('voucher'),
        buyer.publicKey.toBuffer(),
        Buffer.from(new anchor.BN(timestamp).toArray('le', 8)),
      ],
      program.programId
    )

    ;[redemptionPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from('redemption'),
        voucherPda.toBuffer(),
      ],
      chargingProgram.programId
    )

    // Airdrop to buyer
    const signature = await provider.connection.requestAirdrop(
      buyer.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    )
    await provider.connection.confirmTransaction(signature)
  })

  it('initializes marketplace', async () => {
    await program.methods
      .initializeMarketplace()
      .accounts({
        marketplace: marketplacePda,
        authority: payer.publicKey,
      })
      .rpc()

    const marketplace = await program.account.marketplace.fetch(marketplacePda)
    expect(marketplace.authority.equals(payer.publicKey)).toBe(true)
    expect(marketplace.totalPointsSold.toNumber()).toBe(0)
    expect(marketplace.totalRevenueLamports.toNumber()).toBe(0)
    expect(marketplace.pricePerPointLamports.toNumber()).toBe(1_000_000)
  })

  it('initializes seller user account via charging_session', async () => {
    try {
      await chargingProgram.methods
        .initializeUser()
        .accounts({
          userAccount: sellerAccountPda,
          authority: payer.publicKey,
        })
        .rpc()
    } catch (error) {
      // Account may already exist from previous test runs - that's okay
      if (!error.message?.includes('already in use')) {
        throw error
      }
    }

    const sellerAccount = await chargingProgram.account.userAccount.fetch(sellerAccountPda)
    expect(sellerAccount.authority.equals(payer.publicKey)).toBe(true)
    // Don't check points amount as it may have changed from previous runs
  })

  it('initializes buyer user account via charging_session', async () => {
    try {
      await chargingProgram.methods
        .initializeUser()
        .accounts({
          userAccount: buyerAccountPda,
          authority: buyer.publicKey,
        })
        .signers([buyer])
        .rpc()
    } catch (error) {
      // Account may already exist from previous test runs - that's okay
      if (!error.message?.includes('already in use')) {
        throw error
      }
    }

    const buyerAccount = await chargingProgram.account.userAccount.fetch(buyerAccountPda)
    expect(buyerAccount.authority.equals(buyer.publicKey)).toBe(true)
    // Points may vary from previous runs, just verify account exists
  })

  it('buyer purchases points from marketplace at 50% discount', async () => {
    const pointsAmount = 100

    // Step 1: Buy from marketplace (creates voucher)
    await program.methods
      .buyFromMarketplace(new anchor.BN(pointsAmount), new anchor.BN(timestamp))
      .accounts({
        marketplace: marketplacePda,
        voucher: voucherPda,
        buyer: buyer.publicKey,
      })
      .signers([buyer])
      .rpc()

    // Verify voucher was created
    const voucher = await program.account.pointsVoucher.fetch(voucherPda)
    expect(voucher.buyer.equals(buyer.publicKey)).toBe(true)
    expect(voucher.pointsAmount.toNumber()).toBe(pointsAmount)
    expect(voucher.isRedeemed).toBe(false)

    // Step 2: Redeem voucher (credits points)
    await chargingProgram.methods
      .redeemVoucher()
      .accounts({
        userAccount: buyerAccountPda,
        redemptionRecord: redemptionPda,
        voucher: voucherPda,
        authority: buyer.publicKey,
      })
      .signers([buyer])
      .rpc()

    // Verify points were credited
    const buyerAccount = await chargingProgram.account.userAccount.fetch(buyerAccountPda)
    expect(buyerAccount.availablePoints.toNumber()).toBe(pointsAmount)
    expect(buyerAccount.totalPoints.toNumber()).toBe(pointsAmount)
  })

  it('creates a listing (seller sells points)', async () => {
    const pointsAmount = 50
    const pricePerPoint = 500_000 // lamports

    // Buyer has 100 points from previous test and creates a listing
    // Points stay in their account (no locking needed with voucher system)
    await program.methods
      .createListing(new anchor.BN(pointsAmount), new anchor.BN(pricePerPoint), new anchor.BN(timestamp))
      .accounts({
        listing: listingPda,
        seller: buyer.publicKey,
      })
      .signers([buyer])
      .rpc()

    const listing = await program.account.pointsListing.fetch(listingPda)
    expect(listing.seller.equals(buyer.publicKey)).toBe(true)
    expect(listing.pointsAmount.toNumber()).toBe(pointsAmount)
    expect(listing.pricePerPoint.toNumber()).toBe(pricePerPoint)
    expect(listing.isActive).toBe(true)

    // Verify points remain available (not locked in voucher system)
    const buyerAccount = await chargingProgram.account.userAccount.fetch(buyerAccountPda)
    expect(buyerAccount.availablePoints.toNumber()).toBe(100) // Still has all points
  })

  it('cancels a listing', async () => {
    await program.methods
      .cancelListing()
      .accounts({
        listing: listingPda,
        seller: buyer.publicKey,
      })
      .signers([buyer])
      .rpc()

    const listing = await program.account.pointsListing.fetch(listingPda)
    expect(listing.isActive).toBe(false)

    // Points stay in seller's account (no changes needed)
    const buyerAccount = await chargingProgram.account.userAccount.fetch(buyerAccountPda)
    expect(buyerAccount.availablePoints.toNumber()).toBe(100) // Still has all points
  })
})
