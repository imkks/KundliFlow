// apps/web/src/components/GooglePlaceAutocomplete.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Search, Navigation, Loader2, X } from 'lucide-react';
import { useGoogleMapsLoaded } from '../utils/googleMapsLoader.ts';
import { resolveTimezoneFromPlace } from '../utils/timezoneHelper.ts';
import { requestCurrentLocation, type ResolvedLocation } from '../utils/geolocationHelper.ts';

export interface PlaceSelection {
  cityName: string;
  lat: number;
  lon: number;
  tzId: string;
}

interface SuggestionItem {
  id: string;
  title: string;
  subtitle?: string;
  placePrediction: any;
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
  placeholder = 'Search city, town or district worldwide…',
  showCurrentLocationBtn = true,
  autoRequestLocation = false,
  style,
}) => {
  const isMapsLoaded = useGoogleMapsLoaded();
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<any>(null);
  const sessionTokenRef = useRef<any>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

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
      setIsOpen(false);
    } catch (err: any) {
      console.warn('Geolocation error:', err);
      setLocationError(err?.message || 'Could not detect location. Please type manually.');
      setTimeout(() => setLocationError(null), 5000);
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

  // Modern Google Places API (New): AutocompleteSuggestion
  const fetchSuggestions = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (trimmed.length < 2) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      setLoadingSuggestions(true);

      if (typeof window !== 'undefined' && window.google?.maps) {
        try {
          const placesLib = (window.google.maps as any).importLibrary
            ? await (window.google.maps as any).importLibrary('places')
            : (window.google.maps as any).places;

          if (placesLib?.AutocompleteSuggestion?.fetchAutocompleteSuggestions) {
            if (!sessionTokenRef.current && placesLib.AutocompleteSessionToken) {
              sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
            }

            const request: any = { input: trimmed };
            if (sessionTokenRef.current) {
              request.sessionToken = sessionTokenRef.current;
            }

            const response = await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
            if (response?.suggestions && response.suggestions.length > 0) {
              const items: SuggestionItem[] = response.suggestions.slice(0, 6).map((s: any) => {
                const p = s.placePrediction;
                const main =
                  p?.mainText?.text ||
                  p?.mainText?.toString() ||
                  p?.text?.text ||
                  p?.text?.toString() ||
                  'Location';
                const sub = p?.secondaryText?.text || p?.secondaryText?.toString() || '';
                return {
                  id: p?.placeId || `${main}-${Math.random()}`,
                  title: main,
                  subtitle: sub,
                  placePrediction: p,
                };
              });

              setSuggestions(items);
              setActiveIndex(-1);
              setIsOpen(true);
              setLoadingSuggestions(false);
              return;
            }
          }
        } catch (err) {
          console.warn('[Places API New] AutocompleteSuggestion notice:', err);
        }
      }

      setSuggestions([]);
      setLoadingSuggestions(false);
    },
    [],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    onTextChange?.(val);

    clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 280);
  };

  const handleSelectSuggestion = async (item: SuggestionItem) => {
    setIsOpen(false);
    const displayName = item.subtitle ? `${item.title}, ${item.subtitle}` : item.title;
    setInputValue(displayName);

    // Google Places API (New): prediction.toPlace()
    if (item.placePrediction?.toPlace) {
      try {
        const place = item.placePrediction.toPlace();
        await place.fetchFields({
          fields: ['displayName', 'formattedAddress', 'location', 'addressComponents'],
        });
        if (place.location) {
          const lat = Number(place.location.lat().toFixed(4));
          const lon = Number(place.location.lng().toFixed(4));
          const name = place.formattedAddress || place.displayName || displayName;
          setInputValue(name);
          const tzId = resolveTimezoneFromPlace(place.addressComponents, lat, lon);
          sessionTokenRef.current = null; // Reset session token after completion

          onPlaceSelect({
            cityName: name,
            lat,
            lon,
            tzId,
          });
          return;
        }
      } catch (err) {
        console.warn('[Places API New] toPlace fetchFields error:', err);
      }
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            background: 'var(--surface-alt)',
            border: isOpen ? '1px solid var(--gold)' : '1px solid var(--border)',
            borderRadius: 8,
            padding: '0 10px',
            transition: 'border-color 0.15s ease',
          }}
        >
          <MapPin size={15} style={{ color: 'var(--teal)', marginRight: 8, flexShrink: 0 }} />
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => {
              if (suggestions.length > 0) setIsOpen(true);
            }}
            onKeyDown={(e) => {
              if (isOpen && suggestions.length > 0) {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setActiveIndex((prev) => (prev + 1) % suggestions.length);
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
                } else if (e.key === 'Enter') {
                  if (activeIndex >= 0 && suggestions[activeIndex]) {
                    e.preventDefault();
                    handleSelectSuggestion(suggestions[activeIndex]!);
                  }
                } else if (e.key === 'Escape') {
                  setIsOpen(false);
                }
              }
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
          {loadingSuggestions ? (
            <Loader2
              size={13}
              className="spin"
              style={{ color: 'var(--text-muted)', marginLeft: 6, animation: 'spin 1s linear infinite' }}
            />
          ) : inputValue ? (
            <button
              type="button"
              onClick={() => {
                setInputValue('');
                setSuggestions([]);
                setIsOpen(false);
                onTextChange?.('');
              }}
              style={{ color: 'var(--text-muted)', padding: 2 }}
            >
              <X size={13} />
            </button>
          ) : (
            <Search size={14} style={{ color: 'var(--text-muted)', marginLeft: 6, flexShrink: 0 }} />
          )}
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

      {/* Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: showCurrentLocationBtn ? 116 : 0,
            background: '#201d40',
            border: '1px solid rgba(227, 173, 70, 0.35)',
            borderRadius: 10,
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.75)',
            zIndex: 10000,
            overflow: 'hidden',
          }}
        >
          {suggestions.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => handleSelectSuggestion(item)}
              style={{
                padding: '9px 12px',
                borderBottom: '1px solid rgba(243, 238, 226, 0.08)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: activeIndex === idx ? 'rgba(95, 194, 179, 0.22)' : 'transparent',
                transition: 'background 0.12s ease',
              }}
              onMouseEnter={() => {
                setActiveIndex(idx);
              }}
            >
              <MapPin size={13} style={{ color: 'var(--gold)', flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#f3eee2' }}>{item.title}</span>
                {item.subtitle && (
                  <span
                    style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.subtitle}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {locationError && (
        <div style={{ fontSize: 11, color: 'var(--amber)', paddingLeft: 4, marginTop: 4 }}>
          {locationError}
        </div>
      )}
    </div>
  );
};
