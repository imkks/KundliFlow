import React, { useState, useEffect, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { useReading, type MainTab } from '../context/ReadingContext.tsx';

interface CommandItem {
  id: string;
  label: string;
  sublabel: string;
  group: 'Life Topics' | 'Navigation' | 'Modals & Tools' | 'Houses' | 'Planets';
  keywords: string;
  action: () => void;
}

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenShare: () => void;
}

const HOUSE_TITLES: Record<number, string> = {
  1: 'Self, Vitality & Path',
  2: 'Money, Speech & Family',
  3: 'Courage, Skills & Siblings',
  4: 'Home, Peace & Roots',
  5: 'Creativity, Learning & Joy',
  6: 'Work, Health & Obstacles',
  7: 'Partnerships & Marriage',
  8: 'Depth, Change & Shared Resources',
  9: 'Wisdom, Luck & Dharma',
  10: 'Career, Purpose & Reputation',
  11: 'Gains, Networks & Ambitions',
  12: 'Rest, Solitude & Release',
};

const PLANET_NAMES = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'];

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onOpenShare,
}) => {
  const [query, setQuery] = useState('');
  const {
    setActiveTab,
    setSelectedHouse,
    setSelectedPlanet,
    focusLifeTopic,
    openAskDrawer,
    openLifeEventModal,
    openQuantMatrix,
    openChartSystems,
    openGlossaryModal,
    openPatternDecoder,
  } = useReading();

  useEffect(() => {
    if (isOpen) setQuery('');
  }, [isOpen]);

  const items: CommandItem[] = useMemo(() => {
    const goTab = (tab: MainTab) => () => {
      setActiveTab(tab);
      onClose();
    };
    const goHouse = (h: number) => () => {
      setSelectedHouse(h);
      setActiveTab('kundli');
      onClose();
    };
    const goPlanet = (p: string) => () => {
      setSelectedPlanet(p);
      setActiveTab('kundli');
      onClose();
    };

    const list: CommandItem[] = [
      { id: 'topic-career', label: 'Career & Calling', sublabel: 'Jump to House 10 • Career, Purpose & Reputation', group: 'Life Topics', keywords: 'job work career promotion 10th d10', action: () => { focusLifeTopic('career'); onClose(); } },
      { id: 'topic-love', label: 'Love & Marriage', sublabel: 'Jump to House 7 • Marriage & Relationships', group: 'Life Topics', keywords: 'marriage love partner spouse 7th d9', action: () => { focusLifeTopic('love'); onClose(); } },
      { id: 'topic-wealth', label: 'Wealth & Assets', sublabel: 'Jump to House 2 • Money, Income & Savings', group: 'Life Topics', keywords: 'money wealth finance income 2nd 11th d2', action: () => { focusLifeTopic('wealth'); onClose(); } },
      { id: 'topic-peace', label: 'Home & Inner Peace', sublabel: 'Jump to House 4 • Home, Peace & Roots', group: 'Life Topics', keywords: 'home peace mother property health 4th', action: () => { focusLifeTopic('health'); onClose(); } },
      { id: 'topic-year', label: 'Year Ahead Cycle', sublabel: 'Varshaphal Muntha & Annual Cycle', group: 'Life Topics', keywords: 'year ahead varshaphal muntha annual', action: () => { focusLifeTopic('year'); onClose(); } },
      { id: 'tool-life-event', label: 'Decode a Life Event with AI', sublabel: 'Test past or future milestone dates against Dashas', group: 'Modals & Tools', keywords: 'life event milestone past future ai why happened', action: () => { onClose(); openLifeEventModal(); } },
      { id: 'tool-pattern', label: 'Trace Current House Pattern', sublabel: 'Open causal Pattern Decoder modal', group: 'Modals & Tools', keywords: 'pattern decode trace lordship aspect', action: () => { onClose(); openPatternDecoder({ kind: 'house', house: 1 }); } },
      { id: 'tool-quant', label: 'Quant Calculation Workbench', sublabel: 'Degrees, Shadbala, Ashtakvarga, Kakshya, 24 Horas', group: 'Modals & Tools', keywords: 'degrees shadbala ashtakvarga prastara kakshya vedha horas', action: () => { onClose(); openQuantMatrix('degrees'); } },
      { id: 'tool-systems', label: 'Chart Systems (Dual, Chalit, KP, Varshaphal)', sublabel: 'Inspect secondary Jyotish systems', group: 'Modals & Tools', keywords: 'dual transit chalit kp sublord varshaphal arudha', action: () => { onClose(); openChartSystems('dual'); } },
      { id: 'tool-glossary', label: 'Plain English Astrology Glossary', sublabel: 'Demystify every Vedic term', group: 'Modals & Tools', keywords: 'glossary meaning learn terms', action: () => { onClose(); openGlossaryModal({ category: 'kundli' }); } },
      { id: 'nav-today', label: 'Today Briefing & Windows', sublabel: 'Time quality score, best hours & daily check-in', group: 'Navigation', keywords: 'today hora rahu kalam panchang tarabala', action: goTab('today') },
      { id: 'nav-kundli', label: 'Kundli & Life Topics', sublabel: 'Interactive D1/D9 Kundli, Life Focuses & Inspector', group: 'Navigation', keywords: 'chart kundli lagna varga', action: goTab('kundli') },
      { id: 'nav-timing', label: 'Timing, Dashas & Muhurta', sublabel: 'Vimshottari, Yogini, Chara, Gochar & Calendar', group: 'Navigation', keywords: 'dasha timing gochar transit sade sati calendar muhurta', action: goTab('timing') },
      { id: 'nav-strengths', label: 'Yogas & Power', sublabel: 'Yogas, Doshas, Shadbala, Ashtakvarga & Karakas', group: 'Navigation', keywords: 'yoga dosha shadbala ashtakvarga sav karaka', action: goTab('strengths') },
      { id: 'nav-journal', label: 'Timeline & Personal Patterns', sublabel: 'Life milestones, check-ins & calibration', group: 'Navigation', keywords: 'journal timeline notes mood log calibration', action: goTab('journal') },
      { id: 'nav-ask', label: 'Ask AI Jyotish Copilot', sublabel: 'Chat with your chart using verified tool calls', group: 'Navigation', keywords: 'ai ask chat copilot question llm', action: () => { onClose(); openAskDrawer(); } },
      { id: 'nav-share', label: 'Share Cosmic Blueprint Card', sublabel: 'Generate a shareable summary of your chart', group: 'Navigation', keywords: 'share blueprint card export', action: () => { onClose(); onOpenShare(); } },
    ];

    for (let h = 1; h <= 12; h++) {
      list.push({
        id: `house-${h}`,
        label: `House ${h} — ${HOUSE_TITLES[h]}`,
        sublabel: 'Open in Chart Inspector',
        group: 'Houses',
        keywords: `house ${h} h${h} bhava ${HOUSE_TITLES[h]!.toLowerCase()}`,
        action: goHouse(h),
      });
    }

    for (const p of PLANET_NAMES) {
      list.push({
        id: `planet-${p}`,
        label: p.charAt(0).toUpperCase() + p.slice(1),
        sublabel: 'Inspect planetary placement & strength',
        group: 'Planets',
        keywords: `planet graha ${p}`,
        action: goPlanet(p),
      });
    }

    return list;
  }, [setActiveTab, setSelectedHouse, setSelectedPlanet, focusLifeTopic, openAskDrawer, openLifeEventModal, openQuantMatrix, openChartSystems, openGlossaryModal, openPatternDecoder, onClose, onOpenShare]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.slice(0, 12);
    return items
      .filter((i) => i.label.toLowerCase().includes(q) || i.sublabel.toLowerCase().includes(q) || i.keywords.includes(q))
      .slice(0, 14);
  }, [items, query]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Quick Search"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2600,
        background: 'rgba(10, 8, 22, 0.78)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '10vh',
        paddingLeft: 16,
        paddingRight: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(580px, 100%)',
          borderRadius: 16,
          background: 'var(--surface)',
          border: '1px solid var(--gold)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.65)',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <Search size={16} style={{ color: 'var(--gold)' }} />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'Enter' && filtered[0]) filtered[0].action();
            }}
            placeholder="Search career, life event, Saturn, house 7, KP, Shadbala…"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-main)',
              fontSize: 14,
            }}
          />
          <button onClick={onClose} aria-label="Close search" style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ maxHeight: 420, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', fontSize: 12.5, color: 'var(--text-muted)' }}>
              No matches for &ldquo;{query}&rdquo;. Try searching a planet, house number, or life topic.
            </div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                onClick={item.action}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '9px 12px',
                  borderRadius: 10,
                  background: 'transparent',
                  border: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  color: 'var(--text-main)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-alt)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.sublabel}</div>
                </div>
                <span className="gold-badge" style={{ fontSize: 10, padding: '2px 7px' }}>
                  {item.group}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
