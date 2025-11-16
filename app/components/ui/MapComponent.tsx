"use client";
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

interface MapComponentProps {
  center: [number, number];
  zoom: number;
  currentLocation: { lat: number; lng: number; address: string } | null;
  onLocationChange: (location: { lat: number; lng: number; address: string }) => void;
}

function MapClickHandler({ onLocationChange }: { onLocationChange: (location: { lat: number; lng: number; address: string }) => void }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      // Try to get address from coordinates (reverse geocoding)
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
        );
        const data = await response.json();
        const address = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        onLocationChange({ lat, lng, address });
      } catch (error) {
        // Fallback to coordinates if reverse geocoding fails
        onLocationChange({ lat, lng, address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
      }
    },
  });
  return null;
}

export default function MapComponent({ center, zoom, currentLocation, onLocationChange }: MapComponentProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
      key={`${center[0]}-${center[1]}`}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {currentLocation && (
        <Marker position={[currentLocation.lat, currentLocation.lng]} />
      )}
      <MapClickHandler onLocationChange={onLocationChange} />
    </MapContainer>
  );
}

