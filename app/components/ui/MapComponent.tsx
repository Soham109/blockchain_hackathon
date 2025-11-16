"use client";
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';

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

