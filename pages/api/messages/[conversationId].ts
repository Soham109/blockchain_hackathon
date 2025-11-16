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
  const { conversationId } = req.query as any;

  if (req.method === 'GET') {
    // Get messages for a conversation
    const conversation = await db.collection('conversations').findOne({ _id: new ObjectId(conversationId) });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    // Check if user is a participant
    if (!conversation.participantIds.includes(userId) && !conversation.participantEmails.includes(session.user.email)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const messages = await db.collection('messages')
      .find({ conversationId })
      .sort({ createdAt: 1 })
      .toArray();

    // Mark messages as read
    await db.collection('messages').updateMany(
      { conversationId, receiverId: userId, read: false },
      { $set: { read: true } }
    );

    return res.status(200).json({ messages, conversation });
  }

  if (req.method === 'POST') {
    // Send a new message
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content required' });
    }

    const conversation = await db.collection('conversations').findOne({ _id: new ObjectId(conversationId) });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    // Check if user is a participant
    if (!conversation.participantIds.includes(userId) && !conversation.participantEmails.includes(session.user.email)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Find receiver
    const receiverId = conversation.participantIds.find((id: string) => id !== userId);
    const receiverEmail = conversation.participantEmails.find((email: string) => email !== session.user.email);

    const message = {
      conversationId,
      senderId: userId,
      senderEmail: session.user.email,
      receiverId,
      receiverEmail,
      content: content.trim(),
      productId: conversation.productId || null,
      productTitle: conversation.productTitle || null,
      read: false,
      createdAt: new Date()
    };

    const result = await db.collection('messages').insertOne(message);

    // Update conversation last message
    await db.collection('conversations').updateOne(
      { _id: new ObjectId(conversationId) },
      { 
        $set: { 
          lastMessage: content.trim().substring(0, 100),
          lastMessageAt: new Date()
        }
      }
    );

    return res.status(201).json({ message: { ...message, _id: result.insertedId } });
  }

  res.setHeader('Allow', 'GET,POST');
  res.status(405).end();
}

