"use client";
import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Navigation } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// Dynamically import the entire map component to avoid SSR issues
const MapComponent = dynamic(() => import('./MapComponent'), { ssr: false });

interface LocationPickerProps {
  latitude?: number;
  longitude?: number;
  address?: string;
  onLocationChange: (location: { lat: number; lng: number; address: string }) => void;
}


export function LocationPicker({ latitude, longitude, address, onLocationChange }: LocationPickerProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>([40.7128, -74.0060]); // Default to NYC
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number; address: string } | null>(
    latitude && longitude ? { lat: latitude, lng: longitude, address: address || '' } : null
  );
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (latitude && longitude) {
      setMapCenter([latitude, longitude]);
      setCurrentLocation({ lat: latitude, lng: longitude, address: address || '' });
    } else {
      // Try to get user's current location
      getCurrentLocation();
    }
  }, [latitude, longitude, address]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive",
      });
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setMapCenter([latitude, longitude]);
        
        try {
          // Get address from coordinates
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          const address = data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          const location = { lat: latitude, lng: longitude, address };
          setCurrentLocation(location);
          onLocationChange(location);
        } catch (error) {
          const location = { lat: latitude, lng: longitude, address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` };
          setCurrentLocation(location);
          onLocationChange(location);
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        toast({
          title: "Location access denied",
          description: "Please allow location access or select a location on the map",
          variant: "destructive",
        });
        setIsLocating(false);
      }
    );
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const location = { lat: parseFloat(lat), lng: parseFloat(lon), address: display_name };
        setMapCenter([location.lat, location.lng]);
        setCurrentLocation(location);
        onLocationChange(location);
        // Update search query to show the found address
        setSearchQuery(display_name);
      } else {
        toast({
          title: "Location not found",
          description: "Please try a different search term",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Search failed",
        description: "Unable to search for location. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleMapClick = (location: { lat: number; lng: number; address: string }) => {
    setCurrentLocation(location);
    onLocationChange(location);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>Product Location</Label>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter address or search..."
            value={searchQuery || (currentLocation?.address || '')}
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch();
              }
            }}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            size="sm"
          >
            {isSearching ? '...' : 'Search'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={getCurrentLocation}
            disabled={isLocating}
            size="sm"
            title="Use my current location"
          >
            <Navigation className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {currentLocation && (
        <div className="flex items-center gap-2 p-2.5 bg-muted rounded-lg border">
          <MapPin className="h-4 w-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{currentLocation.address}</p>
          </div>
        </div>
      )}

      <details className="border rounded-lg overflow-hidden">
        <summary className="cursor-pointer p-2 text-sm font-medium hover:bg-muted/50">
          {currentLocation ? '📍 View on Map' : '📍 Show Map (Optional)'}
        </summary>
        <div className="border-t" style={{ height: '200px' }}>
          <MapComponent
            center={mapCenter}
            zoom={currentLocation ? 15 : 10}
            currentLocation={currentLocation}
            onLocationChange={handleMapClick}
          />
        </div>
      </details>
    </div>
  );
}

