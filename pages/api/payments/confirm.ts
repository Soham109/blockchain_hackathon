import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { getDb } from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const session: any = await getServerSession(req, res, authOptions as any);
  if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const { productId, amount, paymentMethod, type, boostKeywords, txHash } = req.body;

    if (!productId || !amount || !txHash) {
      return res.status(400).json({ error: 'Missing required fields (productId, amount, txHash)' });
    }

    const db = await getDb();
    const userId = String(session.user.id);

    if (type === 'boost') {
      // Handle product boosting
      const { ObjectId } = require('mongodb');
      // Validate productId before creating ObjectId
      let productObjectId;
      if (typeof productId === 'string' && productId.length === 24 && /^[0-9a-fA-F]{24}$/.test(productId)) {
        productObjectId = new ObjectId(productId);
      } else if (productId instanceof ObjectId) {
        productObjectId = productId;
      } else {
        return res.status(400).json({ error: 'Invalid productId format' });
      }
      
      // Get current product to merge keywords if already boosted
      const product = await db.collection('products').findOne({ _id: productObjectId });
      const existingKeywords = product?.boostKeywords || [];
      const newKeywords = boostKeywords || [];
      
      // Merge keywords, removing duplicates
      const mergedKeywords = Array.from(new Set([...existingKeywords, ...newKeywords]));
      
      // Calculate new expiration: extend by 7 days from now, or keep existing if later
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const currentExpiry = product?.boostExpiresAt ? new Date(product.boostExpiresAt) : null;
      const newExpiry = currentExpiry && currentExpiry > sevenDaysFromNow 
        ? currentExpiry 
        : sevenDaysFromNow;
      
      await db.collection('products').updateOne(
        { _id: productObjectId },
        {
          $set: {
            boosted: true,
            boostKeywords: mergedKeywords,
            boostedAt: product?.boostedAt || new Date(),
            boostExpiresAt: newExpiry,
          },
        }
      );

      // Create payment record with transaction hash
      await db.collection('payments').insertOne({
        userId,
        productId,
        amount,
        paymentMethod,
        type: 'boost',
        keywords: boostKeywords,
        txHash,
        verified: true,
        createdAt: new Date(),
      });

      return res.status(200).json({ success: true, message: 'Product boosted successfully' });
    }

    if (type === 'listing') {
      // Listing fee already paid, product will be created after this
      // Use the productId provided (might be 'new' temporarily)
      await db.collection('payments').insertOne({
        userId,
        productId, // This might be 'new' temporarily, will be updated after product creation
        amount,
        paymentMethod,
        type: 'listing',
        txHash,
        verified: true,
        createdAt: new Date(),
      });

      return res.status(200).json({ success: true, message: 'Listing fee paid' });
    }

    // Regular purchase
    const order = {
      buyerId: userId,
      productId,
      amount,
      paymentMethod,
      status: 'completed',
      createdAt: new Date(),
      completedAt: new Date(),
    };

    await db.collection('orders').insertOne(order);
    await db.collection('payments').insertOne({
      userId,
      productId,
      amount,
      paymentMethod,
      type: 'purchase',
      txHash,
      verified: true,
      createdAt: new Date(),
    });

    // Mark product as sold
    const { ObjectId } = require('mongodb');
    // Validate productId before creating ObjectId
    let productObjectId;
    if (typeof productId === 'string' && productId.length === 24 && /^[0-9a-fA-F]{24}$/.test(productId)) {
      productObjectId = new ObjectId(productId);
    } else if (productId instanceof ObjectId) {
      productObjectId = productId;
    } else {
      return res.status(400).json({ error: 'Invalid productId format for purchase' });
    }
    
    await db.collection('products').updateOne(
      { _id: productObjectId },
      { $set: { status: 'sold', soldAt: new Date() } }
    );

    // Create notification for seller
    const product = await db.collection('products').findOne({ _id: productObjectId });
    if (product) {
      await db.collection('notifications').insertOne({
        userId: product.sellerId,
        type: 'order',
        title: 'Product Sold!',
        message: `Your product "${product.title}" has been purchased.`,
        read: false,
        createdAt: new Date(),
      });
    }

    return res.status(200).json({ success: true, order });
  } catch (error: any) {
    console.error('Payment confirmation error:', error);
    return res.status(500).json({ error: error.message || 'Failed to confirm payment' });
  }
}
