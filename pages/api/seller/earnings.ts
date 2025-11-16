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

    // Get all orders for this seller
    const orders = await db
      .collection('orders')
      .find({ sellerId: userId, status: 'completed' })
      .sort({ createdAt: -1 })
      .toArray();

    // Separate claimed and unclaimed orders
    const unclaimedOrders = orders.filter((o: any) => !o.claimed);
    const claimedOrders = orders.filter((o: any) => o.claimed);

    // Calculate totals
    const totalEarnings = orders.reduce((sum: number, o: any) => sum + (parseFloat(o.amount) || 0), 0);
    const unclaimedAmount = unclaimedOrders.reduce((sum: number, o: any) => sum + (parseFloat(o.amount) || 0), 0);
    const claimedAmount = claimedOrders.reduce((sum: number, o: any) => sum + (parseFloat(o.amount) || 0), 0);

    // Separate by payment method
    const ethOrders = orders.filter((o: any) => o.paymentMethod === 'eth');
    const solOrders = orders.filter((o: any) => o.paymentMethod === 'sol');

    const ethUnclaimed = unclaimedOrders.filter((o: any) => o.paymentMethod === 'eth');
    const solUnclaimed = unclaimedOrders.filter((o: any) => o.paymentMethod === 'sol');

    const ethUnclaimedAmount = ethUnclaimed.reduce((sum: number, o: any) => sum + (parseFloat(o.amount) || 0), 0);
    const solUnclaimedAmount = solUnclaimed.reduce((sum: number, o: any) => sum + (parseFloat(o.amount) || 0), 0);

    return res.status(200).json({
      totalEarnings,
      unclaimedAmount,
      claimedAmount,
      totalOrders: orders.length,
      unclaimedOrders: unclaimedOrders.length,
      claimedOrders: claimedOrders.length,
      breakdown: {
        eth: {
          total: ethOrders.reduce((sum: number, o: any) => sum + (parseFloat(o.amount) || 0), 0),
          unclaimed: ethUnclaimedAmount,
          orders: ethUnclaimed.length,
        },
        sol: {
          total: solOrders.reduce((sum: number, o: any) => sum + (parseFloat(o.amount) || 0), 0),
          unclaimed: solUnclaimedAmount,
          orders: solUnclaimed.length,
        },
      },
      orders: orders.map((o: any) => ({
        _id: o._id,
        productId: o.productId,
        productTitle: o.productTitle,
        buyerEmail: o.buyerEmail,
        amount: o.amount,
        paymentMethod: o.paymentMethod,
        claimed: o.claimed || false,
        claimedAt: o.claimedAt,
        claimTxHash: o.claimTxHash,
        createdAt: o.createdAt,
        completedAt: o.completedAt,
      })),
    });
  } catch (err: any) {
    console.error('Earnings error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch earnings' });
  }
}

