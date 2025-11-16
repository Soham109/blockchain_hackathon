"use client";
import React from 'react';
import Link from 'next/link';
import { ShoppingBag, Mail, Github, Twitter, Linkedin, ShieldCheck, Zap, Users } from 'lucide-react';

export function Footer() {
  return (
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
              The exclusive marketplace for verified students. Trade with complete trust and zero fees.
            </p>
            <div className="flex gap-3">
              <a href="#" className="h-9 w-9 rounded-lg border flex items-center justify-center hover:bg-accent transition-colors">
                <Twitter className="h-4 w-4 text-muted-foreground" />
              </a>
              <a href="#" className="h-9 w-9 rounded-lg border flex items-center justify-center hover:bg-accent transition-colors">
                <Github className="h-4 w-4 text-muted-foreground" />
              </a>
              <a href="#" className="h-9 w-9 rounded-lg border flex items-center justify-center hover:bg-accent transition-colors">
                <Linkedin className="h-4 w-4 text-muted-foreground" />
              </a>
            </div>
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
              <span>Zero Fees</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>Student Community</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

