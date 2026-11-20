import type { Place } from '@astro/content';

export interface PlaceProvider {
  search(query: string, limit?: number): Promise<Place[]>;
  getById(id: string): Promise<Place | null>;
  getDefault(): Promise<Place>;
}
