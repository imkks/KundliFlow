import React, { useEffect, useRef, useState } from 'react';
import { X, ShieldCheck, Loader2, Sparkles, UserCheck } from 'lucide-react';
import { GOOGLE_CLIENT_ID } from '../config.ts';
import {
  loginWithGoogleIdToken,
  loginWithDevEmail,
  type AuthUser,
  type ServerProfileSummary,
} from '../services/apiClient.ts';

interface GoogleAuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (payload: { token: string; user: AuthUser; profiles: ServerProfileSummary[] }) => void;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({ open, onClose, onSuccess }) => {
  const gsiBtnRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devEmail, setDevEmail] = useState('alice@local.test');
  const [devName, setDevName] = useState('Alice (Local Test)');

  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  useEffect(() => {
    if (!open || !GOOGLE_CLIENT_ID || !gsiBtnRef.current) return;
    const g = (window as any).google;
    if (!g?.accounts?.id) return;

    try {
      g.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response: any) => {
          if (!response?.credential) return;
          setLoading(true);
          setError(null);
          try {
            const res = await loginWithGoogleIdToken(response.credential);
            onSuccess(res);
            onClose();
          } catch (err: any) {
            setError(err?.message || 'Google sign-in failed.');
          } finally {
            setLoading(false);
          }
        },
      });
      gsiBtnRef.current.innerHTML = '';
      g.accounts.id.renderButton(gsiBtnRef.current, {
        theme: 'filled_black',
        size: 'large',
        width: 300,
        text: 'continue_with',
        shape: 'pill',
      });
    } catch {
      // ignore GIS init error
    }
  }, [open, onClose, onSuccess]);

  if (!open) return null;

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devEmail.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await loginWithDevEmail(devEmail.trim(), devName.trim() || devEmail.split('@')[0]!);
      onSuccess(res);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Local dev login failed (ensure ALLOW_DEV_AUTH=true on backend).');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 120,
        background: 'rgba(8, 10, 20, 0.78)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 420,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close sign in"
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          <X size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'rgba(212, 175, 55, 0.14)',
              border: '1px solid rgba(212, 175, 55, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--gold)',
            }}
          >
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="serif-title" style={{ margin: 0, fontSize: 18, color: 'var(--gold)' }}>
              Sign in to KundliFlow
            </h2>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Sync your saved charts, profile history &amp; AI chats
            </div>
          </div>
        </div>

        <div
          style={{
            padding: 10,
            borderRadius: 8,
            background: 'var(--surface-alt)',
            border: '1px solid var(--border-subtle)',
            fontSize: 11.5,
            color: 'var(--text-muted)',
            display: 'flex',
            gap: 8,
            alignItems: 'flex-start',
          }}
        >
          <ShieldCheck size={16} style={{ color: 'var(--teal)', flexShrink: 0, marginTop: 1 }} />
          <span>
            Each Google account keeps its own private list of birth profiles. Switching profiles loads only that profile&apos;s chart data and AI conversation.
          </span>
        </div>

        {error && (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              background: 'rgba(217, 119, 54, 0.14)',
              border: '1px solid var(--amber)',
              color: 'var(--amber)',
              fontSize: 12,
            }}
          >
            {error}
          </div>
        )}

        {GOOGLE_CLIENT_ID ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div ref={gsiBtnRef} />
            {loading && (
              <div style={{ fontSize: 12, color: 'var(--teal)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Loader2 size={14} className="spin" /> Signing in…
              </div>
            )}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '6px 0' }}>
            Google Sign-In activates automatically once <code>VITE_GOOGLE_CLIENT_ID</code> is configured.
          </div>
        )}

        {isLocalhost && (
          <form
            onSubmit={handleDevLogin}
            style={{
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--teal)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <UserCheck size={14} /> Local Dev Login (Test Multiple Accounts)
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                { email: 'alice@local.test', name: 'Alice' },
                { email: 'bob@local.test', name: 'Bob' },
              ].map((preset) => (
                <button
                  type="button"
                  key={preset.email}
                  onClick={() => {
                    setDevEmail(preset.email);
                    setDevName(preset.name);
                  }}
                  style={{
                    fontSize: 11,
                    padding: '3px 9px',
                    borderRadius: 12,
                    background: devEmail === preset.email ? 'rgba(95, 194, 179, 0.2)' : 'var(--surface-alt)',
                    color: devEmail === preset.email ? 'var(--teal)' : 'var(--text-muted)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                  }}
                >
                  {preset.name} ({preset.email})
                </button>
              ))}
            </div>
            <input
              type="email"
              value={devEmail}
              onChange={(e) => setDevEmail(e.target.value)}
              placeholder="test@local.test"
              required
              style={{
                background: 'var(--surface-alt)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '8px 10px',
                color: 'var(--text-main)',
                fontSize: 12.5,
              }}
            />
            <input
              type="text"
              value={devName}
              onChange={(e) => setDevName(e.target.value)}
              placeholder="Display Name"
              style={{
                background: 'var(--surface-alt)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '8px 10px',
                color: 'var(--text-main)',
                fontSize: 12.5,
              }}
            />
            <button type="submit" className="btn" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? <Loader2 size={14} className="spin" /> : 'Continue as Local Test Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
