import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const { email } = req.query as any;
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    const db = await getDb();
    const user = await db.collection('users').findOne({ email });
    
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Remove sensitive data
    const { passwordHash, ...safeUser } = user;

    res.status(200).json({ user: safeUser });
  } catch (err) {
    console.error('User lookup error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
}

