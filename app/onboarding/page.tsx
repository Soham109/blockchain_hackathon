"use client";
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [latestVerification, setLatestVerification] = useState<any>(null);
  const [parsedResult, setParsedResult] = useState<any>(null);

  // Redirect if not logged in
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Button onClick={() => router.push('/auth/signin')}>Sign In First</Button>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-12 w-64" />
      </div>
    );
  }

  const user = session?.user as any;
  const isStudentVerified = user?.studentVerified;

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setErrorMsg('Please select a file');
      return;
    }

    setUploadStatus('uploading');
    setErrorMsg('');

    const form = new FormData();
    form.append('file', file);

    try {
      console.log('Starting upload to /api/id/upload');
      const resp = await fetch('/api/id/upload', {
        method: 'POST',
        body: form,
        headers: {
          'x-user-id': user?.id,
        },
      });

      const data = await resp.json();

      if (resp.ok) {
        setUploadStatus('success');
        // show parsed result returned by the API if available
        if (data?.parsed) setParsedResult(data.parsed);
        if (data?.rawModelText) {
          setParsedResult((p: any) => p || null);
          setLatestVerification((lv: any) => lv || { parsed: data.parsed, status: data.status, id: data.idVerificationId, rawModelText: data.rawModelText, debugJson: data.debugJson });
        } else if (data?.status) {
          setLatestVerification({ parsed: data.parsed, status: data.status, id: data.idVerificationId });
        }
        // If backend marked the document as verified, redirect to dashboard immediately
        if (data?.status === 'verified') {
          // Update session first, then redirect
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1500);
        }
      } else {
        setUploadStatus('error');
        setErrorMsg(data?.error || 'Upload failed');
      }
    } catch (err) {
      setUploadStatus('error');
      setErrorMsg((err as Error).message);
    }
  }

  async function fetchLatest() {
    try {
      const resp = await fetch('/api/id/latest', { headers: { 'x-user-id': user.id } });
      const data = await resp.json();
      if (resp.ok) {
        setLatestVerification(data.verification || null);
        setParsedResult(data.verification?.parsed || null);
      }
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => {
    if (user?.id && !isStudentVerified) {
      fetchLatest();
      // Poll for verification status
      const interval = setInterval(async () => {
        try {
          const resp = await fetch('/api/id/latest', { headers: { 'x-user-id': user.id } });
          const data = await resp.json();
          if (resp.ok && data.verification?.status === 'verified') {
            clearInterval(interval);
            // Redirect to dashboard when verified
            window.location.href = '/dashboard';
          }
        } catch (e) {
          // Ignore errors
        }
      }, 5000); // Check every 5 seconds
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isStudentVerified]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="mx-auto max-w-2xl px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4 px-3 py-1 bg-indigo-500/20 border border-indigo-500/50 rounded-full">
            <span className="text-sm font-semibold text-indigo-300">Step 2: Complete Verification</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Verify Your Student ID</h1>
          <p className="text-slate-300">
            Upload a clear photo of your student ID to unlock full marketplace access and seller features.
          </p>
        </div>

        {/* Status Indicator */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          <div className="text-center">
            <div className="w-12 h-12 bg-emerald-500/20 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-xl">✓</span>
            </div>
            <p className="text-sm font-medium">Email Verified</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-indigo-500/20 border-2 border-indigo-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-xl">2</span>
            </div>
            <p className="text-sm font-medium">Upload ID</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-slate-500/20 border-2 border-slate-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-xl">3</span>
            </div>
            <p className="text-sm font-medium text-slate-400">Start Selling</p>
          </div>
        </div>

        {/* Already Verified */}
        {isStudentVerified && (
          <Card className="border-emerald-500/30 bg-emerald-500/10 mb-8">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <span className="text-2xl">✓</span>
                <div>
                  <h3 className="font-bold text-emerald-200">You're Verified!</h3>
                  <p className="text-sm text-emerald-100 mt-1">
                    Your student ID has been verified. You can now buy and sell on the marketplace.
                  </p>
                  <Button
                    onClick={() => router.push('/dashboard')}
                    variant="outline"
                    className="mt-2 cursor-pointer"
                  >
                    Go to Dashboard →
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Form */}
        {!isStudentVerified && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">Upload Student ID Photo</CardTitle>
            </CardHeader>
            <CardContent>

            <form onSubmit={handleUpload} className="space-y-6">
              {/* File Input */}
              <div>
                <label className="block text-sm font-medium mb-3">Student ID Photo</label>
                <label className="flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed border-indigo-500/50 rounded-lg cursor-pointer hover:border-indigo-500 transition bg-indigo-500/5">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      setFile(e.target.files?.[0] || null);
                      setErrorMsg('');
                    }}
                    className="hidden"
                  />
                  <div className="text-center">
                    <div className="text-4xl mb-2">📸</div>
                    <p className="font-medium text-slate-100">{file ? file.name : 'Click to upload or drag and drop'}</p>
                    <p className="text-xs text-slate-400 mt-1">PNG, JPG, or WebP up to 10MB</p>
                  </div>
                </label>
              </div>

              {/* Instructions */}
              <div className="bg-slate-700/50 rounded p-4">
                <p className="text-sm font-medium mb-2">📋 Requirements:</p>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• Clear, well-lit photo of your student ID</li>
                  <li>• All text must be legible</li>
                  <li>• Show front side clearly</li>
                  <li>• Include your full name and student number</li>
                </ul>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="bg-red-500/20 border border-red-500/50 rounded p-3 text-sm text-red-200">
                  ❌ {errorMsg}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={!file || uploadStatus === 'uploading'}
                className="w-full py-3"
              >
                {uploadStatus === 'uploading' ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading...
                  </span>
                ) : uploadStatus === 'success' ? (
                  '✓ Uploaded! Redirecting...'
                ) : (
                  'Upload Student ID'
                )}
              </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Verification Result - Only show if pending/rejected, auto-redirect if verified */}
        {latestVerification && latestVerification.status !== 'verified' && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold">Verification Status</h3>
                  <p className="text-sm text-slate-300 mt-2">
                    Status: <strong className="ml-2 capitalize">{latestVerification.status}</strong>
                  </p>
                  {latestVerification.status === 'pending' && (
                    <p className="text-sm text-slate-400 mt-2">
                      Your ID is being reviewed. This usually takes a few minutes.
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Button onClick={() => fetchLatest()} variant="outline" size="sm" className="cursor-pointer">Refresh Status</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Box */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-bold mb-2">🔒 Your Data is Private</h3>
            <p className="text-sm text-slate-300">
              We use AI to extract and verify your student ID information. Your photo is never stored — only the verification result is saved to our secure database.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
