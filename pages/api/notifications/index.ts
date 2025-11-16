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
      const notifications = await db
        .collection('notifications')
        .find({ userId })
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray();

      return res.status(200).json({ notifications });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Notifications error:', err);
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
}

