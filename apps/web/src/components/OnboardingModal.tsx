import React, { useState, useEffect } from 'react';
import {
  User,
  Calendar,
  Clock,
  Compass,
  Sparkles,
  X,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
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
  mode?: 'add' | 'edit';
  defaultExpandedAdvanced?: boolean;
  onClose: () => void;
  currentProfile: UserProfileInput;
  onSaveProfile: (profile: UserProfileInput, mode: 'add' | 'edit') => void;
}

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
  'UTC',
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  mode = 'edit',
  defaultExpandedAdvanced = false,
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
  const [showAdvanced, setShowAdvanced] = useState(defaultExpandedAdvanced);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setShowAdvanced(defaultExpandedAdvanced || (mode === 'edit' && currentProfile.ayanamsa !== 'lahiri'));
    if (mode === 'add') {
      setName('');
      setBirthDate('1995-08-15');
      setBirthTime('09:30:00');
      setCityName('New Delhi, Delhi, India');
      setLat(28.6139);
      setLon(77.209);
      setTzId('Asia/Kolkata');
      setTimeCertainty('exact');
      setAyanamsa('lahiri');
    } else {
      setName(currentProfile.name);
      setBirthDate(currentProfile.birthDate);
      setBirthTime(currentProfile.birthTime);
      setCityName(currentProfile.cityName);
      setLat(currentProfile.lat);
      setLon(currentProfile.lon);
      setTzId(currentProfile.tzId);
      setTimeCertainty(currentProfile.timeCertainty);
      setAyanamsa(currentProfile.ayanamsa);
    }
  }, [isOpen, mode, currentProfile, defaultExpandedAdvanced]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedTime = timeCertainty === 'unknown'
      ? '12:00:00'
      : birthTime.length === 5
      ? `${birthTime}:00`
      : birthTime;
    if (!/^\d{2}:\d{2}(:\d{2})?$/.test(normalizedTime)) {
      setErrorMsg('Please enter birth time in HH:MM or HH:MM:SS format.');
      return;
    }
    if (!Number.isFinite(Number(lat)) || Number(lat) < -90 || Number(lat) > 90) {
      setErrorMsg('Latitude must be between -90 and 90.');
      return;
    }
    if (!Number.isFinite(Number(lon)) || Number(lon) < -180 || Number(lon) > 180) {
      setErrorMsg('Longitude must be between -180 and 180.');
      return;
    }
    onSaveProfile(
      {
        name: name.trim() || 'My Chart',
        birthDate,
        birthTime: normalizedTime,
        cityName: cityName.trim() || 'New Delhi',
        lat: Number(lat),
        lon: Number(lon),
        tzId,
        timeCertainty,
        ayanamsa,
      },
      mode,
    );
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'add' ? 'Add New Birth Chart' : 'Edit Birth Chart'}
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-panel" style={{ maxWidth: 560 }}>
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h2 className="serif-title" style={{ fontSize: 17, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <Compass size={19} />
              {mode === 'add' ? 'Add New Birth Chart' : `Edit Birth Chart · ${currentProfile.name}`}
            </h2>
            <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 3 }}>
              Computed with Swiss Ephemeris precision on the MyAstro engine.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chart dialog"
            style={{ color: 'var(--text-muted)', padding: 6, borderRadius: 8 }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {errorMsg && (
            <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(217, 119, 54, 0.14)', border: '1px solid var(--amber)', color: 'var(--amber)', fontSize: 12 }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label htmlFor="prof-name" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-main)', marginBottom: 4, display: 'block' }}>
                Full Name
              </label>
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: 8, padding: '0 10px' }}>
                <User size={15} style={{ color: 'var(--text-muted)', marginRight: 8 }} />
                <input
                  id="prof-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Aarav Sharma"
                  style={{ flex: 1, background: 'transparent', border: 'none', padding: '10px 0', color: 'var(--text-main)', fontSize: 13, outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label htmlFor="prof-date" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-main)', marginBottom: 4, display: 'block' }}>
                  Birth Date
                </label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: 8, padding: '0 10px' }}>
                  <Calendar size={15} style={{ color: 'var(--text-muted)', marginRight: 8 }} />
                  <input
                    id="prof-date"
                    type="date"
                    required
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    style={{ flex: 1, background: 'transparent', border: 'none', padding: '9px 0', color: 'var(--text-main)', fontSize: 13, outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="prof-time" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-main)', marginBottom: 4, display: 'block' }}>
                  Birth Time
                </label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: 8, padding: '0 10px' }}>
                  <Clock size={15} style={{ color: 'var(--text-muted)', marginRight: 8 }} />
                  <input
                    id="prof-time"
                    type="time"
                    step="1"
                    disabled={timeCertainty === 'unknown'}
                    value={birthTime.slice(0, 8)}
                    onChange={(e) => setBirthTime(e.target.value)}
                    style={{ flex: 1, background: 'transparent', border: 'none', padding: '9px 0', color: 'var(--text-main)', fontSize: 13, outline: 'none', opacity: timeCertainty === 'unknown' ? 0.5 : 1 }}
                  />
                </div>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-main)', marginBottom: 4, display: 'block' }}>
                Birth Place / City
              </label>
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
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>
                {lat.toFixed(2)}° N, {lon.toFixed(2)}° E • {tzId} • Ayanamsa: <strong style={{ color: 'var(--teal)', textTransform: 'uppercase' }}>{ayanamsa}</strong>
              </div>
            </div>

            <div>
              <label htmlFor="prof-certainty" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-main)', marginBottom: 4, display: 'block' }}>
                Birth Time Certainty
              </label>
              <select
                id="prof-certainty"
                value={timeCertainty}
                onChange={(e) => setTimeCertainty(e.target.value as any)}
                style={{ width: '100%', background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: 8, padding: 8, fontSize: 12.5, color: 'var(--text-main)' }}
              >
                <option value="exact">Exact (Calculates Ascendant &amp; Houses)</option>
                <option value="approx">Approximate (±15 min)</option>
                <option value="unknown">Unknown (Moon Reference / Chandra Kundli)</option>
              </select>
            </div>

            {/* Progressive Disclosure for Expert Coordinates & Ayanamsa */}
            <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '8px 12px', background: 'rgba(42, 38, 82, 0.45)' }}>
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                aria-expanded={showAdvanced}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, fontWeight: 600, color: 'var(--teal)' }}
              >
                <span>Calculation &amp; Coordinate Settings (Lat/Lon, TZ, Ayanamsa)</span>
                {showAdvanced ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              </button>

              {showAdvanced && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 8 }}>
                    <div>
                      <label style={{ fontSize: 10.5, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Latitude (°N)</label>
                      <input
                        type="number"
                        step="0.0001"
                        required
                        value={lat}
                        onChange={(e) => setLat(Number(e.target.value))}
                        style={{ width: '100%', background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 8px', fontSize: 11.5, color: 'var(--text-main)' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 10.5, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Longitude (°E)</label>
                      <input
                        type="number"
                        step="0.0001"
                        required
                        value={lon}
                        onChange={(e) => setLon(Number(e.target.value))}
                        style={{ width: '100%', background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 8px', fontSize: 11.5, color: 'var(--text-main)' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 10.5, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Timezone (IANA)</label>
                      <select
                        value={COMMON_TIMEZONES.includes(tzId) ? tzId : 'CUSTOM'}
                        onChange={(e) => {
                          if (e.target.value !== 'CUSTOM') setTzId(e.target.value);
                        }}
                        style={{ width: '100%', background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px', fontSize: 11.5, color: 'var(--text-main)' }}
                      >
                        {!COMMON_TIMEZONES.includes(tzId) && <option value="CUSTOM">{tzId}</option>}
                        {COMMON_TIMEZONES.map((tz) => (
                          <option key={tz} value={tz} style={{ background: '#201d40', color: '#f3eee2' }}>
                            {tz}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                      Ayanamsa System
                    </label>
                    <select
                      value={ayanamsa}
                      onChange={(e) => setAyanamsa(e.target.value as AyanamsaId)}
                      style={{ width: '100%', background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: 8, padding: 8, fontSize: 12, color: 'var(--text-main)' }}
                    >
                      <option value="lahiri">Lahiri (Chitra Paksha — Vedic Default)</option>
                      <option value="kp_new">KP New (Krishnamurti Padhdhati)</option>
                      <option value="kp_old">KP Original (Krishnamurti Traditional)</option>
                      <option value="raman">B.V. Raman</option>
                      <option value="yukteshwar">Sri Yukteshwar</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
              <button type="button" onClick={onClose} className="btn btn-outline">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ padding: '9px 18px' }}>
                <Sparkles size={14} /> {mode === 'add' ? 'Create & Calculate' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
