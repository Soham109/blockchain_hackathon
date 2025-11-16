import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = await getDb();

  if (req.method === 'GET') {
    const { q, page = '1', limit = '12' } = req.query as any;
    const pageN = Math.max(1, parseInt(page, 10) || 1);
    const lim = Math.min(100, parseInt(limit, 10) || 12);

    const filter: any = {};
    if (q) filter.$text = { $search: q };

    const cursor = db.collection('products').find(filter).skip((pageN - 1) * lim).limit(lim).sort({ createdAt: -1 });
    const items = await cursor.toArray();
    res.status(200).json({ items });
    return;
  }

  if (req.method === 'POST') {
    const { title, description, priceCents, images, category } = req.body as any;
    if (!title || !priceCents) return res.status(400).json({ error: 'title and priceCents required' });

    const now = new Date();
    const doc = { title, description: description || '', priceCents: Number(priceCents), images: images || [], category: category || '', createdAt: now };
    const result = await db.collection('products').insertOne(doc);
    res.status(201).json({ ok: true, id: result.insertedId, product: doc });
    return;
  }

  res.setHeader('Allow', 'GET,POST');
  res.status(405).end();
}
