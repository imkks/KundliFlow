import React, { useState } from 'react';
import { Sparkles, Calendar, Clock, MapPin, User, ShieldCheck, ArrowRight } from 'lucide-react';
import type { UserProfileInput } from './OnboardingModal.tsx';
import { GooglePlaceAutocomplete } from './GooglePlaceAutocomplete.tsx';

interface FirstVisitOnboardingProps {
  onComplete: (profile: UserProfileInput) => void;
  onUseDemo: () => void;
}

export const FirstVisitOnboarding: React.FC<FirstVisitOnboardingProps> = ({
  onComplete,
  onUseDemo,
}) => {
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('1995-08-15');
  const [birthTime, setBirthTime] = useState('09:30:00');
  const [timeCertainty, setTimeCertainty] = useState<'exact' | 'approx' | 'unknown'>('exact');
  const [place, setPlace] = useState<{ cityName: string; lat: number; lon: number; tzId: string }>({
    cityName: 'New Delhi, Delhi, India',
    lat: 28.6139,
    lon: 77.209,
    tzId: 'Asia/Kolkata',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete({
      name: name.trim() || 'My Natal Chart',
      birthDate,
      birthTime: timeCertainty === 'unknown' ? '12:00:00' : birthTime.length === 5 ? `${birthTime}:00` : birthTime,
      cityName: place.cityName,
      lat: place.lat,
      lon: place.lon,
      tzId: place.tzId || 'Asia/Kolkata',
      timeCertainty,
      ayanamsa: 'lahiri',
    });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'radial-gradient(circle at top right, rgba(227, 173, 70, 0.12), transparent 45%), radial-gradient(circle at bottom left, rgba(95, 194, 179, 0.1), transparent 45%), var(--bg-ink)',
      }}
    >
      <div
        className="card"
        style={{
          width: 'min(920px, 100%)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 28,
          padding: 32,
          border: '1px solid var(--border)',
        }}
      >
        {/* Left Column: Value Proposition */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={20} style={{ color: 'var(--gold)' }} />
              <span className="serif-title" style={{ fontSize: 20, color: 'var(--gold)', fontWeight: 700 }}>
                MyAstro Almanac
              </span>
            </div>
            <h1 className="serif-title" style={{ fontSize: 28, lineHeight: 1.25, color: 'var(--text-main)', margin: 0 }}>
              Your Vedic Birth Chart, Translated into Plain English.
            </h1>
            <p style={{ fontSize: 13.5, lineHeight: 1.65, color: 'var(--text-muted)', margin: 0 }}>
              Swiss Ephemeris precision meets 328 deterministic Parashari rules, daily Muhurta rhythms, a life-pattern journal, and a verified AI Jyotish copilot.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ padding: 12, borderRadius: 10, background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)', fontSize: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--teal)', fontWeight: 700, marginBottom: 4 }}>
                <ShieldCheck size={14} /> Local-First &amp; Private by Default
              </div>
              <div style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Your birth details and journal stay on your device. Sign-in with Google Cloud Sync is optional and never required to use the app.
              </div>
            </div>

            <button
              type="button"
              onClick={onUseDemo}
              className="btn btn-outline"
              style={{ padding: '10px 14px', fontSize: 12.5, justifyContent: 'space-between' }}
            >
              <span>Want to explore first? Try Demo Chart</span>
              <ArrowRight size={14} style={{ color: 'var(--gold)' }} />
            </button>
          </div>
        </div>

        {/* Right Column: Birth Details Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
              <User size={12} /> Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Aarav Sharma"
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, background: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-main)', fontSize: 13 }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                <Calendar size={12} /> Birth Date
              </label>
              <input
                type="date"
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                style={{ width: '100%', padding: '9px 10px', borderRadius: 8, background: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-main)', fontSize: 13 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                <Clock size={12} /> Birth Time
              </label>
              <input
                type="time"
                step="1"
                disabled={timeCertainty === 'unknown'}
                value={birthTime}
                onChange={(e) => setBirthTime(e.target.value)}
                style={{ width: '100%', padding: '9px 10px', borderRadius: 8, background: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-main)', fontSize: 13, opacity: timeCertainty === 'unknown' ? 0.5 : 1 }}
              />
            </div>
          </div>

          <div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Time Certainty:</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['exact', 'approx', 'unknown'] as const).map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setTimeCertainty(c)}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    borderRadius: 7,
                    fontSize: 11.5,
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    background: timeCertainty === c ? 'var(--teal)' : 'var(--surface-alt)',
                    color: timeCertainty === c ? '#15132b' : 'var(--text-muted)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
              <MapPin size={12} /> Birth City / Location
            </label>
            <GooglePlaceAutocomplete
              value={place.cityName}
              onPlaceSelect={(p) => setPlace(p)}
              onTextChange={(txt) => setPlace((prev) => ({ ...prev, cityName: txt }))}
              placeholder="Search birth city, town, or use GPS…"
              showCurrentLocationBtn={true}
              autoRequestLocation={false}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 6, fontSize: 10.5, color: 'var(--text-muted)' }}>
              <span>Lat: <strong style={{ color: 'var(--teal)' }}>{place.lat.toFixed(2)}°</strong></span>
              <span>•</span>
              <span>Lon: <strong style={{ color: 'var(--teal)' }}>{place.lon.toFixed(2)}°</strong></span>
              <span>•</span>
              <span>Timezone: <strong style={{ color: 'var(--teal)' }}>{place.tzId}</strong></span>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: '11px 16px', fontSize: 13.5, marginTop: 4 }}>
            Generate My Cosmic Chart <ArrowRight size={15} />
          </button>
        </form>
      </div>
    </div>
  );
};
