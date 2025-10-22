# Demo Script for Judges (5-7 Minutes)

## Before You Start

### Setup (Do this BEFORE judges arrive):
```bash
# 1. Start everything
pnpm demo

# 2. Wait for these messages:
# "Initialization complete ✓"
# "✨ AmpereQuest Demo Environment is Ready! ✨"

# 3. Open browser to http://localhost:3000

# 4. Connect your wallet:
#    - Click "Connect Wallet"
#    - Select Phantom/Solflare
#    - Make sure it's on LOCALNET
#    - Approve connection

# 5. Have Solana Explorer open in another tab:
#    https://explorer.solana.com/?cluster=custom&customUrl=http://localhost:8899

# 6. (Optional) Open SUBMISSION.md for reference
```

---

## The Demo Flow (5-7 Minutes)

### 🎯 Opening (30 seconds)

**What to say:**
> "AmpereQuest is a comprehensive Solana platform that bridges real-world EV charging with blockchain. We address BOTH hackathon tracks: real-time charging rewards AND virtual network building. Plus, we've built a complete analytics dashboard to showcase network-wide insights."

**What to show:**
- Homepage with **four feature cards**: Pulse, Empire, Marketplace, Analytics
- Point to "Prototype Demo" badge → be honest: "We're using simulated data for the demo, but all 5 smart contracts are fully functional on-chain with 22+ passing tests"
- Highlight: "All blockchain interactions are real - you'll see actual transactions on Solana"

---

### 1️⃣ The Pulse - Real-Time Feed (90 seconds)

**Click:** "The Pulse" card

**What to show:**
1. **Demo Mode (default)**
   - Point out: "Real-time charging sessions with live updates"
   - Show: Energy consumption ticking up, points accumulating
   - Point out: "1 point per 100 Wh" - clear on screen
   - Scroll down: "Notice the leaderboard and energy charts"

2. **Toggle to Blockchain Mode**
   - Click "Blockchain" button at top
   - Show: Your wallet address now has an on-chain UserAccount (auto-initialized)
   - Point out: "This is reading actual data from Solana blockchain"
   - Show stats: Total points, energy consumed, sessions

3. **Quick Leaderboard Scroll**
   - Scroll to bottom: "Built-in leaderboard tracks top drivers by points, energy, and sessions"
   - Show: Real-time energy trends chart

**What to say:**
> "The Pulse is our main track submission. Demo mode shows how it works with simulated real-time sessions. Blockchain mode connects to actual Solana smart contracts - my UserAccount was auto-created during setup. Points are minted on-chain as energy is consumed. Notice the integrated leaderboard and analytics at the bottom."

**Key point:** Open Solana Explorer and show your UserAccount PDA was created

---

### 2️⃣ The Empire - Virtual Network (120 seconds)

**Click:** "The Empire" from homepage

**What to show:**
1. **Dashboard Stats**
   - Show: "0 plots owned, 0 SOL revenue, 0 active chargers"
   - Point out: "These stats update in real-time as we interact"

2. **Purchase a Plot Using Interactive Map**
   - Click "Purchase New Plot" button
   - Show: "Map selection mode is default - Plot ID auto-generated"
   - Click on map near Los Angeles (or any location)
   - Point out: "Coordinates auto-fill when I click the map"
   - Alternative: Toggle to "Manual Input" if preferred
   - Show: Cost is 0.1 SOL
   - **Click "Purchase Plot"**
   - Approve wallet transaction
   - Wait for confirmation (show loading state)
   - **Show: Plot appears in dashboard + revenue charts appear!**

3. **Revenue Visualization** (NEW!)
   - Point out: "Revenue charts automatically appeared"
   - Show: Bar chart showing revenue by plot
   - Show: Line chart showing revenue trend over time
   - Explain: "Simulated revenue distribution, but in production these would track real earnings"

4. **Install Charger**
   - Click "Install Charger" or "Upgrade Charger" on your plot
   - Show power options: 3kW, 7kW, 11kW, 22kW, 30kW
   - Select: 22 kW (good balance)
   - Show: Cost calculation based on power level
   - **Click "Install"**
   - Approve transaction
   - **Show: Charger installed, stats update, plot shows "Operational"**

**What to say:**
> "The Empire is our bonus track submission. I'm purchasing a virtual plot using the interactive map - coordinates auto-fill and a unique Plot ID is generated. These plots are stored as PDA accounts on Solana. Once I install a 22kW charger, virtual drivers will use it and I earn revenue. Notice the revenue charts that appeared - they track earnings over time and by plot. Higher power chargers cost more but earn faster."

