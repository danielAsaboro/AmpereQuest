# AmpereQuest ⚡

> **Bridging Real-World EV Charging with Virtual Network Building on Solana**

AmpereQuest is a hybrid Solana application built for the [DeCharge "Anons with Amperes" hackathon](https://earn.superteam.fun/listing/anons-with-amperes/). It combines **real-time charging session visualization** with a **gamified virtual charging empire** to create an engaging on-chain economy for both EV drivers and Web3 users.

## ⚠️ Demo Status

**This is a functional prototype demonstrating blockchain architecture for EV charging integration:**

- ✅ **Smart Contracts**: Fully implemented and tested on Solana (localnet)
- ✅ **Point Economy**: Real on-chain point minting and trading
- ⚡ **Charging Data**: Currently using simulated sessions for demo purposes
- 🎮 **Virtual Empire**: Fully functional on-chain plot ownership and revenue system
- 💰 **Marketplace**: Voucher-based point trading system

**Production Deployment:** Would require oracle integration with DeCharge API for verified real-world charging session data.

## 🎯 Hackathon Tracks

This project addresses **both** the main track and bonus track:

### Main Track: Real-Time Charging Feed ("The Pulse")
- ✅ Live feed of charging sessions across the network
- ✅ Per-watt point calculation (1 point per 100 Wh)
- ✅ Anonymous user profiles with stats
- ✅ Points minted on-chain via Solana smart contracts
- ✅ Marketplace for buying points at 50% discount
- ✅ Solana Pay integration for instant microtransactions

### Bonus Track: Virtual Charging World ("The Empire")
- ✅ PDA-based virtual plot ownership (on-chain, non-transferable)
- ✅ Install and upgrade chargers (3.3kW → 30kW)
- ✅ Virtual EV traffic simulation
- ✅ Revenue generation from virtual sessions
- ✅ Strategic gameplay with location and pricing

> **Note:** Plots are currently stored as PDA accounts. Future enhancement: Convert to SPL tokens for marketplace transferability.

## 🏗️ Architecture

### Solana Programs (Anchor)

#### 1. **Charging Session** (`5emVuARWebNveyqe9ivrM24yhBMdLWJvq3qzYTDDd66u`)
Manages real-world charging sessions and point minting.

**Instructions:**
- `start_session` - Initialize a new charging session
- `update_session` - Update energy consumed during charging
- `end_session` - Complete session and mint points to user
- `initialize_user` - Create user account

**Accounts:**
- `ChargingSession` - Individual session data
- `UserAccount` - User stats and points balance

#### 2. **Points Marketplace** (`9PQHr2B1MoxNwyjwdvxZcc7VifqKsetsjvikGwxu2Eko`)
Enables point trading between users.

**Instructions:**
- `initialize_marketplace` - Set up marketplace
- `create_listing` - Drivers sell earned points
- `buy_from_marketplace` - Web3 users buy at 50% discount
- `buy_from_listing` - Purchase from user listing
- `cancel_listing` - Cancel active listing

**Features:**
- 50% discount for Web3 users buying from marketplace
- P2P trading via listings
- Automatic point locking/unlocking

#### 3. **Virtual Plot** (`Ex4pz9FX9RQUHcSdb74MzTN4hpPFAHMKfqf3RtWcVHRc`)
NFT-based virtual charging plot system.

**Instructions:**
- `purchase_plot` - Buy a virtual plot
- `install_charger` - Add charger to owned plot
- `upgrade_charger` - Increase charger capacity
- `record_session` - Track virtual charging revenue
- `withdraw_revenue` - Claim earnings

**Plot Features:**
- Location-based (lat/lng coordinates)
- Charger power tiers: 3.3kW, 7.4kW, 11kW, 22kW, 30kW
- Revenue accumulation from virtual traffic

### Frontend (Next.js 15 + React 19)

#### Pages
- **`/`** - Home page with feature overview
- **`/pulse`** - Real-time charging feed with live updates & leaderboards
- **`/empire`** - Virtual charging network builder with revenue analytics
- **`/marketplace`** - Points trading platform with Solana Pay
- **`/analytics`** - Comprehensive network statistics and insights
- **`/account`** - User profile and stats

#### Key Components
- **Charging Simulation Engine** - Generates realistic charging sessions
- **Real-time Updates** - WebSocket-like updates every second
- **Animated UI** - Framer Motion for smooth transitions
- **Wallet Integration** - Solana wallet adapter

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm
- Rust & Anchor CLI
- Solana CLI

### Quick Start

```bash
# Install dependencies
pnpm install

# Start everything: build, deploy, and run!
pnpm demo
```

This will automatically:
1. ✅ Build all Anchor programs
2. ✅ Start Solana test validator
3. ✅ Deploy programs to localnet
4. ✅ Start Next.js development server

Open http://localhost:3000 and you're ready to go!

**Press Ctrl+C to stop all services**

### Manual Setup (Alternative)

```bash
# Build Anchor programs
pnpm anchor-build

# Start local validator
pnpm validator

# Deploy programs
cd anchor && anchor deploy

# Start development server
pnpm dev
```

The app will be available at `http://localhost:3000`

## 🎮 How It Works

### For EV Drivers
1. Charge your vehicle at any DeCharge station
2. Earn 1 point per 0.1 kWh (100 Wh) consumed
3. Points are minted on-chain to your Solana wallet
4. Sell points in the marketplace or use them in The Empire

### For Web3 Users
1. Connect your Solana wallet
2. Purchase points at 50% discount from the marketplace
3. Use points to buy virtual plots
4. Install chargers and earn revenue from virtual traffic
5. Upgrade your empire to maximize earnings

## 🔧 Tech Stack

**Blockchain:**
- Solana
- Anchor Framework 0.31.1
- Solana Web3.js
- Solana Pay

**Frontend:**
- Next.js 15.5.3 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Framer Motion (animations)
- shadcn/ui components
- React Query (data fetching)

**Data & Simulation:**
- Custom charging session simulator
- Real charge point data from DeCharge
- Real-time update engine

## 📊 Key Features

### Real-Time Feed
- Live charging sessions with animated progress bars
- Anonymous user identifiers (e.g., "SwiftDriver1234")
- Per-session energy consumption tracking
- Point calculation in real-time
- Completion notifications

### Point Economy
- On-chain point minting via smart contracts
- 1:10 ratio (1 kWh = 10 points)
- Marketplace with 50% Web3 user discount
- P2P trading support
- Transparent on-chain history

### Virtual Empire (In Progress)
- Interactive map with purchasable plots
- NFT-based ownership
- Charger installation and upgrades
- Revenue tracking and withdrawal
- Leaderboard system

## 🎨 Design Principles

1. **Transparency** - All transactions on-chain
2. **Gamification** - Fun and engaging mechanics
3. **Real Utility** - Bridge to actual EV charging
4. **Accessibility** - Easy onboarding for non-crypto users
5. **Scalability** - Built on Solana for speed and low fees

## 📝 Project Structure

```
AmpereQuest/
├── anchor/                     # Solana programs
│   ├── programs/
│   │   ├── charging_session/   # Session management
│   │   ├── points_marketplace/ # Point trading
│   │   └── virtual_plot/       # Virtual empire
│   └── tests/                  # Program tests
├── src/
│   ├── app/                    # Next.js pages
│   │   ├── pulse/             # Live feed
│   │   ├── empire/            # Virtual world
│   │   └── marketplace/       # Trading
│   ├── components/            # React components
│   └── lib/
│       └── simulation.ts      # Charging simulator
└── resources/
    ├── bounty.md              # Hackathon requirements
    └── charge_point_sample.json
```

## 🔮 Production Deployment Architecture

### Oracle Integration for Real Charging Data

**Current State**: Demo uses simulated charging sessions
**Production Goal**: Verify real charging sessions from DeCharge hardware

#### Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                   PRODUCTION FLOW                             │
└──────────────────────────────────────────────────────────────┘

1. EV Driver starts charging at DeCharge station
   ├── Hardware records: energy consumed, timestamp, location
   └── Hardware signs data with private key (Ed25519)

2. Data sent to Switchboard Oracle Network
   ├── Oracle validates hardware signature
   ├── Verifies location within 100m radius (GPS proof)
   ├── Checks rate limits (max sessions per user per day)
   └── Submits verified data to Solana

3. Solana Smart Contract (charging_session)
   ├── Receives oracle-verified data
   ├── Validates oracle authority signature
   ├── Mints points based on energy consumed
   └── Updates user account on-chain

4. User receives points
   ├── Can sell in marketplace
   ├── Can use in virtual empire
   └── Full on-chain transparency
```

#### Security Layers

1. **Hardware Signature** (Layer 1)
   - Each DeCharge station has unique Ed25519 keypair
   - All session data signed by hardware
   - Prevents fake session submissions

2. **Oracle Validation** (Layer 2)
   - Switchboard oracle verifies hardware signature
   - Location proof: GPS coordinates within 100m
   - Rate limiting: prevents spam/abuse
   - Multi-oracle consensus (3+ oracles)

3. **On-Chain Verification** (Layer 3)
   - Smart contract checks oracle authority
   - Validates session parameters (reasonable energy, timing)
   - Anti-replay attack measures
   - Immutable audit trail

#### Implementation Steps

1. **Switchboard Oracle Setup** (Week 1-2)
   ```typescript
   // Oracle job definition
   {
     "name": "DeCharge Session Validator",
     "tasks": [
       {
         "httpTask": {
           "url": "https://api.decharge.io/sessions/verify",
           "method": "POST"
         }
       },
       {
         "jsonParseTask": {
           "path": "$.verified"
         }
       }
     ]
   }
   ```

2. **Hardware Integration** (Week 2-3)
   - Install signing module on DeCharge stations
   - Configure API endpoints
   - Test signature verification

3. **Smart Contract Updates** (Week 3-4)
   ```rust
   // Add oracle authority validation
   pub fn end_session_with_oracle(
       ctx: Context<EndSession>,
       oracle_signature: [u8; 64],
       energy_consumed_wh: u64,
   ) -> Result<()> {
       // Verify oracle signature
       require!(
           verify_oracle_signature(&oracle_signature),
           ErrorCode::InvalidOracle
       );

       // Continue with point minting...
   }
   ```

4. **Testing & Deployment** (Week 4-6)
   - Devnet testing with simulated oracle
   - Testnet with real DeCharge stations
   - Security audit
   - Mainnet deployment

#### Cost Analysis

- **Switchboard Oracle**: ~$0.001 per session verification
- **Solana Transaction**: ~$0.00025 per session
- **Total per session**: < $0.002

At 10,000 sessions/day: **~$20/day operating cost**

### Future Roadmap

#### Phase 1: MVP (Current) ✅
- ✅ Real-time charging feed (simulated)
- ✅ Points system with smart contracts
- ✅ Full marketplace with Solana Pay
- ✅ Virtual plot system with revenue tracking
- ✅ Analytics dashboard
- ✅ Leaderboards and achievements

#### Phase 2: Production Integration (4-6 weeks)
- [ ] Switchboard oracle integration
- [ ] DeCharge hardware API connection
- [ ] Security audit
- [ ] Devnet → Testnet → Mainnet deployment
- [ ] Mobile app (React Native)

#### Phase 3: Enhanced Features (3-6 months)
- [ ] Advanced analytics & ML predictions
- [ ] Social features (following, sharing, teams)
- [ ] Achievement NFTs with rarity
- [ ] Governance token & DAO
- [ ] Multi-network support (Polygon, Arbitrum)

## 🏆 Hackathon Submission

**Bounty:** Anons with Amperes - DeCharge Network
**Tracks:** Main + Bonus
**Prize Pool:** $3,500 USDC

### Judging Criteria
- ✅ **Innovation:** Hybrid real + virtual approach (unique!)
- ✅ **Technical Implementation:** 3 Anchor programs, comprehensive frontend
- ✅ **Impact:** Clear path to real-world deployment with DeCharge
- ✅ **Clarity:** Well-documented, easy to understand

## 📄 License

MIT

## 🤝 Contributing

This project was built for the DeCharge hackathon. Contributions welcome!

## 📧 Contact

For questions about this submission, reach out via [Telegram](https://t.me/dechargecommunity) or [Discord](https://discord.gg/5VBMJcDXnD).

---

**Built with ⚡ for the Solana Cypherpunk Hackathon**
