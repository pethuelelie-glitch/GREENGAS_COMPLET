import { client, executer, resultats, TAILLE_PAGE_MAX } from './client';
import type { FiltresBacs, FiltresJournal, FiltresScans, FiltresUtilisateurs, FiltresVerifications } from './requetes';
import type {
  Bac,
  BacEcriture,
  CleParametre,
  EntreeJournal,
  Scan,
  Utilisateur,
  UtilisateurCreation,
  UtilisateurModification,
} from './types';

export const apiUtilisateurs = {
  lister: async (filtres: FiltresUtilisateurs = {}) =>
    resultats<Utilisateur>(
      await executer(client.GET('/utilisateurs/', { params: { query: { ...filtres, taille_page: TAILLE_PAGE_MAX } } })),
    ),
  creer: (corps: UtilisateurCreation) => executer(client.POST('/utilisateurs/', { body: corps })),
  modifier: (id: string, corps: UtilisateurModification) =>
    executer(client.PATCH('/utilisateurs/{id}/', { params: { path: { id } }, body: corps })),
  decider: (id: string, decision: 'valider' | 'refuser', commentaire?: string) =>
    executer(
      client.POST('/utilisateurs/{id}/validation/', {
        params: { path: { id } },
        body: { decision, commentaire: commentaire ?? null },
      }),
    ),
  solde: (citoyen_id: string) => executer(client.GET('/greenpoints/solde/', { params: { query: { citoyen_id } } })),
};

export const apiBacs = {
  lister: async (filtres: FiltresBacs = {}) =>
    resultats<Bac>(
      await executer(client.GET('/bacs/', { params: { query: { ...filtres, taille_page: TAILLE_PAGE_MAX } } })),
    ),
  detail: (id: string) => executer(client.GET('/bacs/{id}/', { params: { path: { id } } })),
  creer: (corps: BacEcriture) => executer(client.POST('/bacs/', { body: corps })),
  modifier: (id: string, corps: BacEcriture) =>
    executer(client.PATCH('/bacs/{id}/', { params: { path: { id } }, body: corps })),
  tracabilite: (id: string) => executer(client.GET('/bacs/{id}/tracabilite/', { params: { path: { id } } })),
};

export const apiScans = {
  lister: async (filtres: FiltresScans = {}) =>
    resultats<Scan>(
      await executer(client.GET('/scans/', { params: { query: { ...filtres, taille_page: TAILLE_PAGE_MAX } } })),
    ),
};

export const apiVerifications = {
  lister: (filtres: FiltresVerifications = {}) =>
    executer(client.GET('/verifications/', { params: { query: filtres } })),
};

export const apiParametres = {
  lister: () => executer(client.GET('/parametres/')),
  modifier: (cle: CleParametre, valeur: number) =>
    executer(client.PATCH('/parametres/{cle}/', { params: { path: { cle } }, body: { valeur } })),
};

export const apiJournal = {
  lister: async (filtres: FiltresJournal = {}) =>
    resultats<EntreeJournal>(
      await executer(client.GET('/journal/', { params: { query: { ...filtres, taille_page: TAILLE_PAGE_MAX } } })),
    ),
};
