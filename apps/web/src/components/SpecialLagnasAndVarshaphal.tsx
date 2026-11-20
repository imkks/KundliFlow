import React, { useState, useEffect } from 'react';
import { Compass, Calendar, Sparkles } from 'lucide-react';
import type { NatalChart } from '@astro/engine';
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

  const birthYear = Number(natalChart.time.birthLocal.slice(0, 4)) || 1998;
  const yearOptions = Array.from({ length: 45 }, (_, i) => birthYear + i);

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
                  {varshaphal.annualChart.grahasList.slice(0, 9).map((g) => (
                    <tr key={g.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '6px 8px', fontWeight: 600, textTransform: 'capitalize' }}>
                        {g.name} {g.retrograde ? '(R)' : ''}
                      </td>
                      <td style={{ padding: '6px 8px' }}>{g.sign}</td>
                      <td style={{ padding: '6px 8px' }}>{g.degInSign.toFixed(2)}°</td>
                      <td style={{ padding: '6px 8px' }}>H{g.houses.houseFromLagna}</td>
                      <td style={{ padding: '6px 8px' }}>{g.nakshatra} (P{g.pada})</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Ephemeris loading…</div>
        )}
      </div>

      {/* 2. 12 Jaimini Arudha Padas */}
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
