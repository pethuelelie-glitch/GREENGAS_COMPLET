# GREENGAS Control Center

Logiciel de pilotage du système **GREENGAS** : il suit les déchets organiques d'Abidjan depuis le bac du citoyen jusqu'à l'électricité produite par trois biodigesteurs (DIG-01, DIG-02, DIG-03).

Le Control Center fonctionne **dans le navigateur** (React) et en **application Windows** (Electron), avec le même code. Il est développé par l'équipe DEDSEC pour le SIREXE Hackathon 2026.

> Les citoyens et les collecteurs utilisent l'application mobile Flutter, pas ce logiciel.
> Tous les calculs (points, énergie, écarts, alertes) sont faits par le backend Django : le Control Center affiche les données et envoie les actions.

---

## Ce que fait le logiciel

| Rôle | Ce qu'il peut faire |
|---|---|
| **Opérateur de tri** | Voir les tournées à trier, saisir le tri (poids par catégorie), voir le résultat : lots créés, valeur de la tournée, points distribués aux citoyens, matière envoyée au digesteur. |
| **Responsable méthanisation** | Suivre les trois digesteurs sur la carte satellite d'Abidjan, consulter le tableau de bord de chaque site (biogaz, électricité, sondes), traiter les alertes. |
| **Administrateur** | Tout ce qui précède, plus : traçabilité d'un bac jusqu'aux points, validation des comptes du personnel, vérifications, utilisateurs, bacs, tournées, paramètres système, journal et capteurs. |
| **Référent** | Suivre les signaux de sa résidence (collectes à vérifier, scans hors zone, bac surinscrit). |
| **Tous** | Notifications (cloche en haut à droite et page *Notifications*), préférences personnelles (thème clair, sombre ou système ; animations réduites) via le bouton *Paramètres* en bas de la barre latérale. |

Chaque valeur affichée porte un badge **Mesuré**, **Estimé** ou **Simulé**, fourni par l'API.

---

## Démarrer en 3 minutes

**Prérequis :** Node.js 20 ou plus récent, et npm.

```bash
npm install
cp .env.example .env
npm run dev
```

Ouvrez ensuite **<http://localhost:5173>**.

Par défaut, l'application tourne avec un **faux backend** intégré : aucune autre installation n'est nécessaire.

---

## Se connecter

### Comptes préenregistrés

