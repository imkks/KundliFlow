import fs from 'node:fs';
import path from 'node:path';
import { createApiServer } from './server.js';

// Load local .env file if present (without overriding already-exported env vars)
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (key && val) {
      process.env[key] = val;
    }
  }
}

const PORT = Number(process.env.PORT ?? 8787);
const server = createApiServer();

server.listen(PORT, '0.0.0.0', () => {
  console.log(`KundliFlow API listening on http://0.0.0.0:${PORT}`);
});
