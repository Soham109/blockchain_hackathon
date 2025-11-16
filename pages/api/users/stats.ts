import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { getDb } from '../../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const session = await getSession({ req });
  if (!session?.user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const db = await getDb();
    const userId = (session.user as any).id;

    // Fetch user's recent products
    const recentProducts = await db
      .collection('products')
      .find({ seller: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    // Fetch user's orders (buyer)
    const orders = await db
      .collection('orders')
      .countDocuments({ buyer: userId });

    res.status(200).json({
      recentProducts,
      orderCount: orders,
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
}
