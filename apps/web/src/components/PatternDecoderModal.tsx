import React, { useMemo } from 'react';
import { X, GitBranch, Sparkles, Eye, Compass, Clock, ArrowRight } from 'lucide-react';
import {
  computeVedicAspects,
  degToDms,
  type NatalChart,
} from '@astro/engine';
import { useReading } from '../context/ReadingContext.tsx';

interface PatternDecoderModalProps {
  natalChart: NatalChart;
  charaKarakas: Record<string, string>;
}

const VEDIC_KEYS = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'] as const;

export const PatternDecoderModal: React.FC<PatternDecoderModalProps> = ({
  natalChart,
  charaKarakas,
}) => {
  const {
    patternTarget,
    closePatternDecoder,
    reading,
    openAskDrawer,
    setSelectedHouse,
    setSelectedPlanet,
    setActiveTab,
  } = useReading();

  const allAspects = useMemo(() => {
    try {
      return computeVedicAspects(natalChart.grahas);
    } catch {
      return [];
    }
  }, [natalChart]);

  if (!patternTarget) return null;

  const houses = reading?.houses ?? [];
  const planets = reading?.planets ?? [];
  const vargas = reading?.specials?.vargas ?? [];
  const strengthsList = reading?.strengths?.planets ?? [];

  let title = '';
  let subtitle = '';
  let askPrompt = '';
  const steps: Array<{ step: string; heading: string; detail: string; badge?: string }> = [];

  if (patternTarget.kind === 'house') {
    const hNum = patternTarget.house;
    const hData = houses.find((h: any) => h.house === hNum);
    const occupants = VEDIC_KEYS.filter(
      (k) => (natalChart.grahas[k]?.houses?.houseFromLagna ?? (natalChart.grahas[k] as any)?.houseFromLagna) === hNum,
    );
    const lordId = hData?.lord;
    const lordPlaced = hData?.lordPlacedHouse;
    const lordReading = planets.find((p: any) => p.planet === lordId);
    const incomingToOccupants = allAspects.filter((a: any) => occupants.includes(a.to));
    const incomingToLord = allAspects.filter((a: any) => a.to === lordId);

    title = `House ${hNum} Pattern Decoder`;
    subtitle = hData?.lifeArea ?? `Sign: ${hData?.sign ?? ''}`;
    askPrompt = `Explain the full causal chain of my House ${hNum} (${hData?.lifeArea ?? ''}): its sign ${hData?.sign}, lord ${lordId} in House ${lordPlaced}, and how it manifests in daily life.`;

    steps.push({
      step: '1. Sign & Atmosphere',
      heading: `${String(hData?.sign ?? '—').toUpperCase()} colors this arena`,
      detail: hData?.bottomLine ?? `House ${hNum} sets the tone for ${hData?.lifeArea ?? 'this life department'}.`,
      badge: hData?.tone,
    });

    steps.push({
      step: '2. Where the Energy Flows (Lordship)',
      heading: `Ruler ${String(lordId ?? '').toUpperCase()} sits in House ${lordPlaced ?? '—'}`,
      detail:
        hData?.bhavatBhavamNote ??
        `When House ${hNum}'s ruler sits in House ${lordPlaced}, results in ${hData?.lifeArea ?? 'this area'} express through House ${lordPlaced} themes${lordReading?.dignity ? ` (${lordReading.dignity} dignity)` : ''}.`,
      badge: lordReading?.dignity,
    });

    steps.push({
      step: '3. Occupants & Drishti (Aspects)',
      heading: occupants.length > 0 ? `Planets inside: ${occupants.map((o) => o.toUpperCase()).join(', ')}` : 'No planets inside (Lord leads solo)',
      detail:
        [...incomingToOccupants, ...incomingToLord].length > 0
          ? `Influenced by ${[...incomingToOccupants, ...incomingToLord]
              .slice(0, 4)
              .map((a: any) => `${String(a.from).toUpperCase()} → ${String(a.to).toUpperCase()} (${a.aspectName ?? a.type ?? 'Drishti'})`)
              .join(' • ')}`
          : 'Operates cleanly through its sign and house ruler without heavy cross-aspect interference.',
    });

    steps.push({
      step: '4. Support & Current Timing',
      heading: hData?.activeDashaNote ?? 'Baseline environmental support',
      detail:
        [hData?.environmentalSupport, hData?.doubleTransitNote, hData?.argalaNote].filter(Boolean).join(' ') ||
        'Look to the active Mahadasha/Antardasha of this house ruler or occupants to trigger major developments.',
    });
  } else if (patternTarget.kind === 'planet') {
    const pId = patternTarget.planet;
    const pData = planets.find((p: any) => p.planet === pId);
    const g = (natalChart.grahas as any)[pId];
    const pHouse = g?.houses?.houseFromLagna ?? (g as any)?.houseFromLagna ?? pData?.house;
    const vargaEntry = vargas.find((v: any) => v.planet === pId);
    const shadbalaEntry = strengthsList.find((s: any) => s.planet === pId);
    const incoming = allAspects.filter((a: any) => a.to === pId);
    const outgoing = allAspects.filter((a: any) => a.from === pId);

    title = `${pId.charAt(0).toUpperCase() + pId.slice(1)} Pattern Decoder`;
    subtitle = `${String(g?.sign ?? pData?.sign ?? '').toUpperCase()} • House ${pHouse} • ${g ? degToDms(g.degInSign) : ''}`;
    askPrompt = `What is ${pId} doing in my chart in House ${pHouse} (${g?.sign}), ruling Houses ${(pData?.ownedHouses ?? []).join(', ')}, and how does it behave in D9 (${vargaEntry?.d9 ?? ''})?`;

    steps.push({
      step: '1. Placement & Condition',
      heading: `${String(pData?.dignity ?? g?.dignity ?? 'neutral').toUpperCase()} in ${g?.nakshatra ?? pData?.nakshatra ?? ''}${g?.retrograde ? ' · Retrograde (Rx)' : ''}`,
      detail: pData?.bottomLine ?? `${pId} operates from House ${pHouse}.`,
      badge: charaKarakas[pId] ? `Karaka: ${charaKarakas[pId]}` : undefined,
    });

    steps.push({
      step: '2. Responsibilities (Houses Owned)',
      heading: pData?.ownedHouses?.length ? `Carries Houses ${pData.ownedHouses.map((h: number) => `H${h}`).join(' & ')} into H${pHouse}` : 'Shadow Node (acts through sign dispositor & aspects)',
      detail: pData?.functionalNote ?? 'Links the life departments it rules directly to the house where it sits.',
    });

    steps.push({
      step: '3. Aspect Network (Drishti)',
      heading: `Receives ${incoming.length} aspect${incoming.length === 1 ? '' : 's'} · Casts ${outgoing.length}`,
      detail:
        incoming.length > 0 || outgoing.length > 0
          ? [
              incoming.length > 0 ? `Receiving from: ${incoming.map((a: any) => String(a.from).toUpperCase()).join(', ')}` : null,
              outgoing.length > 0 ? `Influencing: ${outgoing.map((a: any) => String(a.to).toUpperCase()).join(', ')}` : null,
            ]
              .filter(Boolean)
              .join(' | ')
          : 'No classical mutual aspects.',
    });

    steps.push({
      step: '4. Inner Strength & D9 Navamsha',
      heading: vargaEntry ? `D9: ${vargaEntry.d9}${vargaEntry.vargottama ? ' (★ Vargottama)' : ''}` : 'Harmonic Maturity',
      detail:
        [
          shadbalaEntry ? `Shadbala Rank #${shadbalaEntry.rank} (${shadbalaEntry.ratio}x required, ${shadbalaEntry.baladi} age, ${shadbalaEntry.deeptadi} mood).` : null,
          pData?.vargaNote,
          pData?.pushkaraNote,
        ]
          .filter(Boolean)
          .join(' ') || 'Check D9 placement to judge long-term stamina.',
    });
  } else {
    const y = patternTarget.yoga;
    const involved: string[] = Array.isArray(y.planets) ? y.planets : [];
    title = y.name ?? 'Chart Pattern Decoder';
    subtitle = `${String(y.category ?? 'Pattern').toUpperCase()} • ${y.strength ?? 'Active'}`;
    askPrompt = `Walk me through how my ${y.name} works step-by-step in my chart and when I will feel it most strongly.`;

    steps.push({
      step: '1. Why This Forms in Your Chart',
      heading: y.category === 'dosha' ? 'Planetary Intensity / Friction Pattern' : 'Cooperative Planetary Alignment',
      detail: y.description ?? 'Formed by geometric relationship between planets/houses in your Rashi chart.',
      badge: y.strength,
    });

    if (involved.length > 0) {
      const planetLines = involved.map((pl) => {
        const key = pl.toLowerCase();
        const g = (natalChart.grahas as any)[key];
        const sb = strengthsList.find((s: any) => s.planet === key);
        if (!g) return pl;
        const h = g.houses?.houseFromLagna ?? (g as any).houseFromLagna ?? '?';
        return `${pl.toUpperCase()} in ${g.sign} (H${h}, ${g.dignity ?? 'neutral'}${sb ? `, Shadbala ${sb.ratio}x` : ''})`;
      });
      steps.push({
        step: '2. Participating Planets Under the Hood',
        heading: `${involved.length} Key Drivers`,
        detail: planetLines.join(' • '),
      });
    }

    steps.push({
      step: '3. Practical Meaning & Expression',
      heading: y.cancellationNote ? 'Classical Cancellation (Bhanga) Applies' : 'How It Shows Up in Real Life',
      detail: [y.plainMeaning ?? y.effect, y.cancellationNote].filter(Boolean).join(' — '),
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) closePatternDecoder();
      }}
    >
      <div className="modal-panel" style={{ maxWidth: 680 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ padding: 8, borderRadius: 10, background: 'rgba(227, 173, 70, 0.14)', color: 'var(--gold)' }}>
              <GitBranch size={19} />
            </div>
            <div>
              <h2 className="serif-title" style={{ margin: 0, fontSize: 17, color: 'var(--gold)' }}>
                {title}
              </h2>
              <div style={{ fontSize: 12, color: 'var(--teal)', textTransform: 'capitalize', marginTop: 2 }}>
                {subtitle}
              </div>
            </div>
          </div>
          <button type="button" onClick={closePatternDecoder} aria-label="Close pattern decoder" style={{ color: 'var(--text-muted)', padding: 6 }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {steps.map((s) => (
              <div
                key={s.step}
                style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'var(--surface-alt)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase' }}>
                    {s.step}
                  </span>
                  {s.badge && (
                    <span className="gold-badge" style={{ fontSize: 10.5, textTransform: 'capitalize' }}>
                      {s.badge}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-main)' }}>{s.heading}</div>
                <div style={{ fontSize: 12.5, lineHeight: 1.55, color: 'var(--text-muted)' }}>{s.detail}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10, paddingTop: 6 }}>
            {patternTarget.kind === 'yoga' && Array.isArray(patternTarget.yoga.planets) && patternTarget.yoga.planets[0] ? (
              <button
                type="button"
                onClick={() => {
                  const p = String(patternTarget.yoga.planets[0]).toLowerCase();
                  closePatternDecoder();
                  setSelectedPlanet(p);
                  setActiveTab('kundli');
                }}
                className="btn btn-outline"
              >
                <Compass size={14} /> Inspect {String(patternTarget.yoga.planets[0]).toUpperCase()} on Chart <ArrowRight size={13} />
              </button>
            ) : patternTarget.kind === 'house' ? (
              <button
                type="button"
                onClick={() => {
                  closePatternDecoder();
                  setSelectedHouse(patternTarget.house);
                  setActiveTab('kundli');
                }}
                className="btn btn-outline"
              >
                <Eye size={14} /> Highlight House {patternTarget.house}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  closePatternDecoder();
                  setActiveTab('timing');
                }}
                className="btn btn-outline"
              >
                <Clock size={14} /> Check When It Activates
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                closePatternDecoder();
                openAskDrawer(askPrompt);
              }}
              className="ask-ai-cta"
              style={{ padding: '8px 16px', fontSize: 12.5 }}
            >
              <Sparkles size={14} /> Ask AI About This Pattern
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
