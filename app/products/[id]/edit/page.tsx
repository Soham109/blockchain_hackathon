"use client";
import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import ImageUpload from '../../../components/ui/ImageUpload';
import { useToast } from '@/components/ui/use-toast';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.product) {
          // Check if user owns this product
          if (session?.user && (d.product.sellerEmail !== (session.user as any).email && d.product.sellerId !== (session.user as any).id)) {
            router.push('/dashboard');
            return;
          }
        setProduct(d.product);
        }
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, [id, session, router]);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }
  if (!product) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Product not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  async function handleSave() {
    if (!product.title || !product.priceCents) {
      toast({
        title: "Validation Error",
        description: "Title and price are required",
        variant: "destructive",
      });
      return;
    }
    setBusy(true);
    try {
      const updates = {
        title: product.title,
        description: product.description || '',
        priceCents: product.priceCents,
        category: product.category || 'other',
        location: product.location || '',
        images: product.images || [],
      };
      const res = await fetch(`/api/products/${id}`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(updates) 
      });
      if (!res.ok) throw new Error('Save failed');
      toast({
        title: "Success",
        description: "Listing updated successfully!",
      });
      router.push(`/products/${id}`);
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Error",
        description: e.message || 'Failed to save',
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen pt-24 pb-12 px-4 bg-background">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Edit Listing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input 
                  id="title"
                  value={product.title} 
                  onChange={(e) => setProduct({ ...product, title: e.target.value })} 
                  placeholder="Enter product title"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description"
                  value={product.description || ''} 
                  onChange={(e) => setProduct({ ...product, description: e.target.value })} 
                  rows={5}
                  placeholder="Describe your product..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price (USD) *</Label>
                  <Input 
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={String((product.priceCents || 0) / 100)} 
                    onChange={(e) => setProduct({ ...product, priceCents: Math.round(Number(e.target.value) * 100) })} 
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={product.category || 'other'} 
                    onValueChange={(value) => setProduct({ ...product, category: value })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="textbooks">Textbooks</SelectItem>
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="furniture">Furniture</SelectItem>
                      <SelectItem value="services">Services</SelectItem>
                      <SelectItem value="clothing">Clothing</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input 
                  id="location"
                  value={product.location || ''} 
                  onChange={(e) => setProduct({ ...product, location: e.target.value })} 
                  placeholder="e.g., Main Campus, Dorm Building A"
                />
              </div>

              <div>
                <Label>Product Images</Label>
                <ImageUpload
                  images={product.images || []}
                  onChange={(images) => setProduct({ ...product, images })}
                  maxImages={5}
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button
                  variant="ghost"
                  onClick={() => router.back()}
                  disabled={busy}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={busy}>
                  {busy ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
