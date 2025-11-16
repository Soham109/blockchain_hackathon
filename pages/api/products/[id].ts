import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as any;
  if (!id) return res.status(400).json({ error: 'id required' });
  const db = await getDb();

  const oid = new ObjectId(id);
  if (req.method === 'GET') {
    const product = await db.collection('products').findOne({ _id: oid });
    if (!product) return res.status(404).json({ error: 'not found' });
    return res.status(200).json({ product });
  }

  if (req.method === 'PUT') {
    const updates = req.body;
    await db.collection('products').updateOne({ _id: oid }, { $set: updates });
    const product = await db.collection('products').findOne({ _id: oid });
    return res.status(200).json({ ok: true, product });
  }

  if (req.method === 'DELETE') {
    await db.collection('products').deleteOne({ _id: oid });
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'GET,PUT,DELETE');
  res.status(405).end();
}
