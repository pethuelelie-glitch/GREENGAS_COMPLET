# GREENGAS Control Center — instructions pour Claude Code

Ce fichier est lu automatiquement par Claude Code à chaque session. Il décrit le projet, la stack, les règles à ne jamais enfreindre et la façon de travailler. **Lis-le en entier avant toute tâche.**

---

## 1. Le projet en cinq lignes

- GREENGAS trace les déchets organiques du bac du citoyen jusqu'à l'électricité produite par trois biodigesteurs (DIG-01, DIG-02, DIG-03) à Abidjan.
- Ce dépôt contient le **Control Center** : le logiciel de gestion du système, en **web (React)** et en **desktop (Electron)**, avec **le même code**.
- Il sert à trois rôles : `operateur_tri`, `responsable_methanisation` et `administrateur`, plus `referent` en accès réduit. Les citoyens et les collecteurs utilisent l'app Flutter, **pas** ce logiciel.
- Le **backend Django** (développé par une autre personne de l'équipe) fait **tous** les calculs. Ce logiciel affiche les données et envoie des actions.
- Le public final est le jury du SIREXE Hackathon (18-22 novembre 2026), devant un écran projeté. L'interface doit faire « salle de pilotage énergétique ».

---

## 2. Documents de référence (par ordre de priorité)

En cas de contradiction, le premier de la liste a raison.

| # | Fichier | Contenu |
|---|---|---|
| 1 | `docs/reference/GREENGAS_Guide_Commun.md` | **Fait foi.** Modèles, champs, énumérations, calculs, endpoints, erreurs, comptes de démo. |
| 2 | `docs/reference/openapi.yaml` | Le même contrat en format machine. Il sert à générer les types TypeScript. |
| 3 | `design/export/GREENGAS_Control_Center.html` | **Maquette validée.** Référence visuelle et comportementale de tous les écrans : à reproduire fidèlement (mise en page, couleurs, composants, textes, carte, graphiques). Ouvrir le fichier dans un navigateur pour la parcourir. |
| 4 | `docs/reference/GREENGAS_Brief_Design_Control_Center.md` | Identité visuelle, écrans, composants, états, données à afficher. |
| 5 | `docs/ROUTES.md` | Correspondance entre écrans, routes, rôles et endpoints. |
| 6 | `docs/DECISIONS.md` | Décisions techniques déjà prises. Ne pas les remettre en cause sans le demander. |
| 7 | `docs/reference/seed.json` | Données de démo communes (UUID fixes), utilisées par les mocks. |

Si une information manque dans ces documents : **demande**, n'invente pas un champ ni un endpoint.

---

## 3. Stack

| Besoin | Choix |
|---|---|
| Langage | TypeScript en mode `strict` |
| Build web | Vite |
| Interface | React 18 |
| Desktop | Electron + `vite-plugin-electron` ; empaquetage avec `electron-builder` (cible : Windows) |
| Styles | Tailwind CSS, avec les jetons GREENGAS (§6) |
| Composants de base | shadcn/ui (Radix), copiés dans `src/components/ui/` |
| Icônes | lucide-react, uniquement |
| Routage | React Router |
| Données serveur | TanStack Query (cache, rafraîchissement toutes les 5 s, mutations) |
| Client API | `openapi-fetch`, typé par `openapi-typescript` (types générés depuis `docs/reference/openapi.yaml`) |
| Formulaires | react-hook-form + zod |
| Graphiques | Recharts |
| Carte | Leaflet + react-leaflet (vue globale : images Esri satellite et relief ; carte stylisée hors ligne en secours) |
| Faux backend | MSW (Mock Service Worker), alimenté par `seed.json` |
| Tests | Vitest + Testing Library |
| Animations | Motion (`motion`, ex-Framer Motion) pour les transitions, les apparitions et les valeurs animées ; CSS pour les boucles simples (flux de la carte, pulsation d'alerte) |
| Qualité | ESLint + Prettier |

Fixe les versions exactes dans `package.json` à l'initialisation du projet, et n'ajoute pas de dépendance sans le demander.

### Commandes (à créer à l'initialisation)

| Commande | Effet |
|---|---|
| `npm run dev` | Application web sur `http://localhost:5173` |
| `npm run dev:electron` | Application desktop en développement |
| `npm run build` | Build web |
| `npm run build:electron` | Installateur Windows |
| `npm run gen:api` | Régénère `src/api/schema.d.ts` depuis `docs/reference/openapi.yaml` |
| `npm run lint` / `npm run typecheck` / `npm test` | Vérifications |

---

## 4. Structure du dépôt

```text
greengas_desktop/
├── CLAUDE.md
├── README.md
├── .env.example
├── docs/
│   ├── ROUTES.md            écrans ↔ routes ↔ rôles ↔ endpoints
│   ├── DECISIONS.md         décisions techniques
│   └── reference/           guide commun, brief design, openapi.yaml, seed.json
├── design/
│   ├── maquettes/           captures validées des écrans (PNG)
│   └── export/              code ou fichiers exportés de Claude Design
├── electron/                main.ts, preload.ts (processus Electron)
├── public/                  logo, favicon
└── src/
    ├── app/                 point d'entrée, routeur, fournisseurs, coque (barre latérale, barre du haut)
    ├── api/                 client, schema.d.ts généré, endpoints par domaine, gestion des erreurs
    ├── auth/                connexion, session, jeton, garde des routes par rôle
    ├── mocks/               faux backend MSW (handlers + données du seed)
    ├── components/
    │   ├── ui/              composants shadcn/ui (bouton, carte, tableau, modale…)
    │   └── greengas/        composants métier partagés (Indicateur, PastilleStatut, BadgeProvenance…)
    ├── features/
    │   ├── tri/             écrans T1 à T4 (opérateur de tri)
    │   ├── methanisation/   écrans M1 à M3 (responsable méthanisation)
    │   ├── administration/  écrans A1 à A11 (administrateur, référent)
    │   └── compte/          préférences personnelles et notifications (tous les rôles)
    ├── lib/                 formats (nombres, dates), constantes, libellés des énumérations
    └── styles/              jetons CSS, styles globaux
```

Chaque dossier de `features/` suit la même organisation : `pages/`, `components/`, `hooks/` (requêtes TanStack Query du domaine).

---

## 5. Règles absolues

1. **Aucun calcul métier côté client.** Points, `valeur_kg`, biogaz, énergie, écarts, statuts et badges viennent du backend.
   - Seule exception : dans le formulaire de tri (T2), l'**aperçu** du total saisi et de l'écart par rapport au poids collecté, à titre indicatif. Le serveur reste juge (erreur `ECART_TOLERANCE`).
2. **Les noms de champs sont exactement ceux du contrat** : `poids_collecte_kg`, `ecart_pct`, `statuts_donnees`… On ne les convertit jamais en camelCase ni en anglais. Les types viennent de `src/api/schema.d.ts`, qu'on ne modifie jamais à la main.
3. **Tous les appels réseau passent par `src/api/`.** Aucun `fetch` dans un composant ; les écrans utilisent les hooks de leur dossier `hooks/`.
4. **Toutes les URL finissent par `/`** et sont relatives à `VITE_API_URL` (qui contient déjà `/api/v1`).
5. **Toujours travailler d'abord contre les mocks.** `VITE_API_MODE=mock` active MSW, et `reel` appelle le vrai backend. Le code des écrans ne doit **jamais** savoir dans quel mode il tourne.
6. **Les mocks respectent le contrat à la lettre** : mêmes URL, mêmes champs, mêmes codes d'erreur, mêmes valeurs que les exemples du Guide commun (§8 et §12).
7. **Les badges Mesuré / Estimé / Simulé** se lisent dans `statuts_donnees`. On ne les déduit jamais côté client.
8. **Couleurs uniquement via les jetons** (§6). Les couleurs de statut servent seulement aux statuts, et un statut n'est jamais indiqué par la couleur seule : toujours une icône ou un texte en plus.
9. **Formats français** pour tout l'affichage : `Intl.NumberFormat('fr-FR')`, unités toujours affichées, dates `12/09/2026 08:30`. Les fonctions sont dans `src/lib/format.ts`.
10. **Erreurs :** on affiche le `message` renvoyé par l'API et on décide du comportement selon `code`, jamais selon le texte.
11. **Jetons de connexion :** jamais dans `localStorage`.
    - Web : jeton d'accès en mémoire.
    - Electron : `safeStorage`, via le preload.
    - Sur un 401 : une seule tentative de `POST /auth/token/rafraichir/`, puis retour à `/connexion`.
12. **Rôles :** les menus et les routes sont filtrés selon `utilisateur.role`. La vraie sécurité reste côté backend : un 403 affiche « Action non autorisée pour votre rôle ».
13. **Electron sécurisé :** `contextIsolation: true`, `nodeIntegration: false`, et le preload n'expose que des fonctions nommées.
14. **Aucune mention « démo » dans l'interface.** L'application se présente comme un logiciel en production. Rien ne doit servir seulement à présenter la maquette : pas de boutons « Accès par rôle », pas de barre de changement de rôle, pas de formulaire prérempli, pas de raccourci de réinitialisation. On change de rôle en se déconnectant. L'écran de pilotage du simulateur s'appelle « Capteurs ». Les badges Mesuré / Estimé / Simulé restent obligatoires.
15. **Textes de l'interface en français.** Le vocabulaire métier reste en français dans le code (`tournee`, `collecte`, `SaisieTri`, `CarteSite`) ; le vocabulaire technique peut rester en anglais (`useQuery`, `props`).

---

## 6. Design system (résumé du brief)

### Jetons de couleur

| Jeton | Valeur | Usage |
|---|---|---|
| `vert-foret` | `#1B4332` | Barre latérale, titres, en-têtes de tableaux, bouton principal |
| `vert` | `#2E7D32` | Accents, liens, série principale des graphiques |
| `vert-pale` | `#EDF3EC` | Lignes alternées, fonds secondaires |
| `or` | `#B8860B` | Filets, mise en avant ponctuelle, bandeau du mode démo |
| `fond` | `#F6F7F4` | Fond de l'application |
| `surface` | `#FFFFFF` | Cartes, modales |
| `texte` | `#222222` | Texte principal |
| `texte-doux` | `#5C5C5C` | Libellés |
| `bordure` | `#D9DED6` | Séparateurs |
| `statut-ok` | `#2E7D32` | Nominal, normal, validé |
| `statut-alerte` | `#C0392B` | Alerte, refusé, erreur |
| `statut-attention` | `#D68910` | À vérifier, en attente |
| `statut-neutre` | `#7F8C8D` | Maintenance, inactif, clôturé |

Les jetons sont déclarés une seule fois, en variables CSS dans `src/styles/tokens.css`, puis branchés dans la config Tailwind. **Aucune couleur en dur dans les composants.**

### Typographie

| Usage | Police |
|---|---|
| Titres | Georgia |
| Interface | Inter, avec chiffres tabulaires (`tabular-nums`) pour les nombres |
| Codes (BAC-014, TRN-0912-01) | JetBrains Mono |

### Composants métier à construire en premier (`src/components/greengas/`)

`Indicateur` · `PastilleStatut` · `BadgeProvenance` · `LegendeProvenance` · `CodeObjet` · `TableauDonnees` · `JaugeEcart` · `GraphiqueAttenduMesure` · `FriseTracabilite` · `ChampPoids` · `ModaleConfirmation` · `PanneauDetail` · `Bandeau` · `EtatVide` · `EtatChargement` · `EtatErreur`

Chaque composant est piloté par des props typées avec les types du contrat, et chacun prévoit ses états : chargement, vide, erreur.

### Animations : mettre le paquet

L'application est présentée à un jury : les animations font partie du livrable, elles ne sont pas un bonus. Elles doivent être fluides (60 images/s, uniquement `transform` et `opacity`), servir la lecture des données et se désactiver avec `prefers-reduced-motion`.

- Transitions entre écrans (fondu + léger glissement) et apparition en cascade des cartes et des lignes de tableau.
- Chiffres des indicateurs qui défilent jusqu'à leur valeur à l'affichage et à chaque mise à jour.
- Aiguille de la jauge d'écart qui pivote avec un effet ressort.
- Graphiques qui se dessinent : courbes tracées progressivement, barres qui grandissent, anneaux qui se remplissent.
- Carte : flux de collecte animés des bacs vers les digesteurs, pins qui apparaissent, pulsation continue d'un site en alerte, bulle d'information qui s'ouvre.
- Alerte : bandeau qui descend, carte du site qui passe au rouge, notification qui glisse.
- Résultat du tri : enchaînement visible lots → valeur → points → envoi au digesteur.
- Micro-interactions : survol et pression des boutons, focus, ouverture des modales et des panneaux avec ressort, squelettes de chargement animés.

### Logo et ressources graphiques (déjà fournis, ne pas les recréer)

| Fichier | Usage |
|---|---|
| `public/brand/logo-g.png` | Le « G » seul : **en haut de la barre latérale**, au-dessus du menu (52 px, comme dans la maquette) |
| `public/brand/logo-greengas.png` | Logo complet, fond transparent : écran de connexion, en-têtes clairs |
| `public/brand/logo-greengas-blanc.png` | Logo complet en blanc : fonds vert forêt ou sombres |
| `public/favicon.png` | Icône de l'onglet (version web) |
| `build/icon.ico`, `build/icon.png` | Icône de l'application Windows (`electron-builder` lit le dossier `build/`) |
| `src/assets/fonts/` | Inter et JetBrains Mono en `woff2` + `fonts.css` : l'application doit fonctionner **hors ligne**, donc aucun appel à Google Fonts. Georgia est une police système de Windows. |
| `src/assets/carte/carte-abidjan.svg` | Fond de carte stylisé de la vue globale (repris de la maquette) |

Les icônes viennent de `lucide-react` : ne pas télécharger d'autres images d'icônes.

### Format cible

Conception en **1440 × 900**, lisible projetée en **1920 × 1080**. Les indicateurs utilisent des chiffres de 32 px minimum.

---

## 7. Écrans et priorités

Le rendu attendu de chaque écran est dans la maquette `design/export/GREENGAS_Control_Center.html` ; le détail fonctionnel dans le brief design (§5) ; la correspondance avec les routes dans `docs/ROUTES.md`. En cas d'écart entre la maquette et le brief, la maquette l'emporte pour le visuel, le Guide commun pour les données.

| Priorité | Écrans |
|---|---|
| **1 — indispensables pour la présentation** | E0 Connexion · T1 Tournées à trier · T2 Saisie du tri · T3 Résultat du tri · M1 Vue globale · M2 Tableau de bord d'un site · M3 Alertes · A2 Traçabilité · A9 Capteurs |
| 2 — importants | A5 Bacs (liste + fiche) · A4 Utilisateurs · A6 Tournées · A3 Vérifications · A7 Paramètres · T4 Historique des tris |
| 3 — si le temps le permet | A1 Supervision · A8 Journal |

**Ordre de construction :**

1. Initialisation du projet, jetons et polices.
2. Couche `api/` et mocks MSW.
3. Connexion et coque (menus par rôle).
4. Composants métier.
5. Écrans dans l'ordre de la présentation : T2 → T3 → T1 → M1 → M2 → M3 → A2 → A9, puis la gestion (A5 Bacs, A4 Utilisateurs, A6 Tournées).
6. Écrans de priorité 2, puis 3.
7. Empaquetage Electron.

---

## 8. Données de démo

- Date de travail : **12/09/2026**.
- Mot de passe commun : **`greengas2026`**.

Connexion par téléphone ou par e-mail (contrat 1.2.0).

| Compte | Rôle | Téléphone | E-mail |
|---|---|---|---|
| Aya Opératrice | `operateur_tri` | `+2250700000003` | `aya.operatrice@greengas.ci` |
| Serge Méthanisation | `responsable_methanisation` | `+2250700000004` | `serge.methanisation@greengas.ci` |
| Administrateur GreenGas | `administrateur` | `+2250700000001` | `admin@greengas.ci` |
| Administrateur principal | `administrateur` (mot de passe `admin1234`) | `+2250700000007` | `admin@admin.com` |
| Référent Atlantic | `referent` | `+2250700000005` | `referent.atlantic@greengas.ci` |
| Kouadio Collecteur | `collecteur` → refusé ici (« s'utilise dans l'app mobile ») | `+2250700000002` | `kouadio.collecteur@greengas.ci` |
| Ibrahim Koné | `operateur_tri` en attente (contrat 1.3.0). Se connecte tant que la validation du personnel est désactivée (paramètre `validation_comptes_personnel = 0`, valeur du seed, contrat 1.5.0) ; refusé quand un administrateur l'active, jusqu'à la validation de son compte | `+2250700000008` | `ibrahim.kone@greengas.ci` |

Les mocks doivent reproduire les résultats attendus du Guide commun :

- **TRN-0912-01** : `valeur_kg` 8,54, BAC-014 → 290 points (Awa 105, Koffi 79, Mariam 65, Yao 39).
- **DIG-02 avec un facteur 0,70** : écart −30 %, alerte `production`, électricité 38,08 kWh.

---

## 9. Comment travailler sur une tâche

1. Relire la section du Guide commun et du brief qui concerne la tâche, ainsi que la maquette dans `design/` si elle existe.
2. Vérifier les endpoints et les champs dans `docs/ROUTES.md` et `src/api/schema.d.ts`.
3. Si l'endpoint n'est pas encore simulé, compléter d'abord le mock dans `src/mocks/`.
4. Coder l'écran contre les mocks, avec ses états de chargement, vide et erreur.
5. Vérifier avec `npm run typecheck`, `npm run lint` et `npm test`. Pour les écrans clés (T2, M2, A2), écrire au moins un test qui contrôle l'affichage des valeurs de démo.
6. Écrire un message de commit au format `feat(cc): …`, `fix(cc): …` ou `docs(cc): …`.

## 10. À ne pas faire

- Ajouter un champ, un endpoint ou une valeur d'énumération qui n'est pas dans le contrat.
- Recalculer une valeur que le backend fournit déjà.
- Utiliser une autre bibliothèque d'interface, d'icônes ou de graphiques que celles du §3.
- Écrire des couleurs, des tailles ou des textes de statut en dur, hors des jetons et de `src/lib/`.
- Stocker un jeton dans `localStorage` ou `sessionStorage`.
- Modifier les fichiers de `docs/reference/` : ils sont la copie du contrat commun et se mettent à jour seulement quand l'équipe publie une nouvelle version.
