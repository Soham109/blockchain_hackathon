import React from 'react';

async function fetchProduct(id: string) {
  const res = await fetch(`/api/products/${id}`);
  return res.json();
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const data = await fetchProduct(params.id);
  const p = data?.product;
  if (!p) return <div className="min-h-screen flex items-center justify-center">Not found</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-white py-12">
      <div className="max-w-4xl mx-auto px-4 bg-white/5 p-6 rounded">
        <h1 className="text-2xl font-bold">{p.title}</h1>
        <div className="mt-4 text-slate-300">{p.description}</div>
        <div className="mt-6 font-bold text-xl">${(p.priceCents/100).toFixed(2)}</div>
        <div className="mt-6">
          <button className="bg-indigo-600 px-4 py-2 rounded">Contact Seller</button>
        </div>
      </div>
    </div>
  );
}
