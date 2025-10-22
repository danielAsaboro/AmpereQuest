#!/usr/bin/env ts-node

/**
 * Demo Initialization Script
 *
 * Initializes all required program accounts for the AmpereQuest demo:
 * - Marketplace (points_marketplace program)
 * - Game Engine Authority (game_engine program)
 * - User Account for demo wallet (charging_session program)
 *
 * This script is idempotent - it can be safely re-run without errors.
 */

import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { PointsMarketplace } from '../target/types/points_marketplace'
import { ChargingSession } from '../target/types/charging_session'
import { GameEngine } from '../target/types/game_engine'

// ANSI color codes for pretty output
const GREEN = '\x1b[32m'
const BLUE = '\x1b[34m'
const YELLOW = '\x1b[33m'
const RED = '\x1b[31m'
const RESET = '\x1b[0m'
const BOLD = '\x1b[1m'

function success(msg: string) {
  console.log(`${GREEN}✓${RESET} ${msg}`)
}

function info(msg: string) {
  console.log(`${BLUE}ℹ${RESET} ${msg}`)
}

function warning(msg: string) {
  console.log(`${YELLOW}⚠${RESET} ${msg}`)
}

function error(msg: string) {
  console.log(`${RED}✗${RESET} ${msg}`)
}

function header(msg: string) {
  console.log(`\n${BOLD}${BLUE}==>${RESET} ${BOLD}${msg}${RESET}`)
}

async function main() {
  console.log(`\n${BOLD}${GREEN}════════════════════════════════════════${RESET}`)
  console.log(`${BOLD}${GREEN}  AmpereQuest Demo Initialization${RESET}`)
  console.log(`${BOLD}${GREEN}════════════════════════════════════════${RESET}\n`)

  // Set up Anchor provider
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)

  const marketplaceProgram = anchor.workspace.PointsMarketplace as Program<PointsMarketplace>
  const chargingProgram = anchor.workspace.ChargingSession as Program<ChargingSession>
  const gameEngineProgram = anchor.workspace.GameEngine as Program<GameEngine>
  const wallet = provider.wallet as anchor.Wallet

  info(`Wallet: ${wallet.publicKey.toBase58()}`)
  try {
    const balance = await provider.connection.getBalance(wallet.publicKey)
    info(`Balance: ${balance / anchor.web3.LAMPORTS_PER_SOL} SOL\n`)
  } catch (err: any) {
    warning(`Could not fetch balance: ${err.message}\n`)
  }

  let successCount = 0
  let skippedCount = 0
  let failedCount = 0

  // ========================================
  // 1. Initialize Marketplace
  // ========================================
  header('1. Initializing Marketplace')

  const [marketplacePda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from('marketplace')],
    marketplaceProgram.programId
  )

  info(`Marketplace PDA: ${marketplacePda.toBase58()}`)

  try {
    await marketplaceProgram.methods
      .initializeMarketplace()
      .accounts({
        marketplace: marketplacePda,
        authority: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc()

    success('Marketplace initialized successfully')

    // Fetch and display marketplace info
    const marketplace = await marketplaceProgram.account.marketplace.fetch(marketplacePda)
    info(`  Price per point: ${marketplace.pricePerPointLamports.toNumber() / anchor.web3.LAMPORTS_PER_SOL} SOL`)
    successCount++
  } catch (err: any) {
    if (err.message?.includes('already in use')) {
      warning('Marketplace already initialized (skipping)')
      skippedCount++
    } else {
      error(`Failed to initialize marketplace: ${err.message}`)
      failedCount++
    }
  }

  // ========================================
  // 2. Game Engine Authority (No Init Required)
  // ========================================
  header('2. Game Engine Authority')

  const [gameEngineAuthorityPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from('game_engine')],
    gameEngineProgram.programId
  )

  info(`Game Engine Authority PDA: ${gameEngineAuthorityPda.toBase58()}`)
  info('(No initialization required - PDA used for CPI signing)')

  // ========================================
  // 3. Initialize User Account for Demo Wallet
  // ========================================
  header('3. Initializing User Account')

  const [userAccountPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from('user'), wallet.publicKey.toBuffer()],
    chargingProgram.programId
  )

  info(`User Account PDA: ${userAccountPda.toBase58()}`)

  try {
    await chargingProgram.methods
      .initializeUser()
      .accounts({
        userAccount: userAccountPda,
        authority: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc()

    success('User Account initialized successfully')

    // Fetch and display user account info
    const userAccount = await chargingProgram.account.userAccount.fetch(userAccountPda)
    info(`  Total points: ${userAccount.totalPoints.toNumber()}`)
    info(`  Available points: ${userAccount.availablePoints.toNumber()}`)
    successCount++
  } catch (err: any) {
    if (err.message?.includes('already in use')) {
      warning('User Account already initialized (skipping)')

      // Fetch and display existing account info
      try {
        const userAccount = await chargingProgram.account.userAccount.fetch(userAccountPda)
        info(`  Total points: ${userAccount.totalPoints.toNumber()}`)
        info(`  Available points: ${userAccount.availablePoints.toNumber()}`)
      } catch (fetchErr) {
        // Ignore fetch errors
      }

      skippedCount++
    } else {
      error(`Failed to initialize user account: ${err.message}`)
      failedCount++
    }
  }

  // ========================================
  // 4. Virtual Plot Treasury (PDA-based, auto-initialized)
  // ========================================
  header('4. Virtual Plot Treasury')

  const virtualPlotProgram = anchor.workspace.VirtualPlot
  const [treasuryPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from('treasury')],
    virtualPlotProgram.programId
  )

  info(`Treasury PDA: ${treasuryPda.toBase58()}`)
  info(`(Auto-initialized on first plot purchase)`)

  // ========================================
  // Summary
  // ========================================
  console.log(`\n${BOLD}${GREEN}════════════════════════════════════════${RESET}`)
  console.log(`${BOLD}  Initialization Summary${RESET}`)
  console.log(`${BOLD}${GREEN}════════════════════════════════════════${RESET}\n`)

  console.log(`${GREEN}✓ Successful:${RESET} ${successCount}`)
  console.log(`${YELLOW}⚠ Skipped (already initialized):${RESET} ${skippedCount}`)

  if (failedCount > 0) {
    console.log(`${RED}✗ Failed:${RESET} ${failedCount}`)
    console.log(`\n${RED}Some initializations failed. Please check the errors above.${RESET}\n`)
    process.exit(1)
  } else {
    console.log(`\n${GREEN}${BOLD}✨ Demo environment is fully initialized! ✨${RESET}\n`)
    console.log('You can now:')
    console.log('  • Open http://localhost:3000 in your browser')
    console.log('  • Navigate to "The Pulse" to see charging sessions')
    console.log('  • Navigate to "The Empire" to build virtual networks')
    console.log('  • Navigate to "Marketplace" to trade points')
    console.log('')
  }
}

main()
  .then(() => {
    // Don't exit immediately - let output display
  })
  .catch((err) => {
    console.error(`\n${RED}${BOLD}Fatal error:${RESET} ${err.message}`)
    console.error(err)
    process.exit(1)
  })
