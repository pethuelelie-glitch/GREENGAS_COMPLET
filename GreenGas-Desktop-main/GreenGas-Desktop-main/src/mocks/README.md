# mocks

Faux backend MSW, actif quand `VITE_API_MODE=mock`. Il remplace le backend Django : c'est le **seul** endroit où les calculs métier sont écrits côté front.

| Fichier | Rôle |
|---|---|
| `envoi.ts` | Point d'entrée : `src/api/client.ts` lui passe chaque requête, résolue par `getResponse` (msw), sans Service Worker. |
| `etat.ts` | État en mémoire construit depuis `docs/reference/seed.json` (v1.1) : historique, lots, résultats de tri, transactions, productions, numérotation des lots, facteurs du simulateur, bac du référent. Aucune donnée de démo n'est écrite dans le code. |
| `base.ts` | Instance de l'état, réinitialisation (tests), ligne de production du jour créée si le seed ne l'a pas, tâches différées du simulateur. |
| `calculs.ts` | Pipeline de tri, énergie, alertes, simulateur IoT (Guide commun §3 et §8). |
| `lectures.ts` | Vue globale, file de vérification, traçabilité, solde. |
| `serialiseurs.ts` | Mise au format exact de `openapi.yaml` (champs calculés compris). |
| `handlers/` | Un fichier par domaine : mêmes URL, champs, codes d'erreur et droits par rôle que le contrat. |
| `faux-backend.test.ts` | Vérifie l'état de départ (14 tournées, 34 collectes, 293 scans, 84 lots, 12 tris, 36 transactions, 24 productions, 320 kg le 12/09, ORG-0258) et les résultats du Guide : 8,54 · 288 · 290 · 15 en attente · −30 % · 38,08 kWh. |
Les valeurs calculées du seed (distances, énergie de l'historique) sont reprises telles quelles, comme le fera le backend ; les nouveaux identifiants partent du dernier numéro du seed.

Le jour où le backend est prêt, on passe `VITE_API_MODE=reel` sans toucher aux écrans.
