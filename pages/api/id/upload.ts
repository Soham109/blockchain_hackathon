// pages/api/id/upload.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import { getDb } from '../../../lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';
import { randomUUID } from 'crypto';

// --------------------
// Multer config
// --------------------
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: any) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

export const config = {
  api: { bodyParser: false },
};

// --------------------
// Helper: normalize OCR
// --------------------
function normalizeOCR(raw: any) {
  const out: any = { name: null, student_id: null, university: null, expiration_date: null };
  if (raw && typeof raw === 'object') {
    out.name = raw.name || raw.full_name || raw.fullName || raw.student_name || null;
    out.student_id = raw.student_id || raw.studentId || raw.student_id_number || raw.id || raw.id_number || null;
    out.university = raw.university || raw.college || raw.institution || null;
    out.expiration_date = raw.expiration_date || raw.expiry || raw.expiration || null;
  }

  const textBlob = (typeof raw === 'string' && raw) || (raw && (raw.text || raw.ocrText || JSON.stringify(raw))) || '';

  if (!out.student_id && textBlob) {
    const labelled = textBlob.match(/(?:Student\s*(?:No|Number|#)|ID|Reg\.?\s*No|Registration)[:\s]*([A-Z0-9-]{4,20})/i);
    const digits = textBlob.match(/\b([0-9]{5,12})\b/);
    out.student_id = (labelled?.[1] || digits?.[1] || null)?.trim() || null;
  }

  if (!out.name && textBlob) {
    const nameMatch = textBlob.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/);
    if (nameMatch) out.name = nameMatch[1].trim();
  }

  if (!out.university && textBlob) {
    const uniMatch = textBlob.match(/([A-Z][\w\s,&'\-]{2,80}?(?:University|College|Institute|School))/i);
    if (uniMatch) out.university = uniMatch[1].trim();
  }

  if (!out.expiration_date && textBlob) {
    const expMatch = textBlob.match(/(0[1-9]|1[0-2])\/(?:20)?(\d{2,4})/);
    if (expMatch) out.expiration_date = `${expMatch[1]}/${expMatch[2]}`;
    else {
      const yearMatch = textBlob.match(/(20\d{2}|19\d{2})/);
      if (yearMatch) out.expiration_date = yearMatch[1];
    }
  }

  return out;
}

// --------------------
// API Handler
// --------------------
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await runMiddleware(req, res, upload.single('file'));
    const file = (req as any).file;
    const userId = req.headers['x-user-id'] as string;

    if (!file) return res.status(400).json({ error: 'File is required' });
    if (!userId) return res.status(400).json({ error: 'x-user-id header required' });

    // ------------------------------
    // OpenRouter OCR
    // ------------------------------
    console.log('=== ID Upload API Called ===');
    console.log('User ID:', userId);
    console.log('File size:', file.size, 'bytes');
    console.log('File mimetype:', file.mimetype);
    
    if (!(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_URL && process.env.OPENROUTER_MODEL)) {
      console.error('OpenRouter not configured. Missing:', {
        hasKey: !!process.env.OPENROUTER_API_KEY,
        hasUrl: !!process.env.OPENROUTER_API_URL,
        hasModel: !!process.env.OPENROUTER_MODEL
      });
      return res.status(400).json({ error: 'OpenRouter not configured. Set API_KEY, API_URL, MODEL.' });
    }

    console.log('OpenRouter config check passed');
    console.log('API URL:', process.env.OPENROUTER_API_URL);
    console.log('Model:', process.env.OPENROUTER_MODEL);
    console.log('API Key present:', !!process.env.OPENROUTER_API_KEY);

    const base64 = file.buffer.toString('base64');
    const mime = file.mimetype || 'image/jpeg';
    const dataUrl = `data:${mime};base64,${base64}`;

    const payload = {
      model: 'openai/gpt-5.1-codex-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract from this student ID: name, student_id_number, university_name, expiration_date. Return ONLY valid JSON with keys exactly: name, student_id, university, expiration_date. Use null for missing fields. Reply with a single JSON object string and no extra text.'
            },
            { type: 'image_url', image_url: dataUrl }
          ]
        }
      ],
      max_tokens: 500
    };

    console.log('Calling OpenRouter API...');
    console.log('Payload (without image data):', {
      model: payload.model,
      messages: payload.messages.map((m: any) => ({
        role: m.role,
        content: m.content.map((c: any) => ({
          type: c.type,
          text: c.text || '[image data]'
        }))
      })),
      max_tokens: payload.max_tokens
    });

    const resp = await fetch(process.env.OPENROUTER_API_URL!, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('OpenRouter response status:', resp.status, resp.statusText);

    let jsonResp: any = null;
    try { 
      jsonResp = await resp.json(); 
      console.log('OpenRouter full JSON response:', JSON.stringify(jsonResp, null, 2));
    } catch (e) {
      console.error('Failed to parse OpenRouter JSON response:', e);
      const textResp = await resp.text().catch(() => 'Could not read response');
      console.error('OpenRouter raw response:', textResp);
      jsonResp = null;
    }

    if (!resp.ok) {
      console.error('OpenRouter API error:', {
        status: resp.status,
        statusText: resp.statusText,
        response: jsonResp
      });
      throw new Error(`OpenRouter ${resp.status}: ${JSON.stringify(jsonResp)}`);
    }

    console.log('OpenRouter API call successful');

    // Parse model response
    console.log('=== Parsing OpenRouter Response ===');
    const message = jsonResp?.choices?.[0]?.message || {};
    const rawContent = message.content;
    
    console.log('Raw content type:', typeof rawContent);
    console.log('Raw content (first 500 chars):', typeof rawContent === 'string' ? rawContent.substring(0, 500) : rawContent);
    
    let modelRawText: string | null = null;
    let ocrResult: any = null;

    // Only use content field, ignore reasoning to prevent leaks
    if (Array.isArray(rawContent)) {
      console.log('Content is array, length:', rawContent.length);
      const t = rawContent.find((c: any) => c?.type === 'text' || c?.text || c?.content);
      if (t) {
        modelRawText = t.text || t.content || (typeof t === 'string' ? t : null);
        console.log('Found text in array:', modelRawText?.substring(0, 200));
      }
    } else if (typeof rawContent === 'string' && rawContent.trim()) {
      modelRawText = rawContent;
      console.log('Content is string, length:', modelRawText.length);
    }

    if (modelRawText) {
      console.log('Model raw text (first 500 chars):', modelRawText.substring(0, 500));
      // sanitize - remove markdown code blocks
      const cleaned = modelRawText.replace(/```(?:json)?\n?/gi, '').replace(/```/g, '').trim();
      console.log('Cleaned text (first 500 chars):', cleaned.substring(0, 500));
      
      // Try to parse as JSON
      try { 
        ocrResult = JSON.parse(cleaned);
        console.log('Successfully parsed JSON:', JSON.stringify(ocrResult, null, 2));
      } catch (parseError) {
        console.warn('JSON parse failed, trying to extract JSON from text:', parseError);
        // Try to find JSON object in the text
        const first = modelRawText.indexOf('{');
        const last = modelRawText.lastIndexOf('}');
        if (first !== -1 && last !== -1 && last > first) {
          const jsonStr = modelRawText.slice(first, last + 1);
          console.log('Extracted JSON string:', jsonStr);
          try { 
            ocrResult = JSON.parse(jsonStr);
            console.log('Successfully parsed extracted JSON:', JSON.stringify(ocrResult, null, 2));
          } catch (e) {
            console.error('Failed to parse extracted JSON:', e);
          }
        }
      }
      
      if (!ocrResult) {
        console.warn('No OCR result parsed, using raw text');
        ocrResult = { text: modelRawText };
      }
    } else {
      console.warn('No model raw text found in response');
    }

    console.log('Final OCR result:', JSON.stringify(ocrResult, null, 2));

    // ------------------------------
    // Normalize & save
    // ------------------------------
    console.log('=== Normalizing and Saving ===');
    const db = await getDb();
    const heur = modelRawText ? normalizeOCR(modelRawText) : normalizeOCR(ocrResult);
    console.log('Heuristic extraction:', JSON.stringify(heur, null, 2));
    
    const choose = (a: any, b: any) => (a !== null && a !== undefined && String(a).trim() !== '' ? a : b);

    const normalized = {
      name: choose(ocrResult?.name, heur.name),
      student_id: choose(ocrResult?.student_id, heur.student_id),
      university: choose(ocrResult?.university, heur.university),
      expiration_date: choose(ocrResult?.expiration_date, heur.expiration_date),
    };

    console.log('Normalized result:', JSON.stringify(normalized, null, 2));

    const isVerified = !!normalized.student_id;
    console.log('Is verified:', isVerified, '(has student_id:', !!normalized.student_id, ')');

    // Generate secrets (UUIDs)
    const secrets = {
      nameSecret: randomUUID(),
      studentIdSecret: randomUUID(),
      universitySecret: randomUUID(),
      expirationSecret: randomUUID(),
    };

    // Hash the normalized data (SHA256 produces 32 bytes = 64 hex chars)
    const hashData = (data: string | null): string => {
      if (!data) return crypto.createHash('sha256').update('').digest('hex');
      return crypto.createHash('sha256').update(String(data).toLowerCase().trim()).digest('hex');
    };

    const nameHash = hashData(normalized.name);
    const studentIdHash = hashData(normalized.student_id);
    const universityHash = hashData(normalized.university);
    const expirationDateHash = hashData(normalized.expiration_date);

    // Verify hashes are 32 bytes (64 hex characters)
    const verifyHash = (hash: string, field: string) => {
      if (hash.length !== 64) {
        throw new Error(`Invalid hash length for ${field}: expected 64 hex chars, got ${hash.length}`);
      }
    };
    verifyHash(nameHash, 'name');
    verifyHash(studentIdHash, 'student_id');
    verifyHash(universityHash, 'university');
    verifyHash(expirationDateHash, 'expiration_date');

    // Generate record ID (use timestamp or MongoDB ID)
    const recordId = Date.now();

    // Submit to Solana Proof Store
    let proofStoreResult: any = null;
    try {
      console.log('Submitting to Solana Proof Store...');
      const PROOF_STORE_API = process.env.PROOF_STORE_API_URL;
      
      if (!PROOF_STORE_API) {
        throw new Error('PROOF_STORE_API_URL environment variable is not set');
      }

      console.log('Submitting with data:', {
        record_id: recordId,
        name_hash: nameHash.substring(0, 16) + '...',
        student_id_hash: studentIdHash.substring(0, 16) + '...',
        university_hash: universityHash.substring(0, 16) + '...',
        expiration_date_hash: expirationDateHash.substring(0, 16) + '...',
      });

      const proofResponse = await fetch(`${PROOF_STORE_API}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          record_id: recordId,
          name_hash: nameHash,
          student_id_hash: studentIdHash,
          university_hash: universityHash,
          expiration_date_hash: expirationDateHash,
        }),
      });

      if (!proofResponse.ok) {
        const errorText = await proofResponse.text().catch(() => 'Unknown error');
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        throw new Error(`Proof store API error: ${proofResponse.status} - ${errorData.error || errorText}`);
      }

      proofStoreResult = await proofResponse.json();
      console.log('Proof store submission successful:', {
        tx: proofStoreResult.tx,
        record_pda: proofStoreResult.record_pda,
        status: proofStoreResult.status,
      });
    } catch (error: any) {
      console.error('Failed to submit to proof store:', error);
      // Don't fail the whole process, but mark as pending
      // The record will stay in review until proof store submission succeeds
    }

    const insert = {
      userId: new ObjectId(userId),
      ocrRaw: ocrResult,
      rawModelText: modelRawText,
      parsed: normalized,
      status: (isVerified && proofStoreResult) ? 'verified' : 'pending',
      createdAt: new Date(),
      recordId: recordId,
      proofStoreTx: proofStoreResult?.tx || null,
      proofStorePda: proofStoreResult?.record_pda || null,
    };

    console.log('Inserting into database...');
    const result = await db.collection('id_verifications').insertOne(insert);
    console.log('Inserted with ID:', result.insertedId);

    // Only update user if verified AND proof store submission succeeded
    if (isVerified && proofStoreResult) {
      console.log('Updating user as verified...');
      const updateData: any = { 
        studentId: normalized.student_id, 
        studentVerified: true, 
        verificationDate: new Date() 
      };
      
      // Save name from ID verification if available
      if (normalized.name) {
        updateData.name = normalized.name;
        console.log('Saving name from ID verification:', normalized.name);
      }
      
      await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $set: updateData }
      );
      console.log('User updated successfully');
    }

    const response = { 
      ok: true, 
      idVerificationId: result.insertedId, 
      parsed: normalized, // OCR values (name, student_id, university, expiration_date)
      status: insert.status, 
      rawModelText: modelRawText,
      ocrResult: ocrResult,
      recordId: recordId,
      proofStoreTx: proofStoreResult?.tx || null,
      proofStorePda: proofStoreResult?.record_pda || null,
      secrets: secrets, // Return secrets to frontend
      hashes: {
        name: nameHash,
        student_id: studentIdHash,
        university: universityHash,
        expiration_date: expirationDateHash,
      },
    };
    
    console.log('=== Final Response ===');
    console.log(JSON.stringify(response, null, 2));
    console.log('=== End ID Upload ===\n');

    res.status(200).json(response);
  } catch (err) {
    console.error('ID upload error:', err);
    res.status(500).json({ error: 'Upload failed', details: (err as any)?.message });
  }
}
