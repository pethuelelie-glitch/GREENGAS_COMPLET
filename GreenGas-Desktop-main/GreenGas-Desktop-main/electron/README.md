# Electron

Processus principal et preload de l'application desktop (créés à l'initialisation) :

- `main.ts` : fenêtre 1440 × 900 minimum, chargement du serveur Vite en développement et du build en production, menu minimal.
- `preload.ts` : expose seulement des fonctions nommées (par exemple `jeton.lire()`, `jeton.ecrire()`, `jeton.effacer()` via `safeStorage`).

Règles : `contextIsolation: true`, `nodeIntegration: false`, aucune logique métier ici.
