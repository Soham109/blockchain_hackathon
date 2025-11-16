"use client";
import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, MessageCircle, MapPin, Calendar, Package, CreditCard, ArrowRight, Star, Shield, TrendingUp, Tag, Clock } from 'lucide-react';
import ReviewSection from '../../components/ReviewSection';
import ImageGallery from '../../components/ui/ImageGallery';
import { ProductMap } from '../../components/ui/ProductMap';
import { useToast } from '@/components/ui/use-toast';
import { PaymentModal } from '../../components/PaymentModal';
import { ProductRecommendations } from '../../components/ProductRecommendations';
import { ProductBoost } from '../../components/ProductBoost';
import { useUserLocation } from '../../components/LocationContext';
import { calculateDistance, formatDistance, estimateTravelTime, formatTravelTime } from '@/lib/location';

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session, status } = useSession();
  const { userLocation } = useUserLocation();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

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

  // Always render same structure to avoid hook violations
  const user = session?.user as any;
  const isVerified = user?.studentVerified;
  const isLoading = status === 'loading' || !session?.user;
  const shouldShowContent = isVerified && status !== 'loading' && session?.user;

  // Always return the same structure
  return (
    <div className="min-h-screen pt-20 pb-12 px-4 bg-background">
      {isLoading || loading ? (
        <div className="flex items-center justify-center">
          <div className="space-y-4 w-full max-w-7xl">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-[600px] w-full" />
          </div>
        </div>
      ) : !shouldShowContent ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Redirecting...</p>
          </div>
        </div>
      ) : !product ? (
        <div className="flex items-center justify-center min-h-[60vh]">
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
      ) : (
        <main className="min-h-screen pt-20 pb-12 px-4 bg-background transition-all duration-300 page-transition">
          {(() => {
            const price = product.price || (product.priceCents / 100).toFixed(2);
            const conditionLabels: Record<string, string> = {
              excellent: 'Excellent',
              'very-good': 'Very Good',
              good: 'Good',
              fair: 'Fair',
              poor: 'Poor',
            };
            return (
              <div className="max-w-7xl mx-auto space-y-4 pt-4">
        {/* Main Product Section - Compact Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: Images - Takes 2 columns */}
          <div className="lg:col-span-2">
            {product.images && product.images.length > 0 ? (
              <div className="sticky top-32">
                <ImageGallery images={product.images} />
              </div>
            ) : (
              <div className="w-full h-[400px] bg-muted rounded-xl flex items-center justify-center border-2">
                <Package className="h-24 w-24 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Right: Product Info - Compact Sidebar */}
          <div className="space-y-3">
            {/* Title and Price */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2 tracking-tight leading-tight">
                {product.title}
              </h1>
              
              {/* Price */}
              <div className="flex items-baseline gap-3 mb-3">
                <div className="text-3xl font-bold text-primary">
                  ${price}
                </div>
                {product.status === 'sold' && (
                  <Badge variant="destructive" className="text-xs px-2 py-0.5">SOLD</Badge>
                )}
              </div>

              {/* Quick Info Badges */}
              <div className="flex flex-wrap gap-2 mb-3">
                {product.category && (
                  <Badge variant="secondary" className="capitalize text-xs px-2 py-0.5">
                    <Tag className="h-3 w-3 mr-1" />
                    {product.category}
                  </Badge>
                )}
                {product.condition && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                    <Shield className="h-3 w-3 mr-1" />
                    {conditionLabels[product.condition] || product.condition}
                  </Badge>
                )}
                {product.brand && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                    {product.brand}
                  </Badge>
                )}
              </div>
            </div>

            {/* Description - Prominent */}
            {product.description && (
              <Card className="border-2 bg-muted shadow-sm">
                <CardContent className="p-4">
                  <h2 className="font-semibold text-xs mb-2.5 text-muted-foreground uppercase tracking-wider">
                    About This Item
                  </h2>
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap text-sm line-clamp-6">
                    {product.description}
                  </p>
                  {product.description.length > 200 && (
                    <button
                      onClick={(e) => {
                        const p = e.currentTarget.previousElementSibling as HTMLElement;
                        if (p) {
                          p.classList.toggle('line-clamp-6');
                          e.currentTarget.textContent = p.classList.contains('line-clamp-6') ? 'Show more' : 'Show less';
                        }
                      }}
                      className="text-xs text-primary hover:underline mt-2 font-medium"
                    >
                      Show more
                    </button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-2 border-t">
              {session?.user && session.user.email !== product.sellerEmail ? (
                <>
                  {product.status !== 'sold' && (
                    <Button 
                      onClick={() => setPaymentOpen(true)}
                      size="lg"
                      className="w-full h-11 text-base font-semibold shadow-md hover:shadow-lg transition-all"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Buy Now
                    </Button>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      onClick={() => router.push(`/chat?productId=${product._id}&receiverEmail=${product.sellerEmail}&receiverId=${product.sellerId}&productTitle=${encodeURIComponent(product.title)}`)}
                      variant="outline"
                      size="sm"
                      className="h-9 border-2 text-sm"
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Message
                    </Button>
                    <Button
                      variant="outline"
                      onClick={toggleWishlist}
                      disabled={wishlistLoading}
                      size="sm"
                      className="h-9 border-2 text-sm"
                    >
                      <Heart className={`h-4 w-4 mr-1 ${isWishlisted ? 'fill-current text-red-500' : ''}`} />
                      {isWishlisted ? 'Saved' : 'Save'}
                    </Button>
                  </div>
                </>
              ) : session?.user && session.user.email === product.sellerEmail ? (
                <Link href={`/products/${product._id}/edit`}>
                  <Button variant="outline" size="lg" className="w-full h-11 border-2">
                    Edit Listing
                  </Button>
                </Link>
              ) : (
                <Button 
                  onClick={() => router.push('/auth/signin')}
                  size="lg"
                  className="w-full h-11 text-base font-semibold shadow-md hover:shadow-lg transition-all"
                >
                  Sign In to Purchase
                </Button>
              )}
            </div>

            {/* Product Details - Compact */}
            <Card className="border-2">
              <CardContent className="p-3 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    Location
                  </span>
                  <span className="font-medium text-right">{product.location || 'Not specified'}</span>
                </div>
                {product.brand && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Brand</span>
                    <span className="font-medium">{product.brand}</span>
                  </div>
                )}
                {product.year && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Year/Model</span>
                    <span className="font-medium">{product.year}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Listed
                  </span>
                  <span className="font-medium">
                    {new Date(product.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5" />
                    Seller
                  </span>
                  <Link href={`/profile/${product.sellerId}`} className="font-medium hover:text-primary transition-colors">
                    {product.sellerEmail?.split('@')[0] || 'student'}
                  </Link>
                </div>
                {product.location && (
                  <div className="pt-2 border-t mt-2 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="truncate">{product.location}</span>
                    </div>
                    {userLocation && product.latitude && product.longitude && (() => {
                      const distanceKm = calculateDistance(
                        userLocation.lat,
                        userLocation.lng,
                        product.latitude,
                        product.longitude
                      );
                      const distance = formatDistance(distanceKm);
                      const timeMinutes = estimateTravelTime(distanceKm, 'walking');
                      const travelTime = formatTravelTime(timeMinutes);
                      return (
                        <div className="flex items-center gap-2 text-xs text-primary font-medium">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{distance} away</span>
                          <span>•</span>
                          <Clock className="h-3.5 w-3.5" />
                          <span>{travelTime}</span>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Location Map */}
        {product.latitude && product.longitude && (
          <div className="pt-2">
            <Card className="border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Product Location
                  </h3>
                  {userLocation && (() => {
                    const distanceKm = calculateDistance(
                      userLocation.lat,
                      userLocation.lng,
                      product.latitude,
                      product.longitude
                    );
                    const distance = formatDistance(distanceKm);
                    const timeMinutes = estimateTravelTime(distanceKm, 'walking');
                    const travelTime = formatTravelTime(timeMinutes);
                    return (
                      <div className="flex items-center gap-2 text-xs text-primary font-medium">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{distance}</span>
                        <span>•</span>
                        <Clock className="h-3.5 w-3.5" />
                        <span>{travelTime}</span>
                      </div>
                    );
                  })()}
                </div>
                <ProductMap
                  latitude={product.latitude}
                  longitude={product.longitude}
                  address={product.location}
                  userLocation={userLocation}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Product Boost Section */}
        {session?.user && session.user.email === product.sellerEmail && (
          <div className="pt-2">
            <ProductBoost productId={id} />
          </div>
        )}

        {/* Reviews Section */}
        <div className="pt-2">
          <ReviewSection productId={id} />
        </div>

        {/* Recommendations */}
        <div className="pt-2">
          <ProductRecommendations currentProductId={id} />
        </div>
              </div>
            );
          })()}
          {product && (
            <PaymentModal
              open={paymentOpen}
              onOpenChange={setPaymentOpen}
              product={product}
              type="purchase"
            />
          )}
        </main>
      )}
    </div>
  );
}
