"use client";
import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, MessageCircle, MapPin, Calendar, Package, CreditCard, ArrowRight } from 'lucide-react';
import ReviewSection from '../../components/ReviewSection';
import ImageGallery from '../../components/ui/ImageGallery';
import { useToast } from '@/components/ui/use-toast';
import { PaymentModal } from '../../components/PaymentModal';
import { ProductRecommendations } from '../../components/ProductRecommendations';
import { ProductBoost } from '../../components/ProductBoost';

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    fetch(`/api/products/${id}`)
      .then((r) => {
        if (!r.ok) {
          throw new Error('Product not found');
        }
        return r.json();
      })
      .then((d) => {
        if (d.error) {
          console.error('API error:', d.error);
          setProduct(null);
        } else {
          setProduct(d.product);
        }
        setLoading(false);
      })
      .catch((e) => {
        console.error('Failed to load product', e);
        setProduct(null);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (session?.user && id) {
      checkWishlist();
    }
  }, [session, id]);

  async function checkWishlist() {
    try {
      const res = await fetch('/api/wishlist');
      const data = await res.json();
      if (res.ok) {
        const wishlisted = data.products?.some((p: any) => String(p._id) === id);
        setIsWishlisted(wishlisted);
      }
    } catch (err) {
      console.error('Failed to check wishlist', err);
    }
  }

  async function toggleWishlist() {
    if (!session?.user) {
      router.push('/auth/signin');
      return;
    }

    setWishlistLoading(true);
    try {
      const res = await fetch('/api/wishlist', {
        method: isWishlisted ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: id }),
      });

      if (res.ok) {
        setIsWishlisted(!isWishlisted);
        toast({
          title: isWishlisted ? 'Removed from wishlist' : 'Added to wishlist',
        });
      }
    } catch (err) {
      console.error('Failed to toggle wishlist', err);
    } finally {
      setWishlistLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-12 px-4 flex items-center justify-center">
        <div className="space-y-4 w-full max-w-7xl">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen pt-32 pb-12 px-4 flex items-center justify-center">
        <Card className="text-center p-12 max-w-md border-2 shadow-sm">
          <CardContent>
            <Package size={64} className="mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
            <p className="text-muted-foreground mb-6">This product doesn't exist or has been removed.</p>
            <Button onClick={() => router.push('/browse')} size="lg">
              Browse Products
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const price = product.price || (product.priceCents / 100).toFixed(2);

  return (
    <main className="min-h-screen pt-32 pb-12 px-4 bg-background">
      <div className="max-w-7xl mx-auto space-y-8 pt-4">
        {/* Main Product Section - Clean Unified Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Images */}
          <div>
            {product.images && product.images.length > 0 ? (
              <div className="sticky top-32">
                <ImageGallery images={product.images} />
              </div>
            ) : (
              <div className="w-full h-[600px] bg-muted rounded-2xl flex items-center justify-center border">
                <Package className="h-24 w-24 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Right: Product Info */}
          <div className="space-y-8">
            {/* Title and Price */}
            <div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight leading-tight">
                {product.title}
              </h1>
              
              <div className="flex items-baseline gap-4 mb-8">
                <div className="text-6xl font-bold">
                  ${price}
                </div>
                {product.status === 'sold' && (
                  <Badge variant="destructive" className="text-base px-4 py-2">SOLD</Badge>
                )}
              </div>

              {/* Meta Info */}
              <div className="flex flex-wrap gap-3 mb-8">
                {product.category && (
                  <Badge variant="secondary" className="capitalize px-4 py-2 text-sm">
                    {product.category}
                  </Badge>
                )}
                {product.location && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{product.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {new Date(product.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Seller Info */}
              <div className="mb-8 p-5 bg-muted/30 rounded-xl">
                <p className="text-sm text-muted-foreground mb-2">Listed by</p>
                <Link href={`/profile/${product.sellerId}`} className="flex items-center gap-2 group">
                  <span className="font-semibold text-xl group-hover:text-primary transition-colors">
                    {product.sellerEmail?.split('@')[0] || 'student'}
                  </span>
                  <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </div>
            </div>

            {/* Description */}
            <div className="p-6 bg-muted/20 rounded-xl">
              <h2 className="font-bold text-xl mb-4">Description</h2>
              <p className="text-foreground leading-relaxed text-lg">
                {product.description || 'No description available'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4 pt-4">
              {session?.user && session.user.email !== product.sellerEmail ? (
                <>
                  {product.status !== 'sold' && (
                    <Button 
                      onClick={() => setPaymentOpen(true)}
                      size="lg"
                      className="w-full h-16 text-lg font-semibold shadow-lg hover:shadow-xl transition-all bg-primary hover:bg-primary/90"
                    >
                      <CreditCard className="h-5 w-5 mr-2" />
                      Buy Now
                    </Button>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      onClick={() => router.push(`/chat?productId=${product._id}&receiverEmail=${product.sellerEmail}&receiverId=${product.sellerId}&productTitle=${encodeURIComponent(product.title)}`)}
                      variant="outline"
                      size="lg"
                      className="h-14 border-2 hover:bg-accent"
                    >
                      <MessageCircle className="h-5 w-5 mr-2" />
                      Contact
                    </Button>
                    <Button
                      variant="outline"
                      onClick={toggleWishlist}
                      disabled={wishlistLoading}
                      size="lg"
                      className="h-14 border-2 hover:bg-accent"
                    >
                      <Heart className={`h-5 w-5 mr-2 ${isWishlisted ? 'fill-current text-red-500' : ''}`} />
                      {isWishlisted ? 'Saved' : 'Save'}
                    </Button>
                  </div>
                </>
              ) : session?.user && session.user.email === product.sellerEmail ? (
                <Link href={`/products/${product._id}/edit`}>
                  <Button variant="outline" size="lg" className="w-full h-14 border-2">
                    Edit Listing
                  </Button>
                </Link>
              ) : (
                <Button 
                  onClick={() => router.push('/auth/signin')}
                  size="lg"
                  className="w-full h-16 text-lg font-semibold shadow-lg hover:shadow-xl transition-all bg-primary hover:bg-primary/90"
                >
                  Sign In to Purchase
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Product Boost Section */}
        {session?.user && session.user.email === product.sellerEmail && (
          <ProductBoost productId={id} />
        )}

        {/* Reviews Section */}
        <ReviewSection productId={id} />

        {/* Recommendations */}
        <ProductRecommendations currentProductId={id} />
      </div>

      {product && (
        <PaymentModal
          open={paymentOpen}
          onOpenChange={setPaymentOpen}
          product={product}
          type="purchase"
          onSuccess={() => {
            router.push('/orders');
          }}
        />
      )}
    </main>
  );
}
