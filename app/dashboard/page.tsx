"use client";
import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, AlertCircle, Store, ShoppingBag, Plus, ArrowRight, TrendingUp, Package, MessageCircle, Heart, Eye, Inbox, User } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ConnectWallet } from '../components/ConnectWallet';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userStats, setUserStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/');
    if (session?.user) {
      fetch('/api/users/stats')
        .then((r) => r.json())
        .then((data) => {
          setUserStats(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [status, session, router]);

  if (status === 'loading' || !session?.user) {
    return (
      <div className="min-h-screen pt-28 pb-12 px-4">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const user = session.user as any;
  const isSeller = user.role === 'seller';

  return (
    <div className="min-h-screen pt-32 pb-12 px-4 bg-background">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4">
          <div className="text-center md:text-left">
            <h1 className="text-5xl md:text-6xl font-bold mb-3 tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground text-xl">Welcome back, {user.email?.split('@')[0]}</p>
          </div>
          <div className="flex gap-3 justify-center md:justify-end">
            <ConnectWallet />
            {isSeller ? (
              <Link href="/seller/create">
                <Button size="lg" className="shadow-sm hover:shadow-md transition-shadow">
                  <Plus size={18} className="mr-2" />
                  New Listing
                </Button>
              </Link>
            ) : (
              <Link href="/browse">
                <Button size="lg" className="shadow-sm hover:shadow-md transition-shadow">
                  <ShoppingBag size={18} className="mr-2" />
                  Browse Market
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-2 font-medium">Verification</p>
                  <div className="flex items-center gap-2.5">
                    {user.studentVerified ? (
                      <>
                        <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                        <span className="text-xl font-bold">Verified</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                        <span className="text-xl font-bold">Pending</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-2 font-medium">Email Status</p>
                  <div className="flex items-center gap-2.5">
                    {user.emailVerified ? (
                      <>
                        <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                        <span className="text-xl font-bold">Confirmed</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                        <span className="text-xl font-bold">Unconfirmed</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2 font-medium">Current Role</p>
                <div className="flex items-center gap-2.5">
                  {isSeller ? (
                    <>
                      <Store className="h-6 w-6 text-primary" />
                      <span className="text-xl font-bold capitalize">Seller</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="h-6 w-6 text-primary" />
                      <span className="text-xl font-bold capitalize">Buyer</span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {isSeller && userStats && (
            <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-2 font-medium">Total Listings</p>
                  <div className="flex items-center gap-2.5">
                    <Package className="h-6 w-6 text-primary" />
                    <span className="text-xl font-bold">{userStats.totalListings || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Stats for Sellers */}
        {isSeller && userStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2 font-medium">Total Views</p>
                    <p className="text-3xl font-bold">{userStats.totalViews || 0}</p>
                  </div>
                  <Eye className="h-10 w-10 text-primary/60" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2 font-medium">Messages</p>
                    <p className="text-3xl font-bold">{userStats.totalMessages || 0}</p>
                  </div>
                  <MessageCircle className="h-10 w-10 text-primary/60" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2 font-medium">Wishlist Saves</p>
                    <p className="text-3xl font-bold">{userStats.totalWishlists || 0}</p>
                  </div>
                  <Heart className="h-10 w-10 text-primary/60" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="space-y-6">
            {!user.studentVerified && (
              <Card className="border-amber-500/20 bg-amber-500/5 border">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-amber-500 shrink-0 mt-1" size={20} />
                    <div className="flex-1">
                      <CardTitle className="text-base mb-1">Verify Student ID</CardTitle>
                      <CardDescription className="text-sm mb-4">
                        Unlock selling features by uploading your ID.
                      </CardDescription>
                      <Link href="/onboarding">
                        <Button variant="outline" size="sm" className="w-full">
                          Upload ID
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            )}

            <Card className="border">
              <CardHeader>
                <CardTitle className="text-lg">Quick Navigation</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex flex-col">
                  <Link href={`/profile/${user.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors border-b">
                    <User size={16} className="text-muted-foreground" />
                    <span>My Profile</span>
                    <ArrowRight size={14} className="ml-auto text-muted-foreground" />
                  </Link>
                  <Link href="/wishlist" className="flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors border-b">
                    <Heart size={16} className="text-muted-foreground" />
                    <span>My Wishlist</span>
                    <ArrowRight size={14} className="ml-auto text-muted-foreground" />
                  </Link>
                  <Link href="/chat" className="flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors border-b">
                    <MessageCircle size={16} className="text-muted-foreground" />
                    <span>Messages</span>
                    <ArrowRight size={14} className="ml-auto text-muted-foreground" />
                  </Link>
                  {isSeller && (
                    <Link href="/seller/dashboard" className="flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors">
                      <TrendingUp size={16} className="text-muted-foreground" />
                      <span>Shop Analytics</span>
                      <ArrowRight size={14} className="ml-auto text-muted-foreground" />
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card className="border">
              <CardHeader>
                <CardTitle>{isSeller ? 'Recent Listings' : 'Recommended for You'}</CardTitle>
              </CardHeader>
              <CardContent>
                {isSeller && userStats?.recentProducts?.length ? (
                  <div className="space-y-3">
                    {userStats.recentProducts.map((product: any) => (
                      <Link key={product._id} href={`/products/${product._id}`}>
                        <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                              <Package size={20} className="text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium">{product.title}</p>
                              <p className="text-sm text-muted-foreground">${(product.priceCents / 100).toFixed(2)}</p>
                            </div>
                          </div>
                          <Badge variant="secondary">{product.status || 'active'}</Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Inbox size={64} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-lg font-medium mb-2">Nothing to see here yet</p>
                    <p className="text-sm text-muted-foreground mb-6">
                      Get started by {isSeller ? 'creating your first listing' : 'browsing the marketplace'}
                    </p>
                    <Link href={isSeller ? "/seller/create" : "/browse"}>
                      <Button>
                        {isSeller ? 'Create your first listing' : 'Start Browsing'}
                        <ArrowRight size={16} className="ml-2" />
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
