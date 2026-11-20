export * from './places.js';
export * from './constants.js';
import citiesData from '../places/cities.json' assert { type: 'json' };
import { PlacesListSchema, type Place } from './places.js';

export const CITIES: Place[] = PlacesListSchema.parse(citiesData);
