import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { getDb } from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const session: any = await getServerSession(req, res, authOptions as any);
  if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const db = await getDb();
    const userId = String(session.user.id);

    // Get recent activities from various sources
    const activities: any[] = [];

    // Recent products
    const recentProducts = await db
      .collection('products')
      .find({ sellerId: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    recentProducts.forEach((product) => {
      activities.push({
        _id: `product_${product._id}`,
        type: 'product_created',
        title: 'New listing created',
        description: product.title,
        createdAt: product.createdAt,
        link: `/products/${product._id}`,
      });
    });

    // Recent orders
    const recentOrders = await db
      .collection('orders')
      .find({ buyerId: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    recentOrders.forEach((order) => {
      activities.push({
        _id: `order_${order._id}`,
        type: 'order',
        title: 'Order completed',
        description: `Order #${order._id.toString().slice(-8)}`,
        createdAt: order.createdAt,
        link: `/orders`,
      });
    });

    // Sort by date and limit
    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const limited = activities.slice(0, 20);

    return res.status(200).json({ activities: limited });
  } catch (err) {
    console.error('Activity error:', err);
    return res.status(500).json({ error: 'Failed to fetch activity' });
  }
}

