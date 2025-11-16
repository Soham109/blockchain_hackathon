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
  title: string;
  description?: string;
  priceCents: number;
  images?: string[];
  category?: string;
  createdAt?: Date;
}
