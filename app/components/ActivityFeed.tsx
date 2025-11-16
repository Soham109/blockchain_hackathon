"use client";
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Package, MessageCircle, Heart, CreditCard, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export function ActivityFeed() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadActivities() {
      try {
        const res = await fetch('/api/activity');
        const data = await res.json();
        if (res.ok) {
          setActivities(data.activities || []);
        }
      } catch (err) {
        console.error('Failed to load activities', err);
      } finally {
        setLoading(false);
      }
    }
    loadActivities();
  }, []);

  function getActivityIcon(type: string) {
    switch (type) {
      case 'product_created':
        return <Package className="h-4 w-4" />;
      case 'message':
        return <MessageCircle className="h-4 w-4" />;
      case 'wishlist':
        return <Heart className="h-4 w-4" />;
      case 'order':
        return <CreditCard className="h-4 w-4" />;
      case 'user_joined':
        return <User className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.length > 0 ? (
          activities.map((activity) => (
            <div key={activity._id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{activity.title}</p>
                {activity.description && (
                  <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                </p>
              </div>
              {activity.link && (
                <Link href={activity.link}>
                  <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                    View
                  </Badge>
                </Link>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            No recent activity
          </p>
        )}
      </CardContent>
    </Card>
  );
}

