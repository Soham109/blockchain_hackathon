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

    if (req.method === 'GET') {
      const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
      return res.status(200).json({ settings: user?.settings || {} });
    }

    if (req.method === 'PUT') {
      const { settings } = req.body;
      await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $set: { settings, settingsUpdatedAt: new Date() } }
      );
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Settings error:', err);
    return res.status(500).json({ error: 'Failed to update settings' });
  }
}