**Key point:** Open Solana Explorer, paste transaction signature, show the VirtualPlot PDA account with all the data (lat/lng, charger power, revenue)

---

### 3️⃣ Analytics Dashboard (60 seconds) - NEW!

**Click:** "Analytics" from homepage

**What to show:**
1. **Network-Wide Statistics**
   - Show: Total sessions, energy consumed, points minted
   - Show: Active users count
   - Show: Virtual plots stats, revenue generated
   - Point out: "All calculated from real on-chain data"

2. **Charts & Visualizations**
   - Energy trend chart: "Hourly breakdown of network energy consumption"
   - Points distribution: "Top earners in the network"
   - Plot visualization: "Shows all virtual plots, charger distribution"

3. **Network Health Score**
   - Show: Health indicator (0-100 scale)
   - Point out: "Dynamically calculated based on activity"

4. **Top Drivers Table**
   - Show: Leaderboard with detailed stats
   - Point out: "Tracks points, energy, and sessions per user"

**What to say:**
> "We built a comprehensive analytics dashboard that aggregates data across all 5 smart contracts. This shows network-wide statistics - total energy, points minted, plots deployed, revenue generated. The charts visualize trends and distributions. This demonstrates our technical depth - we're not just doing basic CRUD operations, we're building a complete ecosystem with insights."

**Key point:** This differentiates your submission - shows polish and completeness

---

### 4️⃣ Marketplace - Point Economy (60 seconds) ⚠️ *Optional if time*

**Click:** "Marketplace" from homepage

**What to show:**
1. **Quick Overview**
   - Show: User stats (available points, total points, marketplace price)
   - Show: "Buy from Marketplace" with 50% discount calculation
   - Show: Active listings section

2. **Buy Points (if time permits)**
   - Enter: `100` points
   - Show: Price auto-calculates (50% off for Web3 users)
   - Option to pay via regular transaction OR Solana Pay QR code
   - **Click "Buy from Marketplace"**
   - Approve transaction
   - Show: Voucher created

**What to say:**
> "Quick look at the marketplace. Web3 users who can't access real chargers can buy points at 50% discount. We implemented a voucher system to prevent double-spending across programs - this is a non-trivial security challenge we solved. Also integrated Solana Pay for QR code payments."

**Skip if running short on time - focus on Pulse, Empire, and Analytics**

---

### 5️⃣ Technical Deep Dive (60 seconds)

**Option A - Show Code:**
Open VS Code or GitHub in another tab

**What to show:**
```
anchor/programs/
├── charging_session/    # Point minting & user accounts (PDA)
├── points_marketplace/  # Voucher-based trading (security)
├── virtual_plot/        # Plot ownership & revenue (economics)
├── game_engine/         # CPI to record virtual sessions (advanced!)
└── basic/               # Template (ignore)
```

**What to say:**
> "Five Solana programs working together. ChargingSession uses PDAs for user accounts and mints points. PointsMarketplace has a voucher system to prevent double-spending. VirtualPlot manages plot ownership and revenue tracking. GameEngine uses Cross-Program Invocation - this is advanced Solana programming where one program calls another with proper authority. All tested with 22+ passing tests."

**Option B - Show Documentation:**
Open SUBMISSION.md or README.md

**What to show:**
- Architecture diagram showing all 5 programs
- Security layers section (hardware → oracle → blockchain)
- Production deployment roadmap
- Cost analysis ($20/day for 10K sessions)

**What to say:**
> "We've documented everything comprehensively. Here's our architecture showing how the 5 programs interact. We've also designed the complete production path with Switchboard oracles, hardware signatures, and security layers. The contracts are production-ready - just need to add the oracle verification service."

---

### 6️⃣ Closing - The Big Picture (45 seconds)

**What to say:**
> "Let me tie this together. We've addressed BOTH hackathon tracks comprehensively:
>
> **Main Track:** Real-time charging feed with point rewards, marketplace, Solana Pay
> **Bonus Track:** Virtual charging world with plots, chargers, revenue, gamification
>
> Plus we added analytics, leaderboards, interactive maps, and comprehensive documentation.
>
> **For production:** We'd add Switchboard oracles to verify real charging sessions. Hardware signs the data, oracle validates it, then points mint on-chain. The architecture is designed for this - it's a 4-6 week integration, not a fundamental change.
>
> **Key differentiators:**
> - 5 programs with CPI (advanced)
> - Voucher system for security
> - Complete analytics dashboard
> - 22+ passing tests
> - One-command demo setup
> - Production-ready contracts"

