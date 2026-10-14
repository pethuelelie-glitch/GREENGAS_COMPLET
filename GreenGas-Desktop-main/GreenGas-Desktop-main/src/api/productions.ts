import { client, executer, resultats, TAILLE_PAGE_MAX } from './client';
import type { FiltresProductions } from './requetes';
import type { DestinationDigestat, ProductionEnergie } from './types';

export const apiProductions = {
  globale: (date: string) => executer(client.GET('/productions/globale/', { params: { query: { date } } })),
  lister: async (filtres: FiltresProductions = {}) =>
    resultats<ProductionEnergie>(
      await executer(client.GET('/productions/', { params: { query: { ...filtres, taille_page: TAILLE_PAGE_MAX } } })),
    ),
  cloturer: (id: string, destination_digestat: DestinationDigestat) =>
    executer(client.POST('/productions/{id}/cloturer/', { params: { path: { id } }, body: { destination_digestat } })),
};

export const apiProductionDetail = (id: string) =>
  executer(client.GET('/productions/{id}/', { params: { path: { id } } }));
