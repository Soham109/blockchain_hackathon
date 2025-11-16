"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, SlidersHorizontal, MapPin, Package, BookOpen, Laptop, Sofa, Wrench, Shirt, Sparkles, Navigation } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { useUserLocation } from '../components/LocationContext';
import { calculateDistance } from '@/lib/location';

function BrowseContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userLocation, userRegion, isLoading: locationLoading, requestLocation } = useUserLocation();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('q') || '');
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [regionFilter, setRegionFilter] = useState<'local' | 'all'>('local'); // Default to local

  // Check verification status
  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated' || !session?.user) {
      router.push('/auth/signin');
      return;
    }

    const user = session.user as any;
    if (!user.studentVerified) {
      router.push('/onboarding');
      return;
    }
  }, [session, status, router]);

  useEffect(() => {
    // Only fetch products if user is verified
    const user = session?.user as any;
    if (!user?.studentVerified || status === 'loading') {
      return;
    }

    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (filter !== 'all') params.set('category', filter);
    
    fetch(`/api/products?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        let items = data.products || data.items || [];
        
        // Apply region filter - show local items by default if user region is available
        if (regionFilter === 'local' && userRegion?.regionKey) {
          items = items.filter((p: any) => {
            // Match if product region key matches user region key
            // Also match if product is in same country (fallback)
            if (p.regionKey) {
              return p.regionKey === userRegion.regionKey || 
                     (userRegion.country && p.regionKey.includes(userRegion.country));
            }
            // If product doesn't have region, include it (backward compatibility)
            return true;
          });
        }
        
        // Apply price filter
        if (priceRange.min || priceRange.max) {
          items = items.filter((p: any) => {
            const price = p.price || (p.priceCents / 100);
            const min = priceRange.min ? Number(priceRange.min) : 0;
            const max = priceRange.max ? Number(priceRange.max) : Infinity;
            return price >= min && price <= max;
          });
        }
        
        // Apply sorting
        if (sortBy === 'distance' && userLocation) {
          // Sort by distance if user location is available
          items = items
            .map((p: any) => ({
              ...p,
              _distance: p.latitude && p.longitude
                ? calculateDistance(userLocation.lat, userLocation.lng, p.latitude, p.longitude)
                : Infinity,
            }))
            .sort((a: any, b: any) => a._distance - b._distance);
        } else {
          items.sort((a: any, b: any) => {
            switch (sortBy) {
              case 'price-low':
                return (a.price || a.priceCents / 100) - (b.price || b.priceCents / 100);
              case 'price-high':
                return (b.price || b.priceCents / 100) - (a.price || a.priceCents / 100);
              case 'newest':
                return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
              case 'oldest':
                return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
              default:
                return 0;
            }
          });
        }
        
        setProducts(items);
        setLoading(false);
      })
      .catch((e) => {
        console.error('Failed to fetch products:', e);
        setLoading(false);
      });
  }, [searchQuery, filter, sortBy, priceRange, session, status, userLocation, userRegion, regionFilter]);

  // Always render same structure to avoid hook violations
  const user = session?.user as any;
  const isVerified = user?.studentVerified;
  const isLoading = status === 'loading' || !session?.user;
  const shouldShowContent = isVerified && status !== 'loading' && session?.user;

  // Always return the same structure to avoid hook violations
  return (
    <div className="min-h-screen pt-32 pb-12 px-4 bg-background transition-all duration-300 page-transition">
      {isLoading || loading ? (
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="border">
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
      ) : !shouldShowContent ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Redirecting...</p>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="pt-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold mb-2 tracking-tight text-center md:text-left">
                <span className="text-blue-500 dark:text-cyan-400">Browse</span>{' '}
                <span>Marketplace</span>
              </h1>
              <p className="text-muted-foreground">
                {products.length} items available
                {userRegion && regionFilter === 'local' && (
                  <span className="ml-2 text-xs">
                    in {userRegion.city || userRegion.state || userRegion.country}
                  </span>
                )}
              </p>
            </div>
            {userRegion && (
              <div className="flex items-center gap-2">
                <Button
                  variant={regionFilter === 'local' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRegionFilter('local')}
                  className="text-xs"
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  Local
                </Button>
                <Button
                  variant={regionFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRegionFilter('all')}
                  className="text-xs"
                >
                  All Regions
                </Button>
              </div>
            )}
          </div>
          
          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="pl-12 pr-4 py-2.5 border shadow-sm focus:shadow-md transition-shadow"
              />
            </div>
            <div className="flex gap-2">
              {!userLocation && (
                <Button
                  variant="outline"
                  onClick={requestLocation}
                  disabled={locationLoading}
                  className="cursor-pointer border shadow-sm hover:shadow-md transition-shadow"
                  title="Enable location to see distances"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  {locationLoading ? 'Locating...' : 'Get Location'}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="cursor-pointer border shadow-sm hover:shadow-md transition-shadow"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] border shadow-sm">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  {userLocation && <SelectItem value="distance">Distance: Nearest</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <Card className="mb-6 border-2 shadow-sm">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Min Price ($)</label>
                    <Input
                      type="number"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                      placeholder="0"
                      className="border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Max Price ($)</label>
                    <Input
                      type="number"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                      placeholder="1000"
                      className="border"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={() => setPriceRange({ min: '', max: '' })}
                      className="w-full cursor-pointer border"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          {[
            { value: 'all', label: 'All', icon: Package },
            { value: 'textbooks', label: 'Textbooks', icon: BookOpen },
            { value: 'electronics', label: 'Electronics', icon: Laptop },
            { value: 'furniture', label: 'Furniture', icon: Sofa },
            { value: 'services', label: 'Services', icon: Wrench },
            { value: 'clothing', label: 'Clothing', icon: Shirt },
            { value: 'other', label: 'Other', icon: Sparkles }
          ].map((cat) => {
            const Icon = cat.icon;
            return (
              <Button
                key={cat.value}
                variant={filter === cat.value ? 'default' : 'outline'}
                onClick={() => setFilter(cat.value)}
                className="cursor-pointer border shadow-sm hover:shadow-md transition-shadow"
              >
                <Icon className="h-4 w-4 mr-2" />
                {cat.label}
              </Button>
            );
          })}
        </div>

        {/* Products Grid */}
        <div className="mt-4">
          {products.length === 0 ? (
            <Card className="text-center py-16 border shadow-sm">
              <CardContent>
                <Package size={64} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-2xl font-bold mb-2">No products found</h3>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your search or filters
                </p>
                <Button onClick={() => {
                  setSearchQuery('');
                  setFilter('all');
                  setPriceRange({ min: '', max: '' });
                }} className="shadow-sm hover:shadow-md transition-shadow">
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} userLocation={userLocation} />
              ))}
            </div>
          )}
        </div>
        </div>
      )}
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <BrowseContent />
    </Suspense>
  );
}
