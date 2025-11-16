"use client";
import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Plus, Eye, Edit, Trash2, TrendingUp, DollarSign } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function SellerDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, totalValue: 0 });

  useEffect(() => {
    if (!session?.user) {
      router.push('/auth/signin');
      return;
    }
    loadProducts();
  }, [session]);

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
    <div className="min-h-screen pt-24 pb-12 px-4 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Seller Dashboard</h1>
            <p className="text-muted-foreground">Manage your listings and track performance</p>
          </div>
          <Link href="/seller/create">
            <Button>
              <Plus size={16} className="mr-2" />
              New Listing
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Listings</p>
                <p className="text-3xl font-bold text-white">{stats.total}</p>
              </div>
              <Package className="text-blue-400" size={32} />
            </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Value</p>
                  <p className="text-3xl font-bold">${(stats.totalValue / 100).toFixed(2)}</p>
                </div>
                <DollarSign className="text-green-500" size={32} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Active Listings</p>
                  <p className="text-3xl font-bold">{items.filter(i => i.status !== 'sold').length}</p>
                </div>
                <TrendingUp className="text-purple-500" size={32} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products List */}
        {items.length > 0 ? (
          <div className="space-y-4">
            {items.map(item => (
              <Card key={item._id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-20 h-20 bg-muted rounded-lg border flex items-center justify-center flex-shrink-0">
                      {item.images && item.images.length > 0 ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={item.images[0]} 
                          alt={item.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Package size={24} className="text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-1 truncate">{item.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-1">{item.description}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold">${(item.priceCents / 100).toFixed(2)}</span>
                        <Badge variant="secondary">{item.category}</Badge>
                        {item.status && (
                          <Badge className={item.status === 'sold' ? 'bg-red-600/20 text-red-400 border-red-600/30' : ''}>
                            {item.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/products/${item._id}`}>
                      <Button variant="outline" className="flex items-center gap-2">
                        <Eye size={16} />
                        View
                      </Button>
                    </Link>
                    <Link href={`/products/${item._id}/edit`}>
                      <Button variant="outline" className="flex items-center gap-2">
                        <Edit size={16} />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      onClick={() => handleDelete(item._id)}
                      className="flex items-center gap-2"
                    >
                      <Trash2 size={16} />
                      Delete
                    </Button>
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
  );
}
