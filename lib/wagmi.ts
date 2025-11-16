import { createConfig, http } from 'wagmi';
import { defineChain } from 'viem';
import { injected, metaMask } from 'wagmi/connectors';

// Local Arbitrum-compatible chain
export const localArbitrum = defineChain({
  id: 31337,
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
    default: { name: 'Local', url: 'http://localhost:8545' },
  },
});

export const config = createConfig({
  chains: [localArbitrum],
  connectors: [
    metaMask(), // MetaMask connector (primary for testing)
    injected({
      // This will detect any injected wallet including Gemini Wallet
      // Gemini Wallet injects window.ethereum like MetaMask
      // Note: Gemini doesn't support testnets, so this is for mainnet only
    }),
  ],
  transports: {
    [localArbitrum.id]: http(process.env.NEXT_PUBLIC_ARBITRUM_RPC || 'http://127.0.0.1:8545'),
  },
});
