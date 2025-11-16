import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyArbitrumTransaction } from '@/lib/blockchain/arbitrum';
import { verifySolanaTransaction } from '@/lib/blockchain/solana';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { txHash, paymentMethod } = req.body;

    if (!txHash || !paymentMethod) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let verified = false;

    if (paymentMethod === 'eth') {
      // Verify Arbitrum transaction
      verified = await verifyArbitrumTransaction(txHash as `0x${string}`);
    } else if (paymentMethod === 'sol') {
      // Verify Solana transaction
      verified = await verifySolanaTransaction(txHash);
    } else {
      return res.status(400).json({ error: 'Invalid payment method' });
    }

    if (verified) {
      return res.status(200).json({ 
        verified: true,
        txHash,
        message: 'Transaction verified on blockchain'
      });
    } else {
      return res.status(400).json({ 
        verified: false,
        error: 'Transaction not found or not confirmed'
      });
    }
  } catch (error: any) {
    console.error('Transaction verification error:', error);
    return res.status(500).json({ 
      verified: false,
      error: error.message || 'Failed to verify transaction' 
    });
  }
}

