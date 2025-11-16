"use client";
import React from 'react';
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
  const { publicKey, connect: connectSolana, disconnect: disconnectSolana, connecting } = useWallet();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="cursor-pointer">
          <Wallet className="mr-2 h-4 w-4" />
          {isConnected || publicKey ? 'Wallet Connected' : 'Connect Wallet'}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-background border-2 shadow-2xl text-foreground max-w-md">
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
                <div className="p-5 border-2 rounded-xl bg-muted/30 border-green-500/30">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">Connected to Arbitrum</p>
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
                  {connectors.map((connector) => (
                    <Button
                      key={connector.uid}
                      variant="outline"
                      className="w-full justify-start cursor-pointer h-14 border-2 hover:bg-accent hover:border-primary/50 transition-all shadow-sm hover:shadow-md"
                      onClick={() => connect({ connector })}
                    >
                      <Wallet className="mr-3 h-5 w-5" />
                      <span className="font-medium">{connector.name}</span>
                    </Button>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="sol" className="space-y-3 mt-4">
              {publicKey ? (
                <div className="p-5 border-2 rounded-xl bg-muted/30 border-green-500/30">
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
                  onClick={() => connectSolana()}
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

