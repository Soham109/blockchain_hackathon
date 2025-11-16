"use client";
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { calculateDistance, formatDistance, estimateTravelTime, formatTravelTime } from '@/lib/location';

// Fix Leaflet z-index to ensure it doesn't appear above navbar (z-50)
if (typeof window !== 'undefined' && !document.getElementById('leaflet-z-index-fix')) {
  const style = document.createElement('style');
  style.id = 'leaflet-z-index-fix';
  style.textContent = `
    .leaflet-container {
      z-index: 0 !important;
    }
    .leaflet-control-container {
      z-index: 1 !important;
    }
    .leaflet-popup {
      z-index: 10 !important;
    }
    .leaflet-top,
    .leaflet-bottom {
      z-index: 1 !important;
    }
  `;
  document.head.appendChild(style);
}

// Fix for default marker icon in Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

interface ProductMapComponentProps {
  center: [number, number];
  zoom: number;
  productLocation: { lat: number; lng: number; address?: string };
  userLocation?: { lat: number; lng: number } | null;
}

// Component to fit map bounds to show both locations
function FitBounds({ productLocation, userLocation }: { productLocation: { lat: number; lng: number }; userLocation?: { lat: number; lng: number } | null }) {
  const map = useMap();

  useEffect(() => {
    if (userLocation) {
      // Fit map to show both locations with padding
      const bounds = L.latLngBounds(
        [productLocation.lat, productLocation.lng],
        [userLocation.lat, userLocation.lng]
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, productLocation, userLocation]);

  return null;
}

export default function ProductMapComponent({ center, zoom, productLocation, userLocation }: ProductMapComponentProps) {
  // Calculate distance if both locations are available
  const distance = userLocation 
    ? calculateDistance(userLocation.lat, userLocation.lng, productLocation.lat, productLocation.lng)
    : null;
  const formattedDistance = distance ? formatDistance(distance) : null;
  const travelTime = distance ? formatTravelTime(estimateTravelTime(distance, 'walking')) : null;

  // Create polyline between user and product if both exist
  const polylinePositions = userLocation 
    ? [[userLocation.lat, userLocation.lng] as [number, number], [productLocation.lat, productLocation.lng] as [number, number]]
    : [];

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%', zIndex: 0 }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Fit bounds to show both locations */}
      <FitBounds productLocation={productLocation} userLocation={userLocation} />
      
      {/* Draw line between user and product */}
      {polylinePositions.length === 2 && (
        <Polyline
          positions={polylinePositions}
          pathOptions={{ color: '#3b82f6', weight: 3, opacity: 0.7, dashArray: '10, 10' }}
        />
      )}

      {/* Product Location Marker */}
      <Marker position={[productLocation.lat, productLocation.lng]}>
        <Popup>
          <div className="text-sm">
            <p className="font-semibold">📍 Product Location</p>
            {productLocation.address && <p className="text-muted-foreground mt-1">{productLocation.address}</p>}
            {formattedDistance && (
              <div className="mt-2 pt-2 border-t">
                <p className="text-primary font-medium">
                  📏 {formattedDistance} away
                </p>
                {travelTime && (
                  <p className="text-muted-foreground text-xs mt-1">
                    ⏱️ {travelTime} walking
                  </p>
                )}
              </div>
            )}
          </div>
        </Popup>
      </Marker>

      {/* User Location Marker */}
      {userLocation && (
        <Marker
          position={[userLocation.lat, userLocation.lng]}
          icon={new L.Icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
            iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          })}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold text-blue-600">📍 Your Location</p>
              {formattedDistance && (
                <div className="mt-2 pt-2 border-t">
                  <p className="text-primary font-medium">
                    📏 {formattedDistance} to product
                  </p>
                  {travelTime && (
                    <p className="text-muted-foreground text-xs mt-1">
                      ⏱️ {travelTime} walking
                    </p>
                  )}
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}

