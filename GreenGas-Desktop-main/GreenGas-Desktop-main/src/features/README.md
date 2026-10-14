# features

Un dossier par rôle, chacun organisé en `pages/`, `components/` et `hooks/` :

- `tri/` : T1 Tournées à trier, T2 Saisie du tri, T3 Résultat du tri, T4 Historique.
- `methanisation/` : M1 Vue globale, M2 Tableau de bord d'un site, M3 Alertes.
- `administration/` : A1 Supervision, A2 Traçabilité, A3 Vérifications, A4 Comptes, A5 Bacs et secteurs, A6 Tournées, A7 Paramètres, A8 Journal, A9 Mode démo.

Les hooks (`useTourneesATrier`, `useValiderTri`…) enveloppent les fonctions de `src/api/` avec TanStack Query.
