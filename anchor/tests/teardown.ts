export default async function globalTeardown() {
  // Give Solana RPC connections time to close gracefully
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Force garbage collection if available
  if (global.gc) {
    global.gc()
  }
}
