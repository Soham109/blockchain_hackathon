import { Connection, PublicKey, Transaction, SystemProgram, Keypair, sendAndConfirmTransaction } from '@solana/web3.js';
import { convertEthToSol } from './payment';

// Platform wallet address for receiving payments
// Using a valid Solana address for local testing (generated keypair public key)
// In production, this should be set via environment variable
const PLATFORM_SOL_ADDRESS = '12SogrSHvLfLV9jnjDmhjgq1tgGBcGvFXvSv1XNAhWR7';

const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC || 'http://127.0.0.1:8899';

export interface SolanaPaymentParams {
  from: PublicKey;
  amountEth: string; // Amount in ETH
  paymentId: string; // Unique payment identifier
}

/**
 * Send SOL payment on Solana (local network)
 * Converts ETH amount to SOL and sends to platform wallet
 */
export async function sendSolanaPayment(
  params: SolanaPaymentParams,
  signTransaction: (transaction: Transaction) => Promise<Transaction>,
  connection: any
): Promise<string> {
  const { from, amountEth, paymentId } = params;

  // Convert ETH to SOL using current market rate
  const solAmount = await convertEthToSol(amountEth);
  const lamports = Math.floor(parseFloat(solAmount) * 1e9); // Convert to lamports

  const conn = connection || new Connection(SOLANA_RPC, 'confirmed');
  
  // Validate and create platform public key
  let platformPubkey: PublicKey;
  try {
    platformPubkey = new PublicKey(PLATFORM_SOL_ADDRESS);
  } catch (error) {
    throw new Error(`Invalid platform SOL address: ${PLATFORM_SOL_ADDRESS}. Please set NEXT_PUBLIC_PLATFORM_SOL_ADDRESS to a valid Solana address.`);
  }

  // Verify the address is not the System Program
  if (platformPubkey.equals(SystemProgram.programId)) {
    throw new Error('Platform address cannot be the System Program. Please set NEXT_PUBLIC_PLATFORM_SOL_ADDRESS to a valid wallet address.');
  }

  // Check if recipient account exists, if not it will be created automatically
  const recipientBalance = await conn.getBalance(platformPubkey).catch(() => 0);
  console.log(`Platform wallet balance: ${recipientBalance / 1e9} SOL`);

  // Create transaction
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: from,
      toPubkey: platformPubkey,
      lamports,
    })
  );

  // Get recent blockhash with proper commitment level
  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash('finalized');
  transaction.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;
  transaction.feePayer = from;

  // Sign and send transaction
  const signedTransaction = await signTransaction(transaction);
  const signature = await conn.sendRawTransaction(signedTransaction.serialize());

  // Wait for confirmation
  await conn.confirmTransaction(signature, 'confirmed');

  return signature;
}

/**
 * Verify transaction on Solana
 */
export async function verifySolanaTransaction(signature: string): Promise<boolean> {
  try {
    const connection = new Connection(SOLANA_RPC, 'confirmed');
    const status = await connection.getSignatureStatus(signature);
    
    if (status.value && status.value.err === null) {
      return true;
    }
    return false;
  } catch (error) {
    console.error('Transaction verification failed:', error);
    return false;
  }
}

