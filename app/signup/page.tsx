"use client";
import React, { useState } from 'react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function SignUpPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'buyer'|'seller'>('buyer');
  const [message, setMessage] = useState('');

  async function register(e: React.FormEvent) {
    e.preventDefault();
    setMessage('Creating account and sending verification email...');
    const resp = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, role }) });
    const data = await resp.json();
    if (resp.ok) {
      setMessage('Account created. Check your email and click the verification link to continue.');
      setStep(2);
    } else {
      setMessage(data?.error || 'Failed to register');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="w-full max-w-md p-8 bg-white/5 rounded-xl backdrop-blur">
        <h1 className="text-2xl font-bold mb-4">Join College Marketplace</h1>
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded ${step===1? 'bg-indigo-600':'bg-white/5'}`}>1. Email</div>
            <div className={`px-3 py-1 rounded ${step===2? 'bg-indigo-600':'bg-white/5'}`}>2. Verify</div>
            <div className={`px-3 py-1 rounded ${step===3? 'bg-indigo-600':'bg-white/5'}`}>3. ID Upload</div>
          </div>
        </div>

        {step === 1 && (
          <form onSubmit={register} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300">Role</label>
              <select value={role} onChange={e => setRole(e.target.value as any)} className="w-full mt-1 p-2 bg-white/5 rounded">
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-300">Student Email</label>
              <Input required type="email" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setEmail(e.target.value)} placeholder="you@university.edu" />
            </div>

            <div>
              <label className="block text-sm text-slate-300">Password</label>
              <Input required type="password" value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setPassword(e.target.value)} placeholder="Choose a secure password" />
            </div>

            <div>
              <Button type="submit" className="w-full">Create account</Button>
            </div>
          </form>
        )}

        {step === 2 && (
          <div>
            <p className="text-sm text-slate-300">{message}</p>
            <p className="mt-3 text-sm">If you already clicked the link, go to the verify page. Otherwise check your inbox.</p>
            <div className="mt-4">
              <a className="text-indigo-400 underline" href="/verify-email">Open verification page</a>
            </div>
          </div>
        )}

        <div className="mt-6 text-sm text-slate-400">Already have an account? <a className="text-indigo-400 underline" href="/auth/signin">Sign in</a></div>
      </div>
    </div>
  );
}
