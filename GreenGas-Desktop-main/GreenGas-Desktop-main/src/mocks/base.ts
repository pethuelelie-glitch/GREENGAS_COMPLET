/**
 * Instance unique de l'état du faux backend, et sa réinitialisation (tests).
 */
import { productionDuJour, statutsProduction } from './calculs';
import { creerEtat, type Etat } from './etat';
import { aujourdhui } from './horloge';
import { notificationsDeDepart } from './notifications';

function initialiser(generation: number): Etat {
  const etat = creerEtat(generation);
  // Les valeurs du seed sont reprises telles quelles ; seule leur provenance est ajoutée.
  etat.productions.forEach((p) => (p.statuts_donnees = statutsProduction(p)));
  // Chaque site a sa ligne de production du jour (créée ouverte et vide si le seed ne la contient pas).
  etat.sites.forEach((s) => productionDuJour(etat, s.id, aujourdhui()));
  // Notifications de départ de la démonstration (note notifications §4).
  notificationsDeDepart(etat);
  return etat;
}

let etat = initialiser(0);

export function etatCourant(): Etat {
  return etat;
}

/** Recharge le seed : toutes les actions de la session sont effacées. */
export function reinitialiser(): void {
  etat = initialiser(etat.generation + 1);
}

/**
 * Tâche différée du simulateur (mesure de gaz après un tri, par exemple).
 * Elle est ignorée si l'état a été réinitialisé entre-temps.
 */
export function differer(tache: (e: Etat) => void, delaiMs: number): void {
  const generation = etat.generation;
  setTimeout(() => {
    if (etat.generation === generation) tache(etat);
  }, delaiMs);
}
