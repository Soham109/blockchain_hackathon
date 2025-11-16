"use client";
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Loading from '../components/ui/Loading';

export default function BrowsePage() {
  const { data: session } = useSession();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.products || data.items || []);
        setLoading(false);
      })
      .catch((e) => {
        console.error('Failed to fetch products:', e);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <Loading fullscreen message="Loading marketplace..." />;
  }

  const filteredProducts = products.filter(
    (p) => filter === 'all' || p.category === filter
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="mx-auto max-w-7xl px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Browse Marketplace</h1>
          <p className="text-slate-300">
            {filteredProducts.length} items available from verified students
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-3">
          {['all', 'textbooks', 'electronics', 'furniture', 'services'].map(
            (cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 rounded-lg transition capitalize ${
                  filter === cat
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                {cat}
              </button>
            )
          )}
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Link key={product._id} href={`/products/${product._id}`}>
                <Card hoverable className="h-full cursor-pointer flex flex-col">
                  {/* Product Image Placeholder */}
                  <div className="w-full h-40 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded mb-4 flex items-center justify-center">
                    <span className="text-4xl">📦</span>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-lg mb-2 line-clamp-2">
                    {product.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-slate-300 mb-4 line-clamp-2 flex-grow">
                    {product.description}
                  </p>

                  {/* Price & Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-indigo-400">
                      ${product.price || (product.priceCents / 100).toFixed(2)}
                    </span>
                    <Badge variant="info">{product.category}</Badge>
                  </div>

                  {/* Seller */}
                  <div className="mt-4 pt-4 border-t border-white/10 text-xs text-slate-400">
                    Listed by {product.sellerEmail?.split('@')[0]}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <p className="text-xl text-slate-300 mb-4">No items found</p>
            <p className="text-slate-400 mb-6">
              {session?.user ? (
                <>
                  Be the first to list something!{' '}
                  <Link href="/list-item" className="text-indigo-400 hover:underline">
                    Create a listing
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/signup" className="text-indigo-400 hover:underline">
                    Sign up
                  </Link>{' '}
                  to start buying and selling.
                </>
              )}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
