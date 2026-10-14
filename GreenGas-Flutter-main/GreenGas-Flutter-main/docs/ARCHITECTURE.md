# Architecture de l'application mobile

Source de vérité du contrat : [docs/contrat/GREENGAS_Guide_Commun.md](contrat/GREENGAS_Guide_Commun.md)
et [docs/contrat/openapi.yaml](contrat/openapi.yaml). Ce document explique comment l'app Flutter les applique.

## Principe : le backend calcule, l'app affiche

L'app n'invente aucune règle et ne recalcule rien : points, poids net, périodes de collecte, seuils, statuts d'un scan.
Elle envoie des actions, affiche ce que le serveur renvoie et réagit au `code` des erreurs. Les 4 jours de collecte
sont le paramètre serveur `duree_periode_collecte_jours` : l'app montre les tournées planifiées et le nombre de scans
depuis la dernière collecte (`scans_valides_periode`), elle ne calcule pas de calendrier.

```
features/ (écrans)  ->  data/providers.dart  ->  data/repositories.dart  ->  ApiClient
                                                                             |-- HttpApiClient  (serveur réel, JWT)
                                                                             `-- FakeApiClient  (mode démo)
domain/models.dart : modèles et énumérations du guide (§6, §7)
```

Un seul point de bascule : `AppConfig.useMock` (`--dart-define=USE_MOCK=false`). Les deux clients parlent le même
langage (chemins du guide, JSON décodé, `ApiException`), donc les repositories et les écrans ne changent pas.

## Parcours et routes utilisées (guide §2 et §10)

| Écran | Routes | Réactions aux erreurs |
|---|---|---|
| Connexion | `POST /auth/token/` | `NON_AUTHENTIFIE` |
| Aiguillage par rôle | `role` du jeton : `citoyen` -> parcours citoyen, `collecteur` -> parcours collecteur, autre -> « Utilisez le Control Center » | |
| Restauration de session | `GET /auth/moi/` | jetons effacés si 401 |
| Inscription citoyen | `GET /bacs/proches/` (route publique, carte pour choisir son bac), `POST /auth/inscription/` (`code_bac`, `email` facultatif) — renvoie `Jetons` et connecte directement (contrat 1.3.0, sans SMS) | `TELEPHONE_DEJA_UTILISE`, `VALIDATION`, 404 code bac |
| Citoyen : scan | `POST /scans/ {code_bac, latitude, longitude}`, `GET /scans/`, `GET /parametres/{cle}/` (`max_scans_par_jour`, contrat 1.6.0) | `COMPTE_NON_VALIDE`; statuts `valide`, `non_localise`, `hors_zone`, `refuse_plafond`. L'app lit le plafond du jour pour bloquer **avant** la saisie (bandeau si le quota est atteint). |
| Citoyen : points | `GET /greenpoints/solde/` | |
| Citoyen : boutique (bento) | `GET /recompenses/`, `POST /echanges/ {recompense_id, telephone_beneficiaire}` (numéro optionnel, contrat 1.4.0), `GET /echanges/` | `SOLDE_INSUFFISANT`, `RECOMPENSE_INACTIVE`, `VALIDATION` |
| Collecteur : tournée | `GET /tournees/?date=`, `GET /tournees/?statut=planifiee`, `GET /tournees/{id}/`, `POST .../demarrer/`, `POST .../cloturer/` | `TOURNEE_STATUT_INVALIDE`, `COLLECTE_STATUT_INVALIDE` |
| Collecteur : scan d'un bac | `POST /tournees/{id}/collectes/ {code_bac}` | `BAC_HORS_TOURNEE`, `BAC_DEJA_COLLECTE`, `TOURNEE_STATUT_INVALIDE` |
| Collecteur : pesée et validation | `GET /collectes/{id}/` chaque seconde jusqu'à `pesee`, puis `POST /collectes/{id}/valider/` | `COLLECTE_STATUT_INVALIDE`, `POIDS_INVALIDE` |

Règles d'écriture reprises du guide : noms français en `snake_case` côté API (camelCase en Dart : `poids_net_kg` ->
`poidsNetKg`), valeurs d'énumération identiques (`en_attente_pesee` -> `StatutCollecte.enAttentePesee`, converti dans
`models.dart`), dates ISO 8601 UTC, QR code = le code seul (`BAC-014`), URL avec barre finale.

## Interface

Direction artistique reprise de l'app desktop (Control Center) : voir [DESIGN_TOKENS.md](DESIGN_TOKENS.md).
Disposition et dock inspirés de la maquette [reference_planta.jpeg](reference_planta.jpeg).

- **Système de design** : `lib/shared/design/` (import unique `design.dart`). Couleurs claires et sombres en
  `ThemeExtension` (`context.colors`), espacements, rayons, ombres, mouvement (`AppMotion` : durées, courbes et ressorts
  du desktop), et les composants : `AppCard`, `AppTile`, `StatusPill`, `AppButton`, `ArrowPillButton`,
  `CircleIconButton`, `AppTextField`, `showAppSheet` / `showResultSheet`, `EmptyState`, `ErrorState`, `Skeleton`,
  `AnimatedNumber`, `Reveal` (apparition en cascade), `SegmentedChoice`, `ProgressBar`, `KpiCard`, `NoticeBanner`,
  `PulseRing`, `FloatingDock`, `PageScaffold`, `TabSwitcher`, `showToast`. Aucune couleur en dur dans les écrans.
- **Polices** : Inter (interface, chiffres tabulaires) et JetBrains Mono (codes BAC-014, TRN-…), embarquées dans
  `assets/fonts/` depuis le desktop : l'app fonctionne hors ligne.
- **Animations** : uniquement transformations et opacité ; toutes coupées si le téléphone demande moins
  d'animations (`MediaQuery.disableAnimations`). Les éléments animés en boucle sont isolés (`RepaintBoundary`).
- **Dock flottant** (`FloatingDock`) : pilule détachée des bords, rond actif plein qui glisse avec un ressort et
  s'étire pendant le trajet ; citoyen : Scanner, Boutique, Gains, Carte ; collecteur : Tournée, Scanner. Un seul
  onglet est construit à la fois (la caméra et les minuteurs s'arrêtent quand on le quitte).
- **En-tête des onglets** (`shared/app_header.dart`) : avatar (ouvre le Profil), salutation ou titre, cloche des
  notifications (oscille à l'arrivée d'une notification).
- **Page d'accueil** : logo, visuel héros animé par slide, panneau blanc arrondi avec le carrousel (5 s, pause au
  toucher) et le bouton pilule à rond-flèche.
- **Accueil citoyen** (onglet Scanner) : bannière verte (solde, points en attente, bouton « Scanner un bac » ou limite
  du jour) et historique des dépôts, rien d'autre : les récompenses sont dans la Boutique.
- **Boutique** : filtres en pilules, grilles par catégorie avec jauge vers chaque récompense ; une récompense ouvre
  un **écran de détail** (visuel, puces d'info, « Qui reçoit ? », bouton « Échanger »).
- **Profil** (`features/profile/`) : identité, compte, langue, mode nuit, notifications, position (collecteur),
  déconnexion. Remplace l'ancien tiroir latéral et l'écran Paramètres.
- **Langues** : `lib/l10n/strings_fr.dart` (référence), `strings_en.dart`, `strings_local.dart` (dioula et baoulé,
  partiels). Français et anglais complets ; aucun texte en dur dans les widgets. Dioula et baoulé : **à faire écrire
  ou valider par des locuteurs** avant toute démonstration publique.
- **Logo** : `assets/images/logo.png` (couleurs), `logo_white.png` (fonds verts), `logo_g.png` (le « G » seul, repris
  du desktop). L'icône (`app_icon.png`) est le logo blanc sur vert forêt `#1B4332` ; régénérer avec
  `dart run flutter_launcher_icons` et `dart run flutter_native_splash:create`.
