import { client, executer, resultats, TAILLE_PAGE_MAX } from './client';
import type { FiltresAlertes } from './requetes';
import type { Alerte } from './types';

export const apiAlertes = {
  lister: async (filtres: FiltresAlertes = {}) =>
    resultats<Alerte>(
      await executer(client.GET('/alertes/', { params: { query: { ...filtres, taille_page: TAILLE_PAGE_MAX } } })),
    ),
  detail: (id: string) => executer(client.GET('/alertes/{id}/', { params: { path: { id } } })),
  resoudre: (id: string, commentaire: string) =>
    executer(client.POST('/alertes/{id}/resoudre/', { params: { path: { id } }, body: { commentaire } })),
};
