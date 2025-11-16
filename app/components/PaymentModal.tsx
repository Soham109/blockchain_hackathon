"use client";
import React, { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Wallet, CheckCircle2, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
// import { formatEther, parseEther } from 'viem';

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    _id: string;
    title: string;
    priceCents: number;
    sellerId: string;
  };
  onSuccess?: () => void;
  type?: 'purchase' | 'listing' | 'boost';
  listingFee?: string;
  boostKeywords?: string[];
  boostFee?: string;
}

export function PaymentModal({
  open,
  onOpenChange,
  product,
  onSuccess,
  type = 'purchase',
  listingFee,
  boostKeywords = [],
  boostFee,
}: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'select' | 'processing' | 'success'>('select');
  const [paymentMethod, setPaymentMethod] = useState<'eth' | 'sol'>('eth');
  const { address, isConnected } = useAccount();
  const { publicKey, connect, disconnect } = useWallet();
  const { toast } = useToast();

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const amount = type === 'listing' 
    ? listingFee || '0.001' // Default 0.001 ETH for listing
    : type === 'boost'
    ? boostFee || (boostKeywords.length * 0.0005).toFixed(4) // 0.0005 ETH per keyword
    : (product.priceCents / 100).toString();

  async function handlePayment() {
    setLoading(true);
    setStep('processing');

    try {
      if (paymentMethod === 'eth') {
        if (!isConnected) {
          toast({
            title: "Wallet Not Connected",
            description: "Please connect your wallet first",
            variant: "destructive",
          });
          setStep('select');
          setLoading(false);
          return;
        }

        // For Arbitrum, we'd use writeContract with the payment contract
        // This is a simplified version - you'd need to deploy a payment contract
        toast({
          title: "Payment Processing",
          description: "Please confirm the transaction in your wallet",
        });

        // Simulate payment - in production, call your payment contract
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        // SOL payment via Phantom
        if (!publicKey) {
          await connect();
          toast({
            title: "Connecting Wallet",
            description: "Please approve the connection",
          });
          return;
        }

        // Calculate SOL equivalent (simplified - you'd fetch real-time rate)
        const ethToSolRate = 0.00004; // Approximate, should fetch from API
        const solAmount = (parseFloat(amount) * ethToSolRate).toFixed(6);

        toast({
          title: "Payment Processing",
          description: `Sending ${solAmount} SOL...`,
        });

        // In production, use @solana/web3.js to send transaction
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Confirm payment on backend
      const res = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product._id,
          amount,
          paymentMethod,
          type,
          boostKeywords: type === 'boost' ? boostKeywords : undefined,
        }),
      });

      if (res.ok) {
        setStep('success');
        toast({
          title: "Payment Successful!",
          description: type === 'boost' ? "Product boosted successfully!" : "Payment confirmed.",
        });
        setTimeout(() => {
          onOpenChange(false);
          setStep('select');
          onSuccess?.();
        }, 2000);
      } else {
        throw new Error('Payment confirmation failed');
      }
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
      setStep('select');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-background border-2 shadow-2xl text-foreground">
        {step === 'select' && (
          <>
            <DialogHeader>
              <DialogTitle>
                {type === 'listing' ? 'Pay Listing Fee' : type === 'boost' ? 'Boost Product' : 'Complete Purchase'}
              </DialogTitle>
              <DialogDescription>
                {type === 'listing' && `Pay ${amount} ETH to list your product`}
                {type === 'boost' && `Pay ${amount} ETH to boost for ${boostKeywords.length} keyword(s)`}
                {type === 'purchase' && `${product.title} - ${amount} ETH`}
              </DialogDescription>
            </DialogHeader>
            <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'eth' | 'sol')} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="eth" className="cursor-pointer">Arbitrum (ETH)</TabsTrigger>
                <TabsTrigger value="sol" className="cursor-pointer">Solana (SOL)</TabsTrigger>
              </TabsList>
                      <TabsContent value="eth" className="space-y-4">
                        <div className="p-4 border-2 rounded-lg bg-muted/30">
                          <div className="flex items-center gap-2 mb-3">
                            <Wallet className="h-5 w-5 text-primary" />
                            <span className="font-semibold">Arbitrum Network</span>
                          </div>
                          {isConnected ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                <span className="text-sm font-medium">Wallet Connected</span>
                              </div>
                              <div className="text-xs text-muted-foreground font-mono bg-background p-2 rounded border">
                                {address?.slice(0, 8)}...{address?.slice(-6)}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground bg-background p-3 rounded border">
                              Please connect your wallet to continue
                            </div>
                          )}
                          <div className="mt-4 p-3 bg-background rounded-lg border">
                            <div className="text-xs text-muted-foreground mb-1">Amount</div>
                            <div className="text-2xl font-bold">{amount} ETH</div>
                          </div>
                        </div>
                      </TabsContent>
                      <TabsContent value="sol" className="space-y-4">
                        <div className="p-4 border-2 rounded-lg bg-muted/30">
                          <div className="flex items-center gap-2 mb-3">
                            <Wallet className="h-5 w-5 text-primary" />
                            <span className="font-semibold">Solana Network</span>
                          </div>
                          {publicKey ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                <span className="text-sm font-medium">Phantom Connected</span>
                              </div>
                              <div className="text-xs text-muted-foreground font-mono bg-background p-2 rounded border">
                                {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-6)}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground bg-background p-3 rounded border">
                              Connect Phantom wallet to continue
                            </div>
                          )}
                          <div className="mt-4 p-3 bg-background rounded-lg border">
                            <div className="text-xs text-muted-foreground mb-1">Amount</div>
                            <div className="text-2xl font-bold">
                              {(parseFloat(amount) * 0.00004).toFixed(6)} SOL
                            </div>
                          </div>
                        </div>
                      </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handlePayment} disabled={loading || (paymentMethod === 'eth' && !isConnected) || (paymentMethod === 'sol' && !publicKey)}>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay {amount} {paymentMethod === 'eth' ? 'ETH' : 'SOL'}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'processing' && (
          <div className="py-8 text-center">
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin" />
            <p className="text-lg font-medium">Processing payment...</p>
            <p className="text-sm text-muted-foreground mt-2">Please wait</p>
          </div>
        )}

        {step === 'success' && (
          <div className="py-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-medium">Payment Successful!</p>
            <p className="text-sm text-muted-foreground mt-2">
              {type === 'boost' ? 'Your product has been boosted!' : 'Your order has been confirmed'}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