On se connecte avec son **téléphone** (onglet « Téléphone » : l'indicatif +225 est déjà affiché, on saisit les 10 chiffres) ou avec son **e-mail** (onglet « E-mail »).

| Compte | Rôle | Téléphone | E-mail | Mot de passe |
|---|---|---|---|---|
| Aya Opératrice | Opérateur de tri | `07 00 00 00 03` | `aya.operatrice@greengas.ci` | `greengas2026` |
| Serge Méthanisation | Responsable méthanisation | `07 00 00 00 04` | `serge.methanisation@greengas.ci` | `greengas2026` |
| Administrateur GreenGas | Administrateur | `07 00 00 00 01` | `admin@greengas.ci` | `greengas2026` |
| Administrateur principal | Administrateur | `07 00 00 00 07` | `admin@admin.com` | `admin1234` |
| Référent Atlantic | Référent | `07 00 00 00 05` | `referent.atlantic@greengas.ci` | `greengas2026` |

Pour changer de rôle, déconnectez-vous (icône à côté de votre nom, en haut à droite), puis reconnectez-vous avec un autre compte.

### Créer un compte

- **Opérateurs de tri et responsables méthanisation** : lien **« Créer un compte »** sous le formulaire de connexion. Téléphone et e-mail sont demandés (chacun ne peut servir qu'à un seul compte) ; on se connecte ensuite avec l'un ou l'autre.
  - **Validation désactivée** (réglage actuel) : le compte est actif tout de suite.
  - **Validation activée** (*Paramètres* → *Comptes* → « Validation des comptes du personnel ») : la demande attend la validation d'un administrateur (écran **Vérifications**), et la connexion est refusée jusque-là. Exemple déjà en attente : Ibrahim Koné (`07 00 00 00 08`), qui peut se connecter tant que la validation est désactivée.
- **Administrateurs** : ils sont préenregistrés. Depuis **Utilisateurs**, un administrateur peut créer tous les autres comptes : référents, collecteurs, opérateurs, administrateurs.
- **Citoyens et collecteurs** : ils utilisent l'application mobile. Le Control Center refuse leur connexion.

Sur le web, la session est gardée en mémoire : recharger la page déconnecte. C'est voulu, pour qu'aucun jeton ne soit stocké dans le navigateur.

---

## Configuration (`.env`)

| Variable | Rôle | Valeur par défaut |
|---|---|---|
| `VITE_API_MODE` | `mock` : faux backend intégré ; `reel` : backend Django | `mock` |
| `VITE_API_URL` | Adresse de l'API (contient déjà `/api/v1`) | `http://localhost:8000/api/v1` |
| `VITE_DATE_DEMO` | Date de travail affichée (AAAA-MM-JJ). Doit valoir le réglage `GREENGAS_DATE_TRAVAIL` du backend. | `2026-09-12` en `mock`, le jour même en `reel` |
| `VITE_RAFRAICHISSEMENT_MS` | Rafraîchissement des tableaux de bord, en millisecondes | `5000` |

`.env.example` contient les valeurs à utiliser avec le jeu de données commun.

---

## Faux backend et vrai backend

- **`VITE_API_MODE=mock`** : les requêtes sont traitées dans le navigateur par le faux backend de `src/mocks/` (MSW). Il charge `docs/reference/seed.json`, le même fichier que le backend Django, et refait les calculs du Guide commun. Les données sont gardées en mémoire : recharger la page les remet à leur état de départ.
- **`VITE_API_MODE=reel`** : le même code appelle le backend Django à l'adresse `VITE_API_URL`. Aucun écran ne change.

---

## Parcours de présentation

On passe d'un compte à l'autre avec le bouton de déconnexion, sans recharger la page : avec le faux backend, un rechargement remet les données à zéro.

1. **Opératrice** : *Tournées à trier* → *Trier* TRN-0912-01 → saisir 320 (organique), 30, 60, 10, 40, 20 et 20 kg → *Valider le tri*. Résultat : 8,54 pts/kg, 288 points crédités, 290 points pour BAC-014. Même saisie pour TRN-0912-02 : 15 points en attente pour BAC-022.
2. **Administrateur** : *Vue globale* (640 kg, puis 960 kg après les deux tris), puis *Capteurs* → *Injecter une baisse de production* sur DIG-02 : bandeau rouge, notification, site en alerte.
3. **Responsable** : *Sites* → DIG-02 (−30 %, 38,08 kWh) → *Alertes* → résoudre avec un commentaire.
4. **Administrateur** : *Traçabilité* de BAC-014 (Awa 105, Koffi 79, Mariam 65, Yao 39 points) ; *Utilisateurs* → *Ajouter un collecteur* ; *Tournées* → *Planifier une tournée*.

---

## Commandes

| Commande | Effet |
|---|---|
| `npm run dev` | Application web sur <http://localhost:5173> |
| `npm run build` | Build web dans `dist/` |
| `npm run typecheck` | Vérification des types TypeScript |
| `npm run lint` | Vérification du code (ESLint, avec les règles du projet) |
| `npm test` | Tests (Vitest) |
| `npm run gen:api` | Régénère les types de l'API depuis `docs/reference/openapi.yaml` |
| `npm run dev:electron` · `npm run build:electron` | Version Windows : **à venir**, après validation complète dans le navigateur |

---

## Technologies

| Besoin | Outil |
|---|---|
| Interface | React 18, TypeScript, Vite |
| Styles | Tailwind CSS, composants Radix (shadcn/ui), icônes lucide-react |
| Données | TanStack Query, client `openapi-fetch` typé depuis `openapi.yaml` |
| Formulaires | react-hook-form et zod |
| Graphiques et animations | Recharts, Motion |
| Carte | Leaflet (react-leaflet), images Esri satellite et relief ; carte stylisée hors ligne en secours |
| Faux backend | MSW |
| Tests | Vitest et Testing Library |
| Desktop | Electron et electron-builder (à venir) |

---

## Organisation du dépôt

```text
docs/
  reference/     contrat commun : Guide, openapi.yaml, seed.json (ne pas modifier sans l'équipe)
  partage/       notes et fichiers partagés avec le backend
  ROUTES.md      écrans ↔ routes ↔ rôles ↔ endpoints
  DECISIONS.md   décisions techniques
design/          maquette validée (design/export/GREENGAS_Control_Center.html)
public/          logo et favicon
src/
  app/           point d'entrée, routes, coque (barre latérale, bandeaux)
  api/           client HTTP, types générés, appels par domaine, erreurs
  auth/          connexion, inscription, session, garde des routes
  mocks/         faux backend (handlers, calculs, état chargé depuis le seed)
  components/    composants d'interface (ui/) et métier (greengas/)
  features/      écrans : tri/, methanisation/, administration/, compte/ (préférences, notifications)
  hooks/         requêtes partagées (référentiel, notifications)
  lib/           formats français, libellés, configuration
  styles/        jetons de couleur et styles globaux
```

---

## Règles du projet

Les règles complètes sont dans [`CLAUDE.md`](CLAUDE.md). Les principales :

- aucun calcul métier dans l'interface : le backend est la seule source de vérité ;
- noms de champs identiques au contrat (`poids_collecte_kg`, `statuts_donnees`…) ;
- tous les appels réseau passent par `src/api/` ;
- couleurs uniquement via les jetons de `src/styles/tokens.css` ;
- jetons de connexion jamais dans `localStorage` ;
- textes de l'interface en français, formats français (`12/09/2026 08:30`, `1 234,5 kg`).

---

## Documentation

- [`docs/reference/GREENGAS_Guide_Commun.md`](docs/reference/GREENGAS_Guide_Commun.md) : modèles, calculs et endpoints communs (fait foi).
- [`docs/ROUTES.md`](docs/ROUTES.md) : quel écran, pour quel rôle, avec quels endpoints.
- [`docs/DECISIONS.md`](docs/DECISIONS.md) : décisions techniques et questions ouvertes.
- [`docs/partage/NOTE_BACKEND_inscription_personnel.md`](docs/partage/NOTE_BACKEND_inscription_personnel.md) : ce que le backend doit ajouter pour l'inscription (contrat 1.1.0).
- [`src/mocks/README.md`](src/mocks/README.md) : fonctionnement du faux backend.

## Licence

MIT, voir [`LICENSE`](LICENSE).
