import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const { id } = req.query as any;
  if (!id) return res.status(400).json({ error: 'User ID required' });

  try {
    const db = await getDb();
    
    // Get user
    const user = await db.collection('users').findOne({ _id: new ObjectId(id) });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Get user's products
    const products = await db
      .collection('products')
      .find({ sellerId: id })
      .sort({ createdAt: -1 })
      .toArray();

    // Remove sensitive data
    const { passwordHash, ...safeUser } = user;

    res.status(200).json({
      user: safeUser,
      products
    });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
}

