import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import { getDb } from '../../../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as any;
  if (!id) return res.status(400).json({ error: 'id required' });
  const db = await getDb();
  const oid = new ObjectId(id);

  if (req.method === 'PATCH') {
    const { status } = req.body as any;
    if (!['pending', 'verified', 'rejected'].includes(status)) return res.status(400).json({ error: 'invalid status' });
    await db.collection('id_verifications').updateOne({ _id: oid }, { $set: { status } });
    const v = await db.collection('id_verifications').findOne({ _id: oid });
    if (status === 'verified' && v && v.userId) {
      // set the user's studentVerified
      await db.collection('users').updateOne({ _id: v.userId }, { $set: { studentVerified: true } });
    }
    return res.status(200).json({ ok: true, verification: v });
  }

  res.setHeader('Allow', 'PATCH');
  res.status(405).end();
}