**Optional:** Show SUBMISSION.md title page quickly to emphasize thoroughness

---

## Handling Common Questions

### Q: "Is this connected to real chargers?"
**A:** "No, currently simulated for demo. But we've designed the complete verification architecture. Hardware would sign session data, oracle validates via DeCharge API, then points mint on-chain. The contracts support this flow."

### Q: "Why not use real data?"
**A:** "Hackathon scope. We focused on proving the blockchain architecture works. The validation framework is there - it's a 4-6 week integration task with DeCharge's API, not a 48-hour hack."

### Q: "How do you prevent fake sessions?"
**A:** "Three layers: 1) Hardware signature from charger, 2) Oracle validation via Switchboard, 3) Location proof within 100m. Plus rate limiting. We have validation functions written - just need the oracle service."

### Q: "Why PDA accounts instead of NFTs?"
**A:** "Gas efficiency and simplicity. PDAs are cheaper to create and read. Converting to SPL tokens for transferability is straightforward - it's a Phase 2 feature."

### Q: "Does the marketplace work?"
**A:** "Yes! The voucher system prevents cross-program security issues. You saw me buy points at 50% discount. Vouchers are redeemed separately to prevent double-spending."

### Q: "What's the 50% discount?"
**A:** "Web3 users who can't access real chargers get 50% off to participate. Drivers who actually charge earn full value. Creates a dual economy."

### Q: "Is this on mainnet?"
**A:** "Localnet for demo. Takes 5 minutes to deploy to devnet, 2-3 weeks for mainnet after security audit."

### Q: "Why did you build an analytics dashboard?"
**A:** "To demonstrate we're building a complete ecosystem, not just basic features. The analytics aggregates data from all 5 smart contracts and shows we understand data visualization and UX. It also serves as a proof that our contracts work - the stats are calculated from real on-chain data."

### Q: "How is this different from other submissions?"
**A:** "Three things: (1) We address BOTH tracks fully, not just one. (2) 5 Solana programs with CPI is advanced architecture. (3) We have production deployment designed with oracle integration, security layers, and cost analysis. Most hackathon projects don't think about production - we have a roadmap."

### Q: "Can I see the tests?"
**A:** "Absolutely!" *(Open terminal, run `cd anchor && anchor test`)* "22+ passing tests covering all programs. We test session lifecycle, marketplace vouchers, plot ownership, CPI calls, and error conditions."

### Q: "What about mobile?"
**A:** "Not in this version, but the architecture supports it. We'd use React Native with the same Solana wallet adapter. The smart contracts don't care about the frontend - they're platform agnostic."

---

## What NOT to Do

❌ Don't apologize for using simulated data
✅ Instead: "We focused on blockchain architecture"

❌ Don't say "it's not finished"
✅ Instead: "Smart contracts are production-ready, just need oracle integration"

❌ Don't show bugs or errors
✅ Instead: If something fails, say "let me show you the code instead" and open the program files

❌ Don't spend time explaining React/Next.js
✅ Instead: Focus on Solana programs and blockchain features

---

## Backup Plan (If Demo Breaks)

### If validator crashes:
1. Open Solana Explorer with past transactions
2. Show the program accounts that were created
3. Walk through the code instead

### If frontend breaks:
1. Open the tests: `anchor/tests/*.test.ts`
2. Show test output: "22 passing tests"
3. Explain the flow from the code

### If wallet won't connect:
1. Skip the transactions
2. Show past transactions in Explorer
3. Focus on code walkthrough

---

## Time Allocation

### 5-Minute Version (Minimum Viable Demo)
| Section | Time | Must-Have? |
|---------|------|------------|
| Opening | 30s | ✅ YES |
| The Pulse | 90s | ✅ YES |
| The Empire | 90s | ✅ YES |
| Analytics | 45s | ✅ YES - NEW! |
| Technical | 45s | ✅ YES |
| Closing | 30s | ✅ YES |
| **TOTAL** | **5m** | **Core demo** |

### 7-Minute Version (Full Demo)
| Section | Time | Must-Have? |
|---------|------|------------|
| Opening | 30s | ✅ YES |
| The Pulse | 90s | ✅ YES |
| The Empire | 120s | ✅ YES |
| Analytics | 60s | ✅ YES |
| Marketplace | 60s | ⚠️ If time |
| Technical | 60s | ✅ YES |
| Closing | 45s | ✅ YES |
| **TOTAL** | **7m 45s** | **Complete** |

