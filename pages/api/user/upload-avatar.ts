import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { getDb } from '@/lib/mongodb';
import multer from 'multer';
import { IncomingMessage } from 'http';
import { ObjectId } from 'mongodb';

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req: any, file: Express.Multer.File, cb: (error: Error | null, acceptFile: boolean) => void) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

function runMiddleware(req: IncomingMessage, res: any, fn: any) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const session: any = await getServerSession(req, res, authOptions as any);
  if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

  try {
    await runMiddleware(req, res, upload.single('avatar'));
    const file = (req as any).file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Convert to base64 for now (in production, upload to Cloudinary/S3)
    const base64 = file.buffer.toString('base64');
    const dataUrl = `data:${file.mimetype};base64,${base64}`;

    // Save to user document
    const db = await getDb();
    const userId = String(session.user.id);
    
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { avatar: dataUrl, avatarUpdatedAt: new Date() } }
    );

    return res.status(200).json({ success: true, avatar: dataUrl });
  } catch (error: any) {
    console.error('Avatar upload error:', error);
    return res.status(500).json({ error: error.message || 'Upload failed' });
  }
}

