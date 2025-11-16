"use client";
import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, Package, Trash2, MapPin } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function WishlistPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) {
      router.push('/auth/signin');
      return;
    }
    loadWishlist();
  }, [session, router]);

  async function loadWishlist() {
    try {
      const res = await fetch('/api/wishlist');
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Failed to load wishlist', err);
    } finally {
      setLoading(false);
    }
  }

  async function removeFromWishlist(productId: string) {
    try {
      await fetch(`/api/wishlist?productId=${productId}`, { method: 'DELETE' });
      setProducts(products.filter(p => String(p._id) !== productId));
      toast({
        title: "Removed",
        description: "Item removed from wishlist",
      });
    } catch (err) {
      console.error('Failed to remove from wishlist', err);
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="border-2">
                <CardContent className="p-0">
                  <Skeleton className="w-full h-48 rounded-t-lg" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-12 px-4 bg-background">
      <div className="max-w-7xl mx-auto space-y-8 pt-4">
        <div className="text-center md:text-left">
          <h1 className="text-5xl md:text-6xl font-bold mb-3 tracking-tight">My Wishlist</h1>
          <p className="text-muted-foreground text-xl">
            {products.length} {products.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <Card key={product._id} className="h-full flex flex-col hover:shadow-xl transition-all border-2 overflow-hidden group">
                <Link href={`/products/${product._id}`} className="flex-1 flex flex-col">
                  <div className="w-full h-48 bg-muted flex items-center justify-center overflow-hidden relative">
                    {product.images && product.images.length > 0 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={product.images[0]} 
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <Package className="h-12 w-12 text-muted-foreground" />
                    )}
                    <div className="absolute top-2 right-2 z-10">
                      <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm border shadow-sm">
                        {product.category || 'General'}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4 flex-1 flex flex-col">
                    <h3 className="font-bold text-lg mb-2 line-clamp-2">
                      {product.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-grow">
                      {product.description || 'No description available'}
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">
                          ${product.price || (product.priceCents / 100).toFixed(2)}
                        </span>
                      </div>
                      {product.location && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          {product.location}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Link>
                <div className="p-4 border-t bg-muted/30">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      removeFromWishlist(product._id);
                    }}
                    className="w-full cursor-pointer border-2 hover:bg-destructive/10 hover:border-destructive/50 transition-all"
                  >
                    <Trash2 size={14} className="mr-2" />
                    Remove
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-2 shadow-sm">
            <CardContent className="p-16 text-center">
              <Heart size={64} className="mx-auto mb-6 text-muted-foreground opacity-50" />
              <p className="text-xl font-bold mb-2">Your wishlist is empty</p>
              <p className="text-muted-foreground mb-8">
                Start adding items you love to your wishlist
              </p>
              <Link href="/browse">
                <Button size="lg" className="cursor-pointer shadow-sm hover:shadow-md transition-shadow">
                  Browse Products
                  <Package size={18} className="ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
