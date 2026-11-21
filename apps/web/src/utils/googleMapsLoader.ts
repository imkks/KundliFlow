// apps/web/src/utils/googleMapsLoader.ts
// Utility to ensure Google Maps JavaScript API with Places library is loaded

const MAPS_API_KEY =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined)?.trim() || '';

let loadPromise: Promise<typeof google.maps> | null = null;

export function loadGoogleMaps(): Promise<typeof google.maps> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window not available'));
  }

  if (window.google?.maps?.places) {
    return Promise.resolve(window.google.maps);
  }

  if (!MAPS_API_KEY) {
    const errorMsg =
      'Google Maps API key missing. Please configure VITE_GOOGLE_MAPS_API_KEY in your environment.';
    console.warn(errorMsg);
    return Promise.reject(new Error(errorMsg));
  }

  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    // Check if script is already in the document
    const existing = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existing) {
      if (window.google?.maps?.places) {
        resolve(window.google.maps);
        return;
      }
      existing.addEventListener('load', () => {
        if (window.google?.maps?.places) {
          resolve(window.google.maps);
        } else {
          reject(new Error('Google Maps script loaded but places library missing'));
        }
      });
      existing.addEventListener('error', () => {
        reject(new Error('Failed to load Google Maps script'));
      });
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      MAPS_API_KEY,
    )}&libraries=places&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.maps) {
        resolve(window.google.maps);
      } else {
        reject(new Error('Google Maps script loaded but google.maps missing'));
      }
    };
    script.onerror = () => {
      reject(new Error('Failed to load Google Maps script'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

import { useState, useEffect } from 'react';

export function useGoogleMapsLoaded(): boolean {
  const [isLoaded, setIsLoaded] = useState(() => {
    return typeof window !== 'undefined' && Boolean(window.google?.maps?.places);
  });

  useEffect(() => {
    if (isLoaded) return;
    let active = true;
    loadGoogleMaps()
      .then(() => {
        if (active) setIsLoaded(true);
      })
      .catch((err) => {
        console.error('[GoogleMaps] load error:', err);
      });
    return () => {
      active = false;
    };
  }, [isLoaded]);

  return isLoaded;
}
