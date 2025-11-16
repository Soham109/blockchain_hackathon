import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { getDb } from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const session: any = await getServerSession(req, res, authOptions as any);
  if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const db = await getDb();
    const userId = String(session.user.id);
    
    const count = await db.collection('notifications').countDocuments({
      userId,
      read: false
    });

    return res.status(200).json({ count });
  } catch (err) {
    console.error('Notification count error:', err);
    return res.status(200).json({ count: 0 });
  }
}

