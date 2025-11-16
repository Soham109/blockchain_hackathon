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

    // Verify user is a seller
    const user = await db.collection('users').findOne({ _id: userId });
    if (user?.role !== 'seller') {
      return res.status(403).json({ error: 'Only sellers can access financial data' });
    }

    // Get all products sold by this seller
    const { ObjectId } = require('mongodb');
    const soldProducts = await db
      .collection('products')
      .find({ 
        sellerId: userId,
        status: 'sold'
      })
      .toArray();

    // Get all orders for these products
    const productIds = soldProducts.map((p: any) => p._id);
    const orders = await db
      .collection('orders')
      .find({ 
        productId: { $in: productIds }
      })
      .toArray();

    // Get all payments for these products
    const payments = await db
      .collection('payments')
      .find({
        productId: { $in: productIds },
        type: 'purchase',
        verified: true
      })
      .toArray();

    // Calculate financial metrics
    const totalRevenue = payments.reduce((sum: number, p: any) => {
      return sum + (parseFloat(p.amount) || 0);
    }, 0);

    const totalSales = orders.length;
    const activeListings = await db
      .collection('products')
      .countDocuments({ 
        sellerId: userId,
        status: { $ne: 'sold' }
      });

    // Recent sales (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentPayments = payments.filter((p: any) => 
      new Date(p.createdAt) >= thirtyDaysAgo
    );
    const recentRevenue = recentPayments.reduce((sum: number, p: any) => {
      return sum + (parseFloat(p.amount) || 0);
    }, 0);

    // Sales by payment method
    const ethPayments = payments.filter((p: any) => p.paymentMethod === 'eth');
    const solPayments = payments.filter((p: any) => p.paymentMethod === 'sol');
    const ethRevenue = ethPayments.reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);
    const solRevenue = solPayments.reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);

    // Get recent sales with product details
    const recentSales = await Promise.all(
      orders
        .filter((o: any) => new Date(o.createdAt) >= thirtyDaysAgo)
        .slice(0, 10)
        .map(async (order: any) => {
          const productId = typeof order.productId === 'string' ? new ObjectId(order.productId) : order.productId;
          const product = await db.collection('products').findOne({ _id: productId });
          const payment = payments.find((p: any) => 
            String(p.productId) === String(order.productId)
          );
          return {
            orderId: order._id,
            productTitle: product?.title || 'Unknown',
            amount: parseFloat(order.amount) || 0,
            paymentMethod: payment?.paymentMethod || order.paymentMethod,
            txHash: payment?.txHash || null,
            createdAt: order.createdAt,
          };
        })
    );

    return res.status(200).json({
      totalRevenue,
      totalSales,
      activeListings,
      recentRevenue,
      recentSalesCount: recentPayments.length,
      ethRevenue,
      solRevenue,
      ethSales: ethPayments.length,
      solSales: solPayments.length,
      recentSales,
    });
  } catch (err: any) {
    console.error('Financials error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch financial data' });
  }
}

