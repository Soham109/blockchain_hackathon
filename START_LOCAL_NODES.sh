#!/bin/bash

# Script to start local blockchain nodes
# Run this in separate terminals

echo "=========================================="
echo "Local Blockchain Nodes Startup Script"
echo "=========================================="
echo ""
echo "IMPORTANT: Run each command in a SEPARATE terminal!"
echo ""

echo "Terminal 1 - Start Local Arbitrum Node:"
echo "----------------------------------------"
echo "cd /Users/sohamaggarwal/blockchain_hackathon"
echo "npx hardhat node"
echo ""
echo "This will start at: http://127.0.0.1:8545"
echo "Keep this terminal running!"
echo ""

echo "Terminal 2 - Start Local Solana Validator:"
echo "-------------------------------------------"
echo "solana-test-validator"
echo ""
echo "This will start at: http://127.0.0.1:8899"
echo "Keep this terminal running!"
echo ""

echo "After both are running, you can:"
echo "1. Configure MetaMask for local network"
echo "2. Configure Phantom for local network"
echo "3. Start the app: npm run dev"
echo ""

