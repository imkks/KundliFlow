import React from 'react';
import { X, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useReading } from '../context/ReadingContext.tsx';

export const DoshaAuditModal: React.FC = () => {
  const { doshaAuditOpen, setDoshaAuditOpen, reading } = useReading();

  if (!doshaAuditOpen) return null;

  const yogasReadings = reading?.yogas ?? [];
  const cancelledDoshas = yogasReadings.filter(
    (y: any) => y.category === 'dosha' && (y.strength === 'cancelled' || y.cancellationNote),
  );
  const clearedDoshas = yogasReadings.filter(
    (y: any) => y.category === 'dosha' && y.presence === false,
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Dosha Cancellations and Absent Checks"
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) setDoshaAuditOpen(false);
      }}
    >
      <div className="modal-panel" style={{ maxWidth: 740 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ padding: 8, borderRadius: 10, background: 'rgba(95, 194, 179, 0.14)', color: 'var(--teal)' }}>
              <ShieldCheck size={19} />
            </div>
            <div>
              <h2 className="serif-title" style={{ margin: 0, fontSize: 17, color: 'var(--gold)' }}>
                Dosha Cancellations (Bhanga) &amp; Clean Checks
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                Classical neutralization checks verified against your Rashi and Navamsha placements.
              </p>
            </div>
          </div>
          <button type="button" onClick={() => setDoshaAuditOpen(false)} aria-label="Close Dosha Audit" style={{ color: 'var(--text-muted)', padding: 6 }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {cancelledDoshas.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase' }}>
                ✓ Cancelled by Classical Bhanga ({cancelledDoshas.length})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
                {cancelledDoshas.map((y: any) => (
                  <div
                    key={y.id}
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      background: 'var(--surface-alt)',
                      border: '1px solid rgba(95, 194, 179, 0.35)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 5,
                      fontSize: 12,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                      <strong style={{ color: 'var(--teal)' }}>✓ {y.name}</strong>
                      <span className="teal-badge" style={{ fontSize: 10 }}>Neutralized</span>
                    </div>
                    <div style={{ color: 'var(--text-muted)', lineHeight: 1.45 }}>{y.description}</div>
                    {y.cancellationNote && (
                      <div style={{ color: 'var(--gold)', fontSize: 11.5, fontWeight: 600 }}>
                        Reason: {y.cancellationNote}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {clearedDoshas.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase' }}>
                ✓ Verified Absent Doshas ({clearedDoshas.length})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 8 }}>
                {clearedDoshas.map((y: any) => (
                  <div
                    key={y.id}
                    style={{
                      padding: 11,
                      borderRadius: 9,
                      background: 'var(--surface-alt)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      fontSize: 11.5,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                      <strong style={{ color: 'var(--text-main)' }}>{y.name}</strong>
                      <span className="teal-badge" style={{ fontSize: 10 }}>
                        <CheckCircle2 size={11} /> Absent
                      </span>
                    </div>
                    <div style={{ color: 'var(--text-muted)', lineHeight: 1.4 }}>{y.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {cancelledDoshas.length === 0 && clearedDoshas.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
              No cancelled or absent dosha records found in this reading.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
