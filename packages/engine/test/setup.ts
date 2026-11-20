import { readFile } from 'node:fs/promises';

// Node.js does not support fetch('file://...') for WASM files out of the box.
// This shim enables @swisseph/browser to load its local swisseph.wasm during Node/Vitest test runs.
const origFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if (url.startsWith('file:')) {
    const fileBytes = await readFile(new URL(url));
    return new Response(fileBytes, {
      headers: { 'content-type': 'application/wasm' },
    });
  }
  return origFetch(input, init);
};
