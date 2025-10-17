import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors. Only use in development/hackathon context.
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
