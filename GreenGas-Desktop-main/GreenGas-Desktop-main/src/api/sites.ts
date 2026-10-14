import { client, executer } from './client';
import type { StatutSite } from './types';

export const apiSites = {
  lister: () => executer(client.GET('/sites/')),
  detail: (id: string) => executer(client.GET('/sites/{id}/', { params: { path: { id } } })),
  changerStatut: (id: string, statut: StatutSite) =>
    executer(client.PATCH('/sites/{id}/', { params: { path: { id } }, body: { statut } })),
};

export const apiSecteurs = {
  lister: () => executer(client.GET('/secteurs/')),
  modifier: (id: string, corps: { site_id?: string; site_repli_id?: string; nom?: string }) =>
    executer(client.PATCH('/secteurs/{id}/', { params: { path: { id } }, body: corps })),
};
