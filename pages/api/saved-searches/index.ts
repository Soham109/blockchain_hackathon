import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { getDb } from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session: any = await getServerSession(req, res, authOptions as any);
  if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const db = await getDb();
    const userId = String(session.user.id);

    if (req.method === 'GET') {
      const searches = await db
        .collection('savedSearches')
        .find({ userId })
        .sort({ createdAt: -1 })
        .toArray();
      return res.status(200).json({ searches });
    }

    if (req.method === 'POST') {
      const { name, query, category, minPrice, maxPrice, notifications } = req.body;
      const search = {
        userId,
        name: name || 'Untitled Search',
        query: query || '',
        category: category || 'all',
        minPrice: minPrice || '',
        maxPrice: maxPrice || '',
        notifications: notifications || false,
        createdAt: new Date(),
      };
      await db.collection('savedSearches').insertOne(search);
      return res.status(201).json({ search });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Saved searches error:', err);
    return res.status(500).json({ error: 'Failed to process request' });
  }
}

