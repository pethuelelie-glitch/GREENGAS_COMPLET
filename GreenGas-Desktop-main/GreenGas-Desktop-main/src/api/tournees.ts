import { client, executer, resultats, TAILLE_PAGE_MAX } from './client';
import type { FiltresCollectes, FiltresTournees } from './requetes';
import type { Collecte, Tournee, TourneeCreation } from './types';

export const apiTournees = {
  lister: async (filtres: FiltresTournees = {}) =>
    resultats<Tournee>(
      await executer(client.GET('/tournees/', { params: { query: { ...filtres, taille_page: TAILLE_PAGE_MAX } } })),
    ),
  detail: (id: string) => executer(client.GET('/tournees/{id}/', { params: { path: { id } } })),
  planifier: (corps: TourneeCreation) => executer(client.POST('/tournees/', { body: corps })),
};

export const apiCollectes = {
  lister: async (filtres: FiltresCollectes = {}) =>
    resultats<Collecte>(
      await executer(client.GET('/collectes/', { params: { query: { ...filtres, taille_page: TAILLE_PAGE_MAX } } })),
    ),
  decider: (id: string, decision: 'valider_points' | 'annuler_points', commentaire: string) =>
    executer(client.POST('/collectes/{id}/decision/', { params: { path: { id } }, body: { decision, commentaire } })),
};
