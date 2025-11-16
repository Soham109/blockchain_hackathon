"use client";
import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ExternalLink, Calendar, CreditCard, Package, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [countdown, setCountdown] = useState(5);

  const txHash = searchParams?.get('txHash');
  const amount = searchParams?.get('amount');
  const paymentMethod = searchParams?.get('paymentMethod');
  const productTitle = searchParams?.get('productTitle');
  const type = searchParams?.get('type') || 'purchase';

  useEffect(() => {
    if (!session?.user) {
      router.push('/auth/signin');
      return;
    }

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/payments');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [session, router]);

  const getTypeLabel = () => {
    switch (type) {
      case 'purchase':
        return 'Purchase';
      case 'listing':
        return 'Listing Fee';
      case 'boost':
        return 'Product Boost';
      default:
        return 'Payment';
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-12 px-4 bg-background flex items-center justify-center">
      <div className="max-w-2xl w-full">
        <Card className="border-2 shadow-xl">
          <CardContent className="p-8 md:p-12">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping"></div>
                <div className="relative bg-green-500 rounded-full p-6">
                  <CheckCircle2 className="h-16 w-16 text-white" />
                </div>
              </div>
            </div>

            {/* Success Message */}
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-3">Payment Successful!</h1>
              <p className="text-xl text-muted-foreground">
                Your {getTypeLabel().toLowerCase()} has been confirmed
              </p>
            </div>

            {/* Payment Details */}
            <Card className="border-2 bg-muted mb-6">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Details
                </h2>
                <div className="space-y-3">
                  {productTitle && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Product</span>
                      <span className="font-medium">{productTitle}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Amount</span>
                    <span className="font-bold text-lg">${parseFloat(amount || '0').toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Payment Method</span>
                    <Badge variant="secondary" className="uppercase text-xs">
                      {paymentMethod || 'N/A'}
                    </Badge>
                  </div>
                  {txHash && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Transaction Hash</span>
                      <span className="font-mono text-xs flex items-center gap-1">
                        {txHash.slice(0, 10)}...{txHash.slice(-8)}
                        <ExternalLink className="h-3 w-3" />
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Date</span>
                    <span className="text-sm">{new Date().toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => router.push('/payments')}
                className="flex-1 h-12 text-base font-semibold shadow-md hover:shadow-lg transition-shadow"
                size="lg"
              >
                <CreditCard className="h-5 w-5 mr-2" />
                View Payment History
              </Button>
              {type === 'purchase' && (
                <Button
                  variant="outline"
                  onClick={() => router.push('/orders')}
                  className="flex-1 h-12 text-base border-2"
                  size="lg"
                >
                  <Package className="h-5 w-5 mr-2" />
                  View Orders
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => router.push('/browse')}
                className="flex-1 h-12 text-base border-2"
                size="lg"
              >
                Continue Shopping
              </Button>
            </div>

            {/* Auto-redirect notice */}
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Redirecting to payment history in {countdown} second{countdown !== 1 ? 's' : ''}...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-32 pb-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}

