import React from 'react';
import type { ChalitChart } from '@astro/engine';
import { degToDms } from '@astro/engine';

interface ChalitTableProps {
  chalit: ChalitChart;
}

export const ChalitTable: React.FC<ChalitTableProps> = ({ chalit }) => {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 className="serif-title" style={{ fontSize: 14, color: 'var(--gold)' }}>
          Sripati Bhava Chalit Table
        </h3>
        <span className="gold-badge" style={{ fontSize: 10 }}>
          Bhava Madhya & Begin
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '6px 4px', color: 'var(--text-muted)' }}>Bhava</th>
              <th style={{ padding: '6px 4px', color: 'var(--text-muted)' }}>Sign</th>
              <th style={{ padding: '6px 4px', color: 'var(--text-muted)' }}>Bhava Begin</th>
              <th style={{ padding: '6px 4px', color: 'var(--teal)' }}>Bhava Madhya</th>
            </tr>
          </thead>
          <tbody>
            {chalit.bhavas.map((b) => (
              <tr key={b.bhava} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '6px 4px', fontWeight: 600 }}>House {b.bhava}</td>
                <td style={{ padding: '6px 4px', textTransform: 'capitalize' }}>{b.sign}</td>
                <td style={{ padding: '6px 4px', color: 'var(--text-muted)' }}>
                  {degToDms(b.bhavaBeginDeg % 30)}
                </td>
                <td style={{ padding: '6px 4px', color: 'var(--teal)', fontWeight: 600 }}>
                  {degToDms(b.midBhavaDeg % 30)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
