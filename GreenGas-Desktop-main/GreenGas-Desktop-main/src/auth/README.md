# auth

Connexion (`POST /auth/token/`), session de l'utilisateur, stockage du jeton (mémoire sur le web, `safeStorage` sur Electron), garde des routes par rôle et redirection après connexion (voir `docs/ROUTES.md`).

Les rôles `citoyen`, `collecteur` et `capteur` sont refusés avec le message « Ce compte s'utilise dans l'application mobile GREENGAS. »
