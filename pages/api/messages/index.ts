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

    // Check if conversation already exists between these two users
    // First check by participant IDs (most reliable)
    const existingByIds = await db.collection('conversations').findOne({
      participantIds: { $all: [userId, receiverUserId], $size: 2 }
    });

    // If not found by IDs, check by emails
    const existingByEmails = existingByIds ? null : await db.collection('conversations').findOne({
      participantEmails: { $all: [session.user.email, receiverEmail || ''], $size: 2 }
    });

    const existing = existingByIds || existingByEmails;

    if (existing) {
      // Update product info if provided and not already set
      if (productId && !existing.productId) {
        await db.collection('conversations').updateOne(
          { _id: existing._id },
          { $set: { productId, productTitle: productTitle || null } }
        );
        existing.productId = productId;
        existing.productTitle = productTitle || null;
      }
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

