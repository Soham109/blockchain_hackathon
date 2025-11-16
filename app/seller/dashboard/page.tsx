"use client";
import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Plus, Eye, Edit, Trash2, TrendingUp, DollarSign, CreditCard, Wallet, Calendar, ExternalLink } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function SellerDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, totalValue: 0 });
  const [financials, setFinancials] = useState<any>(null);

  useEffect(() => {
    if (!session?.user) {
      router.push('/auth/signin');
      return;
    }
    loadProducts();
    loadFinancials();
  }, [session]);

  async function loadFinancials() {
    try {
      const res = await fetch('/api/seller/financials');
      if (res.ok) {
        const data = await res.json();
        setFinancials(data);
      }
    } catch (error) {
      console.error('Failed to load financials', error);
    }
  }

  async function loadProducts() {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      const products = (data.items || []).filter((p: any) => 
        p.sellerEmail === (session?.user as any)?.email || p.sellerId === (session?.user as any)?.id
      );
      setItems(products);
      
      const totalValue = products.reduce((sum: number, p: any) => 
        sum + (p.priceCents || 0), 0
      );
      setStats({ total: products.length, totalValue });
      setLoading(false);
    } catch (error) {
      console.error('Failed to load products', error);
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({
          title: "Success",
          description: "Listing deleted successfully",
        });
        loadProducts();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete listing",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete listing",
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
        <div className="text-muted-foreground">Loading your listings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-12 px-4 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 pt-4">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold mb-3 tracking-tight">
              <span className="text-blue-500 dark:text-cyan-400">Seller</span>{' '}
              <span>Dashboard</span>
            </h1>
            <p className="text-muted-foreground text-xl">Manage your listings and track performance</p>
          </div>
          <Link href="/seller/create">
            <Button>
              <Plus size={16} className="mr-2" />
              New Listing
            </Button>
          </Link>
        </div>

        {/* Financial Overview - Compact */}
        {financials && (
          <div className="mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <Card className="border-2 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold">${financials.totalRevenue.toFixed(2)}</p>
                </CardContent>
              </Card>
              <Card className="border-2 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Total Sales</p>
                  <p className="text-2xl font-bold">{financials.totalSales}</p>
                </CardContent>
              </Card>
              <Card className="border-2 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">30-Day Revenue</p>
                  <p className="text-2xl font-bold">${financials.recentRevenue.toFixed(2)}</p>
                </CardContent>
              </Card>
              <Card className="border-2 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Active Listings</p>
                  <p className="text-2xl font-bold">{financials.activeListings}</p>
                </CardContent>
              </Card>
            </div>

            {/* Payment Method Breakdown - Compact */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Card className="border-2 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-semibold">ETH Revenue</span>
                  </div>
                  <p className="text-xl font-bold">${financials.ethRevenue.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{financials.ethSales} sales</p>
                </CardContent>
              </Card>
              <Card className="border-2 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-semibold">SOL Revenue</span>
                  </div>
                  <p className="text-xl font-bold">${financials.solRevenue.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{financials.solSales} sales</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Sales - Compact */}
            {financials.recentSales && financials.recentSales.length > 0 && (
              <Card className="border-2 shadow-sm mb-4">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold mb-3">Recent Sales (Last 30 Days)</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {financials.recentSales.map((sale: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted transition-colors text-sm">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{sale.productTitle}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>{new Date(sale.createdAt).toLocaleDateString()}</span>
                            <Badge variant="secondary" className="text-xs px-1.5 py-0">
                              {sale.paymentMethod?.toUpperCase() || 'N/A'}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right ml-2">
                          <p className="font-bold">${sale.amount.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Listings Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold">Your Listings</h2>
            <div className="flex gap-2 text-sm">
              <span className="text-muted-foreground">Total: {stats.total}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">Active: {items.filter(i => i.status !== 'sold').length}</span>
            </div>
          </div>

          {/* Products List - Compact */}
        {items.length > 0 ? (
          <div className="space-y-2">
            {items.map(item => (
              <Card key={item._id} className="border-2 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-muted rounded-lg border flex items-center justify-center flex-shrink-0">
                      {item.images && item.images.length > 0 ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={item.images[0]} 
                          alt={item.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Package size={20} className="text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{item.title}</h3>
                        {item.status && (
                          <Badge className={item.status === 'sold' ? 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30 text-xs' : 'text-xs'}>
                            {item.status}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mb-1">{item.description}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">${(item.priceCents / 100).toFixed(2)}</span>
                        <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Link href={`/products/${item._id}`}>
                        <Button variant="outline" size="sm" className="h-8 px-2">
                          <Eye size={14} />
                        </Button>
                      </Link>
                      {item.status !== 'sold' && (
                        <>
                          <Link href={`/products/${item._id}/edit`}>
                            <Button variant="outline" size="sm" className="h-8 px-2">
                              <Edit size={14} />
                            </Button>
                          </Link>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(item._id)}
                            className="h-8 px-2"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Package size={64} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-xl mb-4">No listings yet</p>
              <Link href="/seller/create">
                <Button>
                  <Plus size={16} className="mr-2" />
                  Create Your First Listing
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </div>
  );
}
