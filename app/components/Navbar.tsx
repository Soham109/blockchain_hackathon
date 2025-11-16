"use client";
import React from 'react';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import Button from './ui/Button';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Hide navbar on auth pages
  if (pathname?.includes('/auth/') || pathname === '/signup' || pathname === '/verify-email') {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-gradient-to-r from-slate-900/90 to-slate-800/90 backdrop-blur-md text-white">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        {/* Logo/Brand */}
        <Link href={session?.user ? '/dashboard' : '/'} className="font-bold text-xl text-indigo-400 hover:text-indigo-300 transition">
          📚 College Marketplace
        </Link>

        {/* Nav Links - visible for logged in users */}
        {session?.user && (
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/dashboard" className={`text-sm transition ${pathname === '/dashboard' ? 'text-indigo-400 font-semibold' : 'text-slate-300 hover:text-white'}`}>
              Dashboard
            </Link>
            <Link href="/browse" className={`text-sm transition ${pathname === '/browse' ? 'text-indigo-400 font-semibold' : 'text-slate-300 hover:text-white'}`}>
              Browse
            </Link>
            {(session.user as any)?.role === 'seller' && (
              <Link href="/seller/dashboard" className={`text-sm transition ${pathname === '/seller/dashboard' ? 'text-indigo-400 font-semibold' : 'text-slate-300 hover:text-white'}`}>
                My Shop
              </Link>
            )}
          </nav>
        )}

        {/* Auth Section */}
        <div className="flex items-center gap-4">
          {status === 'loading' ? (
            <div className="text-sm text-slate-300">Loading...</div>
          ) : session?.user ? (
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <div className="text-sm font-medium">{(session.user as any).email}</div>
                <div className="text-xs text-slate-400 capitalize">{(session.user as any).role}</div>
              </div>
              <Button
                variant="danger"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="px-3 py-1 text-sm"
              >
                Sign out
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button onClick={() => signIn()} className="px-4 py-2">
                Sign in
              </Button>
              <Link href="/signup">
                <Button variant="ghost" className="px-4 py-2">
                  Sign up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
