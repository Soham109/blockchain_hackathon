export interface User {
  _id?: string;
  email: string;
  role: 'buyer' | 'seller';
  emailVerified?: boolean;
  createdAt?: Date;
  name?: string;
  studentVerified?: boolean; // true when student id OCR + admin review passes
  studentId?: string;
}

export interface IDVerification {
  _id?: string;
  userId: string;
  imageUrl: string;
  ocrRaw: any; // store raw response from OCR or Qwen model
  status: 'pending' | 'verified' | 'rejected';
  createdAt?: Date;
}

export interface Product {
  _id?: string;
  sellerId: string;
  sellerEmail?: string;
  title: string;
  description?: string;
  priceCents: number;
  images?: string[];
  category?: string;
  location?: string;
  createdAt?: Date;
}

export interface Message {
  _id?: string;
  conversationId: string;
  senderId: string;
  senderEmail: string;
  receiverId: string;
  receiverEmail: string;
  content: string;
  productId?: string;
  productTitle?: string;
  read: boolean;
  createdAt?: Date;
}

export interface Conversation {
  _id?: string;
  participantIds: string[];
  participantEmails: string[];
  productId?: string;
  productTitle?: string;
  lastMessage?: string;
  lastMessageAt?: Date;
  unreadCount?: number;
  createdAt?: Date;
}
