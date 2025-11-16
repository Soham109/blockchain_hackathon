import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) return res.status(400).json({ error: 'x-user-id header required' });

    const db = await getDb();
    const doc = await db
      .collection('id_verifications')
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();

  if (!doc || doc.length === 0) return res.status(200).json({ ok: true, verification: null });

  return res.status(200).json({ ok: true, verification: doc[0] });
  } catch (err) {
    console.error('GET /api/id/latest error:', err);
    return res.status(500).json({ error: 'Server error', details: (err as any)?.message });
  }
}
