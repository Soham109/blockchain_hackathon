"use client";
import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the map component to avoid SSR issues
const MapComponent = dynamic(() => import('./ProductMapComponent'), { ssr: false });

interface ProductMapProps {
  latitude: number;
  longitude: number;
  address?: string;
  userLocation?: { lat: number; lng: number } | null;
}

export function ProductMap({ latitude, longitude, address, userLocation }: ProductMapProps) {
  const center: [number, number] = [latitude, longitude];

  return (
    <div className="border rounded-lg overflow-hidden" style={{ height: '300px' }}>
      <MapComponent
        center={center}
        zoom={15}
        productLocation={{ lat: latitude, lng: longitude, address }}
        userLocation={userLocation}
      />
    </div>
  );
}

