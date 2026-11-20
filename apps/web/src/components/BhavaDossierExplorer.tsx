import React, { useMemo } from 'react';
import {
  BookOpen,
  Compass,
  Star,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import {
  computeBhavaAnalysis,
  type NatalChart,
  type TransitOverview,
  type HouseDossier,
} from '@astro/engine';

interface BhavaDossierExplorerProps {
  natalChart: NatalChart;
  transits?: TransitOverview;
  selectedHouse: number;
  onSelectHouse: (houseNumber: number) => void;
}

export const BhavaDossierExplorer: React.FC<BhavaDossierExplorerProps> = ({
  natalChart,
  transits,
  selectedHouse,
  onSelectHouse,
}) => {
  const dossiers = useMemo(() => {
    return computeBhavaAnalysis(natalChart, transits);
  }, [natalChart, transits]);

  const activeDossier = dossiers.find((d) => d.houseNumber === selectedHouse) || dossiers[0]!;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 12 Houses Quick Selector Grid */}
      <div className="card" style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span className="serif-title" style={{ fontSize: 13, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Compass size={16} /> 12 Life Domains (Bhavas Selector)
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Select any house to explore its detailed reading
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
          {dossiers.map((d) => {
            const isSelected = d.houseNumber === selectedHouse;
            return (
              <button
                key={d.houseNumber}
                onClick={() => onSelectHouse(d.houseNumber)}
                style={{
                  background: isSelected ? 'var(--gold)' : 'var(--surface-alt)',
                  color: isSelected ? '#15132b' : 'var(--text-main)',
                  border: `1px solid ${isSelected ? 'var(--gold)' : 'var(--border-subtle)'}`,
                  borderRadius: 8,
                  padding: '6px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 2,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: 10, fontWeight: 700 }}>
                  <span>House {d.houseNumber}</span>
                  <span style={{ opacity: 0.8 }}>{d.savBindus} pts</span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                  {d.sanskritName.split(' ')[0]}
                </div>
                <div style={{ fontSize: 9, opacity: 0.75, textTransform: 'capitalize' }}>
                  {d.signName} (Lord: {d.lord.slice(0, 2).toUpperCase()})
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active House Deep-Dive Dossier */}
      <div className="card" style={{ borderLeft: '4px solid var(--gold)', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Dossier Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="gold-badge" style={{ fontSize: 11, fontWeight: 800 }}>
                HOUSE {activeDossier.houseNumber}
              </span>
              <h3 className="serif-title" style={{ fontSize: 18, color: 'var(--text-main)' }}>
                {activeDossier.sanskritName} — {activeDossier.domainTitle}
              </h3>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span>
                Cusp Sign: <strong style={{ color: 'var(--text-main)', textTransform: 'capitalize' }}>{activeDossier.signName}</strong>
              </span>
              <span>•</span>
              <span>
                Ruler: <strong style={{ color: 'var(--gold)', textTransform: 'capitalize' }}>{activeDossier.lord}</strong>
              </span>
              <span>•</span>
              <span>
                Ruler Placement: <strong style={{ color: 'var(--teal)' }}>House {activeDossier.lordHouse} ({activeDossier.lordSign})</strong>
              </span>
            </div>
          </div>

          <div
            style={{
              padding: '4px 10px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
              background:
                activeDossier.strengthRating === 'high'
                  ? 'rgba(95, 194, 179, 0.2)'
                  : activeDossier.strengthRating === 'moderate'
                  ? 'rgba(227, 173, 70, 0.2)'
                  : 'rgba(217, 119, 54, 0.2)',
              color:
                activeDossier.strengthRating === 'high'
                  ? 'var(--teal)'
                  : activeDossier.strengthRating === 'moderate'
                  ? 'var(--gold)'
                  : 'var(--amber)',
              border: `1px solid ${
                activeDossier.strengthRating === 'high'
                  ? 'var(--teal)'
                  : activeDossier.strengthRating === 'moderate'
                  ? 'var(--gold)'
                  : 'var(--amber)'
              }`,
            }}
          >
            SAV: {activeDossier.savBindus} Bindus ({activeDossier.strengthRating.replace('_', ' ')})
          </div>
        </div>

        {/* Theme Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {activeDossier.keyThemes.map((t) => (
            <span
              key={t}
              style={{
                fontSize: 10,
                padding: '3px 8px',
                borderRadius: 12,
                background: 'var(--surface-alt)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              #{t}
            </span>
          ))}
        </div>

        {/* 4 Quadrants: Natal Residents, Live Transits, Aspects, Strength */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
          {/* Natal Residents */}
          <div style={{ background: 'var(--surface-alt)', padding: 12, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)' }}>
              NATAL RESIDENTS (BIRTH)
            </span>
            {activeDossier.natalOccupants.length === 0 ? (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>None (Empty house, operates via lord)</span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {activeDossier.natalOccupants.map((o) => (
                  <span key={o.graha} style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-main)', textTransform: 'capitalize' }}>
                    ● {o.graha} ({o.degInSign.toFixed(1)}°){o.retrograde ? ' [Retrograde]' : ''}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Live Transiting Visitors */}
          <div style={{ background: 'var(--surface-alt)', padding: 12, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--teal)' }}>
              LIVE TRANSITING GRAHAS (GOCHAR)
            </span>
            {activeDossier.transitingOccupants.length === 0 ? (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No transiting planets here currently</span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {activeDossier.transitingOccupants.map((t) => (
                  <span key={t.graha} style={{ fontSize: 12, fontWeight: 600, color: 'var(--teal)', textTransform: 'capitalize' }}>
                    ● {t.graha} ({t.degInSign.toFixed(1)}°){t.retrograde ? ' [Retro]' : ''}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Incoming Aspects */}
          <div style={{ background: 'var(--surface-alt)', padding: 12, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--amber)' }}>
              INCOMING ASPECTS (GRAHA DRISHTI)
            </span>
            {activeDossier.aspectingPlanets.length === 0 ? (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No direct angular aspects</span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {activeDossier.aspectingPlanets.map((a, i) => (
                  <span key={i} style={{ fontSize: 11, color: 'var(--text-main)', textTransform: 'capitalize' }}>
                    → {a.graha} ({a.aspectType})
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* House Strength & Bindus */}
          <div style={{ background: 'var(--surface-alt)', padding: 12, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
              ASHTAKVARGA ENDOWMENT
            </span>
            <div style={{ fontSize: 16, fontWeight: 800, color: activeDossier.savBindus >= 30 ? 'var(--teal)' : 'var(--gold)' }}>
              {activeDossier.savBindus} / 56 Bindus
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {activeDossier.savBindus >= 30
                ? 'High planetary backing; manifests rewards with natural ease.'
                : activeDossier.savBindus >= 25
                ? 'Balanced potential; benefits from sustained consistency.'
                : 'Karmic growth ground; rewards deliberate effort and mastery.'}
            </span>
          </div>
        </div>

        {/* Synthesized Astrologer's Reading */}
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: 14, borderRadius: 8, borderLeft: '3px solid var(--gold)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <BookOpen size={14} /> Astrological Synthesis & Lived Experience
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-main)', lineHeight: 1.6, margin: 0 }}>
            {activeDossier.reading}
          </p>
        </div>
      </div>
    </div>
  );
};
