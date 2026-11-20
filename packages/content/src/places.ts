import { z } from 'zod';

export const PlaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  admin: z.string().optional(),
  country: z.string(),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  tzId: z.string(),
  source: z.string(),
});

export type Place = z.infer<typeof PlaceSchema>;

export const PlacesListSchema = z.array(PlaceSchema);
