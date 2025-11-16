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
    let receiverUser = null;
    if (!receiverUserId && receiverEmail) {
      receiverUser = await db.collection('users').findOne({ email: receiverEmail });
      if (!receiverUser) return res.status(404).json({ error: 'Receiver not found' });
      receiverUserId = String(receiverUser._id);
    } else if (receiverUserId) {
      receiverUser = await db.collection('users').findOne({ _id: new ObjectId(receiverUserId) });
    }

    if (receiverUserId === userId) {
      return res.status(400).json({ error: 'Cannot message yourself' });
    }

    // Fetch product details if productId is provided to get correct title and seller info
    let finalProductId = productId;
    let finalProductTitle = productTitle;
    let sellerId = null;
    let sellerEmail = null;
    
    if (productId) {
      try {
        const product = await db.collection('products').findOne({ _id: new ObjectId(productId) });
        if (product) {
          finalProductId = String(product._id);
          finalProductTitle = product.title || productTitle;
          sellerId = String(product.sellerId);
          sellerEmail = product.sellerEmail;
        }
      } catch (err) {
        console.error('Error fetching product:', err);
      }
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
      if (finalProductId && !existing.productId) {
        await db.collection('conversations').updateOne(
          { _id: existing._id },
          { $set: { 
            productId: finalProductId, 
            productTitle: finalProductTitle || null,
            sellerId: sellerId || null,
            sellerEmail: sellerEmail || null
          } }
        );
        existing.productId = finalProductId;
        existing.productTitle = finalProductTitle || null;
        existing.sellerId = sellerId;
        existing.sellerEmail = sellerEmail;
      }
      return res.status(200).json({ conversation: existing });
    }

    // Create new conversation
    // Use the already sorted arrays from above
    const conversation = {
      participantIds: sortedParticipantIds,
      participantEmails: sortedParticipantEmails,
      productId: finalProductId || null,
      productTitle: finalProductTitle || null,
      sellerId: sellerId || null,
      sellerEmail: sellerEmail || null,
      lastMessageAt: new Date(),
      createdAt: new Date()
    };

    const result = await db.collection('conversations').insertOne(conversation);
    return res.status(201).json({ conversation: { ...conversation, _id: result.insertedId } });
  }

  res.setHeader('Allow', 'GET,POST');
  res.status(405).end();
}

