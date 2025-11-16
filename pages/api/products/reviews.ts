import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = await getDb();
  const { productId } = req.method === 'GET' ? req.query as any : req.body;

  if (req.method === 'GET') {
    if (!productId) {
      return res.status(400).json({ error: 'productId is required' });
    }
    // Get reviews for a product
    const reviews = await db.collection('reviews')
      .find({ productId: String(productId) })
      .sort({ createdAt: -1 })
      .toArray();

    // Calculate average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    return res.status(200).json({ reviews, averageRating: avgRating, totalReviews: reviews.length });
  }

  if (req.method === 'POST') {
    const session: any = await getServerSession(req, res, authOptions as any);
    if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

    const { productId, rating, comment } = req.body;
    if (!productId) {
      return res.status(400).json({ error: 'productId is required' });
    }
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if user already reviewed
    const existing = await db.collection('reviews').findOne({
      productId: String(productId),
      userId: String(session.user.id)
    });

    if (existing) {
      // Update existing review
      await db.collection('reviews').updateOne(
        { _id: existing._id },
        { $set: { rating, comment, updatedAt: new Date() } }
      );
      return res.status(200).json({ ok: true, message: 'Review updated' });
    }

    // Create new review
    await db.collection('reviews').insertOne({
      productId: String(productId),
      userId: String(session.user.id),
      userEmail: session.user.email,
      rating,
      comment: comment || '',
      createdAt: new Date()
    });

    return res.status(201).json({ ok: true });
  }

  res.setHeader('Allow', 'GET,POST');
  res.status(405).end();
}

