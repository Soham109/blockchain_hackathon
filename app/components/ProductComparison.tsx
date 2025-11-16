"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Package, DollarSign, MapPin, Calendar } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Product {
  _id: string;
  title: string;
  priceCents: number;
  description: string;
  category: string;
  location: string;
  createdAt: string;
  images?: string[];
}

export function ProductComparison() {
  const [products, setProducts] = useState<Product[]>([]);
  const { toast } = useToast();

  function addProduct(product: Product) {
    if (products.length >= 4) {
      toast({
        title: "Limit reached",
        description: "You can compare up to 4 products",
        variant: "destructive",
      });
      return;
    }
    if (products.some(p => p._id === product._id)) {
      toast({
        title: "Already added",
        description: "This product is already in comparison",
        variant: "destructive",
      });
      return;
    }
    setProducts([...products, product]);
  }

  function removeProduct(id: string) {
    setProducts(products.filter(p => p._id !== id));
  }

  function clearAll() {
    setProducts([]);
  }

  if (products.length === 0) return null;

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Compare Products ({products.length}/4)
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={clearAll} className="cursor-pointer">
            Clear All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {products.map((product) => (
          <div key={product._id} className="p-4 border rounded-lg relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 cursor-pointer"
              onClick={() => removeProduct(product._id)}
            >
              <X className="h-4 w-4" />
            </Button>
            <h4 className="font-semibold mb-2 pr-8">{product.title}</h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="font-bold">${(product.priceCents / 100).toFixed(2)}</span>
              </div>
              {product.location && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {product.location}
                </div>
              )}
              <Badge variant="secondary" className="text-xs">
                {product.category}
              </Badge>
            </div>
          </div>
        ))}
        {products.length > 1 && (
          <Button className="w-full cursor-pointer" onClick={() => {
            // Navigate to comparison view
            const ids = products.map(p => p._id).join(',');
            window.location.href = `/compare?ids=${ids}`;
          }}>
            Compare Now
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

