"use client";
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function VerifyEmailPage() {
  const params = useSearchParams();
  const token = params?.get ? params.get('token') : null;
  const [status, setStatus] = useState('verifying');

  useEffect(() => {
    if (!token) {
      setStatus('no-token');
      return;
    }

    (async () => {
      setStatus('verifying');
      try {
        const resp = await fetch('/api/auth/verifyEmail', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
        const data = await resp.json();
        if (!resp.ok) {
          setStatus('error');
          return;
        }

        const loginToken = data?.loginToken;
        // After verification, redirect user to sign-in page to log in with email/password
        window.location.href = '/auth/signin';
      } catch (err) {
        console.error('verify error', err);
        setStatus('error');
      }
    })();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="p-8 bg-white/5 rounded">
        {status === 'verifying' && <div>Verifying... please wait.</div>}
        {status === 'no-token' && <div>No token provided.</div>}
        {status === 'error' && <div>Verification failed or token expired.</div>}
        {status === 'signin-failed' && <div>Sign in failed.</div>}
        {status === 'signed-in' && <div>Successfully signed in — redirecting...</div>}
      </div>
    </div>
  );
}
