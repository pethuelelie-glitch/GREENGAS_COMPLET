/**
 * Accès aux jetons de couleur depuis le code (graphiques Recharts, SVG).
 * Les valeurs restent déclarées une seule fois, dans `src/styles/tokens.css`.
 */
import type { Categorie } from '@/api/types';

/** Référence CSS à un jeton : utilisable dans `fill`, `stroke` ou `style`. */
export const jeton = (nom: string) => `var(--${nom})`;

export const COULEUR = {
  vertForet: jeton('vert-foret'),
  vert: jeton('vert'),
  vertPale: jeton('vert-pale'),
  or: jeton('or'),
  texte: jeton('texte'),
  texteDoux: jeton('texte-doux'),
  bordure: jeton('bordure'),
  surface: jeton('surface'),
  ok: jeton('statut-ok'),
  alerte: jeton('statut-alerte'),
  attention: jeton('statut-attention'),
  neutre: jeton('statut-neutre'),
} as const;

export const COULEUR_CATEGORIE: Record<Categorie, string> = {
  organique: jeton('cat-organique'),
  biomasse: jeton('cat-biomasse'),
  plastique: jeton('cat-plastique'),
  metal: jeton('cat-metal'),
  carton_papier: jeton('cat-carton-papier'),
  verre: jeton('cat-verre'),
  refus: jeton('cat-refus'),
};

/** Couleur de la n-ième série d'un graphique (sites, secteurs, rôles…). */
export const couleurSerie = (index: number) => jeton(`serie-${(index % 7) + 1}`);
