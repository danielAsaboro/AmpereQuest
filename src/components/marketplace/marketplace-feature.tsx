'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { motion } from 'framer-motion'
import { ShoppingCart, TrendingUp, Users, Plus, X, Wallet, QrCode } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useMarketplace, useMarketplaceUser, usePointsMarketplaceProgram } from './marketplace-data-access'
import { SolanaPayModal } from './solana-pay-modal'
import { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'

export function MarketplaceFeature() {
  const { publicKey, connected } = useWallet()
  const { listings } = usePointsMarketplaceProgram()
  const { marketplaceQuery, marketplacePda, initializeMarketplace } = useMarketplace()
  const [showCreateListing, setShowCreateListing] = useState(false)
  const [showBuyModal, setShowBuyModal] = useState(false)
  const [showSolanaPayModal, setShowSolanaPayModal] = useState(false)
  const [buyAmount, setBuyAmount] = useState('')
  const [listingAmount, setListingAmount] = useState('')
  const [listingPrice, setListingPrice] = useState('')

  const userHooks = publicKey ? useMarketplaceUser({ owner: publicKey }) : null

  const activeListings = listings.data?.filter((listing) => listing.account.isActive) || []
  const marketplace = marketplaceQuery.data
  const userAccount = userHooks?.userAccountQuery.data

  const handleBuyFromMarketplace = async () => {
    if (!userHooks || !buyAmount) return
    await userHooks.buyFromMarketplace.mutateAsync(parseInt(buyAmount))
    setBuyAmount('')
    setShowBuyModal(false)
  }

  const handleCreateListing = async () => {
    if (!userHooks || !listingAmount || !listingPrice) return
    await userHooks.createListing.mutateAsync({
      pointsAmount: parseInt(listingAmount),
      pricePerPoint: parseInt(listingPrice),
    })
    setListingAmount('')
    setListingPrice('')
    setShowCreateListing(false)
  }

  const handleBuyFromListing = async (listingPubkey: PublicKey, sellerPubkey: PublicKey) => {
    if (!userHooks) return
    await userHooks.buyFromListing.mutateAsync({
      listingPda: listingPubkey,
      sellerPubkey: sellerPubkey,
    })
  }

  const handleCancelListing = async (listingPubkey: PublicKey) => {
    if (!userHooks) return
    await userHooks.cancelListing.mutateAsync(listingPubkey)
  }

  if (!connected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Wallet Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Please connect your Solana wallet to access the marketplace.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!marketplace) {
    return (
      <div className="space-y-6">
        <h1 className="text-4xl font-bold mb-2">Points Marketplace</h1>
        <Alert>
          <AlertDescription>
            The marketplace needs to be initialized first.
            <Button
              onClick={() => publicKey && initializeMarketplace.mutateAsync(publicKey)}
              className="ml-4"
              disabled={initializeMarketplace.isPending}
            >
              Initialize Marketplace
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const pricePerPointSol = (marketplace.pricePerPointLamports.toNumber() / LAMPORTS_PER_SOL).toFixed(6)
  const discountedPrice = (marketplace.pricePerPointLamports.toNumber() * 0.5 / LAMPORTS_PER_SOL).toFixed(6)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Points Marketplace</h1>
        <p className="text-muted-foreground">
          Buy charging points at 50% discount or sell your earned points
        </p>
      </div>

      {/* User Stats */}
      {userAccount && (
        <div className="grid gap-4 md:grid-cols-3">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available Points</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {userAccount.availablePoints.toString()}
                </div>
                <p className="text-xs text-muted-foreground">Ready to sell or use</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Points</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {userAccount.totalPoints.toString()}
                </div>
                <p className="text-xs text-muted-foreground">Lifetime earned</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Marketplace Price</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{discountedPrice} SOL</div>
                <p className="text-xs text-muted-foreground">
                  50% off (was {pricePerPointSol} SOL)
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Buy from Marketplace</CardTitle>
            <CardDescription>Purchase points at 50% discount (Web3 users)</CardDescription>
          </CardHeader>
          <CardContent>
            {showBuyModal ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="buyAmount">Points Amount</Label>
                  <Input
                    id="buyAmount"
                    type="number"
                    value={buyAmount}
                    onChange={(e) => setBuyAmount(e.target.value)}
                    placeholder="Enter amount"
                  />
                  {buyAmount && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Cost: {(parseInt(buyAmount) * parseFloat(discountedPrice)).toFixed(4)} SOL
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleBuyFromMarketplace} disabled={!buyAmount}>
                    Buy Points
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowSolanaPayModal(true)
                      setShowBuyModal(false)
                    }}
                    disabled={!buyAmount}
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    Pay with QR
                  </Button>
                  <Button variant="outline" onClick={() => setShowBuyModal(false)}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={() => setShowBuyModal(true)} className="w-full">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Buy Points (50% Off)
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sell Your Points</CardTitle>
            <CardDescription>Create a listing for other users to buy</CardDescription>
          </CardHeader>
          <CardContent>
            {showCreateListing ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="listingAmount">Points to Sell</Label>
                  <Input
                    id="listingAmount"
                    type="number"
                    value={listingAmount}
                    onChange={(e) => setListingAmount(e.target.value)}
                    placeholder="Amount"
                  />
                </div>
                <div>
                  <Label htmlFor="listingPrice">Price per Point (lamports)</Label>
                  <Input
                    id="listingPrice"
                    type="number"
                    value={listingPrice}
                    onChange={(e) => setListingPrice(e.target.value)}
                    placeholder="Price"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreateListing} disabled={!listingAmount || !listingPrice}>
                    Create Listing
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateListing(false)}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={() => setShowCreateListing(true)} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Create Listing
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Listings */}
      <Card>
        <CardHeader>
          <CardTitle>Active Listings</CardTitle>
          <CardDescription>Buy points directly from other users</CardDescription>
        </CardHeader>
        <CardContent>
          {activeListings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No active listings at the moment</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeListings.map((listing) => {
                const isOwnListing = publicKey?.equals(listing.account.seller)
                const totalPrice = (
                  (listing.account.pricePerPoint.toNumber() *
                    listing.account.pointsAmount.toNumber()) /
                  LAMPORTS_PER_SOL
                ).toFixed(4)

                return (
                  <Card key={listing.publicKey.toString()} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">
                          {listing.account.pointsAmount.toString()} Points
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {totalPrice} SOL total
                        </div>
                      </div>
                      <div className="text-right">
                        {isOwnListing ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancelListing(listing.publicKey)}
                          >
                            Cancel
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() =>
                              handleBuyFromListing(listing.publicKey, listing.account.seller)
                            }
                          >
                            Buy
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Solana Pay Modal */}
      {showSolanaPayModal && marketplace && buyAmount && (
        <SolanaPayModal
          open={showSolanaPayModal}
          onClose={() => {
            setShowSolanaPayModal(false)
            setBuyAmount('')
          }}
          marketplaceAddress={marketplacePda}
          pointsAmount={parseInt(buyAmount)}
          pricePerPointLamports={marketplace.pricePerPointLamports.toNumber()}
          onSuccess={() => {
            userHooks?.userAccountQuery.refetch()
          }}
        />
      )}
    </div>
  )
}
