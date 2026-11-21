import React, { useState } from 'react';
import {
  User,
  Calendar,
  Clock,
  MapPin,
  Compass,
  Sparkles,
  X,
  CheckCircle2,
  Sliders,
  HelpCircle,
} from 'lucide-react';
import { CITIES, type Place } from '@astro/content';
import type { AyanamsaId } from '@astro/engine';
import { GooglePlaceAutocomplete } from './GooglePlaceAutocomplete.tsx';

export interface UserProfileInput {
  name: string;
  birthDate: string; // YYYY-MM-DD
  birthTime: string; // HH:mm:ss
  cityName: string;
  lat: number;
  lon: number;
  tzId: string;
  timeCertainty: 'exact' | 'approx' | 'unknown';
  ayanamsa: AyanamsaId;
}

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: UserProfileInput;
  onSaveProfile: (profile: UserProfileInput) => void;
}

const PRESET_PROFILES: Array<{ label: string; profile: UserProfileInput }> = [
  {
    label: 'Aries Ascendant Sample (New Delhi 2000)',
    profile: {
      name: 'Sample Profile: Aries Lagna',
      birthDate: '2000-04-14',
      birthTime: '06:15:00',
      cityName: 'New Delhi',
      lat: 28.6139,
      lon: 77.209,
      tzId: 'Asia/Kolkata',
      timeCertainty: 'exact',
      ayanamsa: 'lahiri',
    },
  },
  {
    label: 'Scorpio Ascendant Test (London 1995)',
    profile: {
      name: 'Test Profile: International',
      birthDate: '1995-10-24',
      birthTime: '08:45:00',
      cityName: 'London',
      lat: 51.5074,
      lon: -0.1278,
      tzId: 'Europe/London',
      timeCertainty: 'exact',
      ayanamsa: 'lahiri',
    },
  },
];

