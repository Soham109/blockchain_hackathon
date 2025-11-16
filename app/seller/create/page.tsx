"use client";
import React, { useState, useRef } from 'react';
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
import { LocationPicker } from '../../components/ui/LocationPicker';
import { useToast } from '@/components/ui/use-toast';
import { PaymentModal } from '../../components/PaymentModal';
import { AlertCircle, Plus } from 'lucide-react';

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
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [region, setRegion] = useState<string>('');
  const [regionKey, setRegionKey] = useState<string>('');
  const [condition, setCondition] = useState('excellent');
  const [brand, setBrand] = useState('');
  const [year, setYear] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [productData, setProductData] = useState<any>(null);
  const imageUploadRef = useRef<HTMLDivElement>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !price) {
      toast({
        title: "Missing Information",
        description: "Title and price are required",
        variant: "destructive",
      });
      // Scroll to first error
      document.getElementById('title')?.focus();
      return;
    }
    if (Number(price) <= 0) {
      toast({
        title: "Invalid Price",
        description: "Price must be greater than 0",
        variant: "destructive",
      });
      document.getElementById('price')?.focus();
      return;
    }

    // Validate images - only check when actually submitting
    if (images.length === 0) {
      toast({
        title: "Images Required",
        description: "Please upload at least one image before continuing. Click the upload area above to add images.",
        variant: "destructive",
      });
      // Scroll to image upload section
      if (imageUploadRef.current) {
        imageUploadRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Highlight the upload area
        const uploadArea = imageUploadRef.current.querySelector('button, [role="button"]');
        if (uploadArea) {
          (uploadArea as HTMLElement).focus();
          setTimeout(() => {
            (uploadArea as HTMLElement).blur();
          }, 2000);
        }
      }
      return;
    }

    const data = {
      title,
      description,
      priceCents: Math.round(Number(price) * 100),
      images: images.filter(img => img && img.length > 0), // Filter out empty images
      category,
      location,
      latitude,
      longitude,
      region: region || undefined,
      regionKey: regionKey || undefined,
      condition,
      brand: brand.trim() || undefined,
      year: year.trim() || undefined,
      sellerEmail: (session as any)?.user?.email
    };
    setProductData(data);
    setPaymentOpen(true);
  }

  const handleLocationChange = async (locationData: { lat: number; lng: number; address: string }) => {
    setLatitude(locationData.lat);
    setLongitude(locationData.lng);
    setLocation(locationData.address);
    
    // Fetch region information from coordinates
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${locationData.lat}&lon=${locationData.lng}&zoom=10&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.address) {
        const addr = data.address;
        const city = addr.city || addr.town || addr.village || addr.municipality;
        const state = addr.state || addr.region;
        const country = addr.country;
        
        // Create region key and display string
        let key = '';
        let display = '';
        if (city && state && country) {
          key = `${city},${state},${country}`;
          display = `${city}, ${state}, ${country}`;
        } else if (state && country) {
          key = `${state},${country}`;
          display = `${state}, ${country}`;
        } else if (country) {
          key = country;
          display = country;
        }
        
        if (key) {
          setRegionKey(key);
          setRegion(display);
        }
      }
    } catch (error) {
      console.error('Failed to fetch region:', error);
    }
  }

  async function createProductAfterPayment() {
    if (!productData) {
      throw new Error('Product data is missing');
    }

    // Validate images before sending
    if (!productData.images || productData.images.length === 0) {
      throw new Error('At least one image is required');
    }

    setBusy(true);
    try {
      const resp = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      
      // Check if response is JSON before parsing
      const contentType = resp.headers.get('content-type');
      let data: any;
      
      if (contentType && contentType.includes('application/json')) {
        data = await resp.json();
      } else {
        // Handle non-JSON responses (like 413 errors)
        const text = await resp.text();
        if (resp.status === 413) {
          throw new Error('Image files are too large. Please compress your images or use fewer images.');
        }
        throw new Error(text || `Server error: ${resp.status} ${resp.statusText}`);
      }
      
      if (!resp.ok) {
        throw new Error(data?.error || 'Failed to create listing');
      }

      if (!data.id) {
        throw new Error('Product created but no ID returned');
      }

      // Update the payment record with the actual productId
      try {
        const updateResp = await fetch('/api/payments/update-product-id', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: 'new', // The temporary ID used during payment
            newProductId: data.id,
            type: 'listing',
          }),
        });
        
        if (!updateResp.ok) {
          console.warn('Failed to update payment record, but product was created');
        }
      } catch (err) {
        console.error('Failed to update payment record:', err);
        // Don't fail the whole process if this fails - product is already created
      }
      
      // Return the product ID so PaymentModal knows it succeeded
      return String(data.id);
    } catch (err: any) {
      console.error('Product creation error:', err);
      // Re-throw so PaymentModal can handle the error
      throw new Error(err.message || "Failed to create listing. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen pt-32 pb-12 px-4 bg-background transition-all duration-300">
      <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card className="border-2 shadow-lg transition-all duration-300 hover:shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-4xl font-bold">Create New Listing</CardTitle>
            </div>
            <div className="flex items-center gap-2 p-4 bg-muted rounded-lg border-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              <p className="text-sm font-medium">
                Listing fee: <span className="font-bold text-primary">{LISTING_FEE} ETH</span> (payable via Arbitrum or Solana)
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-6">
              <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                <Label htmlFor="title" className="text-base font-semibold">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., Calculus Textbook 3rd Edition"
                  required
                  className="border-2 mt-2 transition-all duration-200 focus:scale-[1.01]"
                />
              </div>
              
              <div className="animate-in fade-in slide-in-from-left-2 duration-300 delay-75">
                <Label htmlFor="description" className="text-base font-semibold">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={5}
                  placeholder="Describe your item in detail..."
                  className="border-2 mt-2 transition-all duration-200 focus:scale-[1.01]"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-left-2 duration-300 delay-150">
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
                    className="border-2 mt-2 transition-all duration-200 focus:scale-[1.01]"
                  />
                </div>
                <div>
                  <Label htmlFor="category" className="text-base font-semibold">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category" className="border-2 mt-2 transition-all duration-200">
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-left-2 duration-300 delay-200">
                <div>
                  <Label htmlFor="condition" className="text-base font-semibold">Condition *</Label>
                  <Select value={condition} onValueChange={setCondition}>
                    <SelectTrigger id="condition" className="border-2 mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-2">
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="very-good">Very Good</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="animate-in fade-in slide-in-from-left-2 duration-300 delay-225">
                <LocationPicker
                  latitude={latitude}
                  longitude={longitude}
                  address={location}
                  onLocationChange={handleLocationChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-left-2 duration-300 delay-250">
                <div>
                  <Label htmlFor="brand" className="text-base font-semibold">Brand/Manufacturer</Label>
                  <Input
                    id="brand"
                    value={brand}
                    onChange={e => setBrand(e.target.value)}
                    placeholder="e.g., Apple, Samsung, Pearson"
                    className="border-2 mt-2 transition-all duration-200 focus:scale-[1.01]"
                  />
                </div>
                <div>
                  <Label htmlFor="year" className="text-base font-semibold">Year/Model</Label>
                  <Input
                    id="year"
                    value={year}
                    onChange={e => setYear(e.target.value)}
                    placeholder="e.g., 2024, 3rd Edition"
                    className="border-2 mt-2 transition-all duration-200 focus:scale-[1.01]"
                  />
                </div>
              </div>
              
              <div 
                ref={imageUploadRef}
                className="animate-in fade-in slide-in-from-left-2 duration-300 delay-300"
              >
                <Label className="text-base font-semibold">Product Images *</Label>
                <ImageUpload
                  images={images}
                  onChange={setImages}
                  maxImages={5}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  {images.length === 0 
                    ? "⚠️ Please upload at least 1 image (up to 5 images)" 
                    : `✓ ${images.length} image${images.length > 1 ? 's' : ''} uploaded (up to 5 images)`}
                </p>
              </div>
              
              <div className="flex gap-3 justify-end pt-6 border-t-2 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-400">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={busy}
                  className="border-2 cursor-pointer transition-all duration-200 hover:scale-105"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={busy} 
                  className="h-12 px-8 cursor-pointer transition-all duration-200 hover:scale-105"
                >
                  {busy ? 'Creating...' : 'Continue to Payment'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {paymentOpen && productData && (
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
    </div>
  );
}
