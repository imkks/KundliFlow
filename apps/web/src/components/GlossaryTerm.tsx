import React from 'react';
import { HelpCircle } from 'lucide-react';

const GLOSSARY: Record<string, string> = {
  BAV: 'Bhinna Ashtakavarga (0–8 bindus): higher scores (5–8) cushion difficult transits; 0–3 requires patience.',
  SAV: 'Sarvashtakavarga (average 28): total planetary support for each sign/house.',
  Tarabala: '9-star lunar compatibility cycle from your birth Nakshatra to today’s Moon Nakshatra.',
  Chandrabala: 'Today’s Moon house position counted from your birth Moon (1, 3, 6, 7, 10, 11 are supportive).',
  'Sade Sati': 'Saturn’s ~7.5-year transit through the 12th, 1st, and 2nd signs from your birth Moon.',
  Vargottama: 'A planet occupying the exact same zodiac sign in both D1 (Rashi) and D9 (Navamsha), giving extra stability.',
  Shadbala: 'Six-fold planetary strength measured in Rupas; ≥1.0x required means ample horsepower.',
  'Chara Karaka': 'Jaimini soul-significator planets ranked by degree (AK = Soul, AmK = Career, DK = Partner).',
  Muntha: 'The progressed Ascendant in Tajika Varshaphal (annual solar return), showing the year’s primary house focus.',
  SubLord: 'In KP astrology, the Nakshatra Sub-Lord acts as the final decider of whether a house’s promise manifests.',
};

export const GlossaryTerm: React.FC<{ term: string; children?: React.ReactNode }> = ({ term, children }) => {
  const tip = GLOSSARY[term];
  if (!tip) return <>{children ?? term}</>;
  return (
    <span
      title={tip}
      style={{
        borderBottom: '1px dotted rgba(212, 175, 55, 0.6)',
        cursor: 'help',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
      }}
    >
      {children ?? term}
      <HelpCircle size={11} style={{ color: 'var(--gold)', opacity: 0.75 }} />
    </span>
  );
};
