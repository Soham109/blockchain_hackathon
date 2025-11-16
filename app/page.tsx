"use client";
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Zap, BookOpen, Users, ArrowRight, TrendingUp, Lock, ShoppingBag } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// GridBackground and Footer components

function TypewriterLoop({ texts, delay = 0, className = '' }: { texts: string[]; delay?: number; className?: string }) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (!hasStarted) {
      const startTimeout = setTimeout(() => {
        setHasStarted(true);
      }, delay);
      return () => clearTimeout(startTimeout);
    }
  }, [delay, hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    const currentText = texts[currentTextIndex];
    const typingSpeed = isDeleting ? 40 : 80;
    const pauseBeforeDelete = 2000; // Pause before starting to delete
    const pauseBeforeNext = 500; // Pause before starting next text

    if (!isDeleting && currentCharIndex < currentText.length) {
      // Typing
      const timeout = setTimeout(() => {
        setDisplayedText(currentText.substring(0, currentCharIndex + 1));
        setCurrentCharIndex((prev) => prev + 1);
      }, typingSpeed);
      return () => clearTimeout(timeout);
    } else if (!isDeleting && currentCharIndex === currentText.length) {
      // Finished typing, pause then start deleting
      const timeout = setTimeout(() => {
        setIsDeleting(true);
      }, pauseBeforeDelete);
      return () => clearTimeout(timeout);
    } else if (isDeleting && currentCharIndex > 0) {
      // Deleting
      const timeout = setTimeout(() => {
        setDisplayedText(currentText.substring(0, currentCharIndex - 1));
        setCurrentCharIndex((prev) => prev - 1);
      }, typingSpeed);
      return () => clearTimeout(timeout);
    } else if (isDeleting && currentCharIndex === 0) {
      // Finished deleting, move to next text
      const timeout = setTimeout(() => {
        setIsDeleting(false);
        setCurrentTextIndex((prev) => (prev + 1) % texts.length);
      }, pauseBeforeNext);
      return () => clearTimeout(timeout);
    }
  }, [currentCharIndex, currentTextIndex, isDeleting, hasStarted, texts]);

  return (
    <span className={className}>
      {displayedText}
      <span className="animate-pulse">|</span>
    </span>
  );
}

