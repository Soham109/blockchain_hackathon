"use client";
import React from 'react';
import Link from 'next/link';
import Card from './ui/Card';
import Badge from './ui/Badge';

export default function ListingCard({ item }: { item: any }) {
  const price = (item.priceCents ?? 0) / 100;
  return (
    <Card hoverable className="p-4">
      <div className="flex gap-4">
        <div className="w-28 h-20 bg-white/5 rounded overflow-hidden flex items-center justify-center text-slate-500">
          {item.images && item.images.length ? (
            // use first image URL
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.images[0]} alt={item.title} className="object-cover w-full h-full" />
          ) : (
            <div className="text-xs">No image</div>
          )}
        </div>

        <div className="flex-1">
          <Link href={`/listings/${item._id}`} className="block">
            <h3 className="font-semibold text-lg text-white">{item.title}</h3>
            <p className="text-sm text-slate-400 truncate">{item.description}</p>
          </Link>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="info">{item.category || 'General'}</Badge>
              {item.location && <div className="text-xs text-slate-400">📍 {item.location}</div>}
            </div>
            <div className="text-right">
              <div className="font-bold text-white">${price.toFixed(2)}</div>
              <div className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
