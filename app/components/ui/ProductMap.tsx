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
  // Center map between user and product if both exist, otherwise center on product
  let center: [number, number] = [latitude, longitude];
  let zoom = 15;
  
  if (userLocation) {
    // Calculate center point between user and product
    center = [
      (userLocation.lat + latitude) / 2,
      (userLocation.lng + longitude) / 2
    ];
    // Adjust zoom to fit both locations
    zoom = 13;
  }

  return (
    <div className="border rounded-lg overflow-hidden relative z-0" style={{ height: '300px' }}>
      <MapComponent
        center={center}
        zoom={zoom}
        productLocation={{ lat: latitude, lng: longitude, address }}
        userLocation={userLocation}
      />
    </div>
  );
}

