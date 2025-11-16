# Fix Phantom Network Configuration

## The Issue:
Phantom is showing: "Could not fetch chain ID. Is your RPC URL correct?"

## The Fix:

### Use the FULL URL with `http://` protocol:

**In the "Default RPC URL" field, enter:**
```
http://127.0.0.1:8899
```

**NOT just:**
```
127.0.0.1:8899
```

---

## Complete Phantom Configuration:

1. **Network name**: `Local Solana` (or any name you prefer)

2. **Default RPC URL**: `http://127.0.0.1:8899` ⚠️ **Must include http://**

3. **Chain ID**: Leave empty (Solana doesn't use Chain ID like Ethereum)

4. **Currency symbol**: `SOL`

5. **Block explorer URL**: Leave empty (or use: `http://localhost:8899`)

6. Click **"Save"**

---

## After Saving:

- Switch to the "Local Solana" network
- Your wallet should show your balance (10 SOL)
- You're ready to test payments!

---

**Try entering `http://127.0.0.1:8899` (with http://) and it should work!** ✅

