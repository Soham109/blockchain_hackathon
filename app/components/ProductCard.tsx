"use client";
import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, MapPin, Package, TrendingUp, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateDistance, formatDistance, estimateTravelTime, formatTravelTime } from '@/lib/location';

interface ProductCardProps {
  product: any;
  index?: number;
  onWishlistToggle?: (productId: string) => void;
  isWishlisted?: boolean;
  showActions?: boolean;
  userLocation?: { lat: number; lng: number } | null;
}

export function ProductCard({
  product,
  index = 0,
  onWishlistToggle,
  isWishlisted = false,
  showActions = true,
  userLocation,
}: ProductCardProps) {
  const price = product.price || (product.priceCents / 100).toFixed(2);
  const isBoosted = product.boosted && product.boostExpiresAt && new Date(product.boostExpiresAt) > new Date();
  
  // Calculate distance if both locations are available
  let distance: string | null = null;
  let travelTime: string | null = null;
  if (userLocation && product.latitude && product.longitude) {
    const distanceKm = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      product.latitude,
      product.longitude
    );
    distance = formatDistance(distanceKm);
    const timeMinutes = estimateTravelTime(distanceKm, 'walking');
    travelTime = formatTravelTime(timeMinutes);
  }

  return (
    <Link href={`/products/${product._id}`} className="block h-full">
      <Card className="h-full flex flex-col hover:shadow-lg transition-all duration-300 cursor-pointer group overflow-hidden border">
        <div className="relative w-full h-48 bg-muted flex items-center justify-center overflow-hidden">
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0]}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <Package className="h-12 w-12 text-muted-foreground" />
          )}
          <div className="absolute top-2 right-2 z-10">
            <Badge variant="secondary" className="text-xs">
              {product.category || 'General'}
            </Badge>
          </div>
          {isBoosted && (
            <div className="absolute top-2 left-2 z-10">
              <Badge variant="default" className="text-xs flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Boosted
              </Badge>
            </div>
          )}
          {product.status === 'sold' && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
              <Badge variant="destructive" className="text-lg px-4 py-2">SOLD</Badge>
            </div>
          )}
          {showActions && onWishlistToggle && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onWishlistToggle(product._id);
              }}
              className="absolute top-2 left-2 z-20 p-2 rounded-full bg-background hover:bg-background transition-colors shadow-sm border"
            >
              <Heart
                className={cn(
                  "h-4 w-4 transition-colors",
                  isWishlisted ? "fill-red-500 text-red-500" : "text-foreground"
                )}
              />
            </button>
          )}
        </div>
        <CardContent className="p-3 flex-1 flex flex-col">
          <h3 className="font-semibold text-base mb-1.5 line-clamp-2 group-hover:text-primary transition-colors">
            {product.title}
          </h3>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2 flex-grow">
            {product.description || 'No description available'}
          </p>
          <div className="space-y-2 mt-auto">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                ${price}
              </span>
            </div>
            <div className="space-y-1">
            {product.location && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                  <span className="truncate">{product.location}</span>
                </div>
              )}
              {distance && (
                <div className="flex items-center gap-2 text-xs text-primary font-medium">
                  <MapPin className="h-3 w-3" />
                  <span>{distance} away</span>
                  {travelTime && (
                    <>
                      <span>•</span>
                      <Clock className="h-3 w-3" />
                      <span>{travelTime}</span>
                    </>
                  )}
              </div>
            )}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
              <span>
                by {product.sellerEmail?.split('@')[0] || 'student'}
              </span>
              <span>
                {new Date(product.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
