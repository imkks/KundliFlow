import { CITIES, type Place } from '@astro/content';
import type { PlaceProvider } from './types.js';

export class StaticCityProvider implements PlaceProvider {
  private cities: Place[];
  private defaultCity: Place;

  constructor(cities: Place[] = CITIES, defaultId = 'jamshedpur') {
    this.cities = cities;
    const found = this.cities.find((c) => c.id === defaultId);
    if (!found) {
      throw new Error(`Default city with id "${defaultId}" not found in cities list`);
    }
    this.defaultCity = found;
  }

  async search(query: string, limit = 5): Promise<Place[]> {
    const q = query.trim().toLowerCase();
    if (!q) return this.cities.slice(0, limit);
    return this.cities
      .filter((c) => c.name.toLowerCase().includes(q) || (c.admin && c.admin.toLowerCase().includes(q)))
      .slice(0, limit);
  }

  async getById(id: string): Promise<Place | null> {
    return this.cities.find((c) => c.id === id) || null;
  }

  async getDefault(): Promise<Place> {
    return this.defaultCity;
  }
}
