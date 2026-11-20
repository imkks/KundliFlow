import React, { useState, useMemo } from 'react';
import {
  computeTemporalFriendship,
  computePanchadhaFriendship,
  type SevenGraha,
  SEVEN_GRAHAS,
} from '@astro/engine';
import { FRIENDSHIP_TABLE } from '@astro/content';

interface FriendshipMatrixProps {
  planetSigns?: Record<SevenGraha, number>;
}

type FriendshipMode = 'permanent' | 'temporal' | 'fivefold';

export const FriendshipMatrix: React.FC<FriendshipMatrixProps> = ({ planetSigns }) => {
  const [mode, setMode] = useState<FriendshipMode>('fivefold');

  const temporalMap = useMemo(() => {
    if (!planetSigns) return null;
    return computeTemporalFriendship(planetSigns);
  }, [planetSigns]);

  const fivefoldMap = useMemo(() => {
    if (!planetSigns) return null;
    return computePanchadhaFriendship(planetSigns);
  }, [planetSigns]);

  const modeTitle =
    mode === 'permanent'
      ? 'Permanent Friendship (Naisargika Maitri)'
      : mode === 'temporal'
      ? 'Temporal Friendship (Tatkalika Maitri)'
      : 'Five-fold Compound Friendship (Panchadha Maitri)';

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <h3 className="serif-title" style={{ fontSize: 14, color: 'var(--gold)' }}>
          {modeTitle}
        </h3>

        {/* Mode Selector */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--surface-alt)', padding: 2, borderRadius: 6 }}>
          <button
            onClick={() => setMode('fivefold')}
            style={{
              padding: '3px 8px',
              fontSize: 11,
              borderRadius: 4,
              background: mode === 'fivefold' ? 'var(--gold)' : 'transparent',
              color: mode === 'fivefold' ? '#15132b' : 'var(--text-muted)',
              fontWeight: mode === 'fivefold' ? 600 : 400,
            }}
          >
            5-Fold (Panchadha)
          </button>
          <button
            onClick={() => setMode('permanent')}
            style={{
              padding: '3px 8px',
              fontSize: 11,
              borderRadius: 4,
              background: mode === 'permanent' ? 'var(--gold)' : 'transparent',
              color: mode === 'permanent' ? '#15132b' : 'var(--text-muted)',
              fontWeight: mode === 'permanent' ? 600 : 400,
            }}
          >
            Permanent
          </button>
          <button
            onClick={() => setMode('temporal')}
            style={{
              padding: '3px 8px',
              fontSize: 11,
              borderRadius: 4,
              background: mode === 'temporal' ? 'var(--gold)' : 'transparent',
              color: mode === 'temporal' ? '#15132b' : 'var(--text-muted)',
              fontWeight: mode === 'temporal' ? 600 : 400,
            }}
          >
            Temporal
          </button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, textAlign: 'center' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '6px 4px', textAlign: 'left', color: 'var(--text-muted)' }}>Planet</th>
              {SEVEN_GRAHAS.map((p) => (
                <th key={p} style={{ padding: '6px 4px', textTransform: 'capitalize', color: 'var(--text-muted)' }}>
                  {p.slice(0, 3)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SEVEN_GRAHAS.map((p1) => (
              <tr key={p1} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '6px 4px', textAlign: 'left', fontWeight: 600, textTransform: 'capitalize' }}>
                  {p1}
                </td>
                {SEVEN_GRAHAS.map((p2) => {
                  if (p1 === p2) return <td key={p2} style={{ color: 'var(--text-muted)' }}>—</td>;

                  if (mode === 'permanent') {
                    const rel = FRIENDSHIP_TABLE[p1]?.[p2] || 'neutral';
                    const color = rel === 'friend' ? 'var(--teal)' : rel === 'enemy' ? 'var(--amber)' : 'inherit';
                    return (
                      <td key={p2} style={{ padding: '6px 4px', color, fontWeight: rel !== 'neutral' ? 600 : 400 }}>
                        {rel.charAt(0).toUpperCase() + rel.slice(1, 4)}
                      </td>
                    );
                  } else if (mode === 'temporal') {
                    const rel = temporalMap?.[p1]?.[p2] || 'enemy';
                    const color = rel === 'friend' ? 'var(--teal)' : 'var(--amber)';
                    return (
                      <td key={p2} style={{ padding: '6px 4px', color, fontWeight: 600 }}>
                        {rel === 'friend' ? 'Friend' : 'Enemy'}
                      </td>
                    );
                  } else {
                    // fivefold
                    const rel = fivefoldMap?.[p1]?.[p2] || 'neutral';
                    const label =
                      rel === 'great_friend'
                        ? 'Intimate'
                        : rel === 'friend'
                        ? 'Friend'
                        : rel === 'neutral'
                        ? 'Neutral'
                        : rel === 'enemy'
                        ? 'Enemy'
                        : 'Bitter';

                    const color =
                      rel === 'great_friend'
                        ? 'var(--teal)'
                        : rel === 'friend'
                        ? '#8ee4af'
                        : rel === 'neutral'
                        ? 'inherit'
                        : rel === 'enemy'
                        ? '#f38181'
                        : 'var(--amber)';

                    return (
                      <td key={p2} style={{ padding: '6px 4px', color, fontWeight: rel !== 'neutral' ? 600 : 400 }}>
                        {label}
                      </td>
                    );
                  }
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
