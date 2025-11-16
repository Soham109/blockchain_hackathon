import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { getDb } from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const session: any = await getServerSession(req, res, authOptions as any);
  if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const db = await getDb();
    const userId = String(session.user.id);

    // Get all orders for this seller
    const orders = await db
      .collection('orders')
      .find({ sellerId: userId })
      .sort({ createdAt: -1 })
      .toArray();

    // Get related payment information
    const ordersWithDetails = await Promise.all(
      orders.map(async (order: any) => {
        const { ObjectId } = require('mongodb');
        const productId = typeof order.productId === 'string' ? new ObjectId(order.productId) : order.productId;
        
        // Get payment record
        const payment = await db.collection('payments').findOne({
          productId: String(productId),
          type: 'purchase',
        });

        return {
          _id: order._id,
          productId: order.productId,
          productTitle: order.productTitle || 'Unknown Product',
          buyerId: order.buyerId,
          buyerEmail: order.buyerEmail,
          amount: order.amount,
          paymentMethod: order.paymentMethod,
          status: order.status,
          claimed: order.claimed || false,
          claimedAt: order.claimedAt,
          claimTxHash: order.claimTxHash,
          paymentTxHash: payment?.txHash || null,
          createdAt: order.createdAt,
          completedAt: order.completedAt,
        };
      })
    );

    return res.status(200).json({ orders: ordersWithDetails });
  } catch (err: any) {
    console.error('Seller orders error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch orders' });
  }
}

