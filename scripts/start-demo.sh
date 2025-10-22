#!/bin/bash

# AmpereQuest Demo Startup Script
# This script will:
# 1. Build Anchor programs
# 2. Start Solana test validator
# 3. Deploy programs to localnet
# 4. Start Next.js development server

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}==>${NC} ${GREEN}$1${NC}"
}

print_info() {
    echo -e "${YELLOW}INFO:${NC} $1"
}

print_error() {
    echo -e "${RED}ERROR:${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is in use
port_in_use() {
    lsof -i :"$1" >/dev/null 2>&1
}

# Function to kill process on port
kill_port() {
    if port_in_use "$1"; then
        print_info "Killing process on port $1..."
        lsof -ti :"$1" | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

# Cleanup function
cleanup() {
    print_info "Cleaning up..."

    # Kill validator
    if [ ! -z "$VALIDATOR_PID" ]; then
        print_info "Stopping validator (PID: $VALIDATOR_PID)..."
        kill $VALIDATOR_PID 2>/dev/null || true
    fi

    # Kill Next.js server
    if [ ! -z "$NEXTJS_PID" ]; then
        print_info "Stopping Next.js server (PID: $NEXTJS_PID)..."
        kill $NEXTJS_PID 2>/dev/null || true
    fi

    # Kill any remaining processes
    kill_port 8899
    kill_port 3000

    print_info "Cleanup complete!"
}

# Set trap to cleanup on exit
trap cleanup EXIT INT TERM

# Banner
echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                        ║${NC}"
echo -e "${GREEN}║         AmpereQuest Demo               ║${NC}"
echo -e "${GREEN}║     Starting Development Environment   ║${NC}"
echo -e "${GREEN}║                                        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""

# Check prerequisites
print_step "Checking prerequisites..."

if ! command_exists solana; then
    print_error "Solana CLI not found. Please install: https://docs.solana.com/cli/install-solana-cli-tools"
    exit 1
fi

if ! command_exists anchor; then
    print_error "Anchor CLI not found. Please install: https://www.anchor-lang.com/docs/installation"
    exit 1
fi

if ! command_exists pnpm; then
    print_error "pnpm not found. Please install: npm install -g pnpm"
    exit 1
fi

print_info "All prerequisites found ✓"

# Check if we're in the right directory
if [ ! -d "anchor" ] || [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Step 1: Build Anchor programs
print_step "Step 1: Building Anchor programs..."
cd anchor
anchor build
if [ $? -eq 0 ]; then
    print_info "Build successful ✓"
else
    print_error "Build failed!"
    exit 1
fi
cd ..

# Step 2: Kill existing processes on required ports
print_step "Step 2: Checking for existing processes..."
kill_port 8899  # Validator
kill_port 8900  # Validator WebSocket
kill_port 3000  # Next.js

# Step 3: Start Solana test validator
print_step "Step 3: Starting Solana test validator..."

# Create test-ledger directory if it doesn't exist
mkdir -p test-ledger

# Start validator in background
solana-test-validator \
    --ledger test-ledger \
    --reset \
    --quiet \
    > test-ledger/validator.log 2>&1 &

VALIDATOR_PID=$!

print_info "Validator started (PID: $VALIDATOR_PID)"
print_info "Waiting for validator to be ready..."

# Wait for validator to be ready (max 30 seconds)
for i in {1..30}; do
    if solana cluster-version >/dev/null 2>&1; then
        print_info "Validator is ready ✓"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Validator failed to start!"
        cat test-ledger/validator.log
        exit 1
    fi
    sleep 1
done

# Get validator info
VALIDATOR_IDENTITY=$(solana-keygen pubkey ~/.config/solana/id.json 2>/dev/null || echo "Unknown")
print_info "Validator identity: $VALIDATOR_IDENTITY"

# Step 4: Deploy programs
print_step "Step 4: Deploying Anchor programs..."
cd anchor

anchor deploy 2>&1 | tee deploy.log

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    print_info "Deployment successful ✓"
    echo ""
    print_info "Deployed Program IDs:"
    grep "Program Id:" deploy.log | sed 's/^/  /'
    rm -f deploy.log
else
    print_error "Deployment failed!"
    cat deploy.log
    rm -f deploy.log
    exit 1
fi

cd ..

# Step 5: Airdrop SOL to wallet
print_step "Step 5: Airdropping SOL to wallet..."
solana airdrop 5 >/dev/null 2>&1 || print_info "Airdrop skipped (may have failed)"
BALANCE=$(solana balance 2>/dev/null || echo "Unknown")
print_info "Wallet balance: $BALANCE"

# Step 6: Initialize demo environment (marketplace, game engine, user account)
print_step "Step 6: Initializing demo environment..."
cd anchor

# Check if tsx is available
if ! command_exists tsx; then
    print_info "Installing tsx..."
    pnpm add -D tsx || {
        print_error "Failed to install tsx"
        exit 1
    }
fi

# Run initialization script
if [ -f "scripts/initialize-demo.ts" ]; then
    print_info "Running initialization script..."

    # Set Anchor environment variables
    export ANCHOR_PROVIDER_URL=http://127.0.0.1:8899
    export ANCHOR_WALLET=$HOME/.config/solana/id.json

    npx tsx scripts/initialize-demo.ts 2>&1 | tee init.log

    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        print_info "Initialization complete ✓"
        rm -f init.log
    else
        print_error "Initialization failed!"
        cat init.log
        rm -f init.log
        exit 1
    fi
else
    print_info "Initialization script not found, skipping..."
fi

cd ..

# Step 7: Start Next.js development server
print_step "Step 7: Starting Next.js development server..."

# Start Next.js in background
pnpm dev > nextjs.log 2>&1 &
NEXTJS_PID=$!

print_info "Next.js server starting (PID: $NEXTJS_PID)"
print_info "Waiting for server to be ready..."

# Wait for Next.js to be ready (max 60 seconds)
for i in {1..60}; do
    if port_in_use 3000; then
        print_info "Next.js server is ready ✓"
        break
    fi
    if [ $i -eq 60 ]; then
        print_error "Next.js server failed to start!"
        cat nextjs.log
        exit 1
    fi
    sleep 1
done

# Success message
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║  ✨ AmpereQuest Demo Environment is Ready! ✨              ║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📡 Solana Validator:${NC}    http://localhost:8899"
echo -e "${BLUE}🌐 Frontend:${NC}            http://localhost:3000"
echo -e "${BLUE}📊 Validator Logs:${NC}      tail -f test-ledger/validator.log"
echo -e "${BLUE}📊 Next.js Logs:${NC}        tail -f nextjs.log"
echo ""
echo -e "${YELLOW}Quick Start:${NC}"
echo "  1. Open http://localhost:3000 in your browser"
echo "  2. Connect your Solana wallet (set to Localnet)"
echo "  3. Navigate to 'The Pulse' to see demo charging sessions"
echo "  4. Navigate to 'The Empire' to build your virtual network"
echo "  5. Navigate to 'Marketplace' to trade points"
echo ""
echo -e "${YELLOW}Useful Commands:${NC}"
echo "  View blockchain sessions:  solana program show 5emVuARWebNveyqe9ivrM24yhBMdLWJvq3qzYTDDd66u"
echo "  Check wallet balance:      solana balance"
echo "  Get more SOL:              solana airdrop 5"
echo "  Run tests:                 cd anchor && anchor test --skip-build --skip-deploy"
echo ""
echo -e "${RED}Press Ctrl+C to stop all services${NC}"
echo ""

# Keep script running and tail logs
tail -f nextjs.log &
TAIL_PID=$!

# Wait for interrupt
wait $TAIL_PID

# Cleanup will be called by trap
