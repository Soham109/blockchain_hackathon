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

  console.log('=== sendArbitrumPayment called ===');
  console.log('From:', from);
  console.log('Amount:', amount);
  console.log('Payment ID:', paymentId);

  // Get wallet client from window.ethereum (MetaMask or Gemini Wallet)
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('Wallet not found. Please install MetaMask or Gemini Wallet extension.');
  }

  console.log('Wallet found, requesting account access...');

  // Request account access to ensure MetaMask is ready
  let accountToUse = from;
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    console.log('Accounts:', accounts);
    
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found. Please unlock MetaMask and try again.');
    }
    
    // Use the currently connected account from MetaMask
    const connectedAccount = accounts[0];
    accountToUse = connectedAccount as `0x${string}`;
    
    // Verify the from address matches the connected account
    if (from.toLowerCase() !== connectedAccount.toLowerCase()) {
      console.warn('Address mismatch. Connected:', connectedAccount, 'Requested:', from);
      console.log('Using connected account from MetaMask:', connectedAccount);
    }
  } catch (requestError: any) {
    console.error('Account request error:', requestError);
    if (requestError.code === 4001) {
      throw new Error('Please connect your wallet in MetaMask and try again.');
    }
    throw new Error(`Failed to connect to wallet: ${requestError.message || 'Unknown error'}`);
  }

  // Switch to local network if needed
  try {
    const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
    const targetChainId = `0x${localArbitrum.id.toString(16)}`; // Convert 31337 to 0x7a69
    console.log('Current chain ID:', currentChainId, 'Target:', targetChainId);
    
    if (currentChainId !== targetChainId) {
      console.log('Switching network...');
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChainId }],
      });
      console.log('Network switched successfully');
    }
  } catch (switchError: any) {
    console.error('Network switch error:', switchError);
    // If chain doesn't exist, add it
    if (switchError.code === 4902) {
      console.log('Adding network...');
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${localArbitrum.id.toString(16)}`,
          chainName: localArbitrum.name,
          nativeCurrency: localArbitrum.nativeCurrency,
          rpcUrls: [localArbitrum.rpcUrls.default.http[0]],
        }],
      });
      console.log('Network added successfully');
    } else {
      throw switchError;
    }
  }

  console.log('Creating wallet client with account:', accountToUse);
  const client = createWalletClient({
    account: accountToUse,
    chain: localArbitrum,
    transport: custom(window.ethereum),
  });

  // Convert amount to wei
  const amountWei = parseEther(amount);
  console.log('Amount in wei:', amountWei.toString());

  // Send transaction
  try {
    console.log('Sending transaction...');
    console.log('To:', PLATFORM_ADDRESS);
    console.log('Value:', amountWei.toString());
    console.log('Data:', `0x${Buffer.from(paymentId).toString('hex')}`);
    
    // Try using viem's sendTransaction first
    let hash: `0x${string}`;
    
    try {
      hash = await client.sendTransaction({
        to: PLATFORM_ADDRESS as `0x${string}`,
        value: amountWei,
        data: `0x${Buffer.from(paymentId).toString('hex')}` as `0x${string}`, // Include payment ID in data
      });
      console.log('Transaction hash received via viem:', hash);
    } catch (viemError: any) {
      // If viem fails, try direct MetaMask request
      console.warn('Viem sendTransaction failed, trying direct MetaMask request:', viemError);
      
      const txData = {
        from: accountToUse,
        to: PLATFORM_ADDRESS,
        value: `0x${amountWei.toString(16)}`,
        data: `0x${Buffer.from(paymentId).toString('hex')}`,
      };
      
      console.log('Sending via direct MetaMask request:', txData);
      
      hash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [txData],
      }) as `0x${string}`;
      
      console.log('Transaction hash received via direct request:', hash);
    }

    return hash;
  } catch (error: any) {
    console.error('Transaction error:', error);
    console.error('Error code:', error?.code);
    console.error('Error message:', error?.message);
    console.error('Full error:', JSON.stringify(error, null, 2));
    
    // Handle user rejection
    if (error?.code === 4001 || error?.message?.includes('User rejected') || error?.message?.includes('rejected')) {
      throw new Error('Transaction was rejected. Please approve the transaction in MetaMask to complete the payment.');
    }
    
    // Handle authorization errors - this means MetaMask didn't prompt
    if (error?.message?.includes('not been authorized') || error?.message?.includes('authorized') || error?.code === 4100) {
      console.error('Authorization error - MetaMask prompt may not have appeared');
      throw new Error('MetaMask prompt did not appear. Please try: 1) Refresh the page, 2) Check if MetaMask is unlocked, 3) Make sure you\'re on the correct network.');
    }
    
    // Handle insufficient funds
    if (error?.message?.includes('insufficient funds') || error?.code === -32000) {
      throw new Error('Insufficient funds. Please ensure you have enough ETH in your wallet.');
    }
    
    // Handle network errors
    if (error?.message?.includes('network') || error?.code === 'NETWORK_ERROR') {
      throw new Error('Network error. Please check your connection and try again.');
    }
    
    // Handle case where transaction wasn't sent (no prompt appeared)
    if (error?.message?.includes('User rejected the request') === false && !error?.code) {
      console.error('Transaction failed without user interaction - MetaMask prompt likely did not appear');
      throw new Error('MetaMask prompt did not appear. Please refresh the page and try again. Make sure MetaMask is unlocked and connected.');
    }
    
    // Generic error with original message if it's helpful
    const errorMessage = error?.message || error?.toString() || 'Transaction failed';
    throw new Error(`Payment failed: ${errorMessage}`);
  }
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

