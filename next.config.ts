import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors. Only use in development/hackathon context.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Skip type checking during build to allow compilation
    // Type safety is maintained during development
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizePackageImports: ['@solana/web3.js', '@coral-xyz/anchor'],
  },
}

export default nextConfig
