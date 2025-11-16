"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Loading from '../../../components/ui/Loading';
import Card from '../../../components/ui/Card';

export default function EditProductPage({ params }: any) {
  const { id } = params;
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setProduct(d.product);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <Loading fullscreen message="Loading..." />;
  if (!product) return <div className="p-8">Not found</div>;

  async function handleSave() {
    setBusy(true);
    try {
      const updates = {
        title: product.title,
        description: product.description,
        priceCents: product.priceCents,
        category: product.category,
        location: product.location,
        images: product.images || [],
      };
      const res = await fetch(`/api/products/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
      if (!res.ok) throw new Error('Save failed');
      router.push(`/products/${id}`);
    } catch (e) {
      console.error(e);
      alert('Failed to save');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <Card>
          <h2 className="text-2xl font-bold mb-4">Edit Listing</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Title</label>
              <Input value={product.title} onChange={(e: any) => setProduct({ ...product, title: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Description</label>
              <textarea value={product.description} onChange={(e) => setProduct({ ...product, description: e.target.value })} className="w-full rounded-xl p-3 bg-zinc-900/50 text-white" rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Price (USD)</label>
                <Input value={String((product.priceCents || 0) / 100)} onChange={(e: any) => setProduct({ ...product, priceCents: Math.round(Number(e.target.value) * 100) })} />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Category</label>
                <select value={product.category} onChange={(e) => setProduct({ ...product, category: e.target.value })} className="w-full rounded-xl p-2 bg-zinc-900/50 text-white">
                  <option value="textbooks">Textbooks</option>
                  <option value="electronics">Electronics</option>
                  <option value="furniture">Furniture</option>
                  <option value="services">Services</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-1">Location</label>
              <Input value={product.location || ''} onChange={(e) => setProduct({ ...product, location: e.target.value })} />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={busy}>{busy ? 'Saving...' : 'Save'}</Button>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
