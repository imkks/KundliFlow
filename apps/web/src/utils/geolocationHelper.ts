// apps/web/src/utils/geolocationHelper.ts
// Handles browser geolocation request, permission, and Google Geocoder reverse geocoding

import { loadGoogleMaps } from './googleMapsLoader.ts';
import { getUserDeviceTimezone } from './timezoneHelper.ts';

export interface ResolvedLocation {
  cityName: string;
  lat: number;
  lon: number;
  tzId: string;
}

export async function requestCurrentLocation(): Promise<ResolvedLocation> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    throw new Error('Geolocation is not supported by your browser');
  }

  // Ensure Google Maps is loaded before requesting GPS so reverse-geocoding is instantaneous
  await loadGoogleMaps();

  return new Promise<ResolvedLocation>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(4));
        const lon = Number(pos.coords.longitude.toFixed(4));
        const tzId = getUserDeviceTimezone();

        try {
          if (window.google?.maps?.Geocoder) {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location: { lat, lng: lon } }, (results, status) => {
              if (status === 'OK' && results && results[0]) {
                const first = results[0];
                // Try to find locality or sublocality
                let locality = '';
                let adminArea = '';
                let country = '';

                for (const comp of first.address_components) {
                  if (comp.types.includes('locality')) {
                    locality = comp.long_name;
                  } else if (comp.types.includes('administrative_area_level_1')) {
                    adminArea = comp.short_name;
                  } else if (comp.types.includes('country')) {
                    country = comp.long_name;
                  }
                }

                const parts = [locality, adminArea, country].filter(Boolean);
                const cityName = parts.length > 0 ? parts.join(', ') : first.formatted_address.split(',')[0] || 'Current Location';

                resolve({
                  cityName,
                  lat,
                  lon,
                  tzId,
                });
              } else {
                resolve({
                  cityName: `Lat: ${lat}, Lon: ${lon}`,
                  lat,
                  lon,
                  tzId,
                });
              }
            });
          } else {
            resolve({
              cityName: `Lat: ${lat}, Lon: ${lon}`,
              lat,
              lon,
              tzId,
            });
          }
        } catch {
          resolve({
            cityName: `Lat: ${lat}, Lon: ${lon}`,
            lat,
            lon,
            tzId,
          });
        }
      },
      (err) => {
        let msg = 'Failed to retrieve location.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Location permission denied. Please allow location access or type your city.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'Location information is unavailable.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'Location request timed out.';
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  });
}
