"use client";
import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

function VerifyEmailContent() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params?.get ? params.get('token') : null;
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'no-token'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('no-token');
      setMessage('No verification token provided.');
      return;
    }

    (async () => {
      setStatus('verifying');
      try {
        const resp = await fetch('/api/auth/verifyEmail', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ token }) 
        });
        const data = await resp.json();
        
        if (!resp.ok) {
          setStatus('error');
          setMessage(data?.error || 'Verification failed or token expired.');
          return;
        }

        setStatus('success');
        setMessage('Email verified successfully! Redirecting to sign in...');
        
        // Redirect to sign in after 2 seconds
        setTimeout(() => {
          router.push('/auth/signin?verified=true');
        }, 2000);
      } catch (err) {
        console.error('verify error', err);
        setStatus('error');
        setMessage('Network error. Please try again.');
      }
    })();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md border-2">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === 'verifying' && (
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            )}
            {(status === 'error' || status === 'no-token') && (
              <AlertCircle className="h-12 w-12 text-destructive" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {status === 'verifying' && 'Verifying Email'}
            {status === 'success' && 'Email Verified!'}
            {(status === 'error' || status === 'no-token') && 'Verification Failed'}
          </CardTitle>
          <CardDescription>
            {status === 'verifying' && 'Please wait while we verify your email address...'}
            {status === 'success' && 'Your email has been successfully verified.'}
            {(status === 'error' || status === 'no-token') && message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'verifying' && (
            <div className="text-center text-sm text-muted-foreground">
              This should only take a moment...
            </div>
          )}
          
          {status === 'success' && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                {message}
              </AlertDescription>
            </Alert>
          )}
          
          {(status === 'error' || status === 'no-token') && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          
          {status === 'success' && (
            <div className="text-center text-sm text-muted-foreground">
              You can now sign in to your account.
            </div>
          )}
          
          {(status === 'error' || status === 'no-token') && (
            <div className="flex flex-col gap-2">
              <Button onClick={() => router.push('/auth/signin')} className="w-full">
                Go to Sign In
              </Button>
              <Button variant="outline" onClick={() => router.push('/signup')} className="w-full">
                Create New Account
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
