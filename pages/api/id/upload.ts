// pages/api/id/upload.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import { getDb } from '../../../lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { ObjectId } from 'mongodb';

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
      model: process.env.OPENROUTER_MODEL,
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
    const rawContent = jsonResp?.choices?.[0]?.message?.content;
    console.log('Raw content type:', typeof rawContent);
    console.log('Raw content (first 500 chars):', typeof rawContent === 'string' ? rawContent.substring(0, 500) : rawContent);
    
    let modelRawText: string | null = null;
    let ocrResult: any = null;

    if (Array.isArray(rawContent)) {
      console.log('Content is array, length:', rawContent.length);
      const t = rawContent.find((c: any) => c?.type === 'text' || c?.text || c?.content);
      if (t) {
        modelRawText = t.text || t.content || (typeof t === 'string' ? t : null);
        console.log('Found text in array:', modelRawText?.substring(0, 200));
      }
    } else if (typeof rawContent === 'string') {
      modelRawText = rawContent;
      console.log('Content is string, length:', modelRawText.length);
    }

    if (modelRawText) {
      console.log('Model raw text (first 500 chars):', modelRawText.substring(0, 500));
      // sanitize
      const cleaned = modelRawText.replace(/```(?:json)?\n?/gi, '').replace(/```/g, '').trim();
      console.log('Cleaned text (first 500 chars):', cleaned.substring(0, 500));
      
      try { 
        ocrResult = JSON.parse(cleaned);
        console.log('Successfully parsed JSON:', JSON.stringify(ocrResult, null, 2));
      } catch (parseError) {
        console.warn('JSON parse failed, trying to extract JSON from text:', parseError);
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

    const insert = {
      userId: new ObjectId(userId),
      ocrRaw: ocrResult,
      rawModelText: modelRawText,
      parsed: normalized,
      status: isVerified ? 'verified' : 'pending',
      createdAt: new Date()
    };

    console.log('Inserting into database...');
    const result = await db.collection('id_verifications').insertOne(insert);
    console.log('Inserted with ID:', result.insertedId);

    // Update user
    if (isVerified) {
      console.log('Updating user as verified...');
      await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $set: { studentId: normalized.student_id, studentVerified: true, verificationDate: new Date() } }
      );
      console.log('User updated successfully');
    }

    const response = { 
      ok: true, 
      idVerificationId: result.insertedId, 
      parsed: normalized, 
      status: insert.status, 
      rawModelText: modelRawText,
      ocrResult: ocrResult
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
