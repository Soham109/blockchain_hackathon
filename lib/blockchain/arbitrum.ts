import { createWalletClient, custom, parseEther } from 'viem';
import { localArbitrum } from '@/lib/wagmi';

// Type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Platform wallet address for receiving payments
// Default: Account #0 from local Hardhat/Anvil node
const PLATFORM_ADDRESS = process.env.NEXT_PUBLIC_PLATFORM_ETH_ADDRESS || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

export interface PaymentParams {
  from: `0x${string}`;
  amount: string; // Amount in ETH (as string)
  paymentId: string; // Unique payment identifier
}

/**
 * Send ETH payment on Arbitrum (local network)
 * This sends ETH directly to the platform wallet
 */
export async function sendArbitrumPayment(params: PaymentParams): Promise<`0x${string}`> {
  const { from, amount, paymentId } = params;

  // Get wallet client from window.ethereum (MetaMask or Gemini Wallet)
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('Wallet not found. Please install MetaMask or Gemini Wallet extension.');
  }

  // Switch to local network if needed
  try {
    const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
    const targetChainId = `0x${localArbitrum.id.toString(16)}`; // Convert 31337 to 0x7a69
    
    if (currentChainId !== targetChainId) {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChainId }],
      });
    }
  } catch (switchError: any) {
    // If chain doesn't exist, add it
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${localArbitrum.id.toString(16)}`,
          chainName: localArbitrum.name,
          nativeCurrency: localArbitrum.nativeCurrency,
          rpcUrls: [localArbitrum.rpcUrls.default.http[0]],
        }],
      });
    } else {
      throw switchError;
    }
  }

  const client = createWalletClient({
    account: from as `0x${string}`,
    chain: localArbitrum,
    transport: custom(window.ethereum),
  });

  // Convert amount to wei
  const amountWei = parseEther(amount);

  // Send transaction
  const hash = await client.sendTransaction({
    to: PLATFORM_ADDRESS as `0x${string}`,
    value: amountWei,
    data: `0x${Buffer.from(paymentId).toString('hex')}` as `0x${string}`, // Include payment ID in data
  });

  return hash;
}

/**
 * Verify transaction on Arbitrum
 */
export async function verifyArbitrumTransaction(txHash: `0x${string}`): Promise<boolean> {
  try {
    const response = await fetch(process.env.NEXT_PUBLIC_ARBITRUM_RPC || 'http://127.0.0.1:8545', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionReceipt',
        params: [txHash],
        id: 1,
      }),
    });

    const data = await response.json();
    if (data.result && data.result.status === '0x1') {
      return true;
    }
    return false;
  } catch (error) {
    console.error('Transaction verification failed:', error);
    return false;
  }
}

