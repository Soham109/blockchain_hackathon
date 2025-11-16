"use client";
import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Package, Plus, Eye, Edit, Trash2, TrendingUp, DollarSign, CreditCard, Wallet, Calendar, ExternalLink, ArrowDownCircle, CheckCircle2, Copy } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function SellerDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const { address: ethAddress, isConnected: isEthConnected } = useAccount();
  const { publicKey: solPublicKey } = useWallet();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, totalValue: 0 });
  const [financials, setFinancials] = useState<any>(null);
  const [earnings, setEarnings] = useState<any>(null);
  const [claiming, setClaiming] = useState(false);
  const [sellerOrders, setSellerOrders] = useState<any[]>([]);
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [claimMethod, setClaimMethod] = useState<'eth' | 'sol' | null>(null);
  const [walletAddress, setWalletAddress] = useState('');

  useEffect(() => {
    if (!session?.user) {
      router.push('/auth/signin');
      return;
    }
    loadProducts();
    loadFinancials();
    loadEarnings();
    loadSellerOrders();
  }, [session]);

  async function loadFinancials() {
    try {
      const res = await fetch('/api/seller/financials');
      if (res.ok) {
        const data = await res.json();
        setFinancials(data);
      }
    } catch (error) {
      console.error('Failed to load financials', error);
    }
  }

  async function loadEarnings() {
    try {
      const res = await fetch('/api/seller/earnings');
      if (res.ok) {
        const data = await res.json();
        setEarnings(data);
      }
    } catch (error) {
      console.error('Failed to load earnings', error);
    }
  }

  async function loadSellerOrders() {
    try {
      const res = await fetch('/api/seller/orders');
      if (res.ok) {
        const data = await res.json();
        setSellerOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Failed to load seller orders', error);
    }
  }

  function openClaimDialog(paymentMethod: 'eth' | 'sol') {
    setClaimMethod(paymentMethod);
    // Auto-fill wallet address from connected wallet
    if (paymentMethod === 'eth' && isEthConnected && ethAddress) {
      setWalletAddress(ethAddress);
    } else if (paymentMethod === 'sol' && solPublicKey) {
      setWalletAddress(solPublicKey.toString());
    } else {
      setWalletAddress('');
    }
    setClaimDialogOpen(true);
  }

  async function handleClaim() {
    if (!claimMethod || !walletAddress.trim()) {
      toast({
        title: "Error",
        description: "Please enter a wallet address",
        variant: "destructive",
      });
      return;
    }

    setClaiming(true);
    try {
      const res = await fetch('/api/seller/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: claimMethod,
          walletAddress: walletAddress.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast({
          title: "Success! 🎉",
          description: `Successfully claimed ${data.amount} ${claimMethod.toUpperCase()}. Funds will be sent to your wallet.`,
        });
        setClaimDialogOpen(false);
        setWalletAddress('');
        setClaimMethod(null);
        loadEarnings();
        loadFinancials();
        loadSellerOrders();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to claim earnings",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to claim earnings",
        variant: "destructive",
      });
    } finally {
      setClaiming(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Address copied to clipboard",
    });
  }

  async function loadProducts() {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      const products = (data.items || []).filter((p: any) => 
        p.sellerEmail === (session?.user as any)?.email || p.sellerId === (session?.user as any)?.id
      );
      setItems(products);
      
      const totalValue = products.reduce((sum: number, p: any) => 
        sum + (p.priceCents || 0), 0
      );
      setStats({ total: products.length, totalValue });
      setLoading(false);
    } catch (error) {
      console.error('Failed to load products', error);
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({
          title: "Success",
          description: "Listing deleted successfully",
        });
        loadProducts();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete listing",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete listing",
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
        <div className="text-muted-foreground">Loading your listings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-12 px-4 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 pt-4">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold mb-3 tracking-tight">
              <span className="text-blue-500 dark:text-cyan-400">Seller</span>{' '}
              <span>Dashboard</span>
            </h1>
            <p className="text-muted-foreground text-xl">Manage your listings and track performance</p>
          </div>
          <Link href="/seller/create">
            <Button>
              <Plus size={16} className="mr-2" />
              New Listing
            </Button>
          </Link>
        </div>

        {/* Earnings & Claim Section - Professional */}
        {earnings && (
          <div className="mb-8">
            <Card className="border-2 shadow-lg mb-6">
              <CardHeader className="pb-4 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold mb-1">Earnings</CardTitle>
                    <p className="text-sm text-muted-foreground">Track and withdraw your sales revenue</p>
                  </div>
                  {earnings.unclaimedAmount > 0 && (
                    <Badge variant="secondary" className="text-base px-3 py-1.5">
                      {earnings.unclaimedAmount.toFixed(6)} Available
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {/* Earnings Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-lg border bg-card">
                    <p className="text-sm text-muted-foreground mb-2">Total Earnings</p>
                    <p className="text-2xl font-bold">{earnings.totalEarnings.toFixed(6)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{earnings.totalOrders} orders</p>
                  </div>
                  <div className="p-4 rounded-lg border bg-card">
                    <p className="text-sm text-muted-foreground mb-2">Claimed</p>
                    <p className="text-2xl font-bold text-primary">{earnings.claimedAmount.toFixed(6)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{earnings.claimedOrders} orders</p>
                  </div>
                  <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
                    <p className="text-sm font-medium mb-2">Unclaimed</p>
                    <p className="text-2xl font-bold text-primary">{earnings.unclaimedAmount.toFixed(6)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{earnings.unclaimedOrders} orders</p>
                  </div>
                </div>

                {/* Claim Buttons */}
                {earnings.unclaimedAmount > 0 && (
                  <div className="space-y-4">
                    {earnings.breakdown.eth.unclaimed > 0 && earnings.breakdown.sol.unclaimed > 0 && (
                      <div className="p-3 rounded-lg bg-muted/50 border border-primary/20">
                        <p className="text-sm text-muted-foreground">
                          💡 You have earnings in both ETH and SOL. Claim each separately using the buttons below.
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {earnings.breakdown.eth.unclaimed > 0 && (
                        <Card className="border-2">
                          <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <p className="font-semibold mb-1">Ethereum (ETH)</p>
                                <p className="text-2xl font-bold">{earnings.breakdown.eth.unclaimed.toFixed(6)} ETH</p>
                                <p className="text-xs text-muted-foreground mt-1">{earnings.breakdown.eth.orders} order{earnings.breakdown.eth.orders !== 1 ? 's' : ''} ready to claim</p>
                              </div>
                              {isEthConnected && (
                                <Badge variant="outline" className="border-green-500/30 text-green-600 dark:text-green-400">
                                  Connected
                                </Badge>
                              )}
                            </div>
                            <Button
                              className="w-full"
                              onClick={() => openClaimDialog('eth')}
                              disabled={claiming}
                            >
                              <ArrowDownCircle className="h-4 w-4 mr-2" />
                              {claiming ? 'Claiming...' : 'Claim ETH'}
                            </Button>
                            <p className="text-xs text-muted-foreground mt-2 text-center">
                              Only ETH orders will be claimed
                            </p>
                          </CardContent>
                        </Card>
                      )}
                      {earnings.breakdown.sol.unclaimed > 0 && (
                        <Card className="border-2">
                          <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <p className="font-semibold mb-1">Solana (SOL)</p>
                                <p className="text-2xl font-bold">{earnings.breakdown.sol.unclaimed.toFixed(6)} SOL</p>
                                <p className="text-xs text-muted-foreground mt-1">{earnings.breakdown.sol.orders} order{earnings.breakdown.sol.orders !== 1 ? 's' : ''} ready to claim</p>
                              </div>
                              {solPublicKey && (
                                <Badge variant="outline" className="border-green-500/30 text-green-600 dark:text-green-400">
                                  Connected
                                </Badge>
                              )}
                            </div>
                            <Button
                              className="w-full"
                              onClick={() => openClaimDialog('sol')}
                              disabled={claiming}
                            >
                              <ArrowDownCircle className="h-4 w-4 mr-2" />
                              {claiming ? 'Claiming...' : 'Claim SOL'}
                            </Button>
                            <p className="text-xs text-muted-foreground mt-2 text-center">
                              Only SOL orders will be claimed
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                )}

                {earnings.unclaimedAmount === 0 && (
                  <div className="text-center py-6 border rounded-lg bg-muted/50">
                    <CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="font-medium mb-1">All earnings claimed</p>
                    <p className="text-sm text-muted-foreground">No pending earnings to withdraw</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Claim Dialog */}
            <Dialog open={claimDialogOpen} onOpenChange={setClaimDialogOpen}>
              <DialogContent className="sm:max-w-md bg-white text-black border-2 shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Claim {claimMethod?.toUpperCase()} Earnings
                  </DialogTitle>
                  <DialogDescription>
                    Enter your {claimMethod?.toUpperCase()} wallet address to receive your earnings. The funds will be sent from the platform wallet to your address.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="wallet-address">Wallet Address</Label>
                    <div className="flex gap-2">
                      <Input
                        id="wallet-address"
                        value={walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value)}
                        placeholder={claimMethod === 'eth' ? '0x...' : 'Enter Solana address...'}
                        className="font-mono text-sm"
                      />
                      {walletAddress && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(walletAddress)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {claimMethod === 'eth' && isEthConnected && ethAddress && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        Using connected wallet: {ethAddress.substring(0, 6)}...{ethAddress.substring(38)}
                      </p>
                    )}
                    {claimMethod === 'sol' && solPublicKey && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        Using connected wallet: {solPublicKey.toString().substring(0, 6)}...{solPublicKey.toString().substring(38)}
                      </p>
                    )}
                  </div>
                  <div className="p-3 rounded-lg bg-white border border-gray-300">
                    <p className="text-sm font-semibold mb-1">Amount to Claim:</p>
                    <p className="text-2xl font-bold">
                      {claimMethod === 'eth' 
                        ? earnings?.breakdown.eth.unclaimed.toFixed(6) || '0'
                        : earnings?.breakdown.sol.unclaimed.toFixed(6) || '0'
                      } {claimMethod?.toUpperCase()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      From {claimMethod === 'eth' ? earnings?.breakdown.eth.orders : earnings?.breakdown.sol.orders} order{((claimMethod === 'eth' ? earnings?.breakdown.eth.orders : earnings?.breakdown.sol.orders) || 0) !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleClaim}
                    disabled={claiming || !walletAddress.trim()}
                    size="lg"
                  >
                    {claiming ? (
                      <>Processing Claim...</>
                    ) : (
                      <>
                        <ArrowDownCircle className="h-4 w-4 mr-2" />
                        Claim {claimMethod?.toUpperCase()}
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Financial Overview - Compact */}
        {financials && (
          <div className="mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <Card className="border-2 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold">${financials.totalRevenue.toFixed(2)}</p>
                </CardContent>
              </Card>
              <Card className="border-2 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Total Sales</p>
                  <p className="text-2xl font-bold">{financials.totalSales}</p>
                </CardContent>
              </Card>
              <Card className="border-2 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">30-Day Revenue</p>
                  <p className="text-2xl font-bold">${financials.recentRevenue.toFixed(2)}</p>
                </CardContent>
              </Card>
              <Card className="border-2 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Active Listings</p>
                  <p className="text-2xl font-bold">{financials.activeListings}</p>
                </CardContent>
              </Card>
            </div>

            {/* Payment Method Breakdown - Compact */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Card className="border-2 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-semibold">ETH Revenue</span>
                  </div>
                  <p className="text-xl font-bold">${financials.ethRevenue.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{financials.ethSales} sales</p>
                </CardContent>
              </Card>
              <Card className="border-2 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-semibold">SOL Revenue</span>
                  </div>
                  <p className="text-xl font-bold">${financials.solRevenue.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{financials.solSales} sales</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Sales - Compact */}
            {financials.recentSales && financials.recentSales.length > 0 && (
              <Card className="border-2 shadow-sm mb-4">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold mb-3">Recent Sales (Last 30 Days)</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {financials.recentSales.map((sale: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted transition-colors text-sm">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{sale.productTitle}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>{new Date(sale.createdAt).toLocaleDateString()}</span>
                            <Badge variant="secondary" className="text-xs px-1.5 py-0">
                              {sale.paymentMethod?.toUpperCase() || 'N/A'}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right ml-2">
                          <p className="font-bold">${sale.amount.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Orders Section - Who Bought What */}
        {sellerOrders.length > 0 && (
          <Card className="border-2 shadow-sm mb-6">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-4">📦 Sales History</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {sellerOrders.map((order: any) => (
                  <div key={String(order._id)} className="p-3 border rounded-lg hover:bg-muted transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">{order.productTitle}</p>
                          <Badge variant={order.claimed ? "default" : "secondary"} className="text-xs">
                            {order.claimed ? "Claimed" : "Unclaimed"}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>👤 Buyer: {order.buyerEmail || 'Unknown'}</p>
                          <p>💰 Amount: {parseFloat(order.amount || '0').toFixed(6)} {order.paymentMethod?.toUpperCase() || 'N/A'}</p>
                          <p>📅 Sold: {new Date(order.createdAt).toLocaleDateString()}</p>
                          {order.claimed && order.claimedAt && (
                            <p className="text-green-600 dark:text-green-400">✅ Claimed: {new Date(order.claimedAt).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={order.paymentMethod === 'eth' ? 'bg-blue-500' : 'bg-purple-500'}>
                          {order.paymentMethod?.toUpperCase() || 'N/A'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Listings Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold">Your Listings</h2>
            <div className="flex gap-2 text-sm">
              <span className="text-muted-foreground">Total: {stats.total}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">Active: {items.filter(i => i.status !== 'sold').length}</span>
            </div>
          </div>

          {/* Products List - Compact */}
        {items.length > 0 ? (
          <div className="space-y-2">
            {items.map(item => (
              <Card key={item._id} className="border-2 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-muted rounded-lg border flex items-center justify-center flex-shrink-0">
                      {item.images && item.images.length > 0 ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={item.images[0]} 
                          alt={item.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Package size={20} className="text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{item.title}</h3>
                        {item.status && (
                          <Badge className={item.status === 'sold' ? 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30 text-xs' : 'text-xs'}>
                            {item.status}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mb-1">{item.description}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">${(item.priceCents / 100).toFixed(2)}</span>
                        <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Link href={`/products/${item._id}`}>
                        <Button variant="outline" size="sm" className="h-8 px-2">
                          <Eye size={14} />
                        </Button>
                      </Link>
                      {item.status !== 'sold' && (
                        <>
                          <Link href={`/products/${item._id}/edit`}>
                            <Button variant="outline" size="sm" className="h-8 px-2">
                              <Edit size={14} />
                            </Button>
                          </Link>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(item._id)}
                            className="h-8 px-2"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Package size={64} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-xl mb-4">No listings yet</p>
              <Link href="/seller/create">
                <Button>
                  <Plus size={16} className="mr-2" />
                  Create Your First Listing
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </div>
  );
}
