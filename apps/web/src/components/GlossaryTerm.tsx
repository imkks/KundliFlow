import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, BookOpen, Sparkles, X } from 'lucide-react';
import { useReading } from '../context/ReadingContext.tsx';

const GLOSSARY: Record<string, { tip: string; category: string }> = {
  BAV: {
    tip: 'Bhinna Ashtakavarga (0–8 bindus): higher scores (5–8) cushion difficult transits; 0–3 requires patience.',
    category: 'strengths',
  },
  SAV: {
    tip: 'Sarvashtakavarga (average 28): total planetary support across 12 signs/houses (337 total bindus).',
    category: 'strengths',
  },
  Tarabala: {
    tip: '9-star lunar compatibility cycle counted from your birth Nakshatra to today’s Moon Nakshatra.',
    category: 'panchang',
  },
  Chandrabala: {
    tip: 'Today’s Moon house position counted from your birth Moon (houses 1, 3, 6, 7, 10, 11 are supportive).',
    category: 'panchang',
  },
  'Sade Sati': {
    tip: 'Saturn’s ~7.5-year transit through the 12th, 1st, and 2nd signs from your birth Moon.',
    category: 'timequality',
  },
  Vargottama: {
    tip: 'A planet occupying the exact same zodiac sign in both D1 (Rashi) and D9 (Navamsha), giving extra stability.',
    category: 'kundli',
  },
  Shadbala: {
    tip: 'Six-fold planetary strength measured in Rupas; ≥1.0x required means ample horsepower.',
    category: 'strengths',
  },
  'Chara Karaka': {
    tip: 'Jaimini soul-significator planets ranked by degree (AK = Soul, AmK = Career, DK = Partner).',
    category: 'insights',
  },
  Muntha: {
    tip: 'The progressed Ascendant in Tajika Varshaphal (annual solar return), showing the year’s primary house focus.',
    category: 'kundli',
  },
  SubLord: {
    tip: 'In KP astrology, the Nakshatra Sub-Lord acts as the final decider of whether a house’s promise manifests.',
    category: 'kundli',
  },
};

export const GlossaryTerm: React.FC<{ term: string; children?: React.ReactNode }> = ({ term, children }) => {
  const entry = GLOSSARY[term];
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement | null>(null);
  const { openGlossaryModal, openAskDrawer } = useReading();

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    window.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      window.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  if (!entry) return <>{children ?? term}</>;

  return (
    <span ref={wrapRef} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        aria-label={`Explain ${term}`}
        style={{
          borderBottom: '1px dotted rgba(227, 173, 70, 0.7)',
          color: 'inherit',
          fontWeight: 'inherit',
          fontSize: 'inherit',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 3,
          padding: '1px 2px',
          borderRadius: 4,
        }}
      >
        <span>{children ?? term}</span>
        <HelpCircle size={12} style={{ color: 'var(--gold)', opacity: 0.85 }} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={`${term} explanation`}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 1800,
            width: 'min(290px, 82vw)',
            padding: 12,
            borderRadius: 12,
            background: '#1a1738',
            border: '1px solid var(--gold)',
            boxShadow: '0 14px 36px rgba(0, 0, 0, 0.72)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            textAlign: 'left',
            fontWeight: 400,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: 12.5, color: 'var(--gold)' }}>{term}</strong>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close definition" style={{ color: 'var(--text-muted)', padding: 2 }}>
              <X size={13} />
            </button>
          </div>
          <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: 'var(--text-main)' }}>
            {entry.tip}
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, paddingTop: 4, borderTop: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                openGlossaryModal({ category: entry.category, term });
              }}
              style={{ fontSize: 11, fontWeight: 700, color: 'var(--teal)', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <BookOpen size={12} /> Full Guide
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                openAskDrawer(`Explain what ${term} means specifically in my chart in simple terms.`);
              }}
              style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <Sparkles size={12} /> Ask AI
            </button>
          </div>
        </div>
      )}
    </span>
  );
};
