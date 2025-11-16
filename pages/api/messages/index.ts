import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session: any = await getServerSession(req, res, authOptions as any);
  if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

  const db = await getDb();
  const userId = String(session.user.id);

  if (req.method === 'GET') {
    // Get conversations for the current user
    const conversations = await db.collection('conversations')
      .find({
        $or: [
          { participantIds: userId },
          { participantEmails: session.user.email }
        ]
      })
      .sort({ lastMessageAt: -1 })
      .toArray();

    // Get unread counts for each conversation
    for (const conv of conversations) {
      const unread = await db.collection('messages').countDocuments({
        conversationId: String(conv._id),
        receiverId: userId,
        read: false
      });
      conv.unreadCount = unread;
    }

    return res.status(200).json({ conversations });
  }

  if (req.method === 'POST') {
    // Create a new conversation or get existing one
    const { receiverId, receiverEmail, productId, productTitle } = req.body;

    if (!receiverId && !receiverEmail) {
      return res.status(400).json({ error: 'receiverId or receiverEmail required' });
    }

    // Find receiver if only email provided
    let receiverUserId = receiverId;
    if (!receiverUserId && receiverEmail) {
      const receiver = await db.collection('users').findOne({ email: receiverEmail });
      if (!receiver) return res.status(404).json({ error: 'Receiver not found' });
      receiverUserId = String(receiver._id);
    }

    if (receiverUserId === userId) {
      return res.status(400).json({ error: 'Cannot message yourself' });
    }

    // Check if conversation already exists
    const existing = await db.collection('conversations').findOne({
      $or: [
        { participantIds: { $all: [userId, receiverUserId] } },
        { participantEmails: { $all: [session.user.email, receiverEmail || ''] } }
      ],
      ...(productId && { productId })
    });

    if (existing) {
      return res.status(200).json({ conversation: existing });
    }

    // Create new conversation
    const conversation = {
      participantIds: [userId, receiverUserId],
      participantEmails: [session.user.email, receiverEmail || ''],
      productId: productId || null,
      productTitle: productTitle || null,
      lastMessageAt: new Date(),
      createdAt: new Date()
    };

    const result = await db.collection('conversations').insertOne(conversation);
    return res.status(201).json({ conversation: { ...conversation, _id: result.insertedId } });
  }

  res.setHeader('Allow', 'GET,POST');
  res.status(405).end();
}

