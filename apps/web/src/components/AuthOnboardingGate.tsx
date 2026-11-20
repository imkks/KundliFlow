import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, ShieldCheck, Users, Bot, Loader2, UserCheck } from 'lucide-react';
import { GOOGLE_CLIENT_ID } from '../config.ts';
import {
  loginWithGoogleIdToken,
  loginWithDevEmail,
  type AuthUser,
  type ServerProfileSummary,
} from '../services/apiClient.ts';

interface AuthOnboardingGateProps {
  onSuccess: (payload: { token: string; user: AuthUser; profiles: ServerProfileSummary[] }) => void;
}

export const AuthOnboardingGate: React.FC<AuthOnboardingGateProps> = ({ onSuccess }) => {
  const gsiBtnRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devEmail, setDevEmail] = useState('alice@local.test');
  const [devName, setDevName] = useState('Alice');

  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !gsiBtnRef.current) return;
    let timer: number | undefined;

    const initGsi = () => {
      const g = (window as any).google;
      if (!g?.accounts?.id || !gsiBtnRef.current) {
        timer = window.setTimeout(initGsi, 250);
        return;
      }
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
          width: 320,
          text: 'continue_with',
          shape: 'pill',
        });
      } catch {
        // ignore GIS error
      }
    };

    initGsi();
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [onSuccess]);

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devEmail.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await loginWithDevEmail(devEmail.trim(), devName.trim() || devEmail.split('@')[0]!);
      onSuccess(res);
    } catch (err: any) {
      setError(err?.message || 'Local dev login failed (ensure ALLOW_DEV_AUTH=true on backend).');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        background:
          'radial-gradient(circle at 20% 15%, rgba(212, 175, 55, 0.12), transparent 42%), radial-gradient(circle at 80% 85%, rgba(95, 194, 179, 0.12), transparent 45%), var(--bg-main)',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 460,
          padding: 30,
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          boxShadow: '0 20px 55px rgba(0, 0, 0, 0.55)',
        }}
      >
        {/* Brand Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'rgba(212, 175, 55, 0.14)',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--gold)',
            }}
          >
            <Sparkles size={26} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--teal)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Step 1 of 2 • Account Sign-In
            </div>
            <h1 className="serif-title" style={{ margin: '4px 0 6px', fontSize: 24, color: 'var(--gold)' }}>
              Welcome to KundliFlow
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Sign in or create your free account to access your Vedic charts, daily Panchang, Dashas, and personal AI Copilot.
            </p>
          </div>
        </div>

        {/* Value Highlights */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            padding: 12,
            borderRadius: 10,
            background: 'var(--surface-alt)',
            border: '1px solid var(--border-subtle)',
            fontSize: 12,
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={15} style={{ color: 'var(--teal)', flexShrink: 0 }} />
            <span>Save &amp; switch multiple birth charts under your Google account</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bot size={15} style={{ color: 'var(--gold)', flexShrink: 0 }} />
            <span>Isolated AI Astrologer conversation history per profile</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={15} style={{ color: 'var(--teal)', flexShrink: 0 }} />
            <span>Computed once on server, synced across Web &amp; Android</span>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '9px 12px',
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

        {/* Primary Google Sign-In / Create Account Button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '4px 0' }}>
          {GOOGLE_CLIENT_ID ? (
            <>
              <div ref={gsiBtnRef} style={{ minHeight: 44 }} />
              {loading && (
                <div style={{ fontSize: 12, color: 'var(--teal)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Loader2 size={14} className="spin" /> Signing in &amp; loading your saved charts…
                </div>
              )}
            </>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
              Configure <code>VITE_GOOGLE_CLIENT_ID</code> to enable Google Sign-In.
            </div>
          )}
        </div>

        {/* Localhost-only Dev Login for multi-account testing */}
        {isLocalhost && (
          <form
            onSubmit={handleDevLogin}
            style={{
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 9,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--teal)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <UserCheck size={13} /> Local Test Login (localhost only)
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
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="email"
                value={devEmail}
                onChange={(e) => setDevEmail(e.target.value)}
                placeholder="test@local.test"
                required
                style={{
                  flex: 1,
                  background: 'var(--surface-alt)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '7px 10px',
                  color: 'var(--text-main)',
                  fontSize: 12,
                }}
              />
              <button type="submit" className="btn btn-outline" disabled={loading} style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                {loading ? <Loader2 size={13} className="spin" /> : 'Test Sign In'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
