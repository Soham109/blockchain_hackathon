"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, X, Plus, CheckCircle2, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { PaymentModal } from './PaymentModal';

interface ProductBoostProps {
  productId: string;
}

const KEYWORD_PRICE = 0.0005; // ETH per keyword

export function ProductBoost({ productId }: ProductBoostProps) {
  const { toast } = useToast();
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (productId) {
      fetch(`/api/products/${productId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.product) {
            setProduct(data.product);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [productId]);

  const isBoosted = product?.boosted && product?.boostExpiresAt && new Date(product.boostExpiresAt) > new Date();
  const currentKeywords = product?.boostKeywords || [];
  const expiresAt = product?.boostExpiresAt ? new Date(product.boostExpiresAt) : null;
  const daysRemaining = expiresAt ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  function addKeyword() {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim().toLowerCase())) {
      setKeywords([...keywords, newKeyword.trim().toLowerCase()]);
      setNewKeyword('');
    }
  }

  function removeKeyword(keyword: string) {
    setKeywords(keywords.filter(k => k !== keyword));
  }

  const totalCost = (keywords.length * KEYWORD_PRICE).toFixed(4);

  if (loading) {
    return (
      <Card className="border-2 shadow-sm">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-2 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Boost Product
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isBoosted && (
            <div className="p-4 bg-green-500/10 dark:bg-green-500/20 border border-green-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-green-700 dark:text-green-300 mb-1">Product is Currently Boosted</p>
                  {currentKeywords.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs text-muted-foreground mb-1.5">Active Keywords:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {currentKeywords.map((keyword: string) => (
                          <Badge key={keyword} variant="secondary" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {expiresAt && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        Expires in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} ({expiresAt.toLocaleDateString()})
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <div>
            <Label htmlFor="keyword">
              {isBoosted ? 'Add More Keywords' : 'Add Search Keywords'}
            </Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="keyword"
                placeholder="e.g., textbook, calculus, math"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                className="border-2"
              />
              <Button onClick={addKeyword} size="icon" className="cursor-pointer">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {isBoosted && (
              <p className="text-xs text-muted-foreground mt-1.5">
                Adding keywords will extend your boost and add these keywords to your existing boost.
              </p>
            )}
          </div>

          {keywords.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Keywords ({keywords.length})</Label>
              <div className="flex flex-wrap gap-2">
                {keywords.map((keyword) => (
                  <Badge key={keyword} variant="secondary" className="flex items-center gap-1">
                    {keyword}
                    <button
                      onClick={() => removeKeyword(keyword)}
                      className="ml-1 hover:text-destructive cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Total Cost:</span>
              <span className="text-lg font-bold">{totalCost} ETH</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {KEYWORD_PRICE} ETH per keyword × {keywords.length} keyword(s)
            </p>
          </div>

          <Button
            onClick={() => {
              if (keywords.length === 0) {
                toast({
                  title: "No Keywords",
                  description: "Please add at least one keyword to boost",
                  variant: "destructive",
                });
                return;
              }
              setPaymentOpen(true);
            }}
            className="w-full cursor-pointer shadow-sm hover:shadow-md transition-shadow"
            disabled={keywords.length === 0}
          >
            {isBoosted ? 'Add Keywords to Boost' : 'Boost Product'}
          </Button>
        </CardContent>
      </Card>

      <PaymentModal
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        product={{
          _id: productId,
          title: 'Product Boost',
          priceCents: 0,
          sellerId: '',
        }}
        type="boost"
        boostKeywords={keywords}
        boostFee={totalCost}
        onSuccess={() => {
          setKeywords([]);
          // Reload product to show updated boost status
          fetch(`/api/products/${productId}`)
            .then((r) => r.json())
            .then((data) => {
              if (data.product) {
                setProduct(data.product);
              }
            });
          toast({
            title: "Product Boosted!",
            description: "Your product will appear higher in search results for the selected keywords.",
          });
        }}
      />
    </>
  );
}
