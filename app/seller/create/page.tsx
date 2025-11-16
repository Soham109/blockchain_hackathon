"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateListing() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const priceCents = Math.round(Number(price) * 100);
    const resp = await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, description, priceCents, images: [] }) });
    if (resp.ok) {
      router.push('/seller/dashboard');
    } else {
      alert('create failed');
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-4">Create Listing</h1>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300">Title</label>
            <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full p-2 bg-white/5 rounded" />
          </div>
          <div>
            <label className="block text-sm text-slate-300">Description</label>
            <textarea value={description} onChange={e=>setDescription(e.target.value)} className="w-full p-2 bg-white/5 rounded" />
          </div>
          <div>
            <label className="block text-sm text-slate-300">Price (USD)</label>
            <input value={price} onChange={e=>setPrice(e.target.value)} className="w-full p-2 bg-white/5 rounded" />
          </div>
          <div>
            <button className="bg-indigo-600 px-4 py-2 rounded">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}
