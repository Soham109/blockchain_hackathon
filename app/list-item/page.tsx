"use client";
import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

export default function ListItemPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('textbooks');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !price) return alert('Title and price required');
    setBusy(true);
    try {
      const priceCents = Math.round(Number(price) * 100);
      const body = {
        title,
        description,
        priceCents,
        images: images.split(',').map((s) => s.trim()).filter(Boolean),
        category,
        location,
        sellerEmail: (session as any)?.user?.email || null,
        createdAt: new Date().toISOString(),
      } as any;

      const res = await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to create');
      router.push(`/products/${data.id}`);
    } catch (err: any) {
      console.error('create failed', err);
      alert(err.message || 'Failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <Card>
          <h2 className="text-2xl font-bold mb-4">Create a New Listing</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-xl p-3 bg-zinc-900/50 text-white" rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Price (USD)</label>
                <Input value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-xl p-2 bg-zinc-900/50 text-white">
                  <option value="textbooks">Textbooks</option>
                  <option value="electronics">Electronics</option>
                  <option value="furniture">Furniture</option>
                  <option value="services">Services</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-1">Location (campus / neighborhood)</label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-1">Images (comma-separated URLs)</label>
              <Input value={images} onChange={(e) => setImages(e.target.value)} />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={busy}>{busy ? 'Listing...' : 'Create Listing'}</Button>
            </div>
          </form>
        </Card>
      </div>
    </main>
  );
}
