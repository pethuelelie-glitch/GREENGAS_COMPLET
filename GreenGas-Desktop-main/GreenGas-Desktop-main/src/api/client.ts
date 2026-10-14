/**
 * Client HTTP unique du logiciel (openapi-fetch, typé par schema.d.ts).
 * - ajoute `Authorization: Bearer <access>` ;
 * - sur un 401 : une seule tentative de `POST /auth/token/rafraichir/`, puis la requête est rejouée ;
 *   si le rafraîchissement échoue, la session est déclarée expirée (retour à /connexion).
 * Le mode (`mock` ou `reel`) ne change que la fonction d'envoi : les écrans ne le connaissent pas.
 */
import createClient from 'openapi-fetch';
import { config } from '@/lib/config';
import type { paths } from './schema';
import { ErreurApi } from './erreurs';
import { jetons } from './jetons';

type Envoi = (requete: Request) => Promise<Response>;

/** En mode `mock`, les requêtes sont servies par les handlers MSW (src/mocks), chargés à la demande. */
const envoiDeBase: Envoi =
  config.modeApi === 'reel'
    ? (requete) => globalThis.fetch(requete)
    : async (requete) => (await import('@/mocks/envoi')).envoyerAuFauxBackend(requete);

const auditeursSessionExpiree = new Set<() => void>();

/** Abonnement à l'expiration de la session (utilisé par src/auth). */
export function surSessionExpiree(auditeur: () => void): () => void {
  auditeursSessionExpiree.add(auditeur);
  return () => auditeursSessionExpiree.delete(auditeur);
}

const URL_RAFRAICHIR = `${config.apiUrl}/auth/token/rafraichir/`;
const estUrlAuth = (url: string) => url.startsWith(`${config.apiUrl}/auth/token/`);

let rafraichissementEnCours: Promise<boolean> | null = null;

/** Rafraîchit le jeton d'accès ; les requêtes simultanées partagent la même tentative. */
export function rafraichirJeton(): Promise<boolean> {
  const refresh = jetons.rafraichissement();
  if (!refresh) return Promise.resolve(false);
  rafraichissementEnCours ??= (async () => {
    try {
      const reponse = await envoiDeBase(
        new Request(URL_RAFRAICHIR, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh }),
        }),
      );
      if (!reponse.ok) return false;
      const corps = (await reponse.json()) as { access?: string };
      if (!corps.access) return false;
      jetons.definirAcces(corps.access);
      return true;
    } catch {
      return false;
    } finally {
      rafraichissementEnCours = null;
    }
  })();
  return rafraichissementEnCours;
}

function avecJeton(requete: Request): Request {
  const acces = jetons.acces();
  if (acces) requete.headers.set('Authorization', `Bearer ${acces}`);
  return requete;
}

async function envoyer(requete: Request): Promise<Response> {
  const copie = requete.clone();
  const reponse = await envoiDeBase(avecJeton(requete));
  if (reponse.status !== 401 || estUrlAuth(requete.url)) return reponse;
  if (await rafraichirJeton()) return envoiDeBase(avecJeton(copie));
  auditeursSessionExpiree.forEach((auditeur) => auditeur());
  return reponse;
}

export const client = createClient<paths>({ baseUrl: config.apiUrl, fetch: envoyer });

interface ResultatAppel<T> {
  data?: T;
  error?: unknown;
  response: Response;
}

/** Exécute un appel openapi-fetch et renvoie ses données, ou lève une `ErreurApi`. */
export async function executer<T>(appel: Promise<ResultatAppel<T>>): Promise<T> {
  let resultat: ResultatAppel<T>;
  try {
    resultat = await appel;
  } catch {
    throw ErreurApi.injoignable();
  }
  if (!resultat.response.ok || resultat.error !== undefined) {
    throw ErreurApi.depuis(resultat.response.status, resultat.error);
  }
  return resultat.data as T;
}

/** Taille de page demandée pour les listes affichées en entier (maximum du contrat). */
export const TAILLE_PAGE_MAX = 200;

/** Extrait les résultats d'une page `{count, next, previous, results}`. */
export function resultats<T>(page: { results?: unknown[] } & { results?: T[] }): T[] {
  return (page.results ?? []) as T[];
}
