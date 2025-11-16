"use client";
import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from './components/ThemeProvider';
import { WalletProvider } from './components/WalletProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider 
      refetchInterval={5 * 60} // Refetch session every 5 minutes
      refetchOnWindowFocus={true} // Refetch when window gains focus
    >
      <ThemeProvider>
        <WalletProvider>
          {children}
          <Toaster />
        </WalletProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
