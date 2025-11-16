import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { recordId } = req.query;
  
  if (!recordId) {
    return res.status(400).json({ error: 'recordId is required' });
  }

  try {
    const PROOF_STORE_API = process.env.PROOF_STORE_API_URL || 'http://10.140.133.4:8080';
    
    const response = await fetch(`${PROOF_STORE_API}/record/${recordId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      return res.status(response.status).json({ 
        error: `Record not found: ${errorText}`,
        status: response.status 
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err: any) {
    console.error('Proof store API error:', err);
    return res.status(500).json({ 
      error: `Failed to verify on blockchain: ${err.message || 'Network error'}` 
    });
  }
}

