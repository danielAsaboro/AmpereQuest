'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Activity, Map, ShoppingCart, ArrowRight, Zap, TrendingUp, Cpu } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function Home() {
  const features = [
    {
      icon: Activity,
      title: 'The Pulse',
      description: 'Watch live charging sessions and see points being earned in real-time',
      href: '/pulse',
      color: 'from-green-500 to-emerald-600',
    },
    {
      icon: Map,
      title: 'The Empire',
      description: 'Build your virtual charging network and earn revenue from drivers',
      href: '/empire',
      color: 'from-blue-500 to-cyan-600',
    },
    {
      icon: ShoppingCart,
      title: 'Marketplace',
      description: 'Buy charging points at 50% discount or sell your earned points',
      href: '/marketplace',
      color: 'from-purple-500 to-pink-600',
    },
  ]

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <motion.div
        className="text-center space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
          <Zap className="w-4 h-4" />
          Powered by Solana
        </div>
        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          AmpereQuest
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          The hybrid platform connecting real-world EV charging with virtual network building on Solana
        </p>
      </motion.div>

      {/* Feature Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (index + 1), duration: 0.5 }}
            >
              <Link href={feature.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full group">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="flex items-center justify-between">
                      {feature.title}
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </motion.div>
          )
        })}
      </div>

      {/* Stats Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <Card className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="w-5 h-5" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  For EV Drivers
                </h4>
                <p className="text-sm text-muted-foreground">
                  Charge your vehicle and earn points for every watt consumed. Points are minted on-chain
                  via Solana smart contracts and can be sold in the marketplace or used to build your empire.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  For Web3 Users
                </h4>
                <p className="text-sm text-muted-foreground">
                  Purchase charging points at 50% discount and use them to build a virtual charging network.
                  Earn revenue as virtual EVs charge at your stations.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="bg-white dark:bg-gray-800 px-2 py-1 rounded">Solana Smart Contracts</span>
                <span className="bg-white dark:bg-gray-800 px-2 py-1 rounded">NFT-based Plots</span>
                <span className="bg-white dark:bg-gray-800 px-2 py-1 rounded">Solana Pay</span>
                <span className="bg-white dark:bg-gray-800 px-2 py-1 rounded">Real-time Feed</span>
                <span className="bg-white dark:bg-gray-800 px-2 py-1 rounded">On-chain Transparency</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* CTA */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      >
        <Link href="/pulse">
          <Button size="lg" className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
            <Activity className="w-5 h-5 mr-2" />
            Explore The Pulse
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>
      </motion.div>
    </div>
  )
}
