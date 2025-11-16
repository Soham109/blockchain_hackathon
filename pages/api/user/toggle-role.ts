import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectToDatabase } from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const session: any = await getServerSession(req, res, authOptions as any);
  if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const { db } = await connectToDatabase();
  const userId = String((session.user as any).id || session.user?.id);
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Only allow toggle if studentVerified is true
    if (!user.studentVerified) {
      return res.status(403).json({ error: 'Only verified students can toggle roles' });
    }

    const newRole = user.role === 'seller' ? 'buyer' : 'seller';
    await db.collection('users').updateOne({ _id: new ObjectId(userId) }, { $set: { role: newRole } });

    return res.status(200).json({ ok: true, role: newRole });
  } catch (err: any) {
    console.error('toggle-role error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
