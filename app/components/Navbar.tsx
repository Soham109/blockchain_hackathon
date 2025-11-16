"use client";
import React, { useState } from 'react';
import clsx from 'clsx';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Button from './ui/Button';
import { ShoppingBag, User, LogOut, ShieldCheck, Store, LayoutDashboard, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [toggling, setToggling] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const user = session?.user as any | undefined;
  const isVerified = !!(user?.studentVerified || user?.emailVerified);

  if (pathname?.includes('/auth/') || pathname === '/signup' || pathname === '/verify-email') return null;

  async function handleToggleRole() {
    if (!isVerified) { window.location.href = '/onboarding'; return; }
    try {
      setToggling(true);
      const resp = await fetch('/api/user/toggle-role', { method: 'POST' });
      if (!resp.ok) throw new Error('Toggle failed');
      window.location.reload();
    } catch (e) {
      alert('Failed to toggle role');
      setToggling(false);
    }
  }

  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
      <header className="w-full max-w-5xl rounded-2xl glass-panel border border-white/10 shadow-2xl shadow-black/50 backdrop-blur-xl">
        <div className="px-6 py-3 flex items-center justify-between">
          
          {/* Logo */}
          <Link href={session?.user ? '/dashboard' : '/'} className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShoppingBag size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">UniMarket</span>
          </Link>

          {/* Desktop Nav */}
          {session?.user && (
            <nav className="hidden md:flex items-center gap-1 bg-white/5 px-2 py-1 rounded-full border border-white/5">
              <NavLink href="/dashboard" active={pathname === '/dashboard'} icon={<LayoutDashboard size={14} />}>Dashboard</NavLink>
              <NavLink href="/browse" active={pathname === '/browse'} icon={<ShoppingBag size={14} />}>Browse</NavLink>
              {user?.role === 'seller' && (
                <NavLink href="/seller/dashboard" active={pathname?.startsWith('/seller')} icon={<Store size={14} />}>My Shop</NavLink>
              )}
            </nav>
          )}

          {/* Auth / User */}
          <div className="hidden md:flex items-center gap-4">
            {status === 'loading' ? (
              <div className="w-20 h-8 bg-white/5 rounded animate-pulse" />
            ) : session?.user ? (
              <div className="flex items-center gap-3">
                {isVerified && (
                  <button 
                    onClick={handleToggleRole}
                    disabled={toggling}
                    className="text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                  >
                    {user?.role === 'seller' ? 'Switch to Buyer' : 'Switch to Seller'}
                  </button>
                )}
                <div className="h-8 w-[1px] bg-white/10" />
                <div className="flex items-center gap-2 pr-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-600 flex items-center justify-center text-xs font-bold">
                    {user.email?.[0].toUpperCase()}
                  </div>
                </div>
                <Button variant="ghost" onClick={() => signOut({ callbackUrl: '/' })} className="p-2 h-auto rounded-full hover:bg-red-500/20 hover:text-red-200">
                  <LogOut size={16} />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link href="/auth/signin"><Button variant="ghost">Sign In</Button></Link>
                <Link href="/signup"><Button>Get Started</Button></Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
             {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden border-t border-white/10"
            >
              <div className="p-4 flex flex-col gap-2">
                 {/* Mobile Links go here (simplified for brevity) */}
                 <Link href="/browse" onClick={()=>setMobileMenuOpen(false)} className="p-3 hover:bg-white/5 rounded-lg">Browse</Link>
                 {session?.user && <Button variant="danger" onClick={() => signOut()}>Sign Out</Button>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </div>
  );
}

function NavLink({ href, active, children, icon }: any) {
  return (
    <Link 
      href={href} 
      className={clsx(
        "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
        active ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20" : "text-zinc-400 hover:text-white hover:bg-white/5"
      )}
    >
      {icon}
      {children}
    </Link>
  )
}