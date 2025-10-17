'use client'

import { getChargingSessionProgram, getChargingSessionProgramId } from '@project/anchor'
import { useConnection } from '@solana/wallet-adapter-react'
import { Cluster, PublicKey } from '@solana/web3.js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../use-transaction-toast'
import { toast } from 'sonner'
import BN from 'bn.js'

export function useChargingSessionProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getChargingSessionProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getChargingSessionProgram(provider, programId), [provider, programId])

  const accounts = useQuery({
    queryKey: ['charging-session', 'all', { cluster }],
    queryFn: () => program.account.chargingSession.all(),
  })

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
  }
}

export function useChargingSessionProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const { program, accounts } = useChargingSessionProgram()
  const queryClient = useQueryClient()

  const accountQuery = useQuery({
    queryKey: ['charging-session', 'fetch', { cluster, account }],
    queryFn: () => program.account.chargingSession.fetch(account),
  })

  const updateSession = useMutation({
    mutationKey: ['charging-session', 'update', { cluster, account }],
    mutationFn: async (energyWhIncrement: number) => {
      return program.methods
        .updateSession(new BN(energyWhIncrement))
        .accounts({ session: account })
        .rpc()
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      return Promise.all([
        accountQuery.refetch(),
        queryClient.invalidateQueries({
          queryKey: ['charging-session', 'all', { cluster }],
        }),
      ])
    },
    onError: (error) => {
      toast.error(`Failed to update session: ${error}`)
    },
  })

  const endSession = useMutation({
    mutationKey: ['charging-session', 'end', { cluster, account }],
    mutationFn: async (userAccountPda: PublicKey) => {
      return program.methods
        .endSession()
        .accounts({
          session: account,
          userAccount: userAccountPda,
        })
        .rpc()
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      toast.success('Session ended successfully!')
      return Promise.all([
        accountQuery.refetch(),
        queryClient.invalidateQueries({
          queryKey: ['charging-session', 'all', { cluster }],
        }),
      ])
    },
    onError: (error) => {
      toast.error(`Failed to end session: ${error}`)
    },
  })

  return {
    accountQuery,
    updateSession,
    endSession,
  }
}

export function useUserAccount({ owner }: { owner: PublicKey }) {
  const { cluster } = useCluster()
  const { program } = useChargingSessionProgram()
  const transactionToast = useTransactionToast()
  const queryClient = useQueryClient()

  // Derive the user account PDA
  const userAccountPda = useMemo(() => {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from('user'), owner.toBuffer()],
      program.programId
    )
    return pda
  }, [owner, program.programId])

  const userAccountQuery = useQuery({
    queryKey: ['user-account', 'fetch', { cluster, owner: owner.toString() }],
    queryFn: async () => {
      try {
        return await program.account.userAccount.fetch(userAccountPda)
      } catch {
        return null
      }
    },
  })

  const initializeUser = useMutation({
    mutationKey: ['user-account', 'initialize', { cluster }],
    mutationFn: async () => {
      return program.methods
        .initializeUser()
        .accounts({
          authority: owner,
        })
        .rpc()
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      toast.success('User account initialized!')
      return userAccountQuery.refetch()
    },
    onError: (error) => {
      toast.error(`Failed to initialize user: ${error}`)
    },
  })

  const startSession = useMutation({
    mutationKey: ['charging-session', 'start', { cluster }],
    mutationFn: async ({
      chargerCode,
      chargerPowerKw,
      pricingPerKwh,
    }: {
      chargerCode: string
      chargerPowerKw: number
      pricingPerKwh: number
    }) => {
      const timestamp = Math.floor(Date.now() / 1000)
      const nonce = Math.floor(Math.random() * 1000000) // Random nonce to avoid collisions
      const [sessionPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('session'),
          owner.toBuffer(),
          Buffer.from(new BN(timestamp).toArray('le', 8)),
          Buffer.from(new BN(nonce).toArray('le', 4)),
        ],
        program.programId
      )

      return program.methods
        .startSession(chargerCode, chargerPowerKw, new BN(pricingPerKwh), new BN(timestamp), nonce)
        .accounts({
          user: owner,
        })
        .rpc()
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      toast.success('Charging session started!')
      return queryClient.invalidateQueries({
        queryKey: ['charging-session', 'all', { cluster }],
      })
    },
    onError: (error) => {
      toast.error(`Failed to start session: ${error}`)
    },
  })

  return {
    userAccountPda,
    userAccountQuery,
    initializeUser,
    startSession,
  }
}
