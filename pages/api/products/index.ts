import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { getDb } from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = await getDb();

  if (req.method === 'GET') {
    const { q, page = '1', limit = '12', category, exclude } = req.query as any;
    const pageN = Math.max(1, parseInt(page, 10) || 1);
    const lim = Math.min(100, parseInt(limit, 10) || 12);

    const filter: any = { status: { $ne: 'sold' } };
    const searchTerms = q ? q.toLowerCase().split(/\s+/) : [];
    
    if (q) {
      // Check if any search terms match boosted keywords
      const boostedFilter: any = {
        boosted: true,
        boostExpiresAt: { $gt: new Date() },
        $or: searchTerms.map((term: string) => ({
          boostKeywords: { $in: [term] }
        }))
      };

      // Regular search filter
      const regularFilter: any = {
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
          { category: { $regex: q, $options: 'i' } }
        ]
      };

      // Combine: boosted products matching keywords OR regular search
      filter.$or = [
        { $and: [boostedFilter, regularFilter] },
        regularFilter
      ];
    }
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    if (exclude) {
      const { ObjectId } = require('mongodb');
      filter._id = { $ne: new ObjectId(exclude) };
    }

    // Sort: boosted products first, then by date
    const cursor = db.collection('products').find(filter);
    const items = await cursor.toArray();
    
    // Sort: boosted products first, then by date
    items.sort((a: any, b: any) => {
      const aBoosted = a.boosted && a.boostExpiresAt && new Date(a.boostExpiresAt) > new Date();
      const bBoosted = b.boosted && b.boostExpiresAt && new Date(b.boostExpiresAt) > new Date();
      
      if (aBoosted && !bBoosted) return -1;
      if (!aBoosted && bBoosted) return 1;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    const paginated = items.slice((pageN - 1) * lim, pageN * lim);
    res.status(200).json({ items: paginated, products: paginated });
    return;
  }

  if (req.method === 'POST') {
    const session: any = await getServerSession(req, res, authOptions as any);
    if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

    const { title, description, priceCents, images, category, location, sellerEmail } = req.body as any;
    if (!title || !priceCents) return res.status(400).json({ error: 'title and priceCents required' });

    const now = new Date();
    const doc = { 
      title, 
      description: description || '', 
      priceCents: Number(priceCents), 
      images: images || [], 
      category: category || '', 
      location: location || '',
      sellerId: String(session.user.id),
      sellerEmail: sellerEmail || session.user.email,
      createdAt: now 
    };
    const result = await db.collection('products').insertOne(doc);
    res.status(201).json({ ok: true, id: result.insertedId, product: doc });
    return;
  }

  res.setHeader('Allow', 'GET,POST');
  res.status(405).end();
}
