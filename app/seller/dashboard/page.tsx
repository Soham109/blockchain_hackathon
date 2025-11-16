"use client";
import React, { useEffect, useState } from 'react';

export default function SellerDashboard() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/products');
      const data = await res.json();
      setItems(data.items || []);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Seller Dashboard</h1>
          <a href="/seller/create" className="bg-indigo-600 px-3 py-2 rounded">Create Listing</a>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {items.map(i => (
            <div key={i._id} className="p-4 bg-white/5 rounded flex justify-between">
              <div>
                <div className="font-semibold">{i.title}</div>
                <div className="text-sm text-slate-300">${(i.priceCents/100).toFixed(2)}</div>
              </div>
              <div className="flex gap-2">
                <a href={`/products/${i._id}`} className="text-sm underline">View</a>
                <a href={`/seller/edit/${i._id}`} className="text-sm underline">Edit</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
