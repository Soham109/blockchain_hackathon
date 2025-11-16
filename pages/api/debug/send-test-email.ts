import type { NextApiRequest, NextApiResponse } from 'next';
import { sendVerificationEmail } from '../../../lib/email';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { to } = req.body as { to?: string };
  if (!to) return res.status(400).json({ error: 'provide `to` in JSON body' });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const verifyLink = `${appUrl}/verify-email?token=debug-token`;

  try {
    await sendVerificationEmail(to, verifyLink);
    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error('debug send mail error', err);
    return res.status(500).json({ error: err?.message || 'failed' });
  }
}
