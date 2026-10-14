/**
 * Horloge du faux backend : la journée de travail (12/09/2026) commence à 09:00 UTC
 * au démarrage du logiciel, puis avance au rythme réel.
 */
import { config } from '@/lib/config';

const depart = Date.now();
const debutJournee = Date.parse(`${config.dateTravail}T09:00:00Z`);

/** Date-heure ISO 8601 UTC, sans millisecondes : `2026-09-12T09:00:00Z`. */
export function maintenant(): string {
  return new Date(debutJournee + (Date.now() - depart)).toISOString().replace(/\.\d{3}Z$/, 'Z');
}

export function aujourdhui(): string {
  return config.dateTravail;
}
