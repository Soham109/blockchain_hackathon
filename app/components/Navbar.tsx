"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ShoppingBag, User, LogOut, Store, LayoutDashboard, Menu, X, MessageCircle, Heart, Search, RotateCcw, Bell, Settings, Sun, Moon, CreditCard, Package } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';

function useThemeSafe() {
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark');
  
  useEffect(() => {
    const saved = localStorage.getItem('theme') as any;
    if (saved) setThemeState(saved);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    document.documentElement.className = newTheme;
  };

  return { theme, toggleTheme };
}

export default function Navbar() {
  const { data: session, update } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { theme, toggleTheme } = useThemeSafe();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [toggling, setToggling] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  const user = session?.user as any | undefined;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    async function fetchUserProfile() {
      const userId = (session?.user as any)?.id;
      if (!userId) return;
      try {
        const res = await fetch(`/api/users/${userId}`);
        if (res.ok) {
          const data = await res.json();
          setUserProfile(data.user);
        }
      } catch (err) {
        // Silently fail in incognito or when session is unavailable
        console.warn('Failed to fetch profile (may be incognito mode):', err);
      }
    }
    if (session?.user) {
      fetchUserProfile();
    }
  }, [(session?.user as any)?.id]);

  useEffect(() => {
    if (session?.user) {
      fetch('/api/notifications/count')
        .then(r => r.json())
        .then(data => setNotificationCount(data.count || 0))
        .catch(() => {
          // Silently fail in incognito mode
          setNotificationCount(0);
        });
    } else {
      setNotificationCount(0);
    }
  }, [session]);

  async function handleToggleRole() {
    if (!user?.studentVerified && !user?.emailVerified) {
      toast({
        title: "Verification Required",
        description: "Please verify your email first",
        variant: "destructive",
      });
      return;
    }
    setToggling(true);
    try {
      const res = await fetch('/api/user/toggle-role', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        // Update session first
        await update();
        
        // Fetch updated user profile
        const userId = (session?.user as any)?.id;
        if (userId) {
          const profileRes = await fetch(`/api/users/${userId}`);
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            setUserProfile(profileData.user);
          }
        }
        
        toast({
          title: "Role Switched",
          description: `You are now a ${data.role}`,
        });
        
        // Navigate to appropriate dashboard without reloading
        setTimeout(() => {
          if (data.role === 'seller') {
            router.push('/seller/dashboard');
          } else {
            router.push('/dashboard');
          }
        }, 300);
      } else {
        throw new Error(data.error || 'Failed to toggle role');
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to toggle role",
        variant: "destructive",
      });
    } finally {
      setToggling(false);
    }
  }

  if (pathname?.includes('/auth/') || pathname === '/signup' || pathname === '/verify-email') return null;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/browse?q=${encodeURIComponent(searchQuery)}`);
    }
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { href: '/browse', label: 'Browse', icon: ShoppingBag, path: '/browse' },
    { href: '/chat', label: 'Messages', icon: MessageCircle, path: '/chat' },
    { href: '/wishlist', label: 'Wishlist', icon: Heart, path: '/wishlist' },
  ];

  return (
    <nav className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl rounded-2xl border-2 bg-background shadow-lg transition-all duration-300 ${
      scrolled ? 'shadow-2xl' : ''
    }`}>
      <div className="flex h-16 items-center px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="mr-8 flex items-center space-x-2 group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md group-hover:shadow-lg transition-all group-hover:scale-105">
            <ShoppingBag className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            UniMarket
          </span>
        </Link>

        {/* Desktop Nav */}
        {session?.user && (
          <div className="hidden md:flex items-center gap-1 mr-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    size="sm"
                    className="cursor-pointer"
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
            {user?.role === 'seller' && (
              <Link href="/seller/dashboard">
                <Button
                  variant={pathname?.startsWith('/seller') ? 'default' : 'ghost'}
                  size="sm"
                  className="cursor-pointer"
                >
                  <Store className="h-4 w-4 mr-2" />
                  My Shop
                </Button>
              </Link>
            )}
          </div>
        )}

        {/* Search */}
        {session?.user && (
          <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 cursor-text"
              />
            </div>
          </form>
        )}

        {/* User Menu */}
        <div className="flex flex-1 items-center justify-end gap-2">
          {session?.user ? (
            <>
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="cursor-pointer"
              >
                {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>

              {/* Notifications */}
              <Link href="/notifications">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative cursor-pointer"
                >
                  <Bell className="h-5 w-5" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </Button>
              </Link>

              {/* Role Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleRole}
                disabled={toggling}
                className="hidden md:flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                <span className="text-xs">
                  {user?.role === 'seller' ? 'Buyer' : 'Seller'}
                </span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 cursor-pointer border-2 border-transparent hover:border-primary/30 transition-all">
                    <Avatar className="h-10 w-10 border-2 border-primary/40">
                      <AvatarImage src={userProfile?.avatar || user?.avatar} alt={user?.email} />
                      <AvatarFallback className="text-sm font-bold">
                        {user?.email?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 bg-background border-2 shadow-lg" style={{ backgroundColor: 'hsl(var(--background))' }}>
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-primary/40">
                          <AvatarImage src={userProfile?.avatar || user?.avatar} alt={user?.email} />
                          <AvatarFallback className="text-lg font-bold">
                            {user?.email?.[0]?.toUpperCase() || <User className="h-5 w-5" />}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-none truncate">{user?.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={user?.role === 'seller' ? 'default' : 'secondary'} className="text-xs">
                              {user?.role === 'seller' ? 'Seller' : 'Buyer'}
                            </Badge>
                            {user?.studentVerified && (
                              <Badge variant="outline" className="text-xs">Verified</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link href={`/profile/${user?.id}`}>
                    <DropdownMenuItem className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      View Profile
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/orders">
                    <DropdownMenuItem className="cursor-pointer">
                      <Package className="mr-2 h-4 w-4" />
                      My Orders
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/payments">
                    <DropdownMenuItem className="cursor-pointer">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Payment History
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/settings">
                    <DropdownMenuItem className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem
                    onClick={handleToggleRole}
                    disabled={toggling}
                    className="cursor-pointer"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    {toggling ? 'Switching...' : `Switch to ${user?.role === 'seller' ? 'Buyer' : 'Seller'}`}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/' })} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex gap-2">
              <Link href="/auth/signin">
                <Button variant="ghost" className="cursor-pointer">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button className="cursor-pointer">Get Started</Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden cursor-pointer"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && session?.user && (
        <div className="md:hidden border-t-2 bg-background rounded-b-2xl">
          <div className="px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant={pathname === item.path ? 'default' : 'ghost'}
                    className="w-full justify-start cursor-pointer"
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