const COMMON_TIMEZONES = [
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Europe/London',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'America/Toronto',
  'Australia/Sydney',
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  onSaveProfile,
}) => {
  const [name, setName] = useState(currentProfile.name);
  const [birthDate, setBirthDate] = useState(currentProfile.birthDate);
  const [birthTime, setBirthTime] = useState(currentProfile.birthTime);
  const [cityName, setCityName] = useState(currentProfile.cityName);
  const [lat, setLat] = useState(currentProfile.lat);
  const [lon, setLon] = useState(currentProfile.lon);
  const [tzId, setTzId] = useState(currentProfile.tzId);
  const [timeCertainty, setTimeCertainty] = useState(currentProfile.timeCertainty);
  const [ayanamsa, setAyanamsa] = useState<AyanamsaId>(currentProfile.ayanamsa);

  if (!isOpen) return null;

  const handleCitySelect = (cName: string) => {
    setCityName(cName);
    const city = CITIES.find((c) => c.name.toLowerCase() === cName.toLowerCase());
    if (city) {
      setLat(city.lat);
      setLon(city.lon);
      setTzId(city.tzId);
    }
  };

  const handlePresetSelect = (preset: UserProfileInput) => {
    setName(preset.name);
    setBirthDate(preset.birthDate);
    setBirthTime(preset.birthTime);
    setCityName(preset.cityName);
    setLat(preset.lat);
    setLon(preset.lon);
    setTzId(preset.tzId);
    setTimeCertainty(preset.timeCertainty);
    setAyanamsa(preset.ayanamsa);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      name: name.trim() || 'Anonymous User',
      birthDate,
      birthTime,
      cityName,
      lat: Number(lat),
      lon: Number(lon),
      tzId,
      timeCertainty,
      ayanamsa,
    });
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(10, 8, 22, 0.8)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: 16,
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 580,
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          boxShadow: '0 24px 48px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="serif-title" style={{ fontSize: 18, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Compass size={20} /> Onboarding: Birth Data & Preferences
            </h2>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              Enter any birth date, time, and coordinates. All calculations are executed pure-client with Swiss Ephemeris WASM.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Quick Profile Presets */}
        <div style={{ background: 'var(--surface-alt)', padding: 10, borderRadius: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Sparkles size={13} /> QUICK TEST PROFILES:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {PRESET_PROFILES.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePresetSelect(p.profile)}
                style={{
                  textAlign: 'left',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 6,
                  padding: '6px 10px',
                  fontSize: 11,
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>{p.label}</span>
                <span style={{ fontSize: 10, color: 'var(--teal)' }}>Load Profile →</span>
              </button>
            ))}
          </div>
        </div>

        {/* The Form */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Full Name */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-main)', marginBottom: 4, display: 'block' }}>
              Full Name:
            </label>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: 8, padding: '0 10px' }}>
              <User size={15} style={{ color: 'var(--text-muted)', marginRight: 8 }} />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aarav Sharma"
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  padding: '10px 0',
                  color: 'var(--text-main)',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Date & Time Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-main)', marginBottom: 4, display: 'block' }}>
                Birth Date:
              </label>
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: 8, padding: '0 10px' }}>
                <Calendar size={15} style={{ color: 'var(--text-muted)', marginRight: 8 }} />
                <input
                  type="date"
                  required
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    padding: '9px 0',
                    color: 'var(--text-main)',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-main)', marginBottom: 4, display: 'block' }}>
                Birth Time (HH:MM:SS):
              </label>
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: 8, padding: '0 10px' }}>
                <Clock size={15} style={{ color: 'var(--text-muted)', marginRight: 8 }} />
                <input
                  type="text"
                  required
                  value={birthTime}
                  onChange={(e) => setBirthTime(e.target.value)}
                  placeholder="09:30:00"
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    padding: '9px 0',
                    color: 'var(--text-main)',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          </div>

          {/* City / Place Search Dropdown & Coordinates */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-main)', marginBottom: 4, display: 'block' }}>
              Birth Place / City:
            </label>
            <div style={{ marginBottom: 10 }}>
              <GooglePlaceAutocomplete
                value={cityName}
                onPlaceSelect={(place) => {
                  setCityName(place.cityName);
                  setLat(place.lat);
                  setLon(place.lon);
                  setTzId(place.tzId);
                }}
                onTextChange={(txt) => setCityName(txt)}
                placeholder="Search birth city, town, or district worldwide…"
                showCurrentLocationBtn={true}
              />
            </div>

            {/* Custom Coordinates & Timezone Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 8 }}>
              <div>
                <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block' }}>Latitude (°N):</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={lat}
                  onChange={(e) => setLat(Number(e.target.value))}
                  style={{
                    width: '100%',
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    padding: '6px 8px',
                    fontSize: 11,
                    color: 'var(--text-main)',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block' }}>Longitude (°E):</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={lon}
                  onChange={(e) => setLon(Number(e.target.value))}
                  style={{
                    width: '100%',
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    padding: '6px 8px',
                    fontSize: 11,
                    color: 'var(--text-main)',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block' }}>Timezone (IANA):</label>
                <select
                  value={tzId}
                  onChange={(e) => setTzId(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    padding: '6px 6px',
                    fontSize: 11,
                    color: 'var(--text-main)',
                  }}
                >
                  {COMMON_TIMEZONES.map((tz) => (
                    <option key={tz} value={tz} style={{ background: '#201d40', color: '#f3eee2' }}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Time Certainty & Ayanamsa Options */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-main)', marginBottom: 4, display: 'block' }}>
                Time Certainty:
              </label>
              <select
                value={timeCertainty}
                onChange={(e) => setTimeCertainty(e.target.value as any)}
                style={{
                  width: '100%',
                  background: 'var(--surface-alt)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: 8,
                  fontSize: 12,
                  color: 'var(--text-main)',
                }}
              >
                <option value="exact">Exact (Calculates Ascendant & Houses)</option>
                <option value="approx">Approximate (±15 min)</option>
                <option value="unknown">Unknown (Moon Reference / Chandra Kundli)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-main)', marginBottom: 4, display: 'block' }}>
                Ayanamsa System:
              </label>
              <select
                value={ayanamsa}
                onChange={(e) => setAyanamsa(e.target.value as AyanamsaId)}
                style={{
                  width: '100%',
                  background: 'var(--surface-alt)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: 8,
                  fontSize: 12,
                  color: 'var(--text-main)',
                }}
              >
                <option value="lahiri">Lahiri (Chitra Paksha — Vedic Default)</option>
                <option value="kp_new">KP New (Krishnamurti Padhdhati)</option>
                <option value="raman">B.V. Raman</option>
                <option value="krishnamurti">Krishnamurti Original</option>
                <option value="yukteshwar">Sri Yukteshwar</option>
              </select>
            </div>
          </div>

          {/* Submit Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                background: 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                background: 'var(--gold)',
                border: 'none',
                color: '#15132b',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Sparkles size={15} /> Calculate Chart
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
