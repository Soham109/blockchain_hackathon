import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const session: any = await getServerSession(req, res, authOptions as any);
  if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const db = await getDb();
    const userId = String(session.user.id);
    
    // Get the latest verification record
    const verification = await db.collection('id_verifications')
      .findOne(
        { userId: new ObjectId(userId) },
        { sort: { createdAt: -1 } }
      );

    if (!verification || !verification.recordId) {
      return res.status(404).json({ error: 'No proof store data found' });
    }

    // Hash function
    const hashData = (data: string | null): string => {
      if (!data) return crypto.createHash('sha256').update('').digest('hex');
      return crypto.createHash('sha256').update(String(data).toLowerCase().trim()).digest('hex');
    };

    // Return proof store data (excluding sensitive raw data)
    return res.status(200).json({
      recordId: verification.recordId,
      recordPda: verification.proofStorePda,
      tx: verification.proofStoreTx,
      parsed: verification.parsed, // OCR values (name, student_id, university, expiration_date)
      hashes: {
        name: hashData(verification.parsed?.name || null),
        student_id: hashData(verification.parsed?.student_id || null),
        university: hashData(verification.parsed?.university || null),
        expiration_date: hashData(verification.parsed?.expiration_date || null),
      },
    });
  } catch (err: any) {
    console.error('Proof store data error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch proof store data' });
  }
}

