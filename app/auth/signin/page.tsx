"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Mail, Lock, ArrowRight, ShoppingBag, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const EDU_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.edu$/i;

function SignInContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerified, setShowVerified] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, update } = useSession();
  
  useEffect(() => {
    if (searchParams?.get('verified') === 'true') {
      setShowVerified(true);
      // Hide after 5 seconds
      setTimeout(() => setShowVerified(false), 5000);
    }
  }, [searchParams]);

  function validateEmail(value: string) {
    if (!value) {
      setEmailError('');
      return false;
    }
    if (!EDU_EMAIL_REGEX.test(value)) {
      setEmailError('Please use a valid .edu email address');
      return false;
    }
    setEmailError('');
    return true;
  }

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setEmail(value);
    validateEmail(value);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!validateEmail(email)) {
      setError('Please enter a valid .edu email address');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }
    
    setLoading(true);
    try {
      const res = await signIn('credentials', { redirect: false, email, password });
      if ((res as any)?.ok) {
        // Update session to get latest user data
        await update();
        
        // Fetch user data to check verification status
        try {
          // Get user ID from the response or fetch current user
          const userRes = await fetch('/api/users/current');
          if (userRes.ok) {
            const userData = await userRes.json();
            const user = userData.user;
            
            // If user is not student verified, redirect to onboarding
            if (!user?.studentVerified) {
              router.push('/onboarding');
            } else {
              router.push('/dashboard');
            }
          } else {
            // Fallback: redirect to onboarding (new users need onboarding)
            router.push('/onboarding');
          }
        } catch {
          // Fallback: redirect to onboarding
          router.push('/onboarding');
        }
      } else {
        setError('Invalid email or password. Make sure your email is verified.');
      }
    } catch (err: any) {
      setError(err.message || 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-3">
            <div className="h-10 w-10 rounded-lg bg-foreground flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-background" />
            </div>
            <span className="font-bold text-2xl">UniMarket</span>
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-2 tracking-tight">
            <span className="text-blue-500 dark:text-cyan-400">Sign</span>{' '}
            <span>In</span>
          </h1>
          <p className="text-muted-foreground">Welcome back to your student marketplace</p>
        </div>

        <Card className="border-2">
          <CardHeader className="space-y-1 pb-4">
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {showVerified && (
              <Alert className="mb-4 border-emerald-500/50 bg-emerald-500/20">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <AlertDescription className="text-emerald-700 dark:text-emerald-400">
                  Email verified successfully! You can now sign in.
                </AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={submit} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="you@university.edu"
                    className={`pl-10 ${emailError ? 'border-destructive' : ''}`}
                    required
                  />
                </div>
                {emailError && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {emailError}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
                size="lg"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/signup" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
