import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { getDb } from '../../../lib/mongodb';
import { sendVerificationEmail } from '../../../lib/email';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, role } = req.body as { email?: string; role?: string };
  if (!email || !role) return res.status(400).json({ error: 'email and role are required' });

  const db = await getDb();

  // create token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h

  await db.collection('email_verifications').insertOne({
    email,
    role,
    token,
    expiresAt,
    createdAt: new Date(),
  });

  // ensure user exists (partially) so we can reference later
  await db.collection('users').updateOne(
    { email },
    { $setOnInsert: { email, role, emailVerified: false, createdAt: new Date() } },
    { upsert: true }
  );

  // send email
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:3000`;
  const verifyLink = `${appUrl}/verify-email?token=${token}`;

  try {
    await sendVerificationEmail(email, verifyLink);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('send mail error', err);
    res.status(500).json({ error: 'failed to send email' });
  }
}
