# Blockchain Payment Setup Guide

## Overview
This guide will help you set up local blockchain networks for Arbitrum and Solana, install required wallets, and fund test accounts.

## Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Basic understanding of blockchain wallets

---

## 1. Install Required Packages

```bash
npm install viem@latest wagmi@latest @solana/web3.js
```

**Note**: Gemini Wallet doesn't require a separate SDK package. It works through the standard `window.ethereum` API, which Wagmi's `injected` connector automatically detects.

---

## 2. Local Arbitrum Network Setup

### Option A: Using Hardhat Local Node
```bash
# Install Hardhat globally
npm install -g hardhat

# Create a new directory for local node
mkdir local-arbitrum-node
cd local-arbitrum-node

# Initialize Hardhat
npx hardhat init

# Start local node
npx hardhat node

```

This will start a local Arbitrum-compatible node at `http://127.0.0.1:8545`

### Option B: Using Anvil (Foundry)
```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Start Anvil
anvil
```

This starts a local node at `http://127.0.0.1:8545`

### Funding Test Accounts
When you start a local node, it will provide you with 10 test accounts and their private keys. Use these for testing.

**Test Accounts (from your local node):**
```
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account #1: 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 (10000 ETH)
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
```

**How to use these accounts:**
1. **For Gemini Wallet**: Import Account #0 or #1 using the private key
2. **For Platform Wallet**: Use Account #0 as the platform wallet (receives payments)
3. **For Testing**: Use Account #1 for making payments

---

## 3. Local Solana Network Setup

### Install Solana CLI
```bash
# macOS/Linux
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Windows
# Download from https://github.com/solana-labs/solana/releases
```

### Start Local Validator
```bash
# Start local Solana validator
solana-test-validator
```

This starts a local Solana cluster at `http://127.0.0.1:8899`

### Configure Solana CLI
```bash
# Set to local network
solana config set --url localhost

# Generate a new keypair (if needed)
solana-keygen new

# Airdrop SOL to your account
solana airdrop 10
```

---

## 4. Install Gemini Wallet

### For Browser Extension
1. Go to Chrome Web Store
2. Search for "Gemini Wallet"
3. Install the extension
4. Create a new wallet or import existing

### For Development
Gemini Wallet works through the standard `window.ethereum` API (like MetaMask). Wagmi's `injected` connector will automatically detect it when the extension is installed. No additional SDK package is needed.

---

## 5. Install Phantom Wallet

### For Browser Extension
1. Go to https://phantom.app
2. Click "Download" and install the Chrome extension
3. Create a new wallet or import existing

### Connect to Local Network
1. Open Phantom wallet
2. Go to Settings → Developer Mode
3. Add custom RPC: `http://127.0.0.1:8899`
4. Switch to this network

---

## 6. Fund Your Accounts

### Arbitrum (Local)
Use the test accounts provided by your local node, or:

```bash
# Using Hardhat console
npx hardhat console
> const [signer] = await ethers.getSigners()
> await signer.sendTransaction({to: "YOUR_ADDRESS", value: ethers.utils.parseEther("10")})
```

### Solana (Local)
```bash
# Airdrop SOL to your wallet address
solana airdrop 10 YOUR_WALLET_ADDRESS

# Check balance
solana balance YOUR_WALLET_ADDRESS
```

---

## 7. Environment Variables

Add to your `.env.local`:

```env
# Local Networks
NEXT_PUBLIC_ARBITRUM_RPC=http://127.0.0.1:8545
NEXT_PUBLIC_SOLANA_RPC=http://127.0.0.1:8899

# Platform Wallet Address (receives payments)
# Use Account #0 from your local node as the platform wallet
NEXT_PUBLIC_PLATFORM_ETH_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
NEXT_PUBLIC_PLATFORM_SOL_ADDRESS=11111111111111111111111111111111

# Transaction Verification
NEXT_PUBLIC_VERIFY_TRANSACTIONS=true
```

**Important**: 
- `NEXT_PUBLIC_PLATFORM_ETH_ADDRESS` should be Account #0 (the platform receives all payments)
- Users should import Account #1 (or any other test account) into Gemini Wallet for testing

---

## 8. Payment System (No Smart Contracts Needed!)

**Good news!** This implementation uses **direct transfers** - no smart contracts to deploy!

### How It Works:
1. **User sends ETH/SOL directly** to the platform wallet address
2. **Backend listens** for the transaction on the blockchain
3. **Backend verifies** the transaction was successful
4. **Payment is confirmed** and action is completed

### Platform Wallet Addresses:
- **ETH (Arbitrum)**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` (Account #0)
- **SOL (Solana)**: Set in environment variable (default: `11111111111111111111111111111111`)

**That's it!** No contract deployment needed. Just make sure the platform wallet address is set correctly.

---

## 9. Testing the Setup

1. **Start Local Nodes:**
   - Arbitrum: `npx hardhat node` or `anvil`
   - Solana: `solana-test-validator`

2. **Connect Wallets:**
   - Open your app
   - Connect Gemini Wallet for Arbitrum
   - Connect Phantom for Solana

3. **Test Payment:**
   - Try creating a listing
   - Pay the listing fee
   - Verify transaction appears in your wallet
   - Check backend verification

---

## Troubleshooting

### Gemini Wallet Not Connecting
- Make sure extension is installed and unlocked
- Check that you're on localhost (not production URL)
- Try refreshing the page

### Phantom Not Connecting to Local Network
- Enable Developer Mode in Phantom settings
- Add custom RPC endpoint: `http://127.0.0.1:8899`
- Make sure local validator is running

### Transactions Failing
- Check that you have enough balance
- Verify network is correct (local, not mainnet)
- Check contract addresses are correct
- Review browser console for errors

---

## Next Steps

After setup is complete:
1. Test all payment flows (listing, purchase, boost)
2. Verify backend transaction listeners are working
3. Check transaction verification in database
4. Test ETH/SOL conversion rates

