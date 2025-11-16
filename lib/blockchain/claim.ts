import { createWalletClient, createPublicClient, http, parseEther, formatEther } from 'viem';
import { localArbitrum } from '@/lib/wagmi';
import { Connection, PublicKey, Transaction, SystemProgram, Keypair } from '@solana/web3.js';
import { PLATFORM_ETH_ADDRESS, PLATFORM_SOL_ADDRESS } from './payment';

// Platform wallet private key (for local testing - in production, use secure key management)
// This is Account #0 from Hardhat's default accounts
const PLATFORM_PRIVATE_KEY = process.env.PLATFORM_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC || 'http://127.0.0.1:8899';

export interface ClaimParams {
  to: string; // Recipient wallet address
  amount: string; // Amount in ETH or SOL (as string)
  paymentMethod: 'eth' | 'sol';
}

/**
 * Send ETH from platform wallet to seller's wallet
 */
export async function sendEthClaim(params: ClaimParams): Promise<`0x${string}`> {
  const { to, amount } = params;

  if (!to || !/^0x[a-fA-F0-9]{40}$/.test(to)) {
    throw new Error('Invalid Ethereum address');
  }

  const rpcUrl = process.env.NEXT_PUBLIC_ARBITRUM_RPC || 'http://127.0.0.1:8545';

  // Create public client for reading
  const publicClient = createPublicClient({
    chain: localArbitrum,
    transport: http(rpcUrl),
  });

  // Create wallet client for sending (using platform's private key)
  // Import privateKeyToAccount from viem
  const { privateKeyToAccount } = await import('viem/accounts');
  const account = privateKeyToAccount(PLATFORM_PRIVATE_KEY as `0x${string}`);
  
  const walletClient = createWalletClient({
    account,
    chain: localArbitrum,
    transport: http(rpcUrl),
  });

  // Check platform balance
  const balance = await publicClient.getBalance({
    address: PLATFORM_ETH_ADDRESS as `0x${string}`,
  });

  const amountWei = parseEther(amount);
  
  if (balance < amountWei) {
    throw new Error(`Insufficient platform balance. Required: ${formatEther(amountWei)} ETH, Available: ${formatEther(balance)} ETH`);
  }

  console.log(`Sending ${amount} ETH from platform (${PLATFORM_ETH_ADDRESS}) to seller (${to})`);

  // Send transaction
  const hash = await walletClient.sendTransaction({
    to: to as `0x${string}`,
    value: amountWei,
  });

  console.log(`ETH claim transaction hash: ${hash}`);
  return hash;
}

/**
 * Send SOL from platform wallet to seller's wallet
 */
export async function sendSolClaim(params: ClaimParams): Promise<string> {
  const { to, amount } = params;

  if (!to || to.length < 32) {
    throw new Error('Invalid Solana address');
  }

  const connection = new Connection(SOLANA_RPC, 'confirmed');

  // Platform wallet keypair (for local testing)
  // In production, load from secure storage
  // Default: Private key for address 12SogrSHvLfLV9jnjDmhjgq1tgGBcGvFXvSv1XNAhWR7
  const DEFAULT_SOL_PRIVATE_KEY = '4R2d6QadyG1A2sPgznKhxcGXtJaaZsgPuDn97XG4N93hVJMTYF6LSqswGKxyY8nsKZqMr7u4VZdnwLngDMLcKY4H';
  
  let platformKeypair: Keypair;
  try {
    const platformPrivateKey = process.env.PLATFORM_SOL_PRIVATE_KEY || DEFAULT_SOL_PRIVATE_KEY;
    
    // Parse the private key (can be JSON array or base58 string)
    let privateKeyArray: number[];
    try {
      privateKeyArray = JSON.parse(platformPrivateKey);
    } catch {
      // If not JSON, try as base58 (Solana format)
      const bs58 = await import('bs58');
      const decoded = bs58.default.decode(platformPrivateKey);
      privateKeyArray = Array.from(decoded);
    }
    platformKeypair = Keypair.fromSecretKey(Uint8Array.from(privateKeyArray));
    
    // Verify the public key matches expected address
    if (platformKeypair.publicKey.toString() !== PLATFORM_SOL_ADDRESS) {
      console.warn(`Warning: Platform SOL public key (${platformKeypair.publicKey.toString()}) does not match expected address (${PLATFORM_SOL_ADDRESS})`);
    }
  } catch (error: any) {
    throw new Error(`Failed to load platform wallet: ${error.message || error}`);
  }

  const recipientPubkey = new PublicKey(to);
  const amountLamports = Math.floor(parseFloat(amount) * 1e9);

  // Check platform balance
  const balance = await connection.getBalance(platformKeypair.publicKey);
  if (balance < amountLamports) {
    throw new Error(`Insufficient platform balance. Required: ${amount} SOL, Available: ${balance / 1e9} SOL`);
  }

  console.log(`Sending ${amount} SOL from platform (${platformKeypair.publicKey.toString()}) to seller (${to})`);

  // Create and send transaction
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: platformKeypair.publicKey,
      toPubkey: recipientPubkey,
      lamports: amountLamports,
    })
  );

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
  transaction.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;
  transaction.feePayer = platformKeypair.publicKey;

  // Sign transaction
  transaction.sign(platformKeypair);

  // Send transaction
  const signature = await connection.sendRawTransaction(transaction.serialize(), {
    skipPreflight: false,
  });

  // Wait for confirmation
  await connection.confirmTransaction(signature, 'confirmed');

  console.log(`SOL claim transaction signature: ${signature}`);
  return signature;
}

