import React, { useState, useEffect, useMemo } from 'react';
import { Compass, Calendar, Sparkles, Shield, Coins, Crown, HeartHandshake, Eye, Target, Star, Award, Filter, Search } from 'lucide-react';
import { computeSpecialLagnas, computeAnnualSahams, houseFromSign, SIGNS, type NatalChart, type SahamResult } from '@astro/engine';
import { API_BASE_URL } from '../config.ts';

interface SpecialLagnasAndVarshaphalProps {
  profileId?: string | null;
  natalChart: NatalChart;
}

export const SpecialLagnasAndVarshaphal: React.FC<SpecialLagnasAndVarshaphalProps> = ({
  profileId,
  natalChart,
}) => {
  const currentYear = new Date().getFullYear();
  const [targetYear, setTargetYear] = useState<number>(currentYear);
  const [varshaphal, setVarshaphal] = useState<any>(null);
  const [arudhas, setArudhas] = useState<any[]>([]);
  const [upagrahas, setUpagrahas] = useState<any[]>([]);
  const [sahamCategoryFilter, setSahamCategoryFilter] = useState<string>('all');
  const [sahamSearch, setSahamSearch] = useState<string>('');

  useEffect(() => {
    if (!profileId) return;
    let cancelled = false;
    fetch(`${API_BASE_URL}/api/profiles/${encodeURIComponent(profileId)}/varshaphal?year=${targetYear}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) {
          if (data.varshaphal) setVarshaphal(data.varshaphal);
          if (Array.isArray(data.arudhas)) setArudhas(data.arudhas);
          if (Array.isArray(data.upagrahas)) setUpagrahas(data.upagrahas);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [profileId, targetYear]);

  const birthYear = Number(natalChart.time.birthLocal?.slice(0, 4)) || (currentYear - 28);
  const maxYear = Math.max(currentYear + 5, birthYear + 90);
  const numYears = Math.max(70, maxYear - birthYear + 1);
  const yearOptions = Array.from({ length: numYears }, (_, i) => birthYear + i);

  const specialLagnas = useMemo(() => {
    try {
      return computeSpecialLagnas(natalChart);
    } catch {
      return [];
    }
  }, [natalChart]);

  const sahamsList: SahamResult[] = useMemo(() => {
    if (varshaphal?.sahamsList && varshaphal.sahamsList.length > 0) {
      return varshaphal.sahamsList;
    }
    try {
      const sunH = houseFromSign(natalChart.grahas.sun.signIndex, natalChart.lagna?.signIndex ?? 0);
      const isDay = sunH >= 7 && sunH <= 12;
      return computeAnnualSahams(natalChart, isDay).sahamsList;
    } catch {
      return [];
    }
  }, [varshaphal, natalChart]);

  const filteredSahams = useMemo(() => {
    return sahamsList.filter((s) => {
      const matchCat = sahamCategoryFilter === 'all' || s.category === sahamCategoryFilter;
      const q = sahamSearch.trim().toLowerCase();
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.sanskritName.toLowerCase().includes(q) ||
        s.meaning.toLowerCase().includes(q) ||
        s.sign.toLowerCase().includes(q) ||
        s.lord.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [sahamsList, sahamCategoryFilter, sahamSearch]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: sahamsList.length };
    for (const s of sahamsList) {
      counts[s.category] = (counts[s.category] ?? 0) + 1;
    }
    return counts;
  }, [sahamsList]);

  const kendraTrikonaCount = useMemo(() => {
    return sahamsList.filter((s) => s.isKendraOrTrikona).length;
  }, [sahamsList]);

  const arudhaMap = useMemo(() => {
    const m = new Map<string, any>();
    for (const a of arudhas) {
      m.set(a.code, a);
    }
    return m;
  }, [arudhas]);

  const lagnaSignIndex = natalChart.lagna?.signIndex ?? 0;
  const house10Sign = SIGNS[(lagnaSignIndex + 9) % 12];
  const house7Sign = SIGNS[(lagnaSignIndex + 6) % 12];
  const house11Sign = SIGNS[(lagnaSignIndex + 10) % 12];

  const alDistanceNote = useMemo(() => {
    const al = arudhaMap.get('AL');
    if (!al) return 'Public perception directly mirrors your authentic self.';
    const hFromL = al.houseFromLagna;
    if ([1, 4, 7, 10].includes(hFromL)) {
      return `Arudha Lagna in Kendra (House ${hFromL}): Your public reputation strongly reinforces your natural identity and actions. What people see is very true to who you are.`;
    }
    if ([5, 9].includes(hFromL)) {
      return `Arudha Lagna in Trikona (House ${hFromL}): Society naturally views your character with grace, goodwill, and auspicious alignment.`;
    }
    if ([6, 8, 12].includes(hFromL)) {
      return `Arudha Lagna in Dusthana (House ${hFromL}): A classical Maya gap — the public may misinterpret your motivations, or your outward social persona operates in a completely different sphere from your private reality.`;
    }
    return `Arudha Lagna in House ${hFromL}: Your social standing grows steadily over time through continuous effort, persistence, and community engagement.`;
  }, [arudhaMap]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 1. Tajika Varshaphal (Annual Solar Return) */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={17} style={{ color: 'var(--gold)' }} />
              Tajika Varshaphal (Annual Solar Return)
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              Exact Solar Return chart when transiting Sun returns to your natal Sun degree.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Target Year:</label>
            <select
              value={targetYear}
              onChange={(e) => setTargetYear(Number(e.target.value))}
              style={{
                background: 'var(--surface-alt)',
                color: 'var(--text-main)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '5px 10px',
                fontSize: 12,
              }}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y} (Age {y - birthYear})
                </option>
              ))}
            </select>
          </div>
        </div>

        {varshaphal ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
              <div style={{ padding: 10, borderRadius: 10, background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Varsha Pravesh</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', marginTop: 2 }}>
                  {varshaphal.varshaPraveshLocal.slice(0, 16).replace('T', ' ')}
                </div>
              </div>
              <div style={{ padding: 10, borderRadius: 10, background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Varsha Lagna</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', marginTop: 2 }}>
                  {varshaphal.varshaLagnaSign}
                </div>
              </div>
              <div style={{ padding: 10, borderRadius: 10, background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Muntha Placement</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--teal)', marginTop: 2 }}>
                  {varshaphal.munthaSign} (H{varshaphal.munthaHouseInVarsha})
                </div>
              </div>
              <div style={{ padding: 10, borderRadius: 10, background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Vara Pati / Muntha Lord</div>
                <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'capitalize', color: 'var(--text-main)', marginTop: 2 }}>
                  {varshaphal.varaPati} / {varshaphal.munthaLord}
                </div>
              </div>
              {varshaphal.varsheshwara && (
                <div style={{ padding: 10, borderRadius: 10, background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Varsheshwara (Year Lord)</div>
                  <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'capitalize', color: 'var(--gold)', marginTop: 2 }}>
                    {varshaphal.varsheshwara} {varshaphal.isDayReturn !== undefined ? `(${varshaphal.isDayReturn ? 'Day' : 'Night'})` : ''}
                  </div>
                </div>
              )}
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '6px 8px' }}>Graha</th>
                    <th style={{ padding: '6px 8px' }}>Annual Sign</th>
                    <th style={{ padding: '6px 8px' }}>Deg</th>
                    <th style={{ padding: '6px 8px' }}>Annual House</th>
                    <th style={{ padding: '6px 8px' }}>Nakshatra</th>
                  </tr>
                </thead>
                <tbody>
                  {((varshaphal.annualChart?.grahasList && Array.isArray(varshaphal.annualChart.grahasList))
                    ? varshaphal.annualChart.grahasList
                    : Object.values(varshaphal.annualChart?.grahas ?? {})
                  ).slice(0, 9).map((g: any) => (
                    <tr key={g.id || g.name} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '6px 8px', fontWeight: 600, textTransform: 'capitalize' }}>
                        {g.name} {g.retrograde ? '(R)' : ''}
                      </td>
                      <td style={{ padding: '6px 8px' }}>{g.sign}</td>
                      <td style={{ padding: '6px 8px' }}>
                        {typeof g.degInSign === 'number' ? g.degInSign.toFixed(2) : (g.lon ? (g.lon % 30).toFixed(2) : '0.00')}°
                      </td>
                      <td style={{ padding: '6px 8px' }}>H{g.houses?.houseFromLagna ?? g.house ?? '—'}</td>
                      <td style={{ padding: '6px 8px' }}>{g.nakshatra ?? '—'} (P{g.pada ?? 1})</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tajika Sahams Matrix */}
            {sahamsList.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12, paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 14.5, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 7 }}>
                      <Target size={16} /> Tajika Sahams (36 Sensitive Points • Table 74)
                    </h4>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                      Specific life event triggers derived via day/night polarities with the classical +30° arc rule (PVR Rao Ch. 28).
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span className="teal-badge" style={{ fontSize: 11 }}>
                      {kendraTrikonaCount} in Kendra/Trikona
                    </span>
                    <span className="gold-badge" style={{ fontSize: 11 }}>
                      36 Classical Sahams
                    </span>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                    {[
                      { id: 'all', label: 'All', count: categoryCounts.all ?? 36 },
                      { id: 'vital', label: 'Vital', count: categoryCounts.vital ?? 0 },
                      { id: 'wealth', label: 'Wealth', count: categoryCounts.wealth ?? 0 },
                      { id: 'career', label: 'Career', count: categoryCounts.career ?? 0 },
                      { id: 'relationship', label: 'Rel', count: categoryCounts.relationship ?? 0 },
                      { id: 'family', label: 'Family', count: categoryCounts.family ?? 0 },
                      { id: 'spirituality', label: 'Spirit', count: categoryCounts.spirituality ?? 0 },
                      { id: 'adversity', label: 'Adversity', count: categoryCounts.adversity ?? 0 },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSahamCategoryFilter(cat.id)}
                        style={{
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: sahamCategoryFilter === cat.id ? 700 : 500,
                          background: sahamCategoryFilter === cat.id ? 'var(--gold)' : 'var(--surface-alt)',
                          color: sahamCategoryFilter === cat.id ? '#120f24' : 'var(--text-muted)',
                          border: '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                        }}
                      >
                        {cat.label} ({cat.count})
                      </button>
                    ))}
                  </div>

                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Search size={13} style={{ position: 'absolute', left: 8, color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Search saham, sign, lord..."
                      value={sahamSearch}
                      onChange={(e) => setSahamSearch(e.target.value)}
                      style={{
                        padding: '4px 8px 4px 26px',
                        borderRadius: 6,
                        fontSize: 11.5,
                        background: 'var(--surface-alt)',
                        color: 'var(--text-main)',
                        border: '1px solid var(--border-subtle)',
                        width: 170,
                      }}
                    />
                  </div>
                </div>

                {/* Sahams Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 10 }}>
                  {filteredSahams.map((s) => {
                    const isKendra = [1, 4, 7, 10].includes(s.houseFromLagna);
                    const isTrikona = [5, 9].includes(s.houseFromLagna);
                    const isUpachaya = [3, 6, 11].includes(s.houseFromLagna);
                    const houseColor = isKendra ? 'var(--teal)' : isTrikona ? 'var(--gold)' : isUpachaya ? '#82a0ff' : '#ff8282';
                    const houseBg = isKendra ? 'rgba(95, 194, 179, 0.14)' : isTrikona ? 'rgba(227, 173, 70, 0.16)' : isUpachaya ? 'rgba(130, 160, 255, 0.14)' : 'rgba(255, 100, 100, 0.14)';
                    const houseLabel = isKendra ? 'Kendra' : isTrikona ? 'Trikona' : isUpachaya ? 'Upachaya' : 'Dusthana';

                    return (
                      <div
                        key={s.id}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 10,
                          background: 'var(--surface-alt)',
                          border: s.id === 'punya' || s.id === 'karma' || s.id === 'artha' || s.id === 'vivaha' || s.id === 'rajya'
                            ? '1px solid rgba(227, 173, 70, 0.45)'
                            : '1px solid var(--border-subtle)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                          <div>
                            <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-main)' }}>
                              {s.name} Saham
                            </span>
                            <span style={{ fontSize: 10.5, color: 'var(--text-muted)', marginLeft: 6 }}>
                              {s.sanskritName}
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: 9.5,
                              padding: '2px 6px',
                              borderRadius: 4,
                              textTransform: 'uppercase',
                              fontWeight: 700,
                              background: s.fructification === 'high' ? 'rgba(95, 194, 179, 0.16)' : s.fructification === 'moderate' ? 'rgba(227, 173, 70, 0.16)' : 'rgba(140, 140, 160, 0.16)',
                              color: s.fructification === 'high' ? 'var(--teal)' : s.fructification === 'moderate' ? 'var(--gold)' : 'var(--text-muted)',
                            }}
                          >
                            ● {s.fructification}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                          <span style={{ fontWeight: 600, color: 'var(--gold)' }}>
                            {s.formatted}
                          </span>
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 4,
                              background: houseBg,
                              color: houseColor,
                            }}
                          >
                            H{s.houseFromLagna} ({houseLabel})
                          </span>
                        </div>

                        <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                          {s.meaning}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10.5, color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 5 }}>
                          <span>
                            Lord: <strong style={{ color: 'var(--text-main)', textTransform: 'capitalize' }}>{s.lord}</strong>
                            {s.lordHarshaBala !== undefined ? ` (HB ${s.lordHarshaBala}/20)` : ''}
                          </span>
                          {s.arcRuleApplied && (
                            <span style={{ color: 'var(--gold)', fontSize: 9.5, fontStyle: 'italic' }}>
                              +30° arc rule
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Ephemeris loading…</div>
        )}
      </div>

      {/* 2. Special Reference Ascendants (Jaimini & Parashara Special Lagnas) */}
      {specialLagnas.length > 0 && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Crown size={17} style={{ color: 'var(--gold)' }} />
              Special Reference Ascendants (Jaimini &amp; Parashara Special Lagnas)
            </h3>
            <span className="teal-badge" style={{ fontSize: 11 }}>PVR Rao Ch. 5 • Dr. K.S. Charak Ch. XI/XXI</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
            Special mathematical reference points calibrated from sunrise for targeted life departments: financial accumulation (Hora Lagna), leadership &amp; public power (Ghati Lagna), Lakshmi prosperity (Sree Lagna), and secret wealth reserves (Indu Lagna).
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(215px, 1fr))', gap: 10 }}>
            {specialLagnas.map((sl) => (
              <div
                key={sl.id}
                style={{
                  padding: 10,
                  borderRadius: 10,
                  background: 'var(--surface-alt)',
                  border: sl.code === 'HL' || sl.code === 'GL' || sl.code === 'IL' ? '1px solid var(--gold)' : '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: 'var(--gold)', fontSize: 13 }}>
                    {sl.code} • {sl.name}
                  </span>
                  <span className="badge" style={{ fontSize: 10 }}>
                    {sl.sign} {sl.degInSign.toFixed(1)}°
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  H{sl.houseFromLagna} from Lagna • {sl.nakshatra}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-main)', marginTop: 2, lineHeight: 1.35 }}>
                  {sl.signification}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Perception vs. Reality: The 3-Plane Reality Radar */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Eye size={17} style={{ color: 'var(--purple, #a78bfa)' }} />
            Perception vs. Reality (Maya vs. Sat)
          </h3>
          <span className="gold-badge" style={{ fontSize: 11 }}>Jaimini Arudha Philosophy</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
          In classical Vedic astrology, physical houses represent tangible ground reality (Sat), while Arudha Padas represent how society perceives and projects upon you (Maya). Contrasting both clarifies where public standing aligns with or diverges from personal truth.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
          {/* Identity & Self */}
          <div style={{ padding: 12, borderRadius: 10, background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-main)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Identity &amp; Life Path</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Self vs Public Status</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11.5 }}>
              <div style={{ padding: 8, borderRadius: 8, background: 'var(--surface)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 10, textTransform: 'uppercase' }}>Ground Reality (Lagna)</div>
                <div style={{ fontWeight: 600, marginTop: 2 }}>{natalChart.lagna?.sign} (House 1)</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2 }}>Physical health, authentic self &amp; nature</div>
              </div>
              <div style={{ padding: 8, borderRadius: 8, background: 'var(--surface)' }}>
                <div style={{ color: 'var(--gold)', fontSize: 10, textTransform: 'uppercase' }}>Social Image (Arudha AL)</div>
                <div style={{ fontWeight: 600, marginTop: 2 }}>
                  {arudhaMap.get('AL')?.sign || '—'} (H{arudhaMap.get('AL')?.houseFromLagna || '—'})
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2 }}>Public reputation, brand &amp; outward projection</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
              {alDistanceNote}
            </div>
          </div>

          {/* Career & Office */}
          <div style={{ padding: 12, borderRadius: 10, background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-main)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Career &amp; Vocation</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Daily Karma vs Office</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11.5 }}>
              <div style={{ padding: 8, borderRadius: 8, background: 'var(--surface)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 10, textTransform: 'uppercase' }}>Daily Work (10th House)</div>
                <div style={{ fontWeight: 600, marginTop: 2 }}>{house10Sign} (H10)</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2 }}>Actual work duties, effort &amp; daily karma</div>
              </div>
              <div style={{ padding: 8, borderRadius: 8, background: 'var(--surface)' }}>
                <div style={{ color: 'var(--gold)', fontSize: 10, textTransform: 'uppercase' }}>Career Prestige (A10)</div>
                <div style={{ fontWeight: 600, marginTop: 2 }}>
                  {arudhaMap.get('A10')?.sign || '—'} (H{arudhaMap.get('A10')?.houseFromLagna || '—'})
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2 }}>Title, authority &amp; professional standing</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
              10th house shows what you do each day; A10 (Rajyapada) shows the status, prestige, and influence the world perceives you carrying.
            </div>
          </div>

          {/* Marriage & Relationships */}
          <div style={{ padding: 12, borderRadius: 10, background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-main)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Union &amp; Marriage</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Partner vs Marriage Status</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11.5 }}>
              <div style={{ padding: 8, borderRadius: 8, background: 'var(--surface)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 10, textTransform: 'uppercase' }}>Partner Nature (7th House)</div>
                <div style={{ fontWeight: 600, marginTop: 2 }}>{house7Sign} (H7)</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2 }}>Partner temperament &amp; interpersonal chemistry</div>
              </div>
              <div style={{ padding: 8, borderRadius: 8, background: 'var(--surface)' }}>
                <div style={{ color: 'var(--gold)', fontSize: 10, textTransform: 'uppercase' }}>Marriage Standing (UL)</div>
                <div style={{ fontWeight: 600, marginTop: 2 }}>
                  {arudhaMap.get('UL')?.sign || '—'} (H{arudhaMap.get('UL')?.houseFromLagna || '—'})
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2 }}>Upapada endurance, family bond &amp; social standing</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
              7th house reveals who your partner is; Upapada Lagna (UL) reveals the durability, longevity, and social anchoring of the marital bond.
            </div>
          </div>

          {/* Inflows & Wealth */}
          <div style={{ padding: 12, borderRadius: 10, background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-main)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Wealth &amp; Prosperity</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Cash Flow vs Visible Wealth</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11.5 }}>
              <div style={{ padding: 8, borderRadius: 8, background: 'var(--surface)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 10, textTransform: 'uppercase' }}>Actual Gains (11th House)</div>
                <div style={{ fontWeight: 600, marginTop: 2 }}>{house11Sign} (H11)</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2 }}>Realized financial gains &amp; network earnings</div>
              </div>
              <div style={{ padding: 8, borderRadius: 8, background: 'var(--surface)' }}>
                <div style={{ color: 'var(--gold)', fontSize: 10, textTransform: 'uppercase' }}>Visible Assets (A11)</div>
                <div style={{ fontWeight: 600, marginTop: 2 }}>
                  {arudhaMap.get('A11')?.sign || '—'} (H{arudhaMap.get('A11')?.houseFromLagna || '—'})
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2 }}>Labhapada tangible assets, properties &amp; visible wealth</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
              11th house is the actual flow of incoming resources; A11 is the tangible, publicly visible prosperity and lifestyle assets.
            </div>
          </div>
        </div>
      </div>

      {/* 4. 12 Jaimini Arudha Padas */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Compass size={17} style={{ color: 'var(--teal)' }} />
          Jaimini Arudha Padas (AL, A2–A11, UL)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(195px, 1fr))', gap: 8 }}>
          {arudhas.map((a) => (
            <div
              key={a.code}
              style={{
                padding: 10,
                borderRadius: 10,
                background: 'var(--surface-alt)',
                border: a.code === 'AL' || a.code === 'UL' ? '1px solid var(--gold)' : '1px solid var(--border-subtle)',
                fontSize: 12,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                <span style={{ color: 'var(--gold)' }}>{a.code}</span>
                <span>{a.sign} (H{a.houseFromLagna})</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>
                {a.name.split('—')[1]?.replace(')', '').trim() || a.name} • Lord: {a.lord}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. 7 Upagrahas */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={17} style={{ color: 'var(--amber)' }} />
          Upagrahas (Aprakasha &amp; Saturnian Sub-Planets)
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '6px 8px' }}>Upagraha</th>
                <th style={{ padding: '6px 8px' }}>Sign</th>
                <th style={{ padding: '6px 8px' }}>Deg</th>
                <th style={{ padding: '6px 8px' }}>House</th>
                <th style={{ padding: '6px 8px' }}>Nakshatra</th>
                <th style={{ padding: '6px 8px' }}>Formula</th>
              </tr>
            </thead>
            <tbody>
              {upagrahas.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '6px 8px', fontWeight: 600 }}>{u.name}</td>
                  <td style={{ padding: '6px 8px' }}>{u.sign}</td>
                  <td style={{ padding: '6px 8px' }}>{u.degInSign}°</td>
                  <td style={{ padding: '6px 8px' }}>H{u.houseFromLagna}</td>
                  <td style={{ padding: '6px 8px' }}>{u.nakshatra}</td>
                  <td style={{ padding: '6px 8px', color: 'var(--text-muted)' }}>{u.formula}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
