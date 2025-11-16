import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session: any = await getServerSession(req, res, authOptions as any);
  if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const db = await getDb();
    const userId = String(session.user.id);
    const { id } = req.query;

    if (req.method === 'PUT') {
      await db.collection('notifications').updateOne(
        { _id: new ObjectId(id as string), userId },
        { $set: { read: true, readAt: new Date() } }
      );
      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      await db.collection('notifications').deleteOne({
        _id: new ObjectId(id as string),
        userId
      });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Notification error:', err);
    return res.status(500).json({ error: 'Failed to update notification' });
  }
}

