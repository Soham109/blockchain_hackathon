import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const session: any = await getServerSession(req, res, authOptions as any);
  if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const db = await getDb();
    const userId = String(session.user.id);
    const { id } = req.query;

    const order = await db.collection('orders').findOne({
      _id: new ObjectId(id as string),
      buyerId: userId,
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });

    const product = await db.collection('products').findOne({ _id: order.productId });

    // Generate simple invoice HTML (in production, use a PDF library)
    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .header { border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
            .details { margin: 20px 0; }
            .total { font-size: 24px; font-weight: bold; margin-top: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Invoice</h1>
            <p>Order #${order._id.toString().slice(-8)}</p>
            <p>Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
          <div class="details">
            <h2>Product Details</h2>
            <table>
              <tr>
                <th>Item</th>
                <th>Price</th>
              </tr>
              <tr>
                <td>${product?.title || 'Product'}</td>
                <td>$${(order.amount || 0).toFixed(2)}</td>
              </tr>
            </table>
            <div class="total">Total: $${(order.amount || 0).toFixed(2)}</div>
          </div>
        </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${id}.html`);
    return res.status(200).send(invoiceHTML);
  } catch (err) {
    console.error('Invoice error:', err);
    return res.status(500).json({ error: 'Failed to generate invoice' });
  }
}

