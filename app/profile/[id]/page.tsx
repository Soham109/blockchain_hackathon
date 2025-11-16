"use client";
import React, { useEffect, useState, use } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { AvatarUpload } from '@/app/components/AvatarUpload';
import { Store, Package, Star, MessageCircle, Heart, Calendar, Mail, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatName } from '@/lib/format';

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const [profile, setProfile] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isOwnProfile = session?.user && (session.user as any).id === id;

  useEffect(() => {
    if (id) {
      loadProfile();
    }
  }, [id]);

  async function loadProfile() {
    try {
      const res = await fetch(`/api/users/${id}`);
      const data = await res.json();
      if (res.ok) {
        setProfile(data.user);
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Failed to load profile', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex gap-6">
                <Skeleton className="h-32 w-32 rounded-full" />
                <div className="flex-1 space-y-4">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-6 w-32" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">User not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-12 px-4 bg-background">
      <div className="max-w-6xl mx-auto space-y-8 pt-4">
        {/* Profile Header */}
        <Card className="border-2 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                {isOwnProfile ? (
                  <AvatarUpload
                    currentAvatar={profile.avatar}
                    userId={String(id)}
                    onUploadComplete={(avatarUrl) => {
                      setProfile({ ...profile, avatar: avatarUrl });
                    }}
                  />
                ) : (
                  <Avatar className="h-32 w-32 border-4 border-primary/30">
                    <AvatarImage src={profile.avatar} alt={formatName(profile.name) || profile.email} />
                    <AvatarFallback className="text-4xl font-bold">
                      {(formatName(profile.name) || profile.email)?.[0]?.toUpperCase() || <User size={48} />}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
              <div className="flex-1">
                <div className="mb-3">
                  <h1 className="text-4xl font-bold mb-2">
                    {formatName(profile.name) || profile.email?.split('@')[0] || 'User'}
                  </h1>
                  {profile.name && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail size={14} />
                      <span className="font-medium">{profile.email}</span>
                      <span className="text-xs text-muted-foreground/70">(Username)</span>
                    </div>
                  )}
                  {!profile.name && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail size={16} />
                      <span>{profile.email}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 mb-4">
                  <Badge variant="secondary" className="capitalize">
                    {profile.role || 'buyer'}
                  </Badge>
                  {profile.studentVerified && (
                    <Badge className="bg-green-500/20 dark:bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30 dark:border-green-500/30">
                      ✓ Verified Student
                    </Badge>
                  )}
                  {profile.emailVerified && (
                    <Badge className="bg-blue-500/20 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30 dark:border-blue-500/30">
                      ✓ Email Verified
                    </Badge>
                  )}
                </div>
                {profile.createdAt && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar size={14} />
                    Member since {new Date(profile.createdAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <Package className="mx-auto mb-3 text-primary" size={28} />
              <p className="text-3xl font-bold mb-1">{products.length}</p>
              <p className="text-sm text-muted-foreground font-medium">Listings</p>
            </CardContent>
          </Card>
          <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <Star className="mx-auto mb-3 text-yellow-500 dark:text-yellow-400" size={28} />
              <p className="text-3xl font-bold mb-1">0</p>
              <p className="text-sm text-muted-foreground font-medium">Rating</p>
            </CardContent>
          </Card>
          <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <MessageCircle className="mx-auto mb-3 text-blue-500 dark:text-blue-400" size={28} />
              <p className="text-3xl font-bold mb-1">0</p>
              <p className="text-sm text-muted-foreground font-medium">Reviews</p>
            </CardContent>
          </Card>
          <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <Heart className="mx-auto mb-3 text-pink-500 dark:text-pink-400" size={28} />
              <p className="text-3xl font-bold mb-1">0</p>
              <p className="text-sm text-muted-foreground font-medium">Favorites</p>
            </CardContent>
          </Card>
        </div>

        {/* Products */}
        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Store size={24} />
            {isOwnProfile ? 'My Listings' : 'Listings'}
          </h2>
          {products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Link key={product._id} href={`/products/${product._id}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="w-full h-40 bg-muted rounded-t-lg mb-4 flex items-center justify-center overflow-hidden">
                      {product.images && product.images.length > 0 ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={product.images[0]} 
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package size={32} className="text-muted-foreground" />
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-lg mb-2 line-clamp-2">{product.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{product.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">
                          ${product.price || (product.priceCents / 100).toFixed(2)}
                        </span>
                        <Badge variant="secondary">{product.category}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Package size={48} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No listings yet</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
