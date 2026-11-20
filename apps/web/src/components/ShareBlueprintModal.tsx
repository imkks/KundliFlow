import React, { useState } from 'react';
import { X, Copy, CheckCircle2, Sparkles, Share2 } from 'lucide-react';
import type { NatalChart } from '@astro/engine';
import type { ReadingData } from '../context/ReadingContext.tsx';

interface ShareBlueprintModalProps {
  userName: string;
  natalChart: NatalChart;
  reading: ReadingData | null;
  charaKarakas: Record<string, string>;
  onClose: () => void;
}

export const ShareBlueprintModal: React.FC<ShareBlueprintModalProps> = ({
  userName,
  natalChart,
  reading,
  charaKarakas,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const ascSign = natalChart.lagna?.sign?.toUpperCase() ?? 'CHANDRA';
  const moonSign = natalChart.grahas.moon.sign.toUpperCase();
  const moonNak = natalChart.grahas.moon.nakshatra;
  const akPlanet = Object.entries(charaKarakas).find(([, code]) => code === 'AK')?.[0]?.toUpperCase() ?? '—';
  const amkPlanet = Object.entries(charaKarakas).find(([, code]) => code === 'AmK')?.[0]?.toUpperCase() ?? '—';
  const activeDasha = reading?.dashas?.[0]?.lord?.toUpperCase();
  const yoginiMaha = reading?.extendedDashas?.yogini?.maha;
  const topYoga = reading?.yogas?.find((y: any) => y.category !== 'dosha')?.name ?? 'Balanced Planetary Chart';
  const coreNature = reading?.overview?.coreNature ?? `${ascSign} Rising with Moon in ${moonSign} (${moonNak}).`;

  const shareText = [
    `✨ ${userName}'s Cosmic Blueprint`,
    `• Rising Sign (Lagna): ${ascSign}`,
    `• Moon & Star: ${moonSign} (${moonNak})`,
    `• Soul Planet (Atmakaraka): ${akPlanet} | Career (Amatyakaraka): ${amkPlanet}`,
    `• Signature Yoga: ${topYoga}`,
    activeDasha ? `• Current Chapter: ${activeDasha} Mahadasha${yoginiMaha ? ` / ${yoginiMaha} Yogini` : ''}` : null,
    ``,
    coreNature,
    `Computed with Swiss Ephemeris • MyAstro`,
  ]
    .filter(Boolean)
    .join('\n');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Shareable Cosmic Blueprint"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2500,
        background: 'rgba(10, 8, 22, 0.82)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(500px, 100%)',
          borderRadius: 18,
          background: 'linear-gradient(145deg, #241f49 0%, #15132b 100%)',
          border: '1px solid var(--gold)',
          padding: 24,
          boxShadow: '0 24px 60px rgba(0,0,0,0.65)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--gold)', fontWeight: 700, fontSize: 15 }}>
            <Share2 size={16} /> My Cosmic Blueprint Card
          </div>
          <button
            onClick={onClose}
            aria-label="Close Share Modal"
            style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Aesthetic Share Card */}
        <div
          style={{
            padding: 18,
            borderRadius: 14,
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(227, 173, 70, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: 'var(--teal)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Vedic Natal Signature
            </div>
            <h3 className="serif-title" style={{ fontSize: 20, color: 'var(--gold)', margin: '4px 0 0 0' }}>
              {userName}
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
            <div style={{ padding: 10, borderRadius: 8, background: 'var(--surface-alt)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Rising (Lagna)</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold)' }}>{ascSign}</div>
            </div>
            <div style={{ padding: 10, borderRadius: 8, background: 'var(--surface-alt)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Moon &amp; Nakshatra</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--teal)' }}>{moonSign} • {moonNak}</div>
            </div>
            <div style={{ padding: 10, borderRadius: 8, background: 'var(--surface-alt)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Soul &amp; Career Drivers</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>AK: {akPlanet} • AmK: {amkPlanet}</div>
            </div>
            <div style={{ padding: 10, borderRadius: 8, background: 'var(--surface-alt)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Signature Yoga</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)' }}>{topYoga}</div>
            </div>
          </div>

          <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: 'var(--text-main)' }}>
            <Sparkles size={13} style={{ color: 'var(--gold)', verticalAlign: 'middle', marginRight: 5 }} />
            {coreNature}
          </p>

          {activeDasha && (
            <div style={{ fontSize: 11.5, color: 'var(--teal)', fontWeight: 600 }}>
              Active Chapter: {activeDasha} Mahadasha{yoginiMaha ? ` • ${yoginiMaha} Yogini` : ''}
            </div>
          )}
        </div>

        <button onClick={handleCopy} className="btn btn-primary" style={{ padding: '10px 16px', fontSize: 13 }}>
          {copied ? <CheckCircle2 size={15} /> : <Copy size={15} />}
          {copied ? 'Copied Blueprint to Clipboard!' : 'Copy Shareable Summary'}
        </button>
      </div>
    </div>
  );
};
