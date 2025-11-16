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

    const orders = await db
      .collection('orders')
      .find({ buyerId: userId })
      .sort({ createdAt: -1 })
      .toArray();

    // Populate product details and payment info
    const ordersWithProducts = await Promise.all(
      orders.map(async (order) => {
        const { ObjectId } = require('mongodb');
        const productId = typeof order.productId === 'string' ? new ObjectId(order.productId) : order.productId;
        const product = await db.collection('products').findOne({ _id: productId });
        
        // Find related payment record
        const payment = await db.collection('payments').findOne({
          userId: userId,
          productId: productId,
          type: 'purchase',
        });
        
        return {
          ...order,
          productTitle: product?.title || 'Unknown Product',
          paymentMethod: payment?.paymentMethod || order.paymentMethod,
          txHash: payment?.txHash || null,
          verified: payment?.verified || false,
        };
      })
    );

    return res.status(200).json({ orders: ordersWithProducts });
  } catch (err) {
    console.error('Orders error:', err);
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
}

