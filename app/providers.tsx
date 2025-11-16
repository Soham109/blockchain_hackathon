"use client";
import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from './components/ThemeProvider';
import { WalletProvider } from './components/WalletProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <WalletProvider>
          {children}
          <Toaster />
        </WalletProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
