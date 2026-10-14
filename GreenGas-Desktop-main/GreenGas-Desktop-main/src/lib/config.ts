/** Lecture des variables `VITE_*` (voir `.env.example`). */
import { aujourdhui } from './dates';

export type ModeApi = 'mock' | 'reel';

const env = import.meta.env;

function lireMode(valeur: string | undefined): ModeApi {
  return valeur === 'mock' ? 'mock' : 'reel';
}

const modeApi = lireMode(env.VITE_API_MODE);

export const config = {
  /** URL du backend, contient déjà `/api/v1`, sans barre finale. */
  apiUrl: (env.VITE_API_URL ?? 'http://localhost:8000/api/v1').replace(/\/+$/, ''),
  /** `mock` : faux backend MSW ; `reel` : backend Django. Les écrans ne lisent jamais cette valeur. */
  modeApi,
  /**
   * Date de travail affichée et utilisée par les écrans (AAAA-MM-JJ), identique au réglage
   * GREENGAS_DATE_TRAVAIL du backend. Sans VITE_DATE_DEMO : la date du seed en mode mock, le jour même en mode reel.
   */
  dateTravail: env.VITE_DATE_DEMO || (modeApi === 'mock' ? '2026-09-12' : aujourdhui()),
  /** Intervalle de rafraîchissement des tableaux de bord, en millisecondes. */
  rafraichissementMs: Number(env.VITE_RAFRAICHISSEMENT_MS ?? 5000) || 5000,
} as const;