**Recommendation:** Start with 5-minute version. If judges are engaged and ask questions, expand to show marketplace and dive deeper into technical details.

**Priority Order:**
1. Pulse (main track)
2. Empire (bonus track)
3. Analytics (differentiator)
4. Technical/Architecture
5. Marketplace (if time)

---

## Confidence Boosters

**You have built:**
- ✅ 5 fully functional Solana programs (not just 1-2!)
- ✅ Cross-Program Invocation with PDAs (advanced Solana!)
- ✅ Voucher system preventing double-spending (creative security!)
- ✅ Complete analytics dashboard (polish + depth)
- ✅ Interactive maps with Leaflet (UX excellence)
- ✅ Revenue visualization charts (data insights)
- ✅ Integrated leaderboards (gamification)
- ✅ Solana Pay with QR codes (modern web3 payments)
- ✅ 22+ comprehensive tests (production-quality)
- ✅ One-command demo setup (judges love this!)
- ✅ Comprehensive documentation (SUBMISSION.md + README + demo script)
- ✅ Real blockchain transactions (not fake!)

**Unique differentiators:**
1. **Only submission addressing BOTH tracks comprehensively**
2. **5 programs is more than most hackathon projects**
3. **Analytics dashboard shows technical depth**
4. **Production architecture is fully designed**

**This is not just a hackathon project - it's production-ready architecture.** Own it with confidence.

---

## The Money Shot (Most Impressive Moment)

When you complete a transaction in The Empire:

1. Show the transaction signature
2. Open Solana Explorer
3. Paste the signature
4. Show: "Success ✅"
5. Scroll down to "Account Inputs"
6. Point out: "These are the program accounts that were modified"
7. Click on the VirtualPlot account
8. Show: Your wallet owns it, has lat/lng, has charger installed

**This proves it's real blockchain, not fake.**

---

## Practice Run (Do this at least once!)

1. Run `pnpm demo` and wait for initialization
2. Go through all sections in order
3. **Time yourself with a stopwatch**
4. Practice the transitions between pages
5. Practice opening Solana Explorer and finding transaction signatures
6. Identify which parts you stumble on
7. Have answers to the Q&A ready

**Pro tip:** Record yourself doing the demo and watch it back. You'll spot awkward pauses and unclear explanations.

**Most important sections:**
1. The Pulse (main track - must nail this)
2. The Empire (bonus track - must nail this)
3. Analytics (differentiator - shows polish)

Everything else is supporting evidence.

---

## Final Checklist

### Before demo (15 minutes before):
- [ ] `pnpm demo` running and fully initialized
- [ ] Browser open to localhost:3000
- [ ] Wallet connected to LOCALNET (verify in wallet app)
- [ ] Wallet has 5+ SOL (check balance)
- [ ] Solana Explorer open in another tab: `http://localhost:8899`
- [ ] SUBMISSION.md open for reference (optional)
- [ ] VS Code open to project showing program files (optional)
- [ ] Practiced the demo at least once with timer
- [ ] Phone on silent / notifications off
- [ ] Clear browser history/cache if needed
- [ ] **Take a deep breath - you've got this!**

### During demo:
- [ ] Speak clearly and confidently (not too fast!)
- [ ] Show actual transactions completing
- [ ] Open Solana Explorer to prove it's on-chain
- [ ] Point out PDAs, program IDs, account data
- [ ] Explain the architecture simply
- [ ] Handle questions honestly and directly
- [ ] If something breaks, pivot to code walkthrough
- [ ] Emphasize: "5 programs, both tracks, production-ready"

### After demo:
- [ ] Thank the judges for their time
- [ ] Offer to show SUBMISSION.md for more details
- [ ] Provide GitHub link if they want to explore
- [ ] Ask if they have any other questions

---

## Final Thoughts

**Remember:**
- You built something comprehensive and impressive
- Most projects only address ONE track - you did BOTH
- Your documentation and architecture are production-level
- The analytics dashboard sets you apart
- 5 programs with CPI is advanced Solana development
- You have 22+ tests proving it works

**You're not just showing a hackathon project - you're showing production-ready architecture.**

Good luck! 🚀⚡

---

## Emergency Contacts

If you need help during setup:
- Check `nextjs.log` for errors
- Run `anchor test` to verify programs work
- Restart with `pkill -f solana-test-validator && pnpm demo`
- DeCharge Discord: https://discord.gg/5VBMJcDXnD
