"use client";
import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const res = await signIn('credentials', { redirect: false, email, password });
    if ((res as any)?.ok) {
      router.push('/onboarding');
    } else {
      setError('Authentication failed. Make sure your email is verified and password is correct.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="p-8 bg-white/5 rounded w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">Sign in</h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300">Email</label>
            <Input value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-slate-300">Password</label>
            <Input type="password" value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setPassword(e.target.value)} />
          </div>
          {error && <div className="text-sm text-red-400">{error}</div>}
          <div>
            <Button type="submit">Sign in</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
