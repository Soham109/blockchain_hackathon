"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SlidersHorizontal, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface AdvancedSearchProps {
  onSearch: (filters: any) => void;
  initialFilters?: any;
}

export function AdvancedSearch({ onSearch, initialFilters }: AdvancedSearchProps) {
  const [filters, setFilters] = useState({
    query: initialFilters?.query || '',
    category: initialFilters?.category || 'all',
    minPrice: initialFilters?.minPrice || '',
    maxPrice: initialFilters?.maxPrice || '',
    location: initialFilters?.location || '',
    condition: initialFilters?.condition || 'all',
    sortBy: initialFilters?.sortBy || 'newest',
  });

  const [isOpen, setIsOpen] = useState(false);

  function handleSearch() {
    onSearch(filters);
  }

  function clearFilters() {
    const cleared = {
      query: '',
      category: 'all',
      minPrice: '',
      maxPrice: '',
      location: '',
      condition: 'all',
      sortBy: 'newest',
    };
    setFilters(cleared);
    onSearch(cleared);
  }

  const activeFilters = Object.values(filters).filter(v => v && v !== 'all' && v !== 'newest').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5" />
            Advanced Search
          </CardTitle>
          {activeFilters > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="cursor-pointer">
              <X className="h-4 w-4 mr-2" />
              Clear ({activeFilters})
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="search-query">Search Query</Label>
          <Input
            id="search-query"
            placeholder="Search products..."
            value={filters.query}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={filters.category} onValueChange={(v) => setFilters({ ...filters, category: v })}>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="textbooks">Textbooks</SelectItem>
                <SelectItem value="electronics">Electronics</SelectItem>
                <SelectItem value="furniture">Furniture</SelectItem>
                <SelectItem value="services">Services</SelectItem>
                <SelectItem value="clothing">Clothing</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="condition">Condition</Label>
            <Select value={filters.condition} onValueChange={(v) => setFilters({ ...filters, condition: v })}>
              <SelectTrigger id="condition">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Conditions</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="like-new">Like New</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="fair">Fair</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="min-price">Min Price ($)</Label>
            <Input
              id="min-price"
              type="number"
              placeholder="0"
              value={filters.minPrice}
              onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="max-price">Max Price ($)</Label>
            <Input
              id="max-price"
              type="number"
              placeholder="1000"
              value={filters.maxPrice}
              onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            placeholder="e.g., Main Campus"
            value={filters.location}
            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="sort">Sort By</Label>
          <Select value={filters.sortBy} onValueChange={(v) => setFilters({ ...filters, sortBy: v })}>
            <SelectTrigger id="sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="relevance">Relevance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleSearch} className="w-full cursor-pointer">
          Search
        </Button>
      </CardContent>
    </Card>
  );
}

