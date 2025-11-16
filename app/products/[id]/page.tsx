"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Loading from '../../components/ui/Loading';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Link from 'next/link';

export default function ProductPage({ params }: any) {
  const { id } = params;
  const { data: session } = useSession();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setProduct(d.product);
        setLoading(false);
      })
      .catch((e) => {
        console.error('Failed to load product', e);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <Loading fullscreen message="Loading product..." />;
  if (!product) return <div className="p-8">Product not found</div>;

  const price = product.price || (product.priceCents / 100).toFixed(2);

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-2">
              <h1 className="text-2xl font-bold mb-2">{product.title}</h1>
              <p className="text-slate-300 mb-4">{product.description}</p>
              <div className="text-sm text-slate-400 mb-2">Category: {product.category}</div>
              {product.location && <div className="text-sm text-slate-400 mb-2">Location: {product.location}</div>}
            </div>

            <aside className="p-4 bg-zinc-900/30 rounded">
              <div className="text-3xl font-bold text-indigo-400 mb-2">${price}</div>
              <div className="text-sm text-slate-400 mb-4">Listed by {product.sellerEmail || 'student'}</div>
              <div className="flex flex-col gap-2">
                <Button onClick={() => router.push('/browse')}>Contact Seller</Button>
                {session?.user && session.user.email === product.sellerEmail && (
                  <Link href={`/products/${product._id}/edit`}>
                    <Button variant="ghost">Edit Listing</Button>
                  </Link>
                )}
              </div>
            </aside>
          </div>
        </Card>
      </div>
    </main>
  );
}

