/**
 * Outils communs des handlers MSW : URL, latence, authentification, rôles, pagination, erreurs.
 */
import { delay, http, HttpResponse } from 'msw';
import type { Role } from '@/api/types';
import { config } from '@/lib/config';
import { etatCourant } from './base';
import { accesRefuse, ErreurMock } from './erreurs';
import { peutSeConnecter, type Etat, type UtilisateurDB } from './etat';

export const url = (chemin: string) => `${config.apiUrl}${chemin}`;

const EN_TEST = import.meta.env.MODE === 'test';
/** Latence simulée : assez courte pour la présentation, assez longue pour voir les états de chargement. */
const latence = (methode: string) => (EN_TEST ? 0 : methode === 'GET' ? 160 : 380);

/* ---------- Jetons (format propre au faux backend) ---------- */

const DUREE_ACCES_MS = 60 * 60 * 1000;

export function emettreJetons(utilisateur: UtilisateurDB): { access: string; refresh: string } {
  return {
    access: `mock-acces.${utilisateur.id}.${Date.now() + DUREE_ACCES_MS}`,
    refresh: `mock-rafraichissement.${utilisateur.id}`,
  };
}

export function lireJetonRafraichissement(etat: Etat, jeton: unknown): UtilisateurDB | null {
  const m = typeof jeton === 'string' ? /^mock-rafraichissement\.([0-9a-f-]+)$/.exec(jeton) : null;
  const u = m ? etat.utilisateurs.find((x) => x.id === m[1]) : undefined;
  return u && peutSeConnecter(etat, u) ? u : null;
}

function utilisateurDuJeton(etat: Etat, request: Request): UtilisateurDB {
  const entete = request.headers.get('Authorization') ?? '';
  const m = /^Bearer mock-acces\.([0-9a-f-]+)\.(\d+)$/.exec(entete);
  const u = m && Number(m[2]) > Date.now() ? etat.utilisateurs.find((x) => x.id === m[1]) : undefined;
  if (!u || !peutSeConnecter(etat, u)) {
    throw new ErreurMock(401, 'NON_AUTHENTIFIE', 'Authentification requise');
  }
  return u;
}

/* ---------- Routes ---------- */

export interface Contexte {
  request: Request;
  params: Record<string, string>;
  query: URLSearchParams;
  etat: Etat;
  /** Utilisateur connecté (lève 401 si le jeton est absent ou expiré). */
  moi: () => UtilisateurDB;
  /** Vérifie le rôle de l'utilisateur connecté (lève 403 sinon). */
  exiger: (...roles: Role[]) => UtilisateurDB;
  corps: <T = Record<string, unknown>>() => Promise<Partial<T>>;
}

type Methode = 'get' | 'post' | 'patch' | 'delete';
type Traitement = (ctx: Contexte) => unknown;

/** Réponse explicite (201 Créé, 204 Sans contenu…). */
export const reponse = (corps: unknown, status = 200) =>
  status === 204 ? new HttpResponse(null, { status }) : HttpResponse.json(corps as object, { status });

export function route(methode: Methode, chemin: string, traiter: Traitement) {
  return http[methode](url(chemin), async ({ request, params }) => {
    await delay(latence(request.method));
    const etat = etatCourant();
    const ctx: Contexte = {
      request,
      params: params as Record<string, string>,
      query: new URL(request.url).searchParams,
      etat,
      moi: () => utilisateurDuJeton(etat, request),
      exiger: (...roles) => {
        const u = utilisateurDuJeton(etat, request);
        if (!roles.includes(u.role)) throw accesRefuse();
        return u;
      },
      corps: async <T>() => {
        try {
          return (await request.clone().json()) as Partial<T>;
        } catch {
          return {} as Partial<T>;
        }
      },
    };
    try {
      const resultat = await traiter(ctx);
      return resultat instanceof Response ? resultat : HttpResponse.json(resultat as object);
    } catch (e) {
      if (e instanceof ErreurMock) {
        return HttpResponse.json({ code: e.code, message: e.message, details: e.details }, { status: e.status });
      }
      console.error('[faux backend]', e);
      return HttpResponse.json(
        { code: 'ERREUR_SERVEUR', message: 'Erreur imprévue du serveur', details: {} },
        { status: 500 },
      );
    }
  });
}

/** Rôles du Control Center autorisés en lecture sur les données d'exploitation. */
export const PERSONNEL: Role[] = ['operateur_tri', 'responsable_methanisation', 'administrateur', 'referent'];

/** Liste paginée `{count, next, previous, results}` (page / taille_page, 50 par défaut, 200 au maximum). */
export function paginer<T>(ctx: Contexte, elements: T[]) {
  const page = Math.max(1, Number(ctx.query.get('page')) || 1);
  const taille = Math.min(200, Math.max(1, Number(ctx.query.get('taille_page')) || 50));
  const debut = (page - 1) * taille;
  const lien = (p: number) => {
    const u = new URL(ctx.request.url);
    u.searchParams.set('page', String(p));
    return u.toString();
  };
  return {
    count: elements.length,
    next: debut + taille < elements.length ? lien(page + 1) : null,
    previous: page > 1 ? lien(page - 1) : null,
    results: elements.slice(debut, debut + taille),
  };
}

/** Filtre optionnel d'une liste sur un paramètre de requête. */
export function filtre<T>(ctx: Contexte, nom: string, lire: (e: T) => unknown): (e: T) => boolean {
  const valeur = ctx.query.get(nom);
  return (e) => valeur === null || valeur === '' || String(lire(e)) === valeur;
}
