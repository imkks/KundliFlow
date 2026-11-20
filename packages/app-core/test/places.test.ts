import { describe, it, expect } from 'vitest';
import { StaticCityProvider, getPlaceProvider, setPlaceProvider } from '../src/index.js';

describe('Place Provider Suite', () => {
  it('defaults to Jamshedpur as requested', async () => {
    const provider = getPlaceProvider();
    const def = await provider.getDefault();
    expect(def.id).toBe('jamshedpur');
    expect(def.name).toBe('Jamshedpur');
    expect(def.lat).toBeCloseTo(22.8, 2);
    expect(def.lon).toBeCloseTo(86.166667, 4);
    expect(def.tzId).toBe('Asia/Kolkata');
  });

  it('searches cities by prefix or admin region', async () => {
    const provider = new StaticCityProvider();
    const results = await provider.search('Jam');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0]?.id).toBe('jamshedpur');

    const ranchi = await provider.search('Jharkhand');
    expect(ranchi.map((c) => c.id)).toContain('jamshedpur');
    expect(ranchi.map((c) => c.id)).toContain('ranchi');
  });

  it('allows swapping place providers cleanly', async () => {
    const mockProvider = {
      async search() {
        return [];
      },
      async getById() {
        return null;
      },
      async getDefault() {
        return {
          id: 'mock-place',
          name: 'Mock Place',
          country: 'IN',
          lat: 20.0,
          lon: 80.0,
          tzId: 'Asia/Kolkata',
          source: 'Mock',
        };
      },
    };

    setPlaceProvider(mockProvider);
    expect((await getPlaceProvider().getDefault()).id).toBe('mock-place');

    // Restore
    setPlaceProvider(new StaticCityProvider());
    expect((await getPlaceProvider().getDefault()).id).toBe('jamshedpur');
  });
});
