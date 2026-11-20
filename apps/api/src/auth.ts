import crypto from 'node:crypto';
import type http from 'node:http';

export interface AuthTokenPayload {
  sub: string; // internal user id
  email: string;
  name: string;
  iat: number;
  exp: number;
}

const DEFAULT_SECRET = process.env.JWT_SECRET || 'myastro-local-dev-secret-change-in-prod';

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
}

export function signJwt(
  payload: Omit<AuthTokenPayload, 'iat' | 'exp'>,
  ttlSeconds = 60 * 60 * 24 * 30, // 30 days
  secret = DEFAULT_SECRET,
): string {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: AuthTokenPayload = {
    ...payload,
    iat: now,
    exp: now + ttlSeconds,
  };
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify(fullPayload));
  const sig = base64UrlEncode(crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest());
  return `${header}.${body}.${sig}`;
}

export function verifyJwt(token: string, secret = DEFAULT_SECRET): AuthTokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts as [string, string, string];
    const expected = base64UrlEncode(crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest());
    if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return null;
    }
    const payload = JSON.parse(base64UrlDecode(body)) as AuthTokenPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function extractAuthUser(req: http.IncomingMessage): AuthTokenPayload | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return verifyJwt(authHeader.slice(7).trim());
}

export interface VerifiedGoogleIdentity {
  googleSub: string;
  email: string;
  name: string;
  picture?: string;
}

/**
 * Verifies a Google ID Token (from Web GSI or Android Credential Manager) via Google's tokeninfo endpoint.
 */
export async function verifyGoogleIdToken(
  idToken: string,
  expectedClientId = process.env.GOOGLE_CLIENT_ID,
): Promise<VerifiedGoogleIdentity> {
  const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Invalid Google ID token (HTTP ${res.status})`);
  }
  const info = (await res.json()) as any;
  if (!info.sub || !info.email) {
    throw new Error('Google token missing required sub/email claims');
  }
  if (expectedClientId && info.aud !== expectedClientId) {
    throw new Error('Google token audience mismatch');
  }
  return {
    googleSub: String(info.sub),
    email: String(info.email),
    name: String(info.name || info.email.split('@')[0]),
    picture: info.picture ? String(info.picture) : undefined,
  };
}
