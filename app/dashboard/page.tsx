"use client";
import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Loading from '../components/ui/Loading';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userStats, setUserStats] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      // Fetch user stats (products, orders, etc.)
      fetch('/api/users/stats')
        .then((r) => r.json())
        .then(setUserStats)
        .catch((e) => console.error('Failed to fetch stats:', e));
    }
  }, [session]);

  if (status === 'loading' || !session?.user) {
    return <Loading fullscreen message="Loading your dashboard..." />;
  }

  const user = session.user as any;
  const isStudentVerified = user.studentVerified;
  const isSeller = user.role === 'seller';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome, {user.email?.split('@')[0]}</h1>
          <p className="text-slate-300">
            {isSeller ? "Manage your shop and sell items." : "Browse products and make purchases."}
          </p>
        </div>

        {/* Quick Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Email Status */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 uppercase">Email Status</p>
                <p className="text-lg font-bold mt-1">{user.emailVerified ? 'Verified ✓' : 'Not Verified'}</p>
              </div>
              <Badge variant={user.emailVerified ? 'success' : 'warning'}>
                {user.emailVerified ? 'Active' : 'Pending'}
              </Badge>
            </div>
          </Card>

          {/* Student ID Status */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 uppercase">Student ID</p>
                <p className="text-lg font-bold mt-1">{isStudentVerified ? 'Verified ✓' : 'Not Verified'}</p>
              </div>
              <Badge variant={isStudentVerified ? 'success' : 'warning'}>
                {isStudentVerified ? 'Approved' : 'Pending'}
              </Badge>
            </div>
          </Card>

          {/* Account Role */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 uppercase">Account Role</p>
                <p className="text-lg font-bold mt-1 capitalize">{isSeller ? 'Seller' : 'Buyer'}</p>
              </div>
              <Badge variant="info">{isSeller ? '🏪' : '🛍️'}</Badge>
            </div>
          </Card>
        </div>

        {/* Next Steps */}
        {!isStudentVerified && (
          <Card className="border-amber-500/30 bg-amber-500/10 mb-8">
            <h2 className="font-bold text-amber-200 mb-2">⚠️ Complete Your Profile</h2>
            <p className="text-sm text-amber-100 mb-4">
              Upload your student ID to unlock full marketplace access and unlock seller features.
            </p>
            <Link href="/onboarding">
              <Button className="bg-amber-600 hover:brightness-110">Upload Student ID</Button>
            </Link>
          </Card>
        )}

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left Column - Quick Actions */}
          <div className="lg:col-span-1">
            <Card>
              <h3 className="font-bold text-lg mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {isSeller ? (
                  <>
                    <Link href="/seller/dashboard">
                      <Button className="w-full justify-start text-left" variant="ghost">
                        📊 My Shop
                      </Button>
                    </Link>
                    <Link href="/seller/products/create">
                      <Button className="w-full justify-start text-left" variant="ghost">
                        ➕ List New Item
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/browse">
                      <Button className="w-full justify-start text-left" variant="ghost">
                        🔍 Browse Items
                      </Button>
                    </Link>
                    <Link href="/orders">
                      <Button className="w-full justify-start text-left" variant="ghost">
                        📦 My Orders
                      </Button>
                    </Link>
                  </>
                )}
                <Link href="/profile">
                  <Button className="w-full justify-start text-left" variant="ghost">
                    👤 Profile Settings
                  </Button>
                </Link>
              </div>
            </Card>
          </div>

          {/* Right Column - Featured / Recent Activity */}
          <div className="lg:col-span-2">
            {isSeller ? (
              <Card>
                <h3 className="font-bold text-lg mb-4">Recent Listings</h3>
                {userStats?.recentProducts?.length ? (
                  <div className="space-y-3">
                    {userStats.recentProducts.map((product: any) => (
                      <div
                        key={product._id}
                        className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/5"
                      >
                        <div>
                          <p className="font-medium">{product.title}</p>
                          <p className="text-xs text-slate-400">${product.price}</p>
                        </div>
                        <Badge variant="info">{product.status}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm">
                    No listings yet.{' '}
                    <Link href="/seller/products/create" className="text-indigo-400 hover:underline">
                      Create one now
                    </Link>
                  </p>
                )}
              </Card>
            ) : (
              <Card>
                <h3 className="font-bold text-lg mb-4">Recommended For You</h3>
                <p className="text-slate-400 text-sm">
                  <Link href="/browse" className="text-indigo-400 hover:underline">
                    Browse the marketplace
                  </Link>{' '}
                  to discover products from other students.
                </p>
              </Card>
            )}
          </div>
        </div>

        {/* Footer CTA */}
        <Card>
          <div className="text-center">
            <h3 className="font-bold text-xl mb-2">Ready to explore?</h3>
            <p className="text-slate-300 mb-4">
              {isSeller
                ? 'Start by listing your first item for sale.'
                : 'Browse thousands of items from verified students.'}
            </p>
            <Link href={isSeller ? '/seller/products/create' : '/browse'}>
              <Button>{isSeller ? 'Create Listing' : 'Browse Now'}</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
