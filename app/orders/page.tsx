"use client";
import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, Download, Eye, Calendar, DollarSign, Truck, ExternalLink, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export default function OrdersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) {
      router.push('/auth/signin');
      return;
    }
    loadOrders();
  }, [session, router]);

  async function loadOrders() {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  }

  async function downloadInvoice(orderId: string) {
    try {
      const res = await fetch(`/api/orders/${orderId}/invoice`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download invoice', err);
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

  return (
    <div className="min-h-screen pt-32 pb-12 px-4 bg-background">
      <div className="max-w-6xl mx-auto space-y-6 pt-4">
        <div>
          <h1 className="text-5xl md:text-6xl font-bold mb-3 tracking-tight">
            My <span className="text-blue-500 dark:text-cyan-400">Orders</span>
          </h1>
          <p className="text-muted-foreground text-xl">
            {orders.length} {orders.length === 1 ? 'order' : 'orders'} total
          </p>
        </div>

        {orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order._id} className="border-2 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Package className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <h3 className="font-semibold text-lg">{order.productTitle || 'Product'}</h3>
                          <p className="text-sm text-muted-foreground">
                            Order #{order._id.toString().slice(-8)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          ${(parseFloat(order.amount) || 0).toFixed(2)}
                        </div>
                        {order.paymentMethod && (
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            {order.paymentMethod.toUpperCase()}
                          </div>
                        )}
                        {order.verified && (
                          <Badge variant="default" className="bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30">
                            ✓ Verified
                          </Badge>
                        )}
                        {order.status && (
                          <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                            {order.status}
                          </Badge>
                        )}
                        {order.txHash && (
                          <div className="flex items-center gap-2">
                            <ExternalLink className="h-3 w-3" />
                            <span className="font-mono text-xs">{order.txHash.slice(0, 10)}...{order.txHash.slice(-8)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/products/${order.productId}`}>
                        <Button variant="outline" size="sm" className="cursor-pointer">
                          <Eye className="h-4 w-4 mr-2" />
                          View Product
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadInvoice(order._id)}
                        className="cursor-pointer"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Invoice
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-2">
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-medium mb-2">No orders yet</p>
              <p className="text-sm text-muted-foreground mb-6">
                Start shopping to see your orders here
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

