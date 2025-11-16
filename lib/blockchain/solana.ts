import { Connection, PublicKey, Transaction, SystemProgram, Keypair, sendAndConfirmTransaction } from '@solana/web3.js';
import { convertEthToSol } from './payment';

// Platform wallet address for receiving payments
const PLATFORM_SOL_ADDRESS = process.env.NEXT_PUBLIC_PLATFORM_SOL_ADDRESS || '11111111111111111111111111111111';

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
  const platformPubkey = new PublicKey(PLATFORM_SOL_ADDRESS);

  // Create transaction
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: from,
      toPubkey: platformPubkey,
      lamports,
    })
  );

  // Set recent blockhash
  const { blockhash } = await conn.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
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

