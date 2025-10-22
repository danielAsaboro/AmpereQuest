import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Basic } from '../target/types/basic'

describe('basic', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)

  const program = anchor.workspace.Basic as Program<Basic>

  it('should run the program', async () => {
    // Add your test here.
    const tx = await program.methods.greet().rpc()
    console.log('Your transaction signature', tx)
  })
})
