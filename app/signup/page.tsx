"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Mail, Lock, User, CheckCircle2, ShoppingBag, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const EDU_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.edu$/i;

export default function SignUpPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'buyer'|'seller'>('buyer');
  const [message, setMessage] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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

  async function register(e: React.FormEvent) {
    e.preventDefault();
    if (!validateEmail(email)) {
      setMessage('Please enter a valid .edu email address');
      return;
    }
    if (password.length < 6) {
      setMessage('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    setMessage('Creating your account...');
    
    try {
      const resp = await fetch('/api/auth/register', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ email, password, role }) 
      });
      const data = await resp.json();
      
      if (resp.ok) {
        setMessage('Account created successfully! Check your email for the verification link.');
        setStep(2);
      } else {
        setMessage(data?.error || 'Failed to create account. Please try again.');
      }
    } catch (err: any) {
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-lg bg-foreground flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-background" />
            </div>
            <span className="font-bold text-2xl">UniMarket</span>
          </Link>
          <p className="text-muted-foreground">Join the student marketplace</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${
              step >= 1 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'
            }`}>
              {step > 1 ? <CheckCircle2 className="h-4 w-4" /> : '1'}
            </div>
            <span className="text-sm font-medium hidden sm:inline">Account</span>
          </div>
          <div className={`h-1 w-12 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${
              step >= 2 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'
            }`}>
              {step > 2 ? <CheckCircle2 className="h-4 w-4" /> : '2'}
            </div>
            <span className="text-sm font-medium hidden sm:inline">Verify</span>
          </div>
          <div className={`h-1 w-12 ${step >= 3 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${
              step >= 3 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'
            }`}>
              3
            </div>
            <span className="text-sm font-medium hidden sm:inline">ID Upload</span>
          </div>
        </div>

        <Card className="border-2">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
            <CardDescription>
              {step === 1 && 'Start by creating your account'}
              {step === 2 && 'Verify your email to continue'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <form onSubmit={register} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="role">I want to</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as any)}>
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buyer">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Buy items
                        </div>
                      </SelectItem>
                      <SelectItem value="seller">
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="h-4 w-4" />
                          Sell items
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Student Email</Label>
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
                  {!emailError && email && EDU_EMAIL_REGEX.test(email) && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Valid .edu email
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
                      placeholder="At least 6 characters"
                      className="pl-10"
                      required
                      minLength={6}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Must be at least 6 characters long
                  </p>
                </div>

                {message && (
                  <Alert variant={message.includes('successfully') ? 'default' : 'destructive'}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{message}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={loading} size="lg">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Creating account...
                    </span>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Account created!</strong> We've sent a verification link to <strong>{email}</strong>
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Click the link in your email to verify your account. Once verified, you can sign in and complete your student ID verification.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={() => router.push('/verify-email')}
                      className="flex-1"
                    >
                      Open Verification Page
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/auth/signin" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
