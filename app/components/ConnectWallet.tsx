"use client";
import React, { useRef, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function ConnectWallet() {
  const { address, isConnected, connector } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { publicKey, disconnect: disconnectSolana, connecting, select, connect: connectSolana, wallets, wallet } = useWallet();
  const publicKeyRef = useRef(publicKey);
  
  // Update ref when publicKey changes
  useEffect(() => {
    publicKeyRef.current = publicKey;
  }, [publicKey]);
  
  const handleConnectSolana = async () => {
    const wasConnected = !!publicKeyRef.current;
    
    try {
      // Find Phantom wallet adapter
      const phantomWallet = wallets.find(w => w.adapter.name === 'Phantom');
      
      if (!phantomWallet) {
        alert('Phantom wallet not found. Please install the Phantom extension.');
        return;
      }

      // If Phantom is already selected and connected, do nothing
      if (wallet?.adapter.name === 'Phantom' && publicKey) {
        return;
      }

      // Select Phantom wallet first - this is critical
      if (wallet?.adapter.name !== 'Phantom') {
        select('Phantom');
        // Wait longer for selection to complete
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Use the adapter's connect method directly to avoid hook issues
      const adapter = phantomWallet.adapter;
      
      // Check if adapter is already connected
      if (adapter.connected) {
        return;
      }

      // Connect using the adapter directly
      if (!adapter.connected) {
        await adapter.connect();
      }
    } catch (error: any) {
      // Wait a bit to see if connection actually succeeded despite the error
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // If user rejected, don't show error
      if (error.message?.includes('User rejected') || error.message?.includes('rejected') || error.message?.includes('User cancelled')) {
        return;
      }
      
      // Check if we're actually connected now (connection might have succeeded despite error)
      const isConnectedNow = !!publicKeyRef.current;
      
      // Only show error if we're definitely not connected AND we weren't connected before
      if (!isConnectedNow && !wasConnected) {
        // Real failure - show error
        console.error('Phantom connection failed:', error);
        // Don't show alert - just log it, the UI will show the connection state
      } else {
        // Connection succeeded despite the error - this is common with wallet adapters
        // Silently succeed
      }
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="cursor-pointer">
          <Wallet className="mr-2 h-4 w-4" />
          {isConnected || publicKey ? 'Wallet Connected' : 'Connect Wallet'}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-background border-2 shadow-2xl text-foreground max-w-md" style={{ backgroundColor: 'hsl(var(--background))' }}>
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-bold text-center">Connect Wallet</DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Choose a wallet to connect for payments. You'll need this to make purchases and pay listing fees.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <Tabs defaultValue="eth" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="eth" className="cursor-pointer font-medium">Arbitrum (ETH)</TabsTrigger>
              <TabsTrigger value="sol" className="cursor-pointer font-medium">Solana (SOL)</TabsTrigger>
            </TabsList>
            <TabsContent value="eth" className="space-y-3 mt-4">
              {isConnected ? (
                <div className="p-5 border-2 rounded-xl bg-muted border-green-500/50">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                      Connected to Arbitrum ({connector?.name || 'Wallet'})
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4 break-all font-mono bg-background p-3 rounded-lg border-2">
                    {address}
                  </p>
                  <Button variant="outline" size="sm" onClick={() => disconnect()} className="w-full cursor-pointer border-2">
                    Disconnect
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {connectors
                    .filter((connector) => {
                      const name = connector.name.toLowerCase();
                      // Show MetaMask first, then injected wallets (Gemini)
                      return name.includes('metamask') || name.includes('injected') || name.includes('browser');
                    })
                    .map((connector) => {
                      const name = connector.name.toLowerCase();
                      const isMetaMask = name.includes('metamask');
                      const isGemini = typeof window !== 'undefined' && 
                        window.ethereum && 
                        (window.ethereum.isGemini || window.ethereum.providers?.some((p: any) => p.isGemini));
                      
                      let displayName = 'Browser Wallet';
                      if (isMetaMask) {
                        displayName = 'MetaMask';
                      } else if (isGemini) {
                        displayName = 'Gemini Wallet';
                      }
                      
                      return (
                        <Button
                          key={connector.uid}
                          variant="outline"
                          className="w-full justify-start cursor-pointer h-14 border-2 hover:bg-accent hover:border-primary transition-all shadow-sm hover:shadow-md"
                          onClick={() => connect({ connector })}
                        >
                          <Wallet className="mr-3 h-5 w-5" />
                          <span className="font-medium">{displayName}</span>
                          {isMetaMask && (
                            <span className="ml-auto text-xs text-muted-foreground">(Recommended for testing)</span>
                          )}
                        </Button>
                      );
                    })}
                  {connectors.filter((c) => {
                    const name = c.name.toLowerCase();
                    return name.includes('metamask') || name.includes('injected') || name.includes('browser');
                  }).length === 0 && (
                    <div className="p-4 border-2 rounded-lg bg-muted text-center">
                      <p className="text-sm text-muted-foreground mb-2">No wallet detected</p>
                      <p className="text-xs text-muted-foreground">Please install MetaMask or Gemini Wallet extension</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
            <TabsContent value="sol" className="space-y-3 mt-4">
              {publicKey ? (
                <div className="p-5 border-2 rounded-xl bg-muted border-green-500/50">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">Connected to Solana</p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4 break-all font-mono bg-background p-3 rounded-lg border-2">
                    {publicKey.toString()}
                  </p>
                  <Button variant="outline" size="sm" onClick={() => disconnectSolana()} className="w-full cursor-pointer border-2">
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full justify-start cursor-pointer h-14 border-2 hover:bg-accent hover:border-primary/50 transition-all shadow-sm hover:shadow-md"
                  onClick={handleConnectSolana}
                  disabled={connecting}
                >
                  <Wallet className="mr-3 h-5 w-5" />
                  <span className="font-medium">{connecting ? 'Connecting...' : 'Connect Phantom'}</span>
                </Button>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

