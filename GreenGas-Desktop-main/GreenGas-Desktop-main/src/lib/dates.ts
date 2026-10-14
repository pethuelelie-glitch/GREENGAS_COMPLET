/** Calculs de dates calendaires (AAAA-MM-JJ), sans fuseau : Abidjan est en UTC toute l'année. */

/** `2026-09-12`, -7 → `2026-09-05`. */
export function decalerJours(jour: string, jours: number): string {
  return new Date(Date.parse(`${jour}T12:00:00Z`) + jours * 86400000).toISOString().slice(0, 10);
}

/** Date du jour à Abidjan. */
export function aujourdhui(): string {
  return new Date().toISOString().slice(0, 10);
}
