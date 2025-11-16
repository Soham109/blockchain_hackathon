"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Transaction, SystemProgram, PublicKey } from '@solana/web3.js';
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
import { sendArbitrumPayment, verifyArbitrumTransaction } from '@/lib/blockchain/arbitrum';
import { sendSolanaPayment, verifySolanaTransaction } from '@/lib/blockchain/solana';
import { convertEthToSol } from '@/lib/blockchain/payment';

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
  const [step, setStep] = useState<'select' | 'processing' | 'verifying' | 'success'>('select');
  const [paymentMethod, setPaymentMethod] = useState<'eth' | 'sol'>('eth');
  const [txHash, setTxHash] = useState<string>('');
  const [solAmount, setSolAmount] = useState<string>('...');
  const { address, isConnected } = useAccount();
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const { toast } = useToast();
  const router = useRouter();

  const amount = useMemo(() => {
    return type === 'listing' 
      ? listingFee || '0.001' // Default 0.001 ETH for listing
      : type === 'boost'
      ? boostFee || (boostKeywords.length * 0.0005).toFixed(4) // 0.0005 ETH per keyword
      : (product.priceCents / 100).toString();
  }, [type, listingFee, boostFee, boostKeywords.length, product.priceCents]);

  // Generate unique payment ID only once when modal opens
  const paymentIdRef = useRef<string>('');
  useEffect(() => {
    if (open && !paymentIdRef.current) {
      paymentIdRef.current = `${type}-${product._id}-${Date.now()}`;
    } else if (!open) {
      // Reset when modal closes
      paymentIdRef.current = '';
      setStep('select');
      setLoading(false);
      setTxHash('');
    }
  }, [open, type, product._id]);

  const paymentId = paymentIdRef.current;

  // Fetch SOL amount when component mounts or amount changes
  useEffect(() => {
    let cancelled = false;
    async function fetchSolAmount() {
      try {
        const sol = await convertEthToSol(amount);
        if (!cancelled) {
          setSolAmount(sol);
        }
      } catch (error) {
        console.error('Failed to convert ETH to SOL:', error);
        if (!cancelled) {
          setSolAmount('Error');
        }
      }
    }
    if (open) {
      fetchSolAmount();
    }
    return () => {
      cancelled = true;
    };
  }, [amount, open]);

  const handlePayment = async () => {
    // Prevent multiple clicks
    if (loading) {
      return;
    }
    
    setLoading(true);
    setStep('processing');

    try {
      let transactionHash: string;

      if (paymentMethod === 'eth') {
        if (!isConnected || !address) {
          toast({
            title: "Wallet Not Connected",
            description: "Please connect your wallet (MetaMask or Gemini) first",
            variant: "destructive",
          });
          setStep('select');
          setLoading(false);
          return;
        }

        toast({
          title: "Processing Payment",
          description: "Please confirm the transaction in your wallet",
        });

        // Send real Arbitrum transaction
        transactionHash = await sendArbitrumPayment({
          from: address,
          amount,
          paymentId,
        });

        setTxHash(transactionHash);
        toast({
          title: "Transaction Sent",
          description: `Transaction hash: ${transactionHash.slice(0, 10)}...`,
        });
      } else {
        // SOL payment via Phantom
        if (!publicKey || !signTransaction) {
          toast({
            title: "Wallet Not Connected",
            description: "Please connect your Phantom wallet first",
            variant: "destructive",
          });
          setStep('select');
          setLoading(false);
          return;
        }

        const calculatedSolAmount = await convertEthToSol(amount);
        toast({
          title: "Processing Payment",
          description: `Sending ${calculatedSolAmount} SOL...`,
        });

        // Send real Solana transaction (conversion happens inside sendSolanaPayment)
        transactionHash = await sendSolanaPayment(
          {
            from: publicKey,
            amountEth: amount,
            paymentId,
          },
          signTransaction,
          connection
        );

        setTxHash(transactionHash);
        toast({
          title: "Transaction Sent",
          description: `Transaction signature: ${transactionHash.slice(0, 10)}...`,
        });
      }

      // Move to verification step
      setStep('verifying');

      // Verify transaction on backend
      const verifyRes = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txHash: transactionHash,
          paymentId,
          productId: product._id,
          amount,
          paymentMethod,
          type,
          boostKeywords: type === 'boost' ? boostKeywords : undefined,
        }),
      });

      if (!verifyRes.ok) {
        throw new Error('Transaction verification failed');
      }

      const verifyData = await verifyRes.json();
      
      if (!verifyData.verified) {
        throw new Error('Transaction not confirmed on blockchain');
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
          txHash: transactionHash,
          boostKeywords: type === 'boost' ? boostKeywords : undefined,
        }),
      });

      if (res.ok) {
        // For listing type, create the product BEFORE showing success
        if (type === 'listing' && onSuccess) {
          try {
            // Create product first
            const productId = await onSuccess();
            
            if (!productId) {
              throw new Error('Product creation returned no ID');
            }
            
            // Small delay to ensure product is saved
            await new Promise(resolve => setTimeout(resolve, 500));
            
            setStep('success');
            toast({
              title: "Success!",
              description: "Payment confirmed and listing created successfully!",
            });
            
            // Redirect to seller dashboard after successful creation
            setTimeout(() => {
              onOpenChange(false);
              router.push('/seller/dashboard');
            }, 2000);
          } catch (error: any) {
            console.error('Error creating product after payment:', error);
            setStep('select');
            toast({
              title: "Product Creation Failed",
              description: error.message || "Payment was successful but product creation failed. Please try creating the listing again.",
              variant: "destructive",
            });
            // Don't redirect - let user try again
            return;
          }
        } else {
          // For purchase and boost, show success immediately
          setStep('success');
          toast({
            title: "Payment Successful!",
            description: type === 'boost' ? "Product boosted successfully!" : "Payment confirmed.",
          });
          
          // Redirect to payment success page
          setTimeout(() => {
            onOpenChange(false);
            const params = new URLSearchParams({
              txHash: transactionHash,
              amount: amount,
              paymentMethod: paymentMethod,
              type: type,
            });
            
            // Add product title if available
            if (product.title) {
              params.set('productTitle', product.title);
            }
            
            router.push(`/payment-success?${params.toString()}`);
          }, 1500);
        }
      } else {
        throw new Error('Payment confirmation failed');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      
      // Parse error message for user-friendly display
      let errorTitle = "Payment Failed";
      let errorDescription = error.message || "Please try again";
      
      // Handle specific error types
      if (error.message?.includes('rejected') || error.message?.includes('User rejected')) {
        errorTitle = "Transaction Rejected";
        errorDescription = "You rejected the transaction in MetaMask. Please try again and click 'Confirm' when prompted.";
      } else if (error.message?.includes('not been authorized') || error.message?.includes('authorized')) {
        errorTitle = "Transaction Not Approved";
        errorDescription = "Please approve the transaction in MetaMask. Make sure you click 'Confirm' when MetaMask prompts you.";
      } else if (error.message?.includes('insufficient funds')) {
        errorTitle = "Insufficient Funds";
        errorDescription = "You don't have enough ETH in your wallet. Please add more funds and try again.";
      } else if (error.message?.includes('Wallet not found') || error.message?.includes('not connected')) {
        errorTitle = "Wallet Not Connected";
        errorDescription = "Please connect your wallet (MetaMask) and try again.";
      } else if (error.message?.includes('network')) {
        errorTitle = "Network Error";
        errorDescription = "There was a network issue. Please check your connection and try again.";
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive",
        duration: 5000, // Show for 5 seconds
      });
      setStep('select');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background border-2 shadow-2xl text-foreground" style={{ backgroundColor: 'hsl(var(--background))' }}>
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
                <div className="p-4 border-2 rounded-lg bg-muted">
                  <div className="flex items-center gap-2 mb-3">
                    <Wallet className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Arbitrum Network (Local)</span>
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
                      Please connect your wallet (MetaMask or Gemini) to continue
                    </div>
                  )}
                  <div className="mt-4 p-3 bg-background rounded-lg border">
                    <div className="text-xs text-muted-foreground mb-1">Amount</div>
                    <div className="text-2xl font-bold">{amount} ETH</div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="sol" className="space-y-4">
                <div className="p-4 border-2 rounded-lg bg-muted">
                  <div className="flex items-center gap-2 mb-3">
                    <Wallet className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Solana Network (Local)</span>
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
                    <div className="text-2xl font-bold">{solAmount} SOL</div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handlePayment} 
                disabled={loading || (paymentMethod === 'eth' && !isConnected) || (paymentMethod === 'sol' && !publicKey)}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Pay {paymentMethod === 'eth' ? `${amount} ETH` : `${solAmount} SOL`}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'processing' && (
          <div className="py-8 text-center">
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin" />
            <p className="text-lg font-medium">Processing payment...</p>
            <p className="text-sm text-muted-foreground mt-2">Please confirm in your wallet</p>
          </div>
        )}

        {step === 'verifying' && (
          <div className="py-8 text-center">
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin" />
            <p className="text-lg font-medium">Verifying transaction...</p>
            <p className="text-xs text-muted-foreground mt-2 font-mono break-all">{txHash}</p>
          </div>
        )}

        {step === 'success' && (
          <div className="py-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-medium">Payment Successful!</p>
            <p className="text-sm text-muted-foreground mt-2">
              {type === 'boost' ? 'Your product has been boosted!' : 'Your order has been confirmed'}
            </p>
            {txHash && (
              <p className="text-xs text-muted-foreground mt-4 font-mono break-all">
                TX: {txHash.slice(0, 20)}...
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
