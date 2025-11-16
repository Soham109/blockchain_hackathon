"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bell, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useSession } from 'next-auth/react';

interface PriceAlertProps {
  productId: string;
  currentPrice: number;
  productTitle: string;
}

export function PriceAlert({ productId, currentPrice, productTitle }: PriceAlertProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [targetPrice, setTargetPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);

  React.useEffect(() => {
    if (session?.user) {
      loadAlerts();
    }
  }, [session, productId]);

  async function loadAlerts() {
    try {
      const res = await fetch(`/api/price-alerts?productId=${productId}`);
      const data = await res.json();
      if (res.ok) {
        setAlerts(data.alerts || []);
      }
    } catch (err) {
      console.error('Failed to load alerts', err);
    }
  }

  async function createAlert() {
    if (!targetPrice || Number(targetPrice) >= currentPrice) {
      toast({
        title: "Invalid Price",
        description: "Target price must be less than current price",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/price-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          targetPrice: Number(targetPrice),
        }),
      });

      if (res.ok) {
        toast({
          title: "Alert Created",
          description: "We'll notify you when the price drops!",
        });
        setTargetPrice('');
        loadAlerts();
      } else {
        throw new Error('Failed to create alert');
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to create alert",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function deleteAlert(alertId: string) {
    try {
      await fetch(`/api/price-alerts/${alertId}`, { method: 'DELETE' });
      toast({
        title: "Alert Removed",
      });
      loadAlerts();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to remove alert",
        variant: "destructive",
      });
    }
  }

  if (!session?.user) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Price Alert
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            Current price: <span className="font-semibold">${currentPrice.toFixed(2)}</span>
          </p>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Target price"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              className="flex-1"
            />
            <Button onClick={createAlert} disabled={loading} className="cursor-pointer">
              Set Alert
            </Button>
          </div>
        </div>

        {alerts.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Active Alerts:</p>
            {alerts.map((alert) => (
              <div key={alert._id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                <span className="text-sm">
                  Alert when price drops to ${alert.targetPrice.toFixed(2)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteAlert(alert._id)}
                  className="h-6 w-6 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

