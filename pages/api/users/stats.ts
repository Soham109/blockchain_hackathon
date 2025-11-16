import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { getDb } from '../../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const session: any = await getServerSession(req, res, authOptions as any);
  if (!session?.user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const db = await getDb();
    const userId = String(session.user.id);

    // Fetch user's recent products
    const recentProducts = await db
      .collection('products')
      .find({ sellerId: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    // Count total listings
    const totalListings = await db
      .collection('products')
      .countDocuments({ sellerId: userId });

    // Count messages
    const totalMessages = await db
      .collection('messages')
      .countDocuments({ 
        $or: [
          { senderId: userId },
          { receiverId: userId }
        ]
      });

    // Count wishlist saves (products in user's wishlist)
    const totalWishlists = await db
      .collection('wishlist')
      .countDocuments({ userId });

    // Count total views (placeholder - you can implement view tracking)
    const totalViews = 0; // TODO: Implement view tracking

    // Fetch user's orders (buyer)
    const orderCount = await db
      .collection('orders')
      .countDocuments({ buyerId: userId });

    res.status(200).json({
      recentProducts,
      orderCount,
      totalListings,
      totalMessages,
      totalWishlists,
      totalViews,
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
}
