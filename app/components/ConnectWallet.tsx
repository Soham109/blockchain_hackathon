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
      <DialogContent className="sm:max-w-md border-2 shadow-2xl bg-white text-black">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-xl font-bold">Connect Wallet</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-2">
            Choose a wallet to connect for payments. You'll need this to make purchases and pay listing fees.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6">
          <Tabs defaultValue="eth" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100">
              <TabsTrigger value="eth" className="cursor-pointer font-medium data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-gray-700">Arbitrum (ETH)</TabsTrigger>
              <TabsTrigger value="sol" className="cursor-pointer font-medium data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-gray-700">Solana (SOL)</TabsTrigger>
            </TabsList>
            <TabsContent value="eth" className="space-y-4 mt-6">
              {isConnected ? (
                <div className="p-5 border-2 rounded-lg bg-white border-green-500/30">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    <p className="text-sm font-semibold text-green-700">
                      Connected to Arbitrum ({connector?.name || 'Wallet'})
                    </p>
                  </div>
                  <div className="mb-4 p-3 rounded-lg bg-white border border-gray-300">
                    <p className="text-xs text-gray-600 mb-1 font-medium">Wallet Address</p>
                    <p className="text-xs text-black break-all font-mono">
                      {address}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => disconnect()} className="w-full cursor-pointer border-2 hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive transition-colors">
                    Disconnect
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {connectors
                    .filter((connector) => {
                      const id = connector.id.toLowerCase();
                      const name = connector.name.toLowerCase();
                      // Show Gemini, MetaMask, and injected wallets
                      return id === 'gemini' || name.includes('metamask') || name.includes('injected') || name.includes('browser');
                    })
                    .sort((a, b) => {
                      // Sort: Gemini first, then MetaMask, then others
                      const aId = a.id.toLowerCase();
                      const bId = b.id.toLowerCase();
                      const aName = a.name.toLowerCase();
                      const bName = b.name.toLowerCase();
                      
                      if (aId === 'gemini') return -1;
                      if (bId === 'gemini') return 1;
                      if (aName.includes('metamask')) return -1;
                      if (bName.includes('metamask')) return 1;
                      return 0;
                    })
                    .map((connector) => {
                      const id = connector.id.toLowerCase();
                      const name = connector.name.toLowerCase();
                      const isGemini = id === 'gemini';
                      const isMetaMask = name.includes('metamask') && !isGemini;
                      const isInjected = name.includes('injected') || name.includes('browser');
                      
                      // Check if Gemini is available via window.ethereum
                      const geminiAvailable = typeof window !== 'undefined' && 
                        window.ethereum && 
                        (window.ethereum.isGemini || window.ethereum.providers?.some((p: any) => p.isGemini));
                      
                      let displayName = 'Browser Wallet';
                      if (isGemini) {
                        displayName = 'Gemini Wallet';
                      } else if (isMetaMask) {
                        displayName = 'MetaMask';
                      } else if (isInjected && geminiAvailable) {
                        displayName = 'Gemini Wallet (Injected)';
                      }
                      
                      return (
                        <Button
                          key={connector.uid}
                          variant="outline"
                          className="w-full justify-start cursor-pointer h-14 border-2 hover:bg-gray-100 hover:border-primary/50 transition-all shadow-sm hover:shadow-md bg-white text-black"
                          onClick={() => connect({ connector })}
                        >
                          <Wallet className="mr-3 h-5 w-5" />
                          <span className="font-medium">{displayName}</span>
                          {isGemini && (
                            <span className="ml-auto text-xs text-muted-foreground">(Production Ready)</span>
                          )}
                          {isMetaMask && (
                            <span className="ml-auto text-xs text-muted-foreground">(Recommended for testing)</span>
                          )}
                        </Button>
                      );
                    })}
                  {connectors.filter((c) => {
                    const id = c.id.toLowerCase();
                    const name = c.name.toLowerCase();
                    return id === 'gemini' || name.includes('metamask') || name.includes('injected') || name.includes('browser');
                  }).length === 0 && (
                    <div className="p-4 border-2 rounded-lg bg-white border-gray-300 text-center">
                      <p className="text-sm text-black mb-2 font-medium">No wallet detected</p>
                      <p className="text-xs text-gray-600">Please install MetaMask or Gemini Wallet extension</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
            <TabsContent value="sol" className="space-y-4 mt-6">
              {publicKey ? (
                <div className="p-5 border-2 rounded-lg bg-white border-green-500/30">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    <p className="text-sm font-semibold text-green-700">Connected to Solana</p>
                  </div>
                  <div className="mb-4 p-3 rounded-lg bg-white border border-gray-300">
                    <p className="text-xs text-gray-600 mb-1 font-medium">Wallet Address</p>
                    <p className="text-xs text-black break-all font-mono">
                      {publicKey.toString()}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => disconnectSolana()} className="w-full cursor-pointer border-2 hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive transition-colors">
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full justify-start cursor-pointer h-14 border-2 hover:bg-accent hover:border-primary/50 transition-all shadow-sm hover:shadow-md bg-white dark:bg-[#0a0a0a]"
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

