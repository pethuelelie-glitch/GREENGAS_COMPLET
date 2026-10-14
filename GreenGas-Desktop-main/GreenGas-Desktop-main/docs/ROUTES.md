# Écrans, routes, rôles et endpoints

Toutes les URL d'API sont relatives à `VITE_API_URL` (`http://localhost:8000/api/v1`) et finissent par `/`.
Les identifiants d'écran (E0, T1…) sont ceux du brief design.

## Après la connexion

| Rôle | Page d'arrivée |
|---|---|
| `operateur_tri` | `/tri` |
| `responsable_methanisation` | `/methanisation` |
| `administrateur` | `/methanisation` (vue globale, comme dans la maquette) |
| `referent` | `/admin/verifications` (accès limité à sa résidence) |
| `citoyen`, `collecteur`, `capteur` | Connexion refusée côté interface : « Ce compte s'utilise dans l'application mobile GREENGAS. » |

L'administrateur peut aussi ouvrir les pages `/tri/*` et `/methanisation/*`, en lecture.

## Commun

| Écran | Route | Endpoints |
|---|---|---|
| E0 Connexion | `/connexion` | `POST /auth/token/` (`{telephone}` ou `{email}`, onglets Téléphone / E-mail ; `403 COMPTE_NON_VALIDE` affiché dans le formulaire), `GET /auth/moi/`, `POST /auth/token/rafraichir/` |
| E1 Inscription du personnel | `/inscription` | `POST /auth/inscription/personnel/` (`{nom, telephone, email, mot_de_passe, role}` ; opérateur de tri ou responsable méthanisation). Contrat 1.3.0 : `201` + `Utilisateur` en attente, sans jetons ; écran « Demande envoyée » |
| Paramètres personnels (bouton « Paramètres » du bas de la barre latérale, sauf administrateur) | `/preferences` | aucun (thème et animations gardés sur l’appareil ; compte lu dans la session) |
| Cloche des notifications (barre du haut, tous les rôles) | — | `GET /notifications/compteur/` (toutes les 5 s), `GET /notifications/` (panneau : 20 plus récentes), `POST /notifications/{id}/lue/`, `POST /notifications/tout-lire/` |
| Notifications (tous les rôles) | `/notifications` | `GET /notifications/` (100 plus récentes, filtre `lue`), `POST /notifications/{id}/lue/`, `POST /notifications/tout-lire/` |
| Page introuvable | `*` | — |

## Opérateur de tri — `features/tri/`

| Écran | Route | Rôles | Endpoints | Priorité |
|---|---|---|---|---|
| T1 Tournées à trier | `/tri` | operateur_tri, administrateur | `GET /tournees/?statut=collectee` | 1 |
| T2 Saisie du tri | `/tri/:tourneeId/saisie` | operateur_tri | `GET /tournees/{id}/`, `GET /parametres/` (tolérance), `POST /tournees/{id}/tri/` | 1 |
| T3 Résultat du tri | `/tri/:tourneeId/resultat` | operateur_tri, administrateur | `GET /tournees/{id}/tri/`, `GET /greenpoints/transactions/?tournee_id=` | 1 |
| T4 Historique des tris | `/tri/historique` | operateur_tri, administrateur | `GET /tournees/?statut=triee`, `GET /lots/` | 2 |

## Responsable méthanisation — `features/methanisation/`

| Écran | Route | Rôles | Endpoints | Priorité |
|---|---|---|---|---|
| M1 Vue globale | `/methanisation` | responsable_methanisation, administrateur | `GET /productions/globale/?date=`, `GET /sites/`, `GET /alertes/?statut=ouverte` | 1 |
| M2 Tableau de bord d'un site | `/methanisation/sites/:siteId` | responsable_methanisation, administrateur | `GET /sites/{id}/`, `GET /productions/?site_id=&date_debut=&date_fin=`, `PATCH /sites/{id}/`, `POST /productions/{id}/cloturer/`, `GET /parametres/` | 1 |
| M3 Alertes | `/methanisation/alertes` (détail : `?alerte=<id>`) | responsable_methanisation, administrateur | `GET /alertes/`, `GET /alertes/{id}/`, `POST /alertes/{id}/resoudre/` | 1 |

## Administrateur — `features/administration/`

| Écran | Route | Rôles | Endpoints | Priorité |
|---|---|---|---|---|
| A1 Supervision | `/admin` | administrateur | `GET /productions/globale/`, `GET /tournees/`, `GET /verifications/`, `GET /alertes/?statut=ouverte` | 3 |
| A2 Traçabilité | `/admin/tracabilite` (bac : `?bac=BAC-014`) | administrateur | `GET /bacs/?code=`, `GET /bacs/{id}/tracabilite/` | 1 |
| A3 Vérifications | `/admin/verifications` | administrateur, referent (signaux de sa résidence, sans les comptes en attente) | `GET /verifications/`, `POST /collectes/{id}/decision/` (administrateur), `POST /utilisateurs/{id}/validation/` (**administrateur seulement**, personnel en attente) | 2 |
| A4 Utilisateurs | `/admin/utilisateurs` (filtres en paramètres d'URL) | administrateur | `GET /utilisateurs/`, `POST /utilisateurs/`, `PATCH /utilisateurs/{id}/`, `POST /utilisateurs/{id}/validation/` (personnel en attente), `GET /bacs/` | 2 |
| A5 Bacs | `/admin/bacs` (liste) · `/admin/bacs/:bacId` (fiche) | administrateur | `GET /bacs/`, `POST /bacs/`, `PATCH /bacs/{id}/`, `GET /collectes/?bac_id=`, `GET /utilisateurs/?bac_id=`, `GET /secteurs/` | 2 |
| A6 Tournées | `/admin/tournees` | administrateur | `GET /tournees/`, `POST /tournees/`, `GET /utilisateurs/?role=collecteur`, `GET /bacs/`, `GET /sites/` | 2 |
| A7 Paramètres (bouton « Paramètres » du bas de la barre latérale) | `/admin/parametres` | administrateur | `GET /parametres/`, `PATCH /parametres/{cle}/` | 2 |
| A8 Journal | `/admin/journal` | administrateur | `GET /journal/` | 3 |
| A9 Capteurs | `/admin/capteurs` | administrateur | `GET /simulation/scenarios/`, `POST /simulation/scenarios/`, `DELETE /simulation/scenarios/{site_id}/`, `GET /sites/` | 1 |

## Rafraîchissement automatique (toutes les 5 s)

M1, M2, M3, A1, A3, ainsi que le compteur d'alertes du bandeau global. Les autres écrans se rafraîchissent après chaque action (invalidation TanStack Query).

## Clés de cache TanStack Query (convention)

`['tournees', filtres]` · `['tournee', id]` · `['tri', tourneeId]` · `['sites']` · `['productions', filtres]` · `['production-globale', date]` · `['alertes', filtres]` · `['verifications', type]` · `['parametres']` · `['bac-tracabilite', bacId]` · `['journal', filtres]` · `['scenarios']` · `['notifications', …]`
