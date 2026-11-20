import type { PlaceProvider } from './types.js';
import { StaticCityProvider } from './static-city-provider.js';

let currentPlaceProvider: PlaceProvider = new StaticCityProvider();

export const getPlaceProvider = (): PlaceProvider => currentPlaceProvider;

export const setPlaceProvider = (provider: PlaceProvider): void => {
  currentPlaceProvider = provider;
};
