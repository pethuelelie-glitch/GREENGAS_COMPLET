# api

Seule couche autorisée à appeler le réseau.

- `schema.d.ts` : types **générés** depuis `docs/reference/openapi.yaml` (`npm run gen:api`). Ne jamais modifier à la main.
- `client.ts` : instance `openapi-fetch` (URL de base, jeton, rafraîchissement sur 401).
- `erreurs.ts` : lecture du format `{code, message, details}`.
- Un fichier par domaine : `tournees.ts`, `tri.ts`, `sites.ts`, `productions.ts`, `alertes.ts`, `administration.ts`, `simulation.ts`.
