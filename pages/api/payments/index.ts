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

    let payments;
    try {
      payments = await db
        .collection('payments')
        .find({ userId })
        .sort({ createdAt: -1 })
        .toArray();
    } catch (queryError: any) {
      console.error('Error querying payments:', queryError);
      // If there's an ObjectId error in the query, try to clean up invalid records
      return res.status(500).json({ 
        error: 'Error loading payments. Some payment records may have invalid data.',
        details: queryError.message 
      });
    }

    // Populate product details for payments
    const { ObjectId } = require('mongodb');
    
    let paymentsWithDetails;
    try {
      paymentsWithDetails = await Promise.all(
        payments.map(async (payment) => {
        let product = null;
        if (payment.productId) {
          try {
            // Validate that productId is a valid ObjectId format
            const productIdStr = String(payment.productId);
            // Check if it's a valid 24-character hex string (ObjectId format)
            if (productIdStr && productIdStr.length === 24 && /^[0-9a-fA-F]{24}$/.test(productIdStr)) {
              const productId = new ObjectId(productIdStr);
              product = await db.collection('products').findOne({ _id: productId });
            } else if (payment.productId instanceof ObjectId) {
              // If it's already an ObjectId, use it directly
              product = await db.collection('products').findOne({ _id: payment.productId });
            }
          } catch (err) {
            // Invalid ObjectId format, skip product lookup
            console.warn('Invalid productId in payment:', payment.productId, err);
          }
        }
        // Safely serialize the payment document
        // Convert all ObjectIds to strings to avoid serialization issues
        const serializedPayment: any = {
          _id: payment._id ? (payment._id.toString ? payment._id.toString() : String(payment._id)) : null,
          userId: String(payment.userId || ''),
          productId: payment.productId && String(payment.productId) !== 'new' 
            ? (payment.productId.toString ? payment.productId.toString() : String(payment.productId))
            : null,
          productTitle: product?.title || 'N/A',
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          type: payment.type,
          txHash: payment.txHash,
          verified: payment.verified || false,
          keywords: payment.keywords || [],
          createdAt: payment.createdAt,
        };
        
        return serializedPayment;
        })
      );
    } catch (processError: any) {
      console.error('Error processing payments:', processError);
      // If there's an ObjectId error during processing, return payments without product details
      paymentsWithDetails = payments.map((payment: any) => ({
        _id: payment._id ? (payment._id.toString ? payment._id.toString() : String(payment._id)) : null,
        userId: String(payment.userId || ''),
        productId: payment.productId && String(payment.productId) !== 'new' 
          ? (payment.productId.toString ? payment.productId.toString() : String(payment.productId))
          : null,
        productTitle: 'N/A',
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        type: payment.type,
        txHash: payment.txHash,
        verified: payment.verified || false,
        keywords: payment.keywords || [],
        createdAt: payment.createdAt,
      }));
    }

    return res.status(200).json({ payments: paymentsWithDetails });
  } catch (err: any) {
    console.error('Payments error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch payments' });
  }
}

