// apps/web/src/components/GooglePlaceAutocomplete.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Search, Navigation, Loader2 } from 'lucide-react';
import { useGoogleMapsLoaded } from '../utils/googleMapsLoader.ts';
import { resolveTimezoneFromPlace } from '../utils/timezoneHelper.ts';
import { requestCurrentLocation, type ResolvedLocation } from '../utils/geolocationHelper.ts';

export interface PlaceSelection {
  cityName: string;
  lat: number;
  lon: number;
  tzId: string;
}

interface Props {
  value: string;
  onPlaceSelect: (place: PlaceSelection) => void;
  onTextChange?: (text: string) => void;
  placeholder?: string;
  showCurrentLocationBtn?: boolean;
  autoRequestLocation?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const GooglePlaceAutocomplete: React.FC<Props> = ({
  value,
  onPlaceSelect,
  onTextChange,
  placeholder = 'Search city, town or district…',
  showCurrentLocationBtn = true,
  autoRequestLocation = false,
  style,
}) => {
  const isMapsLoaded = useGoogleMapsLoaded();
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [inputValue, setInputValue] = useState(value);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleUseCurrentLocation = useCallback(async () => {
    setDetectingLocation(true);
    setLocationError(null);
    try {
      const loc: ResolvedLocation = await requestCurrentLocation();
      setInputValue(loc.cityName);
      onPlaceSelect({
        cityName: loc.cityName,
        lat: loc.lat,
        lon: loc.lon,
        tzId: loc.tzId,
      });
    } catch (err: any) {
      console.warn('Geolocation error:', err);
      setLocationError(err?.message || 'Could not detect location. Please type manually.');
      setTimeout(() => setLocationError(null), 4500);
    } finally {
      setDetectingLocation(false);
    }
  }, [onPlaceSelect]);

  // Auto-request location on mount if requested and no value is set
  useEffect(() => {
    if (autoRequestLocation && !value && isMapsLoaded) {
      handleUseCurrentLocation();
    }
  }, [autoRequestLocation, isMapsLoaded]);

  // Initialize Google Autocomplete once Maps is loaded
  useEffect(() => {
    if (!isMapsLoaded || !inputRef.current || !window.google?.maps?.places) {
      return;
    }

    try {
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['(cities)'],
        fields: ['address_components', 'formatted_address', 'geometry', 'name'],
      });

      autocompleteRef.current = autocomplete;

      const listener = autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) {
          return;
        }

        const lat = Number(place.geometry.location.lat().toFixed(4));
        const lon = Number(place.geometry.location.lng().toFixed(4));
        const cityName = place.formatted_address || place.name || 'Selected Place';
        const tzId = resolveTimezoneFromPlace(place.address_components as any, lat, lon);

        setInputValue(cityName);
        setLocationError(null);
        onPlaceSelect({
          cityName,
          lat,
          lon,
          tzId,
        });
      });

      return () => {
        if (listener) {
          window.google.maps.event.removeListener(listener);
        }
      };
    } catch (err) {
      console.error('[GooglePlaceAutocomplete] init error:', err);
    }
  }, [isMapsLoaded, onPlaceSelect]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%', ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            background: 'var(--surface-alt)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '0 10px',
            transition: 'border-color 0.15s ease',
          }}
        >
          <MapPin size={15} style={{ color: 'var(--teal)', marginRight: 8, flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              onTextChange?.(e.target.value);
            }}
            placeholder={placeholder}
            autoComplete="off"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              padding: '9px 0',
              color: 'var(--text-main)',
              fontSize: 13,
              outline: 'none',
              width: '100%',
            }}
          />
          <Search size={14} style={{ color: 'var(--text-muted)', marginLeft: 6, flexShrink: 0 }} />
        </div>

        {showCurrentLocationBtn && (
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={detectingLocation}
            title="Use current GPS location"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '9px 12px',
              borderRadius: 8,
              background: detectingLocation ? 'rgba(95, 194, 179, 0.25)' : 'rgba(95, 194, 179, 0.12)',
              border: '1px solid rgba(95, 194, 179, 0.4)',
              color: 'var(--teal)',
              fontSize: 11.5,
              fontWeight: 600,
              cursor: detectingLocation ? 'wait' : 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {detectingLocation ? (
              <>
                <Loader2 size={13} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                <span>Locating…</span>
              </>
            ) : (
              <>
                <Navigation size={13} />
                <span>Current GPS</span>
              </>
            )}
          </button>
        )}
      </div>

      {locationError && (
        <div style={{ fontSize: 11, color: 'var(--amber)', paddingLeft: 4 }}>
          {locationError}
        </div>
      )}
    </div>
  );
};
