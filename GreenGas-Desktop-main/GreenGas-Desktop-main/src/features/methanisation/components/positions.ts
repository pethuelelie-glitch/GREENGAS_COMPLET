/**
 * Placement des sites et des bacs sur le fond de carte stylisé (en % de la carte), repris de la maquette.
 * Ce n'est que de la mise en page : la carte n'affiche que les sites et les bacs renvoyés par l'API,
 * et un objet absent de ces tables (nouveau bac) est placé par projection de sa latitude et de sa longitude.
 */
const SITES: Record<string, [number, number]> = { 'DIG-01': [59, 24], 'DIG-02': [86, 45], 'DIG-03': [39, 51] };

const BACS: Record<string, [number, number]> = {
  'BAC-014': [51, 12],
  'BAC-015': [65, 11],
  'BAC-016': [70, 31],
  'BAC-021': [77, 31],
  'BAC-022': [94, 31],
  'BAC-023': [80, 58],
  'BAC-031': [33, 38],
};

export const QUARTIERS: [string, number, number][] = [
  ['Abobo · Cocody', 61, 7],
  ['Riviera · Bingerville', 88, 20],
  ['Yopougon', 36, 26],
  ['Plateau', 57, 55],
  ['Lagune Ébrié', 72, 70],
];

const borne = (v: number) => Math.max(4, Math.min(96, v));

function projection(latitude: number, longitude: number): [number, number] {
  return [borne(39 + (longitude + 4.0721) * 388), borne(24 + (5.3599 - latitude) * 1150)];
}

export const positionSite = (code: string, latitude: number, longitude: number) => SITES[code] ?? projection(latitude, longitude);
export const positionBac = (code: string, latitude: number, longitude: number) => BACS[code] ?? projection(latitude, longitude);
