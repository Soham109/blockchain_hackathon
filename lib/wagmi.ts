import { createConfig, http } from 'wagmi';
import { arbitrum } from 'wagmi/chains';
import { injected, metaMask } from 'wagmi/connectors';

export const config = createConfig({
  chains: [arbitrum],
  connectors: [
    injected(),
    metaMask(),
  ],
  transports: {
    [arbitrum.id]: http(),
  },
});
