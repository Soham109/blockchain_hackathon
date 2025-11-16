"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
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
import { Search, SlidersHorizontal, MapPin, Package, BookOpen, Laptop, Sofa, Wrench, Shirt, Sparkles } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';

function BrowseContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('q') || '');
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (filter !== 'all') params.set('category', filter);
    
    fetch(`/api/products?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        let items = data.products || data.items || [];
        
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
        
        setProducts(items);
        setLoading(false);
      })
      .catch((e) => {
        console.error('Failed to fetch products:', e);
        setLoading(false);
      });
  }, [searchQuery, filter, sortBy, priceRange]);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-12 px-4 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 pt-4">
          <h1 className="text-5xl md:text-6xl font-bold mb-3 tracking-tight text-center md:text-left">Browse Marketplace</h1>
          <p className="text-muted-foreground mb-6">
            {products.length} items available
          </p>
          
          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
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
