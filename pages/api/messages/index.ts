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

    // Normalize participant arrays for consistent comparison
    const sortedParticipantIds = [userId, receiverUserId].sort();
    const sortedParticipantEmails = [session.user.email, receiverEmail || ''].filter(Boolean).sort();
    
    // Check if conversation already exists - use multiple strategies to be absolutely sure
    // Strategy 1: Check by sorted participant IDs (most reliable)
    const existingByIds = await db.collection('conversations').findOne({
      $or: [
        // Exact match with sorted array
        { participantIds: { $eq: sortedParticipantIds } },
        // Both IDs present and array size is 2
        {
          $and: [
            { participantIds: { $all: sortedParticipantIds } },
            { $expr: { $eq: [{ $size: '$participantIds' }, 2] } }
          ]
        }
      ]
    });

    // Strategy 2: Check by sorted participant emails (if receiverEmail provided)
    let existingByEmails = null;
    if (!existingByIds && receiverEmail) {
      existingByEmails = await db.collection('conversations').findOne({
        $or: [
          // Exact match with sorted array
          { participantEmails: { $eq: sortedParticipantEmails } },
          // Both emails present and array size is 2
          {
            $and: [
              { participantEmails: { $all: sortedParticipantEmails } },
              { $expr: { $eq: [{ $size: '$participantEmails' }, 2] } }
            ]
          }
        ]
      });
    }

    // Strategy 3: Check all conversations and manually verify (fallback)
    let existingManual = null;
    if (!existingByIds && !existingByEmails) {
      const allConvs = await db.collection('conversations')
        .find({
          $or: [
            { participantIds: { $in: [userId, receiverUserId] } },
            { participantEmails: { $in: [session.user.email, receiverEmail || ''] } }
          ]
        })
        .toArray();
      
      // Manually check each conversation
      for (const conv of allConvs) {
        const convIds = (conv.participantIds || []).map(String).sort();
        const convEmails = (conv.participantEmails || []).filter(Boolean).sort();
        
        // Check if this conversation matches
        const idsMatch = convIds.length === 2 && 
          convIds.includes(String(userId)) && 
          convIds.includes(String(receiverUserId));
        
        const emailsMatch = receiverEmail && convEmails.length === 2 &&
          convEmails.includes(session.user.email) &&
          convEmails.includes(receiverEmail);
        
        if (idsMatch || emailsMatch) {
          existingManual = conv;
          break;
        }
      }
    }

    const existing = existingByIds || existingByEmails || existingManual;

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
    // Use the already sorted arrays from above
    const conversation = {
      participantIds: sortedParticipantIds,
      participantEmails: sortedParticipantEmails,
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

