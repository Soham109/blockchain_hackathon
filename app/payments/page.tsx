"use client";
import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditCard, Calendar, Package, TrendingUp, FileText, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export default function PaymentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for session to load before redirecting
    if (status === 'loading') {
      return;
    }
    
    if (status === 'unauthenticated' || !session?.user) {
      router.push('/auth/signin');
      return;
    }
    
    if (status === 'authenticated' && session?.user) {
      loadPayments();
    }
  }, [session, status, router]);

  async function loadPayments() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/payments');
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/auth/signin');
          return;
        }
        const errorData = await res.json().catch(() => ({ error: 'Failed to load payments' }));
        throw new Error(errorData.error || `Failed to load payments: ${res.status}`);
      }
      const data = await res.json();
      setPayments(data.payments || []);
    } catch (err: any) {
      console.error('Failed to load payments', err);
      setError(err.message || 'Failed to load payment history');
    } finally {
      setLoading(false);
    }
  }

  function getPaymentTypeIcon(type: string) {
    switch (type) {
      case 'purchase':
        return <Package className="h-5 w-5" />;
      case 'listing':
        return <FileText className="h-5 w-5" />;
      case 'boost':
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  }

  function getPaymentTypeLabel(type: string) {
    switch (type) {
      case 'purchase':
        return 'Product Purchase';
      case 'listing':
        return 'Listing Fee';
      case 'boost':
        return 'Product Boost';
      default:
        return 'Payment';
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-12 px-4">
        <div className="max-w-6xl mx-auto space-y-4 pt-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const totalSpent = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

  return (
    <div className="min-h-screen pt-32 pb-12 px-4 bg-background">
      <div className="max-w-6xl mx-auto space-y-6 pt-4">
        <div>
          <h1 className="text-5xl md:text-6xl font-bold mb-3 tracking-tight">
            <span className="text-blue-500 dark:text-cyan-400">Payment</span>{' '}
            <span>History</span>
          </h1>
          <p className="text-muted-foreground text-xl">
            {payments.length} {payments.length === 1 ? 'payment' : 'payments'} • Total: ${totalSpent.toFixed(2)}
          </p>
        </div>

        {payments.length > 0 ? (
          <div className="space-y-4">
            {payments.map((payment) => (
              <Card key={payment._id} className="border-2 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                          {getPaymentTypeIcon(payment.type)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{getPaymentTypeLabel(payment.type)}</h3>
                          {payment.productTitle && payment.productTitle !== 'N/A' && (
                            <p className="text-sm text-muted-foreground">{payment.productTitle}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {formatDistanceToNow(new Date(payment.createdAt), { addSuffix: true })}
                        </div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          ${(parseFloat(payment.amount) || 0).toFixed(2)} {payment.paymentMethod === 'eth' ? 'ETH' : 'SOL'}
                        </div>
                        {payment.verified && (
                          <Badge variant="default" className="bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30">
                            ✓ Verified
                          </Badge>
                        )}
                        {payment.txHash && (
                          <div className="flex items-center gap-2">
                            <ExternalLink className="h-3 w-3" />
                            <span className="font-mono text-xs">{payment.txHash.slice(0, 10)}...{payment.txHash.slice(-8)}</span>
                          </div>
                        )}
                      </div>
                      {payment.keywords && payment.keywords.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="text-xs text-muted-foreground">Keywords:</span>
                          {payment.keywords.map((keyword: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    {payment.productId && payment.productId !== 'N/A' && (
                      <Link href={`/products/${payment.productId}`}>
                        <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                          View Product
                        </Badge>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="border-2 border-destructive/50">
            <CardContent className="p-12 text-center">
              <CreditCard className="h-16 w-16 mx-auto mb-4 text-destructive opacity-50" />
              <p className="text-lg font-medium mb-2 text-destructive">Error Loading Payments</p>
              <p className="text-sm text-muted-foreground mb-6">{error}</p>
              <Button onClick={loadPayments} className="cursor-pointer">
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-2">
            <CardContent className="p-12 text-center">
              <CreditCard className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-medium mb-2">No payments yet</p>
              <p className="text-sm text-muted-foreground mb-6">
                Your payment history will appear here
              </p>
              <Link href="/browse">
                <Button className="cursor-pointer">
                  Browse Products
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

