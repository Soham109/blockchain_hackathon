import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import { connectToDatabase } from '../../../lib/mongodb';
import type { NextAuthOptions } from 'next-auth';
import { ObjectId } from 'mongodb';

const clientPromise = (async () => {
  const { client } = await connectToDatabase();
  return client;
})();

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise as any),
  providers: [
    CredentialsProvider({
      name: 'Email/Password',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials: any) {
        if (!credentials?.email || !credentials?.password) return null;
        const { db } = await connectToDatabase();
        const user = await db.collection('users').findOne({ email: credentials.email });
        if (!user) return null;
        if (!user.passwordHash) return null;
        // verify password
        const bcrypt = require('bcryptjs');
        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) return null;
        // only allow login if email is verified
        if (!user.emailVerified) return null;
        return { id: String(user._id), email: user.email, role: user.role } as any;
      },
    }),
  ],
  session: { 
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = (user as any).id || token.sub;
        token.email = (user as any).email || token.email;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }: any) {
      (session as any).user.id = token.id;
      (session as any).user.role = token.role;
      (session as any).user.email = token.email || (session as any).user.email;

      // fetch fresh user record from DB to include latest flags like emailVerified/studentVerified
      try {
        if (token?.id) {
          const { db } = await connectToDatabase();
          const user = await db.collection('users').findOne({ _id: new ObjectId(String(token.id)) });
          if (user) {
            (session as any).user.emailVerified = !!user.emailVerified;
            (session as any).user.studentVerified = !!user.studentVerified;
            (session as any).user.studentId = user.studentId || null;
            (session as any).user.role = user.role || token.role;
            (session as any).user.name = user.name || null;
          }
        }
      } catch (e) {
        // ignore DB errors — return session as-is
        console.warn('NextAuth session callback DB fetch failed:', e);
      }

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions as any);
