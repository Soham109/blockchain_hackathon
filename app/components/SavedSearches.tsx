"use client";
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { useSession } from 'next-auth/react';

export function SavedSearches() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [searches, setSearches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      loadSearches();
    }
  }, [session]);

  async function loadSearches() {
    try {
      const res = await fetch('/api/saved-searches');
      const data = await res.json();
      if (res.ok) {
        setSearches(data.searches || []);
      }
    } catch (err) {
      console.error('Failed to load saved searches', err);
    } finally {
      setLoading(false);
    }
  }

  async function deleteSearch(id: string) {
    try {
      await fetch(`/api/saved-searches/${id}`, { method: 'DELETE' });
      toast({
        title: "Search deleted",
      });
      loadSearches();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete search",
        variant: "destructive",
      });
    }
  }

  function runSearch(search: any) {
    const params = new URLSearchParams();
    if (search.query) params.set('q', search.query);
    if (search.category && search.category !== 'all') params.set('category', search.category);
    if (search.minPrice) params.set('minPrice', search.minPrice);
    if (search.maxPrice) params.set('maxPrice', search.maxPrice);
    router.push(`/browse?${params.toString()}`);
  }

  if (!session?.user || searches.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Saved Searches
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {searches.map((search) => (
          <div
            key={search._id}
            className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-accent transition-colors group"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium truncate">{search.name || 'Untitled Search'}</p>
                {search.notifications && (
                  <Badge variant="secondary" className="text-xs">
                    <Bell className="h-3 w-3 mr-1" />
                    Alerts
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {search.query && <span>Query: {search.query}</span>}
                {search.category && search.category !== 'all' && (
                  <span>Category: {search.category}</span>
                )}
                {(search.minPrice || search.maxPrice) && (
                  <span>
                    ${search.minPrice || '0'} - ${search.maxPrice || '∞'}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => runSearch(search)}
                className="cursor-pointer"
              >
                Run
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteSearch(search._id)}
                className="h-8 w-8 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

