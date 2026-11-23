import type { EphemerisProvider } from '@astro/engine';
import type { Rule, StrengthConfig } from '@astro/rules';
import type { LlmClient } from '@astro/agent';
import type { AppDatabase } from './db.js';
import type { AuthTokenPayload } from './auth.js';

export interface ServerContext {
  appDb: AppDatabase;
  getServerEphemeris: (providerId?: any) => Promise<EphemerisProvider>;
  rules: Rule[];
  rulesVersion: string;
  strengthConfig: StrengthConfig;
  kb: any;
  getLlmClient: () => LlmClient;
  aggregateLevel1And2: (profile: any, providedLevel1?: any) => Promise<{ level1: any; level2: any }>;
  canAccessProfile: (profile: any, user: AuthTokenPayload | null) => boolean;
}
