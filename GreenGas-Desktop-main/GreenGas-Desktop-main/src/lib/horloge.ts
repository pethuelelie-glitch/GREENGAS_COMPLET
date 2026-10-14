/**
 * Horloge de l'application pour les durées relatives (« il y a 5 min »).
 * Si la date de travail est celle du jour, c'est l'heure réelle ; sinon, comme le serveur de démonstration,
 * la journée de travail commence à 09:00 UTC à l'ouverture du logiciel puis avance au rythme réel.
 */
import { config } from './config';
import { aujourdhui } from './dates';

const ouverture = Date.now();

export function maintenantApplication(): number {
  if (config.dateTravail === aujourdhui()) return Date.now();
  return Date.parse(`${config.dateTravail}T09:00:00Z`) + (Date.now() - ouverture);
}

/** `2026-09-12T10:42:00Z` → « il y a 5 min », « il y a 2 h », « il y a 3 j » ou « à l'instant ». */
export function ilYA(dateIso: string, maintenant = maintenantApplication()): string {
  const secondes = Math.max(0, Math.round((maintenant - Date.parse(dateIso)) / 1000));
  if (secondes < 60) return "à l'instant";
  const minutes = Math.floor(secondes / 60);
  if (minutes < 60) return `il y a ${minutes} min`;
  const heures = Math.floor(minutes / 60);
  if (heures < 24) return `il y a ${heures} h`;
  return `il y a ${Math.floor(heures / 24)} j`;
}
