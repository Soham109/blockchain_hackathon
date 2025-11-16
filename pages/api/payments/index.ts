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

    const payments = await db
      .collection('payments')
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();

    // Populate product details for payments
    const paymentsWithDetails = await Promise.all(
      payments.map(async (payment) => {
        let product = null;
        if (payment.productId) {
          const { ObjectId } = require('mongodb');
          const productId = typeof payment.productId === 'string' ? new ObjectId(payment.productId) : payment.productId;
          product = await db.collection('products').findOne({ _id: productId });
        }
        return {
          ...payment,
          productTitle: product?.title || 'N/A',
          productId: payment.productId ? String(payment.productId) : null,
        };
      })
    );

    return res.status(200).json({ payments: paymentsWithDetails });
  } catch (err: any) {
    console.error('Payments error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch payments' });
  }
}

