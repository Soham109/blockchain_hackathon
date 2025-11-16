import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '../../../lib/mongodb';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { token } = req.body as { token?: string };
  if (!token) return res.status(400).json({ error: 'token required' });

  const db = await getDb();
  const record = await db.collection('email_verifications').findOne({ token });
  if (!record) return res.status(400).json({ error: 'invalid or expired token' });

  if (new Date(record.expiresAt) < new Date()) {
    await db.collection('email_verifications').deleteOne({ _id: record._id });
    return res.status(400).json({ error: 'token expired' });
  }

  // mark user as emailVerified
  const userRes = await db.collection('users').findOneAndUpdate(
    { email: record.email },
    { $set: { emailVerified: true } },
    { returnDocument: 'after' }
  );

  // delete verification record
  await db.collection('email_verifications').deleteOne({ _id: record._id });

  res.status(200).json({ ok: true });
}
