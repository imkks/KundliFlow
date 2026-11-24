import React, { useState } from 'react';
import {
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  User,
  ShieldCheck,
  ArrowRight,
  Bot,
  Compass,
  Calculator,
} from 'lucide-react';
import type { UserProfileInput } from './OnboardingModal.tsx';
import type { ReadingDepth } from '../context/ReadingContext.tsx';
import { GooglePlaceAutocomplete } from './GooglePlaceAutocomplete.tsx';

interface FirstVisitOnboardingProps {
  onComplete: (profile: UserProfileInput, lens: ReadingDepth) => void;
}

const LENS_CHOICES: Array<{
  id: ReadingDepth;
  title: string;
  desc: string;
  Icon: React.FC<any>;
  accent: string;
}> = [
  {
    id: 'simple',
    title: 'Guided (AI-First)',
    desc: 'Learn about life events & today’s timing in plain English with AI.',
    Icon: Bot,
    accent: 'var(--teal)',
  },
  {
    id: 'standard',
    title: 'Chart Explorer',
    desc: 'Click houses, trace patterns, and learn what placements are doing.',
    Icon: Compass,
    accent: 'var(--gold)',
  },
  {
    id: 'detailed',
    title: 'Quant Pro',
    desc: 'Full degrees, Vargas, Shadbala, Ashtakvarga, KP & rule telemetry.',
    Icon: Calculator,
    accent: 'var(--amber)',
  },
];

export const FirstVisitOnboarding: React.FC<FirstVisitOnboardingProps> = ({
  onComplete,
}) => {
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('1995-08-15');
  const [birthTime, setBirthTime] = useState('09:30:00');
  const [timeCertainty, setTimeCertainty] = useState<'exact' | 'approx' | 'unknown'>('exact');
  const [selectedLens, setSelectedLens] = useState<ReadingDepth>('simple');
  const [place, setPlace] = useState<{ cityName: string; lat: number; lon: number; tzId: string }>({
    cityName: 'New Delhi, Delhi, India',
    lat: 28.6139,
    lon: 77.209,
    tzId: 'Asia/Kolkata',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(
      {
        name: name.trim() || 'My Natal Chart',
        birthDate,
        birthTime: timeCertainty === 'unknown' ? '12:00:00' : birthTime.length === 5 ? `${birthTime}:00` : birthTime,
        cityName: place.cityName,
        lat: place.lat,
        lon: place.lon,
        tzId: place.tzId || 'Asia/Kolkata',
        timeCertainty,
        ayanamsa: 'lahiri',
      },
      selectedLens,
    );
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        background:
          'radial-gradient(circle at top right, rgba(227, 173, 70, 0.12), transparent 45%), radial-gradient(circle at bottom left, rgba(95, 194, 179, 0.1), transparent 45%), var(--bg-ink)',
      }}
    >
      <div
        className="card"
        style={{
          width: 'min(980px, 100%)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 28,
          padding: 28,
          border: '1px solid var(--border)',
        }}
      >
        {/* Left Column: Value Proposition + Experience Lens Picker */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 18 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={20} style={{ color: 'var(--gold)' }} />
              <span className="serif-title" style={{ fontSize: 20, color: 'var(--gold)', fontWeight: 700 }}>
                MyAstro Almanac
              </span>
            </div>
            <h1 className="serif-title" style={{ fontSize: 26, lineHeight: 1.25, color: 'var(--text-main)', margin: 0 }}>
              Vedic Precision, Adapted to How You Read.
            </h1>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--text-muted)', margin: 0 }}>
              Choose your starting view below (you can switch anytime in the top bar without losing your place):
            </p>

            {/* 3-User Experience Lens Cards */}
            <div role="radiogroup" aria-label="Choose experience level" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              {LENS_CHOICES.map((lens) => {
                const isSelected = selectedLens === lens.id;
                const Icon = lens.Icon;
                return (
                  <button
                    key={lens.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setSelectedLens(lens.id)}
                    style={{
                      textAlign: 'left',
                      padding: '10px 12px',
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      background: isSelected ? 'rgba(95, 194, 179, 0.14)' : 'var(--surface-alt)',
                      border: isSelected ? `1px solid ${lens.accent}` : '1px solid var(--border-subtle)',
                      transition: 'all 0.16s ease',
                    }}
                  >
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--surface)',
                        color: lens.accent,
                      }}
                    >
                      <Icon size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: isSelected ? lens.accent : 'var(--text-main)' }}>
                        {lens.title}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.4, marginTop: 2 }}>
                        {lens.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ padding: 10, borderRadius: 10, background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)', fontSize: 11.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--teal)', fontWeight: 700, marginBottom: 3 }}>
                <ShieldCheck size={14} /> Step 2 of 2 · Saved to Your Account
              </div>
              <div style={{ color: 'var(--text-muted)', lineHeight: 1.45 }}>
                Your chart is calculated once, cached locally on this device, and synced under your signed-in account.
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Birth Details Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, justifyContent: 'center' }}>
          <div>
            <label htmlFor="onb-name" style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
              <User size={12} /> Full Name
            </label>
            <input
              id="onb-name"
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
              <label htmlFor="onb-date" style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                <Calendar size={12} /> Birth Date
              </label>
              <input
                id="onb-date"
                type="date"
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                style={{ width: '100%', padding: '9px 10px', borderRadius: 8, background: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-main)', fontSize: 13 }}
              />
            </div>

            <div>
              <label htmlFor="onb-time" style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                <Clock size={12} /> Birth Time
              </label>
              <input
                id="onb-time"
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
            <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>
              Birth Time Certainty:
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              {(
                [
                  { id: 'exact', label: 'Exact' },
                  { id: 'approx', label: 'Approx (±15m)' },
                  { id: 'unknown', label: 'Unknown (Moon Ref)' },
                ] as const
              ).map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setTimeCertainty(c.id)}
                  style={{
                    flex: 1,
                    padding: '7px 8px',
                    borderRadius: 7,
                    fontSize: 11.5,
                    fontWeight: 600,
                    background: timeCertainty === c.id ? 'var(--teal)' : 'var(--surface-alt)',
                    color: timeCertainty === c.id ? '#15132b' : 'var(--text-muted)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {c.label}
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
            <div style={{ display: 'flex', gap: 10, marginTop: 6, fontSize: 11, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
              <span>Lat: <strong style={{ color: 'var(--teal)' }}>{place.lat.toFixed(2)}°</strong></span>
              <span>•</span>
              <span>Lon: <strong style={{ color: 'var(--teal)' }}>{place.lon.toFixed(2)}°</strong></span>
              <span>•</span>
              <span>Timezone: <strong style={{ color: 'var(--teal)' }}>{place.tzId}</strong></span>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: '12px 16px', fontSize: 13.5, marginTop: 4 }}>
            Generate My Chart <ArrowRight size={15} />
          </button>
        </form>
      </div>
    </div>
  );
};
