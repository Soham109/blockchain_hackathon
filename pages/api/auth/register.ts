import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '../../../lib/mongodb';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendVerificationEmail } from '../../../lib/email';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { email, password, role } = req.body as { email?: string; password?: string; role?: string };
  if (!email || !password || !role) return res.status(400).json({ error: 'email, password and role are required' });

  const db = await getDb();
  const existing = await db.collection('users').findOne({ email });
  if (existing) return res.status(400).json({ error: 'user exists' });

  const hash = await bcrypt.hash(password, 10);
  const now = new Date();
  const insert = { email, passwordHash: hash, role, emailVerified: false, createdAt: now };
  const r = await db.collection('users').insertOne(insert);

  // create verification token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
  await db.collection('email_verifications').insertOne({ email, role, token, expiresAt, createdAt: new Date() });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:3000`;
  const verifyLink = `${appUrl}/verify-email?token=${token}`;

  try {
    await sendVerificationEmail(email, verifyLink);
    res.status(201).json({ ok: true, id: r.insertedId });
  } catch (err) {
    console.error('send mail error', err);
    res.status(500).json({ error: 'failed to send email' });
  }
}
