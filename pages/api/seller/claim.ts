import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { getDb } from '@/lib/mongodb';
import { sendEthClaim, sendSolClaim } from '@/lib/blockchain/claim';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const session: any = await getServerSession(req, res, authOptions as any);
  if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const { paymentMethod, walletAddress, orderIds } = req.body;

    if (!paymentMethod || !walletAddress) {
      return res.status(400).json({ error: 'paymentMethod and walletAddress are required' });
    }

    if (paymentMethod !== 'eth' && paymentMethod !== 'sol') {
      return res.status(400).json({ error: 'paymentMethod must be "eth" or "sol"' });
    }

    // Validate wallet address format
    if (paymentMethod === 'eth' && !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ error: 'Invalid Ethereum address format' });
    }

    if (paymentMethod === 'sol' && walletAddress.length < 32) {
      return res.status(400).json({ error: 'Invalid Solana address format' });
    }

    const db = await getDb();
    const userId = String(session.user.id);

    // Get unclaimed orders for this seller with the specified payment method
    const query: any = {
      sellerId: userId,
      status: 'completed',
      paymentMethod,
      $or: [{ claimed: { $exists: false } }, { claimed: false }],
    };

    // If specific order IDs provided, filter by them
    if (orderIds && Array.isArray(orderIds) && orderIds.length > 0) {
      const { ObjectId } = require('mongodb');
      query._id = {
        $in: orderIds.map((id: string) => {
          if (typeof id === 'string' && id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) {
            return new ObjectId(id);
          }
          return id;
        }),
      };
    }

    const unclaimedOrders = await db.collection('orders').find(query).toArray();

    if (unclaimedOrders.length === 0) {
      return res.status(400).json({ error: 'No unclaimed orders found' });
    }

    // Calculate total amount to claim
    const totalAmount = unclaimedOrders.reduce((sum: number, o: any) => sum + (parseFloat(o.amount) || 0), 0);

    // Send actual blockchain transaction from platform wallet to seller
    let claimTxHash: string;
    try {
      if (paymentMethod === 'eth') {
        claimTxHash = await sendEthClaim({
          to: walletAddress,
          amount: totalAmount.toString(),
          paymentMethod: 'eth',
        });
      } else {
        claimTxHash = await sendSolClaim({
          to: walletAddress,
          amount: totalAmount.toString(),
          paymentMethod: 'sol',
        });
      }
    } catch (blockchainError: any) {
      console.error('Blockchain transaction failed:', blockchainError);
      return res.status(500).json({
        error: `Failed to send payment: ${blockchainError.message || 'Blockchain transaction failed'}`,
      });
    }

    // Mark orders as claimed with real transaction hash
    const { ObjectId } = require('mongodb');
    const orderIdsToUpdate = unclaimedOrders.map((o: any) => o._id);

    await db.collection('orders').updateMany(
      { _id: { $in: orderIdsToUpdate } },
      {
        $set: {
          claimed: true,
          claimedAt: new Date(),
          claimTxHash,
          claimWalletAddress: walletAddress,
        },
      }
    );

    // Create a claim record
    await db.collection('claims').insertOne({
      sellerId: userId,
      sellerEmail: (session.user as any)?.email,
      paymentMethod,
      walletAddress,
      amount: totalAmount,
      orderIds: orderIdsToUpdate.map((id: any) => String(id)),
      orderCount: unclaimedOrders.length,
      txHash: claimTxHash,
      status: 'completed',
      createdAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: `Successfully sent ${totalAmount} ${paymentMethod.toUpperCase()} to your wallet`,
      amount: totalAmount,
      orderCount: unclaimedOrders.length,
      claimTxHash,
    });
  } catch (err: any) {
    console.error('Claim error:', err);
    return res.status(500).json({ error: err.message || 'Failed to claim earnings' });
  }
}

