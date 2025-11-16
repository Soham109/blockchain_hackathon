"use client";
import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Loading from '../components/ui/Loading';
import { CheckCircle2, AlertCircle, Store, ShoppingBag, Plus, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userStats, setUserStats] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/');
    if (session?.user) {
      fetch('/api/users/stats').then((r) => r.json()).then(setUserStats).catch(console.error);
    }
  }, [status, session, router]);

  if (status === 'loading' || !session?.user) return <Loading fullscreen message="Preparing your dashboard..." />;

  const user = session.user as any;
  const isSeller = user.role === 'seller';

  return (
    <div className="min-h-screen pt-28 pb-12 px-4 max-w-7xl mx-auto">
      
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-zinc-400 mt-1">Welcome back, {user.email?.split('@')[0]}</p>
        </div>
        <div className="flex gap-3">
          {isSeller ? (
            <Link href="/seller/products/create">
              <Button className="shadow-lg shadow-violet-500/20"><Plus size={16} className="mr-2"/> New Listing</Button>
            </Link>
          ) : (
            <Link href="/browse">
              <Button><ShoppingBag size={16} className="mr-2"/> Browse Market</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatusCard 
          title="Verification" 
          active={user.studentVerified} 
          activeText="Verified Student" 
          inactiveText="Pending ID"
        />
        <StatusCard 
          title="Email Status" 
          active={user.emailVerified} 
          activeText="Confirmed" 
          inactiveText="Unconfirmed"
        />
        <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-violet-500">
          <div className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Current Role</div>
          <div className="text-2xl font-bold capitalize flex items-center gap-2">
            {user.role}
            {isSeller ? <Store className="text-violet-400"/> : <ShoppingBag className="text-pink-400"/>}
          </div>
        </div>
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Actions Column */}
        <div className="space-y-6">
          {!user.studentVerified && (
            <Card className="bg-amber-500/10 border-amber-500/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-amber-500 shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-amber-200">Verify Student ID</h3>
                  <p className="text-sm text-amber-200/70 mt-1 mb-3">
                    Unlock selling features and full access by uploading your ID.
                  </p>
                  <Link href="/onboarding">
                    <Button variant="outline" className="w-full border-amber-500/30 text-amber-200 hover:bg-amber-500/20">Upload ID</Button>
                  </Link>
                </div>
              </div>
            </Card>
          )}

          <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b border-white/5 font-semibold bg-white/5">Quick Navigation</div>
            <div className="flex flex-col p-2">
              <NavRow href="/profile" label="Profile Settings" />
              <NavRow href="/orders" label="My Orders" />
              {isSeller && <NavRow href="/seller/dashboard" label="Shop Analytics" />}
            </div>
          </Card>
        </div>

        {/* Content Column */}
        <div className="lg:col-span-2">
          <Card>
            <h3 className="text-xl font-bold mb-6">{isSeller ? 'Recent Activity' : 'Recommended for You'}</h3>
            
            {isSeller && userStats?.recentProducts?.length ? (
               <div className="space-y-3">
               {userStats.recentProducts.map((product: any) => (
                 <div key={product._id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                   <div className="flex items-center gap-4">
                     <div className="h-10 w-10 rounded-lg bg-zinc-800 flex items-center justify-center text-lg">📦</div>
                     <div>
                       <p className="font-medium text-white">{product.title}</p>
                       <p className="text-xs text-zinc-400">${(product.priceCents/100).toFixed(2)}</p>
                     </div>
                   </div>
                   <Badge variant="info">{product.status}</Badge>
                 </div>
               ))}
             </div>
            ) : (
              <div className="text-center py-12 bg-white/5 rounded-xl border border-dashed border-zinc-700">
                <div className="text-4xl mb-3">👻</div>
                <p className="text-zinc-400 mb-4">Nothing to see here yet.</p>
                <Link href={isSeller ? "/seller/products/create" : "/browse"}>
                  <Button variant="ghost" className="text-violet-400 hover:text-violet-300">
                    {isSeller ? 'Create your first listing' : 'Start Browsing'} <ArrowRight size={14} className="ml-1"/>
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatusCard({ title, active, activeText, inactiveText }: any) {
  return (
    <Card className="flex items-center justify-between">
      <div>
        <div className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">{title}</div>
        <div className={clsx("text-lg font-bold flex items-center gap-2", active ? "text-emerald-400" : "text-amber-400")}>
          {active ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {active ? activeText : inactiveText}
        </div>
      </div>
    </Card>
  )
}

function NavRow({ href, label }: any) {
  return (
    <Link href={href} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors group">
      <span>{label}</span>
      <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-violet-400" />
    </Link>
  )
}