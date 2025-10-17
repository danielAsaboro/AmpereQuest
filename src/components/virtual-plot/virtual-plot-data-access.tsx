'use client'

import { getVirtualPlotProgram, getVirtualPlotProgramId } from '@project/anchor'
import { useConnection } from '@solana/wallet-adapter-react'
import { Cluster, PublicKey, SystemProgram } from '@solana/web3.js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../use-transaction-toast'
import { toast } from 'sonner'
import BN from 'bn.js'

export function useVirtualPlotProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getVirtualPlotProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getVirtualPlotProgram(provider, programId), [provider, programId])

  const plots = useQuery({
    queryKey: ['virtual-plot', 'all', { cluster }],
    queryFn: () => program.account.virtualPlot.all(),
  })

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  return {
    program,
    programId,
    plots,
    getProgramAccount,
  }
}

export function useVirtualPlotActions({ owner, treasury }: { owner: PublicKey; treasury?: PublicKey }) {
  const { cluster } = useCluster()
  const { program } = useVirtualPlotProgram()
  const transactionToast = useTransactionToast()
  const queryClient = useQueryClient()

  // Default treasury if not provided
  const treasuryPubkey = treasury || owner

  const purchasePlot = useMutation({
    mutationKey: ['virtual-plot', 'purchase', { cluster }],
    mutationFn: async ({
      plotId,
      latitude,
      longitude,
      priceLamports,
    }: {
      plotId: number
      latitude: number
      longitude: number
      priceLamports: number
    }) => {
      const [plotPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('plot'), Buffer.from(new BN(plotId).toArray('le', 4))],
        program.programId
      )

      return program.methods
        .purchasePlot(
          plotId,
          Math.floor(latitude * 1_000_000), // Convert to i32 with precision
          Math.floor(longitude * 1_000_000),
          new BN(priceLamports)
        )
        .accounts({
          buyer: owner,
        })
        .rpc()
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      toast.success('Plot purchased!')
      return queryClient.invalidateQueries({
        queryKey: ['virtual-plot', 'all', { cluster }],
      })
    },
    onError: (error) => {
      toast.error(`Failed to purchase plot: ${error}`)
    },
  })

  const installCharger = useMutation({
    mutationKey: ['virtual-plot', 'install-charger', { cluster }],
    mutationFn: async ({
      plotId,
      chargerPowerKw,
      installationCost,
    }: {
      plotId: number
      chargerPowerKw: number
      installationCost: number
    }) => {
      const [plotPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('plot'), Buffer.from(new BN(plotId).toArray('le', 4))],
        program.programId
      )

      return program.methods
        .installCharger(chargerPowerKw, new BN(installationCost))
        .accounts({
          owner: owner,
        })
        .rpc()
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      toast.success('Charger installed!')
      return queryClient.invalidateQueries({
        queryKey: ['virtual-plot', 'all', { cluster }],
      })
    },
    onError: (error) => {
      toast.error(`Failed to install charger: ${error}`)
    },
  })

  const upgradeCharger = useMutation({
    mutationKey: ['virtual-plot', 'upgrade-charger', { cluster }],
    mutationFn: async ({
      plotId,
      newPowerKw,
      upgradeCost,
    }: {
      plotId: number
      newPowerKw: number
      upgradeCost: number
    }) => {
      const [plotPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('plot'), Buffer.from(new BN(plotId).toArray('le', 4))],
        program.programId
      )

      return program.methods
        .upgradeCharger(newPowerKw, new BN(upgradeCost))
        .accounts({
          owner: owner,
        })
        .rpc()
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      toast.success('Charger upgraded!')
      return queryClient.invalidateQueries({
        queryKey: ['virtual-plot', 'all', { cluster }],
      })
    },
    onError: (error) => {
      toast.error(`Failed to upgrade charger: ${error}`)
    },
  })

  const withdrawRevenue = useMutation({
    mutationKey: ['virtual-plot', 'withdraw-revenue', { cluster }],
    mutationFn: async ({ plotId, amount }: { plotId: number; amount: number }) => {
      const [plotPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('plot'), Buffer.from(new BN(plotId).toArray('le', 4))],
        program.programId
      )

      return program.methods
        .withdrawRevenue(new BN(amount))
        .accounts({
          owner: owner,
        })
        .rpc()
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      toast.success('Revenue withdrawn!')
      return queryClient.invalidateQueries({
        queryKey: ['virtual-plot', 'all', { cluster }],
      })
    },
    onError: (error) => {
      toast.error(`Failed to withdraw revenue: ${error}`)
    },
  })

  return {
    purchasePlot,
    installCharger,
    upgradeCharger,
    withdrawRevenue,
  }
}

export function useVirtualPlot({ plotId }: { plotId: number }) {
  const { cluster } = useCluster()
  const { program } = useVirtualPlotProgram()

  const plotPda = useMemo(() => {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from('plot'), Buffer.from(new BN(plotId).toArray('le', 4))],
      program.programId
    )
    return pda
  }, [plotId, program.programId])

  const plotQuery = useQuery({
    queryKey: ['virtual-plot', 'fetch', { cluster, plotId }],
    queryFn: async () => {
      try {
        return await program.account.virtualPlot.fetch(plotPda)
      } catch {
        return null
      }
    },
  })

  return {
    plotPda,
    plotQuery,
  }
}
