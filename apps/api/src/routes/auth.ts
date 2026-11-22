import type { AppRouter } from '../router/router.js';
import type { ServerContext } from '../types.js';
import { signJwt, verifyGoogleIdToken } from '../auth.js';

export function registerAuthRoutes(router: AppRouter, ctx: ServerContext) {
  // --- Google OAuth 2.0 Sign-In ---
  router.post('/api/auth/google', async (c) => {
    try {
      const body = c.body;
      let identity: { googleSub: string; email: string; name: string; picture?: string };
      if (body.idToken) {
        identity = await verifyGoogleIdToken(String(body.idToken));
      } else if (process.env.NODE_ENV !== 'production' && process.env.ALLOW_DEV_AUTH === 'true' && body.devEmail) {
        identity = {
          googleSub: `dev_${String(body.devEmail).replace(/[^a-z0-9]/gi, '_')}`,
          email: String(body.devEmail),
          name: String(body.devName || 'Dev User'),
        };
      } else {
        c.error('Missing Google idToken', 400);
        return;
      }
      const user = ctx.appDb.upsertUser(identity);
      const token = signJwt({ sub: user.id, email: user.email, name: user.name });
      const profiles = ctx.appDb.listProfilesForUser(user.id);
      c.json({ token, user, profiles }, 200);
    } catch (err: any) {
      c.error(err?.message ?? 'Google authentication failed', 401);
    }
  });

  // --- Current Authenticated User & Their Profile History ---
  router.get('/api/auth/me', (c) => {
    if (!c.authUser) {
      c.error('Not authenticated', 401);
      return;
    }
    const user = ctx.appDb.getUserById(c.authUser.sub);
    if (!user) {
      c.error('User not found', 401);
      return;
    }
    const profiles = ctx.appDb.listProfilesForUser(user.id);
    c.json({ user, profiles }, 200);
  });
}
