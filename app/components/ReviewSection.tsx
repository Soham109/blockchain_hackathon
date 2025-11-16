"use client";
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';

export default function ReviewSection({ productId }: { productId: string }) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadReviews() {
    try {
      const res = await fetch(`/api/products/reviews?productId=${productId}`);
      const data = await res.json();
      if (res.ok) {
        setReviews(data.reviews || []);
        setAverageRating(data.averageRating || 0);
        setTotalReviews(data.totalReviews || 0);
        
        if (session?.user) {
          const userReview = data.reviews?.find((r: any) => r.userEmail === (session.user as any).email);
          if (userReview) {
            setUserRating(userReview.rating);
            setUserComment(userReview.comment || '');
          }
        }
      }
    } catch (err) {
      console.error('Failed to load reviews', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  useEffect(() => {
    if (session?.user) {
      loadReviews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user]);

  async function submitReview() {
    if (!session?.user || userRating === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/products/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          rating: userRating,
          comment: userComment
        })
      });
      if (res.ok) {
        setUserRating(0);
        setUserComment('');
        await loadReviews();
        toast({
          title: "Review Submitted!",
          description: "Thank you for your feedback.",
        });
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit review');
      }
    } catch (err: any) {
      console.error('Failed to submit review', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to submit review. Please try again.',
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  function StarRating({ rating, onChange, readonly = false }: any) {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => !readonly && onChange(star)}
            className={readonly ? 'cursor-default' : 'cursor-pointer hover:scale-125 transition-transform'}
          >
            <Star
              size={24}
              className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}
            />
          </button>
        ))}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading reviews...</p>
      </div>
    );
  }

  return (
    <Card className="mt-8 border-2 shadow-sm">
      <CardHeader className="bg-muted/20">
        <CardTitle className="text-3xl font-bold">Reviews & Ratings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="mb-6 p-4 bg-muted/30 rounded-xl border-2">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <StarRating rating={Math.round(averageRating)} readonly />
              <span className="text-3xl font-bold">{averageRating > 0 ? averageRating.toFixed(1) : '0.0'}</span>
            </div>
            <span className="text-muted-foreground text-lg">({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})</span>
          </div>
        </div>

        {session?.user && (
          <div className="mb-6 p-6 bg-muted/30 rounded-xl border-2">
            <h4 className="font-bold text-lg mb-4">Write a Review</h4>
            <div className="space-y-4">
              <div>
                <Label className="block text-sm font-medium text-muted-foreground mb-3">Your Rating</Label>
                <StarRating rating={userRating} onChange={setUserRating} />
              </div>
              <div>
                <Label htmlFor="review-comment" className="block text-sm font-medium text-muted-foreground mb-2">Comment (optional)</Label>
                <Textarea
                  id="review-comment"
                  value={userComment}
                  onChange={(e) => setUserComment(e.target.value)}
                  placeholder="Share your experience with this product..."
                  className="w-full rounded-lg border-2 bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none resize-none"
                  rows={4}
                />
              </div>
              <Button 
                onClick={submitReview} 
                disabled={submitting || userRating === 0}
                className="shadow-sm hover:shadow-md transition-shadow"
                size="lg"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
              <p className="text-lg font-medium text-muted-foreground mb-2">No reviews yet</p>
              <p className="text-sm text-muted-foreground">Be the first to review this product!</p>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review._id} className="p-5 bg-muted/20 rounded-xl border-2 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar className="h-10 w-10 border-2 border-primary/20">
                        <AvatarFallback className="text-sm font-bold">
                          {review.userEmail?.[0]?.toUpperCase() || 'A'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{review.userEmail?.split('@')[0] || 'Anonymous'}</p>
                        <StarRating rating={review.rating} readonly />
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-sm text-foreground mt-3 leading-relaxed">{review.comment}</p>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