export default function HomePage() {
  const { data: session } = useSession();

  return (
    <div className="relative min-h-screen flex flex-col bg-background">
      {/* Premium Grid Background */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/10" />
      
      {/* Hero Section */}
      <div className="relative flex-1 flex flex-col items-center justify-center pt-28 pb-20 px-4 z-10">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <Badge variant="outline" className="px-4 py-1.5 text-sm border shadow-sm">
            <ShieldCheck className="h-3 w-3 mr-2" />
            <span>100% Verified Student Marketplace</span>
          </Badge>

          <div className="space-y-6">
            <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-center leading-tight">
              Buy & Sell
              <br />
              Like{' '}
              <TypewriterLoop
                texts={['Never Before', 'A Champion', 'You Deserve']}
                delay={800}
                className="text-blue-500 dark:text-cyan-400"
              />
            </h1>
          </div>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            The exclusive marketplace for verified students. Trade textbooks, gear, and services with complete trust. Minimal listing fees for sellers, zero transaction fees for buyers.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
            {!session?.user && (
              <Link href="/signup">
                <Button size="lg" className="h-14 px-8 text-lg shadow-lg hover:shadow-xl transition-all bg-blue-500 hover:bg-blue-600 text-white border-0">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            )}
            <Link href="/browse">
              <Button variant="outline" size="lg" className="h-14 px-8 text-lg border-2 shadow-sm hover:shadow-md transition-all hover:border-blue-400/50 hover:bg-blue-50 dark:hover:bg-blue-950/20">
                Explore Marketplace
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 pt-12 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-500 dark:text-green-400">100%</div>
              <div className="text-sm text-muted-foreground mt-1">Verified</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-500 dark:text-blue-400">Minimal</div>
              <div className="text-sm text-muted-foreground mt-1">Listing Fees</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-500 dark:text-purple-400">24/7</div>
              <div className="text-sm text-muted-foreground mt-1">Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="relative max-w-7xl mx-auto px-4 py-20 w-full z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Why Choose UniMarket?</h2>
          <p className="text-muted-foreground text-lg">Everything you need for a seamless trading experience</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: ShieldCheck,
              title: 'Verified Students Only',
              description: 'Every user is verified through .edu email and student ID. No bots, no scams, just your classmates.',
              color: 'from-green-500 to-emerald-500',
            },
            {
              icon: Zap,
              title: 'Minimal Listing Fees',
              description: 'Sellers pay a small one-time listing fee. Buyers pay zero transaction fees. Keep 100% of your sales.',
              color: 'from-yellow-500 to-amber-500',
            },
            {
              icon: BookOpen,
              title: 'Textbooks & More',
              description: 'Find course materials, electronics, furniture, and services from students who\'ve been there.',
              color: 'from-blue-500 to-cyan-500',
            },
            {
              icon: Lock,
              title: 'Secure Messaging',
              description: 'Built-in chat system to communicate safely with buyers and sellers before meeting up.',
              color: 'from-purple-500 to-pink-500',
            },
            {
              icon: TrendingUp,
              title: 'Smart Search',
              description: 'Find exactly what you need with powerful search and filtering options across all categories.',
              color: 'from-indigo-500 to-blue-500',
            },
            {
              icon: Users,
              title: 'Community Driven',
              description: 'Built by students, for students. Join thousands of verified students trading on campus.',
              color: 'from-cyan-500 to-teal-500',
            },
          ].map((feature, i) => {
            const Icon = feature.icon;
            return (
              <Card key={i} className="h-full border-2 hover:shadow-xl hover:border-blue-300/50 dark:hover:border-blue-600/50 transition-all duration-300 group bg-background">
                <CardHeader>
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg group-hover:shadow-xl`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{feature.title}</CardTitle>
                  <CardDescription className="leading-relaxed">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>

      {/* CTA Section */}
      {!session?.user && (
        <div className="relative max-w-4xl mx-auto px-4 py-20 z-10">
          <Card className="border shadow-lg">
            <CardContent className="p-12 text-center">
              <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
                Join thousands of verified students buying and selling on campus. Create your account in seconds.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <Button size="lg" className="h-12 px-8 shadow-lg hover:shadow-xl transition-all bg-blue-500 hover:bg-blue-600 text-white border-0">
                    Create Free Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/browse">
                  <Button variant="outline" size="lg" className="h-12 px-8 border-2 shadow-sm hover:shadow-md transition-all hover:border-blue-400/50 hover:bg-blue-50 dark:hover:bg-blue-950/20">
                    Browse Listings
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Footer */}
      <footer className="relative border-t bg-background mt-20">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="space-y-4">
              <Link href="/" className="flex items-center space-x-2 group">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                  <ShoppingBag className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  UniMarket
                </span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The exclusive marketplace for verified students. Trade with complete trust. Minimal listing fees for sellers.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/browse" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Browse Marketplace
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/chat" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Messages
                  </Link>
                </li>
                <li>
                  <Link href="/wishlist" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Wishlist
                  </Link>
                </li>
              </ul>
            </div>

            {/* For Students */}
            <div>
              <h3 className="font-semibold mb-4">For Students</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/signup" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Create Account
                  </Link>
                </li>
                <li>
                  <Link href="/onboarding" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Verify Student ID
                  </Link>
                </li>
                <li>
                  <Link href="/seller/create" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Sell Items
                  </Link>
                </li>
                <li>
                  <Link href="/seller/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Seller Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Safety Guidelines
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 UniMarket. All rights reserved. Built for students, by students.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                <span>100% Verified</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                <span>Minimal Fees</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>Student Community</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
