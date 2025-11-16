import { createConfig, http } from 'wagmi';
import { defineChain } from 'viem';
import { injected } from 'wagmi/connectors';
import { gemini } from '@gemini-wallet/wagmi';

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
    // Gemini Wallet connector (explicit support)
    gemini({
      appMetadata: {
        name: 'College Marketplace',
        description: 'Buy and sell items on campus',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com',
        icons: typeof window !== 'undefined' ? [`${window.location.origin}/icon.png`] : [],
      },
    }),
    // Injected connector for MetaMask and other wallets
    // This will detect MetaMask and other injected wallets
    injected({
      // This will detect any injected wallet including MetaMask
      // MetaMask injects window.ethereum, so it will be detected automatically
    }),
  ],
  transports: {
    [localArbitrum.id]: http(process.env.NEXT_PUBLIC_ARBITRUM_RPC || 'http://127.0.0.1:8545'),
  },
  ssr: true,
});
