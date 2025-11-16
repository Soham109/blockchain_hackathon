"use client";
import React, { useState } from 'react';
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
import ImageUpload from '../../components/ui/ImageUpload';
import { useToast } from '@/components/ui/use-toast';
import { PaymentModal } from '../../components/PaymentModal';
import { AlertCircle, Sparkles } from 'lucide-react';
import { CardSpotlight } from '../../components/ui/CardSpotlight';
import { BorderBeam } from '../../components/ui/BorderBeam';
import { MagneticButton } from '../../components/ui/MagneticButton';
import { ShimmerButton } from '../../components/ui/ShimmerButton';
import { AnimatedGradientText } from '../../components/ui/AnimatedGradientText';
import { BlurFadeIn } from '../../components/ui/BlurFadeIn';
import { Spotlight } from '../../components/ui/Spotlight';
import { GridPattern } from '../../components/ui/GridPattern';

const LISTING_FEE = '0.001'; // 0.001 ETH

export default function CreateListing() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('textbooks');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [productData, setProductData] = useState<any>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !price) {
      toast({
        title: "Validation Error",
        description: "Title and price are required",
        variant: "destructive",
      });
      return;
    }
    if (Number(price) <= 0) {
      toast({
        title: "Validation Error",
        description: "Price must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    const data = {
      title,
      description,
      priceCents: Math.round(Number(price) * 100),
      images,
      category,
      location,
      sellerEmail: (session as any)?.user?.email
    };
    setProductData(data);
    setPaymentOpen(true);
  }

  async function createProductAfterPayment() {
    if (!productData) return;

    setBusy(true);
    try {
      const resp = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      const data = await resp.json();
      if (resp.ok) {
        toast({
          title: "Success",
          description: "Listing created successfully!",
        });
        router.push(`/products/${data.id}`);
      } else {
        throw new Error(data?.error || 'Failed to create listing');
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to create listing",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen pt-28 pb-12 px-4 bg-background overflow-hidden">
      <Spotlight />
      <GridPattern className="opacity-10" />
      
      <div className="relative max-w-3xl mx-auto z-10">
        <BlurFadeIn direction="down" delay={0.1}>
          <CardSpotlight>
            <CardHeader>
              <CardTitle className="text-4xl flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <AnimatedGradientText>Create New Listing</AnimatedGradientText>
              </CardTitle>
              <div className="flex items-center gap-2 mt-4 p-4 bg-muted/50 rounded-lg border-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                <p className="text-sm font-medium">
                  Listing fee: <span className="font-bold text-primary">{LISTING_FEE} ETH</span> (payable via Arbitrum or Solana)
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-6">
                <BlurFadeIn delay={0.2}>
                  <div>
                    <Label htmlFor="title" className="text-base font-semibold">Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="e.g., Calculus Textbook 3rd Edition"
                      required
                      className="border-2 mt-2"
                    />
                  </div>
                </BlurFadeIn>
                
                <BlurFadeIn delay={0.3}>
                  <div>
                    <Label htmlFor="description" className="text-base font-semibold">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      rows={5}
                      placeholder="Describe your item in detail..."
                      className="border-2 mt-2"
                    />
                  </div>
                </BlurFadeIn>
                
                <BlurFadeIn delay={0.4}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price" className="text-base font-semibold">Price (USD) *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={price}
                        onChange={e => setPrice(e.target.value)}
                        placeholder="0.00"
                        required
                        className="border-2 mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category" className="text-base font-semibold">Category</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger id="category" className="border-2 mt-2">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent className="border-2">
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
                </BlurFadeIn>
                
                <BlurFadeIn delay={0.5}>
                  <div>
                    <Label htmlFor="location" className="text-base font-semibold">Location</Label>
                    <Input
                      id="location"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      placeholder="e.g., Main Campus, Dorm Building A"
                      className="border-2 mt-2"
                    />
                  </div>
                </BlurFadeIn>
                
                <BlurFadeIn delay={0.6}>
                  <div>
                    <Label className="text-base font-semibold">Product Images</Label>
                    <ImageUpload
                      images={images}
                      onChange={setImages}
                      maxImages={5}
                    />
                    <p className="mt-2 text-xs text-muted-foreground">Upload up to 5 images</p>
                  </div>
                </BlurFadeIn>
                
                <BlurFadeIn delay={0.7}>
                  <div className="flex gap-3 justify-end pt-6 border-t-2">
                    <MagneticButton
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                      disabled={busy}
                      className="border-2"
                    >
                      Cancel
                    </MagneticButton>
                    <ShimmerButton type="submit" disabled={busy} className="h-12 px-8">
                      {busy ? 'Creating...' : 'Continue to Payment'}
                    </ShimmerButton>
                  </div>
                </BlurFadeIn>
              </form>
            </CardContent>
            <BorderBeam />
          </CardSpotlight>
        </BlurFadeIn>
      </div>

      {productData && (
        <PaymentModal
          open={paymentOpen}
          onOpenChange={setPaymentOpen}
          product={{
            _id: 'new',
            title: productData.title,
            priceCents: 0,
            sellerId: '',
          }}
          type="listing"
          listingFee={LISTING_FEE}
          onSuccess={createProductAfterPayment}
        />
      )}
    </div>
  );
}
