/** Notifications de l'utilisateur connecté (contrat 1.4.0) : lecture et marquage seulement. */
import { client, executer, resultats } from './client';
import type { Notification } from './types';

export const apiNotifications = {
  /** Les plus récentes d'abord (filtre facultatif sur `lue`). */
  lister: async (taille_page = 20, lue?: boolean) =>
    resultats<Notification>(
      await executer(
        client.GET('/notifications/', { params: { query: { taille_page, ...(lue === undefined ? {} : { lue }) } } }),
      ),
    ),
  compteur: () => executer(client.GET('/notifications/compteur/')),
  /** Non lues (couleur de la pastille, toast des nouvelles critiques). */
  nonLues: () => apiNotifications.lister(20, false),
  marquerLue: (id: string) => executer(client.POST('/notifications/{id}/lue/', { params: { path: { id } } })),
  toutLire: () => executer(client.POST('/notifications/tout-lire/')),
};
