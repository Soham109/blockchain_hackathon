import { createConfig, http } from 'wagmi';
import { defineChain } from 'viem';
import { injected } from 'wagmi/connectors';

// Local Arbitrum-compatible chain (Chain ID: 31337)
export const localArbitrum = defineChain({
  id: 1337,
  name: 'Local Arbitrum',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_ARBITRUM_RPC || 'http://127.0.0.1:8545'],
    },
  },
  blockExplorers: {
    default: { name: 'Local Arbitrum', url: 'http://localhost:8545' },
  },
});

export const config = createConfig({
  chains: [localArbitrum],
  connectors: [
    // Use injected connector instead of metaMask() to avoid SDK initialization errors
    // The injected connector automatically detects MetaMask, Gemini Wallet, and other injected wallets
    // This prevents the "Cannot read properties of undefined (reading 'on')" error
    injected({
      // This will detect any injected wallet including MetaMask and Gemini Wallet
      // MetaMask injects window.ethereum, so it will be detected automatically
    }),
  ],
  transports: {
    [localArbitrum.id]: http(process.env.NEXT_PUBLIC_ARBITRUM_RPC || 'http://127.0.0.1:8545'),
  },
  ssr: true,
});