- **Cartes** : `flutter_map` (OpenStreetMap) + itinéraires OSRM (`shared/map_parts.dart` : fond, position qui pulse,
  épingles). Le bouton « Itinéraire » ouvre Google Maps (`lib/core/maps.dart`, `url_launcher`, sans clé).

## Ce que fait le collecteur

1. Se connecte avec son compte préenregistré (il n'y a pas d'inscription collecteur).
2. Onglet Tournée : voit la tournée du jour, la carte et les bacs triés par distance, démarre la tournée.
3. Sur place, onglet Scanner : scanne le QR du bac, le serveur ouvre la collecte.
4. Saisit le poids brut du bac (`source = manuel`, contrat 1.5.0), puis valide la collecte.
5. Quand tous les bacs sont validés : clôture de la tournée. Le tri et les points se passent ensuite au Control Center.

## Mode démo (FakeApiClient)

Répond avec les formats du guide et les données de démo du §12 (mêmes comptes, mêmes bacs, BAC-014 avec 22 scans).
Simplifications : pas de contrôle de distance (pas de `hors_zone`), le poids est saisi à la main par le
collecteur (`source = manuel`), le tri se déclenche avec le bouton « Simuler la validation du tri »
(Paramètres), avec `valeur_kg = 8,54` comme dans l'exemple du §8.3 : Awa reçoit +105 points.

## Session et jetons

`SecureTokenStore` (Keystore / Keychain) en mode serveur, mémoire en mode démo. Sur 401, `HttpApiClient` appelle une
fois `/auth/token/rafraichir/` ; en cas d'échec, les jetons sont effacés et l'app revient à la connexion.

## Ajouts de contrat intégrés

Les anciennes propositions (bacs proches, e-mail facultatif, catégorie de récompense, numéro bénéficiaire
d'un échange) sont désormais **dans le contrat** (openapi / guide 1.4.0). Le contrat 1.6.0 y ajoute la lecture
`GET /parametres/{cle}/` (plafond de scans/jour) et la pesée manuelle du collecteur. Voir
[PROPOSITIONS_CONTRAT.md](PROPOSITIONS_CONTRAT.md) pour ce qui reste ouvert (langue, durcissement sécurité).

## Questions ouvertes pour l'équipe (à trancher dans le guide avant de coder)

1. `GET /tournees/?statut=planifiee` renvoie-t-il bien les tournées futures du collecteur connecté ? L'écran « prochaine tournée » en dépend.
2. `poids_net_kg` reste-t-il `null` jusqu'à la validation ? L'app n'affiche que `poids_brut_kg` et `tare_kg` avant.
3. Le citoyen peut-il voir la date de la prochaine collecte de son bac ? Rien ne l'expose aujourd'hui (proposition : `prochaine_collecte` dans `GET /bacs/{id}/`).
4. Un scan sur un autre bac que le sien est-il accepté par `POST /scans/` ? Aucun code d'erreur ne le prévoit.
5. Un échange renvoie-t-il un code de retrait ? `Echange` n'en contient pas, l'app confirme seulement le débit.
6. Le QR ne contient que le code : n'importe qui peut en fabriquer un. Acceptable pour la démo, à durcir ensuite.
