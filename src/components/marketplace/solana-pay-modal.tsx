'use client'

import { useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { generatePaymentQR, createMarketplacePaymentRequest, waitForPayment } from '@/lib/solana-pay'
import { PublicKey } from '@solana/web3.js'
import { useConnection } from '@solana/wallet-adapter-react'
import { toast } from 'sonner'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

interface SolanaPayModalProps {
  open: boolean
  onClose: () => void
  marketplaceAddress: PublicKey
  pointsAmount: number
  pricePerPointLamports: number
  onSuccess: () => void
}

export function SolanaPayModal({
  open,
  onClose,
  marketplaceAddress,
  pointsAmount,
  pricePerPointLamports,
  onSuccess,
}: SolanaPayModalProps) {
  const qrRef = useRef<HTMLDivElement>(null)
  const { connection } = useConnection()
  const [status, setStatus] = useState<'pending' | 'waiting' | 'confirmed' | 'error'>('pending')
  const [reference, setReference] = useState<PublicKey | null>(null)

  useEffect(() => {
    if (!open || !qrRef.current) return

    // Generate payment request
    const paymentRequest = createMarketplacePaymentRequest(
      marketplaceAddress,
      pointsAmount,
      pricePerPointLamports
    )

    setReference(paymentRequest.reference)

    // Generate QR code
    const { qr } = generatePaymentQR(paymentRequest)

    // Clear previous QR code
    qrRef.current.innerHTML = ''
    qr.append(qrRef.current)

    // Wait for payment
    setStatus('waiting')
    waitForPayment(connection, paymentRequest.reference, { timeout: 120000 })
      .then((signature) => {
        setStatus('confirmed')
        toast.success('Payment confirmed!')
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 2000)
      })
      .catch((error) => {
        setStatus('error')
        toast.error('Payment failed or timed out')
        console.error('Payment error:', error)
      })
  }, [open, marketplaceAddress, pointsAmount, pricePerPointLamports, connection, onSuccess, onClose])

  const handleClose = () => {
    if (status === 'waiting') {
      const confirm = window.confirm('Payment is still pending. Are you sure you want to close?')
      if (!confirm) return
    }
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan to Pay with Solana Pay</DialogTitle>
          <DialogDescription>
            Scan this QR code with your Solana mobile wallet to complete the purchase
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4">
          {/* QR Code */}
          <div
            ref={qrRef}
            className="border-4 border-gray-200 dark:border-gray-700 rounded-lg p-4"
          />

          {/* Status */}
          <div className="text-center">
            {status === 'waiting' && (
              <div className="flex items-center gap-2 text-blue-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Waiting for payment...</span>
              </div>
            )}
            {status === 'confirmed' && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span>Payment confirmed!</span>
              </div>
            )}
            {status === 'error' && (
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="w-5 h-5" />
                <span>Payment failed</span>
              </div>
            )}
          </div>

          {/* Payment details */}
          <div className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Points:</span>
              <span className="font-semibold">{pointsAmount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price:</span>
              <span className="font-semibold">
                {((pointsAmount * pricePerPointLamports * 0.5) / 1e9).toFixed(4)} SOL
              </span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>Discount:</span>
              <span className="font-semibold">50% off</span>
            </div>
          </div>

          <Button variant="outline" onClick={handleClose} className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
