"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface UserRegion {
  city?: string;
  state?: string;
  country?: string;
  regionKey: string; // Format: "city,state,country" or "state,country" or "country"
}

interface LocationContextType {
  userLocation: { lat: number; lng: number } | null;
  userRegion: UserRegion | null;
  isLoading: boolean;
  error: string | null;
  requestLocation: () => void;
  hasRequestedPermission: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

// Helper function to fetch region from coordinates
async function fetchRegionFromCoordinates(lat: number, lng: number): Promise<UserRegion | null> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.address) {
        const addr = data.address;
        const city = addr.city || addr.town || addr.village || addr.municipality;
        const state = addr.state || addr.region;
        const country = addr.country;
        
        // Create region key: prefer city,state,country or state,country or country
        let regionKey = '';
        if (city && state && country) {
          regionKey = `${city},${state},${country}`;
        } else if (state && country) {
          regionKey = `${state},${country}`;
        } else if (country) {
          regionKey = country;
        }
        
        if (regionKey) {
          return { city, state, country, regionKey };
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch region:', error);
      return null;
    }
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [userRegion, setUserRegion] = useState<UserRegion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRequestedPermission, setHasRequestedPermission] = useState(false);

  const requestLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasRequestedPermission(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(location);
        
        // Fetch region information
        const region = await fetchRegionFromCoordinates(location.lat, location.lng);
        if (region) {
          setUserRegion(region);
        }
        
        setIsLoading(false);
        // Store in localStorage for persistence
        localStorage.setItem('userLocation', JSON.stringify(location));
        if (region) {
          localStorage.setItem('userRegion', JSON.stringify(region));
        }
      },
      (err) => {
        setError(err.message);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000, // 10 minutes
      }
    );
  };

  // Try to load from localStorage on mount and auto-request if not available
  useEffect(() => {
    const storedLocation = localStorage.getItem('userLocation');
    const storedRegion = localStorage.getItem('userRegion');
    const hasRequested = localStorage.getItem('locationPermissionRequested') === 'true';
    
    if (storedLocation) {
      try {
        const location = JSON.parse(storedLocation);
        setUserLocation(location);
      } catch (e) {
        localStorage.removeItem('userLocation');
      }
    }
    
    if (storedRegion) {
      try {
        const region = JSON.parse(storedRegion);
        setUserRegion(region);
      } catch (e) {
        localStorage.removeItem('userRegion');
      }
    }
    
    // Auto-request location if not stored and permission hasn't been requested
    if (!storedLocation && !hasRequested && navigator.geolocation) {
      // Small delay to let UI render first
      const timer = setTimeout(() => {
        // Call requestLocation directly without dependency
        if (!navigator.geolocation) return;
        
        setIsLoading(true);
        setError(null);
        setHasRequestedPermission(true);
        
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setUserLocation(location);
            
            // Fetch region information
            const region = await fetchRegionFromCoordinates(location.lat, location.lng);
            if (region) {
              setUserRegion(region);
            }
            
            setIsLoading(false);
            localStorage.setItem('userLocation', JSON.stringify(location));
            if (region) {
              localStorage.setItem('userRegion', JSON.stringify(region));
            }
          },
          (err) => {
            setError(err.message);
            setIsLoading(false);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 600000,
          }
        );
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Save permission request status
  useEffect(() => {
    if (hasRequestedPermission) {
      localStorage.setItem('locationPermissionRequested', 'true');
    }
  }, [hasRequestedPermission]);

  return (
    <LocationContext.Provider value={{ userLocation, userRegion, isLoading, error, requestLocation, hasRequestedPermission }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useUserLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useUserLocation must be used within a LocationProvider');
  }
  return context;
}

