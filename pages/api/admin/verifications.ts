import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  const db = await getDb();
  const items = await db.collection('id_verifications').find().sort({ createdAt: -1 }).limit(200).toArray();
  res.status(200).json({ items });
}
