import { client, executer, resultats, TAILLE_PAGE_MAX } from './client';
import type { FiltresLots, FiltresTransactions } from './requetes';
import type { GreenPointsTransaction, LotTrie, TriRequete } from './types';

export const apiTri = {
  valider: (tourneeId: string, requete: TriRequete) =>
    executer(client.POST('/tournees/{id}/tri/', { params: { path: { id: tourneeId } }, body: requete })),
  resultat: (tourneeId: string) => executer(client.GET('/tournees/{id}/tri/', { params: { path: { id: tourneeId } } })),
  lots: async (filtres: FiltresLots = {}) =>
    resultats<LotTrie>(
      await executer(client.GET('/lots/', { params: { query: { ...filtres, taille_page: TAILLE_PAGE_MAX } } })),
    ),
  transactions: async (filtres: FiltresTransactions = {}) =>
    resultats<GreenPointsTransaction>(
      await executer(
        client.GET('/greenpoints/transactions/', { params: { query: { ...filtres, taille_page: TAILLE_PAGE_MAX } } }),
      ),
    ),
};
