"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserLocation } from './LocationContext';

interface ProductRecommendationsProps {
  currentProductId: string;
}

export function ProductRecommendations({ currentProductId }: ProductRecommendationsProps) {
  const { userRegion } = useUserLocation();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecommendations() {
      try {
        const params = new URLSearchParams();
        params.set('limit', '20'); // Get more to filter by region
        params.set('exclude', currentProductId);

        const res = await fetch(`/api/products?${params.toString()}`);
        const data = await res.json();
        if (res.ok) {
          let items = data.products || data.items || [];
          
          // Prioritize local items if user region is available
          if (userRegion?.regionKey) {
            const localItems = items.filter((p: any) => 
              p.regionKey && (
                p.regionKey === userRegion.regionKey || 
                (userRegion.country && p.regionKey.includes(userRegion.country))
              )
            );
            const otherItems = items.filter((p: any) => 
              !p.regionKey || (
                p.regionKey !== userRegion.regionKey && 
                (!userRegion.country || !p.regionKey.includes(userRegion.country))
              )
            );
            // Show local items first, then others
            items = [...localItems, ...otherItems];
          }
          
          setProducts(items.slice(0, 4));
        }
      } catch (err) {
        console.error('Failed to load recommendations', err);
      } finally {
        setLoading(false);
      }
    }
    loadRecommendations();
  }, [currentProductId, userRegion]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border">
            <CardContent className="p-0">
              <Skeleton className="w-full h-48 rounded-t-lg" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">You might also like</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <Link key={product._id} href={`/products/${product._id}`}>
            <Card className="h-full hover:shadow-lg transition-all hover:scale-105 cursor-pointer overflow-hidden group">
              <div className="w-full h-48 bg-muted flex items-center justify-center overflow-hidden relative">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <Package className="h-12 w-12 text-muted-foreground" />
                )}
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="bg-black/50 backdrop-blur-sm">
                    {product.category || 'General'}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-base mb-2 line-clamp-2">{product.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{product.description || 'No description'}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold">
                    ${product.price || (product.priceCents / 100).toFixed(2)}
                  </span>
                  {product.location && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {product.location}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
