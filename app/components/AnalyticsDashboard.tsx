"use client";
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Eye, DollarSign, ShoppingCart, Users, Package, MessageCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface AnalyticsDashboardProps {
  userId: string;
  role: 'buyer' | 'seller';
}

export function AnalyticsDashboard({ userId, role }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const res = await fetch(`/api/analytics?userId=${userId}&range=${timeRange}`);
        const data = await res.json();
        if (res.ok) {
          setAnalytics(data);
        }
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, [userId, timeRange]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analytics</h2>
        <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
          <TabsList>
            <TabsTrigger value="7d" className="cursor-pointer">7 Days</TabsTrigger>
            <TabsTrigger value="30d" className="cursor-pointer">30 Days</TabsTrigger>
            <TabsTrigger value="90d" className="cursor-pointer">90 Days</TabsTrigger>
            <TabsTrigger value="all" className="cursor-pointer">All Time</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {role === 'seller' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${analytics.totalRevenue?.toFixed(2) || '0.00'}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.revenueChange > 0 ? (
                  <span className="text-green-500 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +{analytics.revenueChange}%
                  </span>
                ) : (
                  <span className="text-red-500 flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" />
                    {analytics.revenueChange}%
                  </span>
                )}
                {' '}from last period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Products Sold</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.productsSold || 0}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.soldChange > 0 ? (
                  <span className="text-green-500 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +{analytics.soldChange}
                  </span>
                ) : (
                  <span className="text-red-500 flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" />
                    {analytics.soldChange}
                  </span>
                )}
                {' '}from last period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalViews || 0}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.viewsChange > 0 ? (
                  <span className="text-green-500 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +{analytics.viewsChange}%
                  </span>
                ) : (
                  <span className="text-red-500 flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" />
                    {analytics.viewsChange}%
                  </span>
                )}
                {' '}from last period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.activeListings || 0}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.listingsChange > 0 ? (
                  <span className="text-green-500 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +{analytics.listingsChange}
                  </span>
                ) : (
                  <span className="text-red-500 flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" />
                    {analytics.listingsChange}
                  </span>
                )}
                {' '}from last period
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Items Purchased</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.itemsPurchased || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wishlist Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.wishlistCount || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messages</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.messageCount || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${analytics.totalSpent?.toFixed(2) || '0.00'}</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

