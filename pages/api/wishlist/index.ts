import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session: any = await getServerSession(req, res, authOptions as any);
  if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

  const db = await getDb();
  const userId = String(session.user.id);

  if (req.method === 'GET') {
    // Get user's wishlist
    const wishlist = await db.collection('wishlist').find({ userId }).toArray();
    const productIds = wishlist.map(w => new ObjectId(w.productId));
    const products = await db.collection('products').find({ _id: { $in: productIds } }).toArray();
    return res.status(200).json({ products });
  }

  if (req.method === 'POST') {
    // Add to wishlist
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId required' });

    const existing = await db.collection('wishlist').findOne({ userId, productId });
    if (existing) {
      return res.status(200).json({ message: 'Already in wishlist' });
    }

    await db.collection('wishlist').insertOne({
      userId,
      productId,
      createdAt: new Date()
    });

    return res.status(201).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    // Remove from wishlist
    const { productId } = req.query as any;
    if (!productId) return res.status(400).json({ error: 'productId required' });

    await db.collection('wishlist').deleteOne({ userId, productId });
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'GET,POST,DELETE');
  res.status(405).end();
}

