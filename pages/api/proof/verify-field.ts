import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { field, value, hash, recordId } = req.body;

  if (!field || !value || !hash) {
    return res.status(400).json({ error: 'field, value, and hash are required' });
  }

  if (!recordId) {
    return res.status(400).json({ error: 'recordId is required for field verification' });
  }

  try {
    // First verify the hash locally
    const hashData = (data: string | null): string => {
      if (!data) return crypto.createHash('sha256').update('').digest('hex');
      return crypto.createHash('sha256').update(String(data).toLowerCase().trim()).digest('hex');
    };

    const computedHash = hashData(value);
    const hashValid = computedHash === hash;

    if (!hashValid) {
      return res.status(200).json({
        hashValid: false,
        blockchainValid: false,
        error: 'Hash does not match the provided value',
      });
    }

    // Verify on blockchain (recordId is required)
    const PROOF_STORE_API = process.env.PROOF_STORE_API_URL || 'http://10.140.133.4:8080';
    
    try {
      const response = await fetch(`${PROOF_STORE_API}/record/${recordId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return res.status(200).json({
          hashValid: true,
          blockchainValid: false,
          error: `Record not found on blockchain (${response.status})`,
        });
      }

      const blockchainData = await response.json();
      
      // Get the hash for this field from blockchain
      const blockchainHashes: any = {
        name: blockchainData.name_hash,
        student_id: blockchainData.student_id_hash,
        university: blockchainData.university_hash,
        expiration_date: blockchainData.expiration_date_hash,
      };

      const blockchainHash = blockchainHashes[field];
      const blockchainValid = blockchainHash === hash;

      return res.status(200).json({
        hashValid: true,
        blockchainValid,
        field,
        recordId,
        blockchainHash: blockchainHash || null,
        providedHash: hash,
      });
    } catch (err: any) {
      return res.status(200).json({
        hashValid: true,
        blockchainValid: false,
        error: `Failed to verify on blockchain: ${err.message || 'Network error'}`,
      });
    }
  } catch (err: any) {
    console.error('Field verification error:', err);
    return res.status(500).json({ 
      error: err.message || 'Failed to verify field' 
    });
  }
}

