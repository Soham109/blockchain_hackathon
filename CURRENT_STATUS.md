# Current Setup Status

## ✅ Completed Automatically:
- Solana CLI installed
- Environment variables configured
- Code ready

## 📝 Your Wallet Information:
- **Ethereum (MetaMask)**: `0x05cbbefc67fd488920d1d571b3079b63ddb49bd2`
- **Solana (Phantom)**: `12SogrSHvLfLV9jnjDmhjgq1tgGBcGvFXvSv1XNAhWR7`

## ⚠️ What Needs to Be Done:

### 1. Start Local Blockchain Nodes

**Terminal 1 - Arbitrum Node:**
```bash
cd /Users/sohamaggarwal/blockchain_hackathon
npx hardhat node
```

**Terminal 2 - Solana Validator:**
```bash
solana-test-validator
```

**Status Check:**
- [ ] Arbitrum node running on port 8545
- [ ] Solana validator running on port 8899

---

### 2. Fund Phantom Wallet

Once Solana validator is running, run:
```bash
solana airdrop 10 12SogrSHvLfLV9jnjDmhjgq1tgGBcGvFXvSv1XNAhWR7
```

**Status Check:**
- [ ] Phantom wallet funded with SOL

---

### 3. Configure MetaMask

1. Open MetaMask
2. Add network:
   - Name: `Local Arbitrum`
   - RPC: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Symbol: `ETH`
3. Switch to this network

**Status Check:**
- [ ] MetaMask configured for local network

---

### 4. Configure Phantom

1. Open Phantom
2. Enable Developer Mode
3. Add custom network:
   - Name: `Local Solana`
   - RPC: `http://127.0.0.1:8899`
4. Switch to this network

**Status Check:**
- [ ] Phantom configured for local network

---

### 5. Start Application

```bash
npm run dev
```

**Status Check:**
- [ ] App running at http://localhost:3000

---

## 🎯 Next: Test Wallet Connections

Once everything is set up, we'll test:
1. Connect MetaMask
2. Connect Phantom
3. Test payment flows

---

**Tell me which steps you've completed and we'll proceed!** 🚀

