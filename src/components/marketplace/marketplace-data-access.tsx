'use client'

import { getPointsMarketplaceProgram, getPointsMarketplaceProgramId } from '@project/anchor'
import { useConnection } from '@solana/wallet-adapter-react'
import { Cluster, PublicKey, SystemProgram } from '@solana/web3.js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../use-transaction-toast'
import { toast } from 'sonner'
import BN from 'bn.js'

export function usePointsMarketplaceProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getPointsMarketplaceProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getPointsMarketplaceProgram(provider, programId), [provider, programId])

  const listings = useQuery({
    queryKey: ['points-marketplace', 'listings', { cluster }],
    queryFn: () => program.account.pointsListing.all(),
  })

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  return {
    program,
    programId,
    listings,
    getProgramAccount,
  }
}

export function useMarketplace() {
  const { cluster } = useCluster()
  const { program } = usePointsMarketplaceProgram()
  const transactionToast = useTransactionToast()
  const queryClient = useQueryClient()

  // Marketplace PDA
  const marketplacePda = useMemo(() => {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from('marketplace')],
      program.programId
    )
    return pda
  }, [program.programId])

  const marketplaceQuery = useQuery({
    queryKey: ['marketplace', 'fetch', { cluster }],
    queryFn: async () => {
      try {
        return await program.account.marketplace.fetch(marketplacePda)
      } catch {
        return null
      }
    },
  })

  const initializeMarketplace = useMutation({
    mutationKey: ['marketplace', 'initialize', { cluster }],
    mutationFn: async (authority: PublicKey) => {
      return program.methods
        .initializeMarketplace()
        .accounts({
          marketplace: marketplacePda,
          authority,
          systemProgram: SystemProgram.programId,
        })
        .rpc()
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      toast.success('Marketplace initialized!')
      return marketplaceQuery.refetch()
    },
    onError: (error) => {
      toast.error(`Failed to initialize marketplace: ${error}`)
    },
  })

  return {
    marketplacePda,
    marketplaceQuery,
    initializeMarketplace,
  }
}

export function useMarketplaceUser({ owner }: { owner: PublicKey }) {
  const { cluster } = useCluster()
  const { program, listings } = usePointsMarketplaceProgram()
  const { marketplacePda } = useMarketplace()
  const transactionToast = useTransactionToast()
  const queryClient = useQueryClient()

  // User account PDA (same as charging session)
  const userAccountPda = useMemo(() => {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from('user'), owner.toBuffer()],
      program.programId
    )
    return pda
  }, [owner, program.programId])

  const userAccountQuery = useQuery({
    queryKey: ['marketplace-user-account', 'fetch', { cluster, owner: owner.toString() }],
    queryFn: async () => {
      try {
        return await program.account.userAccount.fetch(userAccountPda)
      } catch {
        return null
      }
    },
  })

  const createListing = useMutation({
    mutationKey: ['marketplace', 'create-listing', { cluster }],
    mutationFn: async ({
      pointsAmount,
      pricePerPoint,
    }: {
      pointsAmount: number
      pricePerPoint: number
    }) => {
      const timestamp = Math.floor(Date.now() / 1000)
      const [listingPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('listing'),
          owner.toBuffer(),
          Buffer.from(new BN(timestamp).toArray('le', 8)),
        ],
        program.programId
      )

      return program.methods
        .createListing(new BN(pointsAmount), new BN(pricePerPoint), new BN(timestamp))
        .accounts({
          listing: listingPda,
          sellerAccount: userAccountPda,
          seller: owner,
          systemProgram: SystemProgram.programId,
        })
        .rpc()
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      toast.success('Listing created!')
      return Promise.all([
        userAccountQuery.refetch(),
        queryClient.invalidateQueries({
          queryKey: ['points-marketplace', 'listings', { cluster }],
        }),
      ])
    },
    onError: (error) => {
      toast.error(`Failed to create listing: ${error}`)
    },
  })

  const buyFromMarketplace = useMutation({
    mutationKey: ['marketplace', 'buy-from-marketplace', { cluster }],
    mutationFn: async (pointsAmount: number) => {
      return program.methods
        .buyFromMarketplace(new BN(pointsAmount))
        .accounts({
          marketplace: marketplacePda,
          buyerAccount: userAccountPda,
          buyer: owner,
          systemProgram: SystemProgram.programId,
        })
        .rpc()
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      toast.success('Points purchased at 50% discount!')
      return userAccountQuery.refetch()
    },
    onError: (error) => {
      toast.error(`Failed to buy points: ${error}`)
    },
  })

  const buyFromListing = useMutation({
    mutationKey: ['marketplace', 'buy-from-listing', { cluster }],
    mutationFn: async ({
      listingPda,
      sellerPubkey,
    }: {
      listingPda: PublicKey
      sellerPubkey: PublicKey
    }) => {
      return program.methods
        .buyFromListing()
        .accounts({
          listing: listingPda,
          buyerAccount: userAccountPda,
          buyer: owner,
          seller: sellerPubkey,
          systemProgram: SystemProgram.programId,
        })
        .rpc()
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      toast.success('Points purchased from listing!')
      return Promise.all([
        userAccountQuery.refetch(),
        queryClient.invalidateQueries({
          queryKey: ['points-marketplace', 'listings', { cluster }],
        }),
      ])
    },
    onError: (error) => {
      toast.error(`Failed to buy from listing: ${error}`)
    },
  })

  const cancelListing = useMutation({
    mutationKey: ['marketplace', 'cancel-listing', { cluster }],
    mutationFn: async (listingPda: PublicKey) => {
      return program.methods
        .cancelListing()
        .accounts({
          listing: listingPda,
          sellerAccount: userAccountPda,
          seller: owner,
        })
        .rpc()
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      toast.success('Listing cancelled!')
      return Promise.all([
        userAccountQuery.refetch(),
        queryClient.invalidateQueries({
          queryKey: ['points-marketplace', 'listings', { cluster }],
        }),
      ])
    },
    onError: (error) => {
      toast.error(`Failed to cancel listing: ${error}`)
    },
  })

  return {
    userAccountPda,
    userAccountQuery,
    createListing,
    buyFromMarketplace,
    buyFromListing,
    cancelListing,
  }
}
