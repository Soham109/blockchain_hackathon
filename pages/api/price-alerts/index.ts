import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { getDb } from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session: any = await getServerSession(req, res, authOptions as any);
  if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const db = await getDb();
    const userId = String(session.user.id);

    if (req.method === 'GET') {
      const { productId } = req.query as any;
      const filter: any = { userId };
      if (productId) filter.productId = productId;

      const alerts = await db.collection('priceAlerts').find(filter).toArray();
      return res.status(200).json({ alerts });
    }

    if (req.method === 'POST') {
      const { productId, targetPrice } = req.body;
      if (!productId || !targetPrice) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check if alert already exists
      const existing = await db.collection('priceAlerts').findOne({ userId, productId });
      if (existing) {
        await db.collection('priceAlerts').updateOne(
          { _id: existing._id },
          { $set: { targetPrice, updatedAt: new Date() } }
        );
        return res.status(200).json({ alert: { ...existing, targetPrice } });
      }

      const alert = {
        userId,
        productId,
        targetPrice: Number(targetPrice),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.collection('priceAlerts').insertOne(alert);
      return res.status(201).json({ alert });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Price alert error:', err);
    return res.status(500).json({ error: 'Failed to process request' });
  }
}

