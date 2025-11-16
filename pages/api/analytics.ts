import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const session: any = await getServerSession(req, res, authOptions as any);
  if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const db = await getDb();
    const { userId, range = '30d' } = req.query as any;
    const requestedUserId = userId || session.user.id;

    // Verify user can access this analytics
    if (requestedUserId !== session.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const user = await db.collection('users').findOne({ _id: new ObjectId(requestedUserId) });
    const isSeller = user?.role === 'seller';

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case 'all':
        startDate = new Date(0);
        break;
    }

    // Previous period for comparison
    const periodLength = now.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - periodLength);
    const prevEndDate = startDate;

    if (isSeller) {
      // Seller analytics
      const products = await db
        .collection('products')
        .find({ sellerId: requestedUserId })
        .toArray();

      const orders = await db
        .collection('orders')
        .find({ sellerId: requestedUserId })
        .toArray();

      // Current period
      const currentOrders = orders.filter(o => new Date(o.createdAt) >= startDate);
      const totalRevenue = currentOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
      const productsSold = currentOrders.length;
      const activeListings = products.filter(p => p.status !== 'sold').length;

      // Previous period
      const prevOrders = orders.filter(
        o => new Date(o.createdAt) >= prevStartDate && new Date(o.createdAt) < prevEndDate
      );
      const prevRevenue = prevOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
      const prevSold = prevOrders.length;

      // Views (mock for now)
      const totalViews = products.reduce((sum, p) => sum + (p.views || 0), 0);

      return res.status(200).json({
        totalRevenue,
        productsSold,
        totalViews,
        activeListings,
        revenueChange: prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : 0,
        soldChange: prevSold > 0 ? productsSold - prevSold : productsSold,
        viewsChange: 0, // Mock
        listingsChange: 0, // Mock
      });
    } else {
      // Buyer analytics
      const orders = await db
        .collection('orders')
        .find({ buyerId: requestedUserId })
        .toArray();

      const wishlist = await db
        .collection('wishlists')
        .findOne({ userId: requestedUserId });

      const messages = await db
        .collection('messages')
        .countDocuments({ $or: [{ senderId: requestedUserId }, { receiverId: requestedUserId }] });

      const currentOrders = orders.filter(o => new Date(o.createdAt) >= startDate);
      const totalSpent = currentOrders.reduce((sum, o) => sum + (o.amount || 0), 0);

      return res.status(200).json({
        itemsPurchased: currentOrders.length,
        wishlistCount: wishlist?.productIds?.length || 0,
        messageCount: messages,
        totalSpent,
      });
    }
  } catch (err) {
    console.error('Analytics error:', err);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
}

