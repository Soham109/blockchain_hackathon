import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { getDb } from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const session: any = await getServerSession(req, res, authOptions as any);
  if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const { productId, newProductId, type } = req.body;

    if (!productId || !newProductId || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const db = await getDb();
    const userId = String(session.user.id);

    // Update payment record with actual productId
    // For listing type, we need to find the most recent payment with the temporary productId
    // Find the most recent payment record for this user with the temporary productId
    const payment = await db.collection('payments').findOne(
      {
        userId: userId,
        productId: productId,
        type: type,
      },
      {
        sort: { createdAt: -1 } // Get the most recent one
      }
    );

    if (!payment) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    // Update it with the actual productId
    const updateResult = await db.collection('payments').updateOne(
      {
        _id: payment._id,
      },
      {
        $set: {
          productId: newProductId,
        },
      }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    return res.status(200).json({ success: true, message: 'Payment record updated' });
  } catch (error: any) {
    console.error('Update product ID error:', error);
    return res.status(500).json({ error: error.message || 'Failed to update payment record' });
  }
}

