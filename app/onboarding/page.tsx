"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Upload, CheckCircle2, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function OnboardingPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [latestVerification, setLatestVerification] = useState<any>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Always return the same structure to avoid hook violations
  const user = session?.user as any;
  const isStudentVerified = user?.studentVerified;
  const isLoading = status === 'loading' || status === 'unauthenticated';

  // Redirect if already verified
  useEffect(() => {
    if (isStudentVerified && !isRedirecting) {
      setIsRedirecting(true);
      setTimeout(async () => {
        await update();
        router.push('/dashboard');
      }, 2000);
    }
  }, [isStudentVerified, router, isRedirecting, update]);

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
      console.log('=== Frontend: Starting ID Upload ===');
      console.log('User ID:', user?.id);
      console.log('File name:', file.name);
      console.log('File size:', file.size, 'bytes');
      console.log('File type:', file.type);

      const resp = await fetch('/api/id/upload', {
        method: 'POST',
        body: form,
        headers: {
          'x-user-id': user?.id,
        },
      });

      console.log('Upload response status:', resp.status, resp.statusText);

      const data = await resp.json();
      console.log('=== Frontend: Upload API Response ===');
      console.log(JSON.stringify(data, null, 2));
      console.log('Response status field:', data?.status);
      console.log('Response parsed field:', data?.parsed);
      console.log('Response ocrResult field:', data?.ocrResult);
      console.log('Response rawModelText (first 500 chars):', data?.rawModelText?.substring(0, 500));

      if (resp.ok) {
        setUploadStatus('success');
        setLatestVerification(data);
        
        // Save secrets, OCR values, and proof store data to localStorage
        if (data?.secrets && data?.recordId && data?.proofStorePda) {
          const proofStoreData = {
            recordId: data.recordId,
            recordPda: data.proofStorePda,
            tx: data.proofStoreTx,
            secrets: data.secrets,
            parsed: data.parsed, // OCR values (name, student_id, university, expiration_date)
            hashes: data.hashes, // Hashes for verification
          };
          localStorage.setItem('proofStoreData', JSON.stringify(proofStoreData));
          console.log('Saved proof store data to localStorage:', proofStoreData);
        }
        
        console.log('Upload successful, verification status:', data?.status);
        
        // If verified immediately, redirect
        if (data?.status === 'verified') {
          console.log('Status is verified, redirecting to dashboard...');
          toast({
            title: "Verification Successful!",
            description: "Redirecting to dashboard...",
          });
          // Update session to reflect verification
          setTimeout(async () => {
            // Refresh session to get updated user data
            await update();
            router.push('/dashboard');
          }, 1500);
        } else {
          console.log('Status is pending, showing pending message');
          toast({
            title: "Upload Successful",
            description: "Your ID is being reviewed. We'll notify you when it's verified.",
          });
        }
      } else {
        setUploadStatus('error');
        let errorMessage = data?.error || 'Upload failed. Please try again.';
        
        // Handle specific API errors
        if (errorMessage.includes('OpenRouter not configured')) {
          errorMessage = 'ID verification service is not configured. Please contact support.';
        } else if (errorMessage.includes('API')) {
          errorMessage = 'Verification service error. Please try again later.';
        }
        
        setErrorMsg(errorMessage);
        toast({
          title: "Upload Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (err) {
      setUploadStatus('error');
      const errorMessage = (err as Error).message || 'Network error. Please check your connection.';
      setErrorMsg(errorMessage);
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }

  const fetchLatest = useCallback(async () => {
    if (!user?.id) {
      console.warn('fetchLatest: No user ID available');
      return;
    }
    
    try {
      console.log('fetchLatest: Calling API with user ID:', user.id);
      const resp = await fetch('/api/id/latest', { 
        headers: { 'x-user-id': user.id } 
      });
      
      console.log('fetchLatest: Response status:', resp.status);
      
      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({ error: 'Unknown error' }));
        console.error('fetchLatest: API error:', resp.status, errorData);
        return;
      }
      
      const data = await resp.json();
      console.log('fetchLatest: Response data:', data);
      
      if (data.verification) {
        console.log('fetchLatest: Setting verification status:', data.verification.status);
        setLatestVerification(data.verification);
        
        // If verified, redirect
        if (data.verification.status === 'verified') {
          toast({
            title: "Verification Complete!",
            description: "Redirecting to dashboard...",
          });
          // Small delay to ensure database is updated
          setTimeout(async () => {
            // Refresh session to get updated user data
            await update();
            router.push('/dashboard');
          }, 1500);
        }
      } else {
        console.warn('fetchLatest: No verification data in response');
      }
    } catch (e) {
      console.error('fetchLatest: Exception:', e);
      toast({
        title: "Error checking status",
        description: "Failed to fetch verification status. Please try refreshing.",
        variant: "destructive",
      });
    }
  }, [user?.id, toast, update, router]);

  // Poll for verification status if pending
  useEffect(() => {
    if (!user?.id || isStudentVerified || latestVerification?.status !== 'pending') {
      return;
    }

    console.log('Setting up polling interval for verification status');
    
    const checkStatus = async () => {
      if (!user?.id) {
        console.warn('checkStatus: No user ID available');
        return;
      }
      
      try {
        console.log('Polling: Checking verification status...');
        console.log('checkStatus: Calling API with user ID:', user.id);
        const resp = await fetch('/api/id/latest', { 
          headers: { 'x-user-id': user.id } 
        });
        
        console.log('checkStatus: Response status:', resp.status);
        
        if (!resp.ok) {
          const errorData = await resp.json().catch(() => ({ error: 'Unknown error' }));
          console.error('checkStatus: API error:', resp.status, errorData);
          return;
        }
        
        const data = await resp.json();
        console.log('checkStatus: Response data:', data);
        
        if (data.verification) {
          console.log('checkStatus: Setting verification status:', data.verification.status);
          setLatestVerification(data.verification);
          
          // If verified, redirect
          if (data.verification.status === 'verified') {
            toast({
              title: "Verification Complete!",
              description: "Redirecting to dashboard...",
            });
            // Small delay to ensure database is updated
            setTimeout(async () => {
              // Refresh session to get updated user data
              await update();
              router.push('/dashboard');
            }, 1500);
          }
        } else {
          console.warn('checkStatus: No verification data in response');
        }
      } catch (e) {
        console.error('checkStatus: Exception:', e);
        toast({
          title: "Error checking status",
          description: "Failed to fetch verification status. Please try refreshing.",
          variant: "destructive",
        });
      }
    };

    const interval = setInterval(checkStatus, 5000); // Check every 5 seconds
    
    return () => {
      console.log('Clearing polling interval');
      clearInterval(interval);
    };
  }, [user?.id, isStudentVerified, latestVerification?.status, toast, update, router]);

  // Fetch latest on mount
  useEffect(() => {
    if (user?.id && !isStudentVerified) {
      fetchLatest();
    }
  }, [user?.id, isStudentVerified]);

  // Always return the same structure
  return (
    <div className="min-h-screen pt-28 pb-8 px-4 bg-background">
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Skeleton className="h-12 w-64" />
        </div>
      ) : (
        <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <Badge className="mb-3 px-4 py-1.5 text-sm">Step 2: Complete Verification</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-2 tracking-tight">
            <span className="text-blue-500 dark:text-cyan-400">Verify</span>{' '}
            <span>Your Student ID</span>
          </h1>
          <p className="text-muted-foreground text-base">
            Upload a clear photo of your student ID to unlock full marketplace access
          </p>
        </div>

        {/* Status Indicator */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="border-2 border-green-500/30 bg-green-500/10">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-green-500/20 border-2 border-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
            <p className="text-sm font-medium">Email Verified</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-primary">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-primary/20 border-2 border-primary rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-xl font-bold">2</span>
            </div>
            <p className="text-sm font-medium">Upload ID</p>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-muted border-2 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-xl font-bold text-muted-foreground">3</span>
          </div>
              <p className="text-sm font-medium text-muted-foreground">Start Selling</p>
            </CardContent>
          </Card>
        </div>

        {/* Already Verified */}
        {isStudentVerified && (
          <Card className="border-2 border-green-500/30 bg-green-500/10 mb-6">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="h-8 w-8 text-green-500 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2">You're Verified!</h3>
                  <p className="text-muted-foreground mb-4">
                  Your student ID has been verified. You can now buy and sell on the marketplace.
                </p>
                  {isRedirecting ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span>Redirecting to dashboard...</span>
                    </div>
                  ) : (
                    <Button
                  onClick={() => router.push('/dashboard')}
                      className="cursor-pointer"
                    >
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Form */}
        {!isStudentVerified && (
          <Card className="border-2 shadow-lg mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Upload Student ID Photo</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
            <form onSubmit={handleUpload} className="space-y-4">
              {/* File Input */}
              <div>
                <label className="block text-sm font-medium mb-2">Student ID Photo</label>
                  <label className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors bg-muted min-h-[160px]">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const selectedFile = e.target.files?.[0] || null;
                      setFile(selectedFile);
                      setErrorMsg('');
                      if (selectedFile) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setPreview(reader.result as string);
                        };
                        reader.readAsDataURL(selectedFile);
                      } else {
                        setPreview(null);
                      }
                    }}
                    className="hidden"
                      disabled={uploadStatus === 'uploading'}
                  />
                  {preview ? (
                    <div className="space-y-3">
                      <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-primary">
                        <img 
                          src={preview} 
                          alt="Preview" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-sm">{file?.name}</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFile(null);
                            setPreview(null);
                          }}
                          className="mt-2"
                        >
                          Change Image
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                      <p className="font-medium text-sm">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG, or WebP up to 10MB
                      </p>
                    </div>
                  )}
                </label>
              </div>

              {/* Instructions */}
                <Card className="bg-muted border-2">
                  <CardContent className="p-3">
                <p className="text-xs font-medium mb-1.5">📋 Requirements:</p>
                    <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
                      <li>Clear, well-lit photo of your student ID</li>
                      <li>All text must be legible</li>
                      <li>Show front side clearly</li>
                      <li>Include your full name and student number</li>
                </ul>
                  </CardContent>
                </Card>

              {/* Error Message */}
              {errorMsg && (
                  <div className="bg-destructive/10 border-2 border-destructive/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-medium">{errorMsg}</span>
                    </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={!file || uploadStatus === 'uploading'}
                  className="w-full h-11 text-sm font-semibold"
                  size="lg"
              >
                {uploadStatus === 'uploading' ? (
                  <span className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading...
                  </span>
                ) : uploadStatus === 'success' ? (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      Uploaded Successfully!
                    </span>
                ) : (
                    <span className="flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      Upload Student ID
                    </span>
                )}
              </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Verification Status */}
        {latestVerification && latestVerification.status && latestVerification.status !== 'verified' && (
          <Card className="border-2 mb-6">
            <CardContent className="p-6">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {latestVerification.status === 'pending' ? (
                      <Clock className="h-6 w-6 text-yellow-500" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-red-500" />
                    )}
                    <h3 className="font-bold text-lg">Verification Status</h3>
                  </div>
                  <Badge 
                    variant={latestVerification.status === 'pending' ? 'default' : 'destructive'}
                    className="mb-2"
                  >
                    {latestVerification.status === 'pending' ? 'Pending Review' : 'Rejected'}
                  </Badge>
                  {latestVerification.status === 'pending' && (
                    <p className="text-sm text-muted-foreground">
                      Your ID is being reviewed. This usually takes a few minutes. We'll automatically redirect you when verification is complete.
                    </p>
                  )}
                  {latestVerification.status === 'rejected' && (
                    <p className="text-sm text-muted-foreground">
                      Your ID verification was rejected. Please upload a clearer photo and try again.
                    </p>
                )}
              </div>
                <Button 
                  onClick={fetchLatest} 
                  variant="outline" 
                  size="sm" 
                  className="cursor-pointer"
                >
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Box */}
        <Card className="border-2">
          <CardContent className="p-6">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <span>🔒</span>
              Your Data is Private
            </h3>
            <p className="text-sm text-muted-foreground">
              We use AI to extract and verify your student ID information. Your photo is processed securely and only the verification result is saved to our database.
            </p>
          </CardContent>
        </Card>
        </div>
      )}
    </div>
  );
}
