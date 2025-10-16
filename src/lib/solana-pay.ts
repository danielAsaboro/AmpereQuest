import { createQR, encodeURL, TransactionRequestURLFields, findReference, FindReferenceError } from '@solana/pay'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import BigNumber from 'bignumber.js'

export interface PaymentRequest {
  recipient: PublicKey
  amount: BigNumber
  splToken?: PublicKey
  reference: PublicKey
  label: string
  message: string
  memo?: string
}

/**
 * Generate a Solana Pay QR code for a payment
 */
export function generatePaymentQR(request: PaymentRequest): { qr: ReturnType<typeof createQR>, url: URL } {
  const url: URL = encodeURL({
    recipient: request.recipient,
    amount: request.amount,
    splToken: request.splToken,
    reference: request.reference,
    label: request.label,
    message: request.message,
    memo: request.memo,
  })

  const qr = createQR(url, 400, 'transparent')

  return { qr, url }
}

/**
 * Wait for a payment to be confirmed
 */
export async function waitForPayment(
  connection: Connection,
  reference: PublicKey,
  options: {
    timeout?: number // milliseconds
    finality?: 'finalized' | 'confirmed'
  } = {}
): Promise<string> {
  const { timeout = 60000, finality = 'confirmed' } = options

  const startTime = Date.now()

  while (Date.now() - startTime < timeout) {
    try {
      const signature = await findReference(connection, reference, { finality })
      return signature.signature
    } catch (error) {
      if (error instanceof FindReferenceError) {
        // Payment not found yet, wait and retry
        await new Promise((resolve) => setTimeout(resolve, 1000))
        continue
      }
      throw error
    }
  }

  throw new Error('Payment timeout')
}

/**
 * Create a payment request for marketplace point purchase
 */
export function createMarketplacePaymentRequest(
  marketplaceAddress: PublicKey,
  pointsAmount: number,
  pricePerPointLamports: number,
  discount: number = 0.5 // 50% discount for Web3 users
): PaymentRequest {
  const totalLamports = pointsAmount * pricePerPointLamports * discount
  const reference = Keypair.generate().publicKey

  return {
    recipient: marketplaceAddress,
    amount: new BigNumber(totalLamports).dividedBy(1e9), // Convert to SOL
    reference,
    label: 'AmpereQuest Marketplace',
    message: `Purchase ${pointsAmount} charging points`,
    memo: `AMPERE_POINTS_${pointsAmount}`,
  }
}

/**
 * Create a payment request for virtual plot purchase
 */
export function createPlotPurchasePaymentRequest(
  treasuryAddress: PublicKey,
  plotId: number,
  priceLamports: number
): PaymentRequest {
  const reference = Keypair.generate().publicKey

  return {
    recipient: treasuryAddress,
    amount: new BigNumber(priceLamports).dividedBy(1e9), // Convert to SOL
    reference,
    label: 'AmpereQuest Empire',
    message: `Purchase Plot #${plotId}`,
    memo: `AMPERE_PLOT_${plotId}`,
  }
}
