# GREENGAS — Guide commun de l'équipe

**SIREXE Hackathon 2026 · Équipe DEDSEC · version du 14 octobre 2026** (contrat 1.5.0 : citoyens actifs dès l'inscription ; validation du personnel par l'administrateur, activable dans les paramètres)

Ce document est la référence unique pour travailler ensemble. Il fixe ce que tout le monde doit écrire **de la même façon** : les modèles, les noms de champs, les statuts, les calculs et la manière dont les applications se parlent.

Quand une question se pose (« ce champ s'appelle comment ? », « qui calcule les points ? »), la réponse est ici. Si elle n'y est pas, on l'ajoute ici avant de coder, et on prévient les autres.

> Le cahier des charges (CDC v2.1) explique **le pourquoi** fonctionnel. Ce guide explique **le comment** technique commun.

---

## Sommaire

1. [Les livrables et qui fait quoi](#1-les-livrables-et-qui-fait-quoi)
2. [Comment les livrables marchent ensemble](#2-comment-les-livrables-marchent-ensemble)
3. [Comment fonctionne le backend](#3-comment-fonctionne-le-backend)
4. [Les règles d'écriture communes](#4-les-règles-décriture-communes)
5. [Les rôles et les comptes](#5-les-rôles-et-les-comptes)
6. [Les énumérations](#6-les-énumérations)
7. [Les modèles](#7-les-modèles)
8. [Les calculs](#8-les-calculs)
9. [Les paramètres système](#9-les-paramètres-système)
10. [Les endpoints par application](#10-les-endpoints-par-application)
11. [Les erreurs](#11-les-erreurs)
12. [Les données de démo communes](#12-les-données-de-démo-communes)
13. [Planning d'intégration](#13-planning-dintégration)

---

## 1. Les livrables et qui fait quoi

| # | Livrable | Technologie | Responsable | Ce qu'il doit faire |
|---|---|---|---|---|
| 1 | **Backend / API** | Django + DRF + MySQL | _à compléter_ | Stocker toutes les données, faire **tous** les calculs (points, biogaz, énergie, alertes), vérifier les droits, simuler les capteurs. |
| 2 | **Application mobile** | Flutter | _à compléter_ | Parcours **citoyen** (inscription, scan du bac, points, récompenses) et parcours **collecteur** (tournée, identification du bac, pesée, validation). |
| 3 | **Control Center** | React (web) + Electron (desktop) | Bonfils | Écrans de l'**opérateur de tri**, du **responsable méthanisation** et de l'**administrateur** : tri, tableaux de bord énergie, alertes, vérifications, paramètres, traçabilité. |
| 4 | Site vitrine | Vue.js | _à compléter_ | Pages statiques de présentation. Priorité basse, sacrifiable. |
| 5 | Dossier, pitch et démo | — | Toute l'équipe | Présentation au jury, scénario de démo répété. |

**Principe clé :** seul le backend calcule. Flutter et le Control Center **affichent** et **envoient des actions** ; ils ne recalculent jamais des points, du biogaz ou un écart.

---

## 2. Comment les livrables marchent ensemble

```
   ┌──────────────────────┐          ┌──────────────────────────┐
   │  App Flutter         │          │  Control Center          │
   │  • citoyen           │          │  (React web + Electron)  │
   │  • collecteur        │          │  • opérateur de tri      │
   └──────────┬───────────┘          │  • resp. méthanisation   │
              │  HTTP + JSON + JWT   │  • administrateur        │
              │                      └────────────┬─────────────┘
              ▼                                   ▼
        ┌──────────────────────────────────────────────┐
        │         Backend Django REST  /api/v1/        │
        │  règles · calculs · droits · journal         │
        │  ┌───────────────────────┐                   │
        │  │ Simulateur IoT        │ (pesée, gaz)      │
        │  └───────────────────────┘                   │
        └──────────────────────┬───────────────────────┘
                               ▼
                        ┌─────────────┐
                        │   MySQL     │
                        └─────────────┘
```

- Flutter et le Control Center **ne parlent jamais entre eux** et **ne touchent jamais à MySQL**. Tout passe par l'API.
- Ils se « rencontrent » dans les données : ce que le collecteur valide sur Flutter apparaît dans le Control Center chez l'opérateur de tri ; ce que l'opérateur trie crée les points que le citoyen voit sur Flutter.

### La chaîne complète (ce que la démo doit montrer)

| Étape | Qui | Où | Ce qui se passe |
|---|---|---|---|
| 1 | Citoyen | Flutter | Scanne le QR du bac `BAC-014` → un **Scan** est enregistré. |
| 2 | Collecteur | Flutter | Démarre sa **Tournée**, scanne le bac → une **Collecte** s'ouvre. |
| 3 | Simulateur | Backend | Envoie le poids du bac → la collecte passe à `pesee`. |
| 4 | Collecteur | Flutter | Valide la collecte, puis clôture la tournée → tournée `collectee`. |
| 5 | Opérateur de tri | Control Center | Saisit les poids par catégorie → le backend crée les **Lots**, calcule les **GreenPoints** et envoie l'organique au **Site**. |
| 6 | Citoyen | Flutter | Voit ses nouveaux points (+105). |
| 7 | Simulateur | Backend | Envoie la mesure de gaz du site → le backend calcule l'énergie et l'écart ; à −30 %, il crée une **Alerte**. |
| 8 | Resp. méthanisation | Control Center | Voit l'alerte et la résout. |
| 9 | Administrateur | Control Center | Ouvre la traçabilité du bac : scans → collecte → tri → points → énergie. |

### Qui dépend de qui

| Pour avancer, j'ai besoin de… | Flutter | Control Center |
|---|---|---|
| Connexion JWT (`/auth/token/`) | ✔ | ✔ |
| Référentiel (secteurs, sites, bacs) | ✔ | ✔ |
| Scans | ✔ | (lecture) |
| Tournées + collectes + pesée simulée | ✔ | (lecture) |
| Tri + pipeline des points | (lecture des points) | ✔ |
| Productions, mesures, alertes | — | ✔ |
| Vérifications, paramètres, journal | — | ✔ |

En attendant que le backend soit prêt, Flutter et le Control Center travaillent avec **des données factices qui respectent exactement les formats de ce guide** (voir §12). Le jour où le backend est prêt, on change seulement l'URL.

---

## 3. Comment fonctionne le backend

### Organisation conseillée (apps Django)

| App Django | Contenu |
|---|---|
| `comptes` | Utilisateur (modèle personnalisé), OTP, rôles, permissions |
| `referentiel` | Secteur, Site, Bac |
| `collecte` | Scan, Tournee, Collecte |
| `tri` | LotTrie, pipeline de tri |
| `greenpoints` | GreenPointsTransaction, Recompense, Echange |
| `energie` | ProductionEnergie, Alerte |
| `supervision` | Parametre, JournalAudit, file de vérification, traçabilité |
| `simulateur` | Faux capteurs (pesée, compteur de gaz) |

### Les quatre moments où le backend calcule

**1. À la validation d'une collecte** (collecteur)
- `poids_net_kg = poids_brut_kg − tare_kg`
- fige `scans_valides` = scans qui comptent depuis la dernière collecte du bac
- calcule `kg_par_scan` ; si < 0,3 → `statut_controle = a_verifier`
- remet à zéro le compteur de scans du bac

**2. À la validation du tri** (opérateur) — *le pipeline*, dans une seule transaction (`transaction.atomic()`) : soit tout passe, soit rien n'est écrit
1. Compare le poids trié au poids collecté (tolérance de 2 %).
2. Crée les lots et calcule `valeur_kg` de la tournée.
3. Pour chaque bac : calcule `points_bac`.
4. Pour chaque citoyen du bac : crée sa transaction (`creditee`, ou `en_attente` si le bac est « à vérifier »).
5. Ajoute le poids organique à la production du jour du site → `biogaz_attendu_m3`.

**3. À la réception d'une mesure de gaz** (simulateur)
- calcule l'écart, l'énergie, le digestat et les foyers équivalents
- crée ou met à jour une alerte si nécessaire

**4. À une décision manuelle** (admin, responsable)
- applique la décision et l'écrit dans le **journal d'audit** (qui, quand, avant/après, motif)

### Le simulateur IoT

Il remplace les vrais capteurs **en passant par les mêmes endpoints** qu'eux, avec `source = "simule"`.

| Capteur simulé | Quand | Valeur envoyée |
|---|---|---|
| Pesée embarquée | Dès qu'une collecte est ouverte | `poids_brut_kg` (poids prévu dans les données de démo, sinon aléatoire) |
| Compteur de gaz | Une fois par jour et par site (ou à la demande en démo) | `biogaz_mesure_m3 = attendu × facteur` ; facteur aléatoire entre 0,95 et 1,05 |
| Méthane, température, pH | Avec la mesure de gaz | Valeurs réalistes (CH₄ ≈ 60 %, 36 °C, pH 7,1) |

**Scénario de démo :** l'administrateur force le facteur d'un site à 0,70 depuis le Control Center → la mesure suivante donne −30 % → l'alerte se déclenche à coup sûr devant le jury.

### Réglages Django à poser dès le premier jour

| Réglage | Valeur | Pourquoi |
|---|---|---|
| `AUTH_USER_MODEL` | `comptes.Utilisateur`, `id` en UUID, connexion par `telephone` | Impossible à changer proprement après la première migration |
| `COERCE_DECIMAL_TO_STRING` | `False` | Sinon DRF envoie `"34.00"` (texte) au lieu de `34.0` (nombre) |
| `USE_TZ` / `TIME_ZONE` | `True` / `"UTC"` | Dates cohérentes partout |
| Base MySQL | `charset utf8mb4` | Accents et caractères spéciaux |
| Pagination | `page` et `taille_page` (50 par défaut, 200 au maximum) | Même format de liste partout |
| Gestionnaire d'erreurs | format `{code, message, details}` | Même format d'erreur partout (§11) |
| JWT (simplejwt) | accès 60 min, rafraîchissement 7 jours, `role` dans le jeton | Connexion commune |
| CORS | `http://localhost:5173` (Vite) | Le Control Center web peut appeler l'API |

---

## 4. Les règles d'écriture communes

| Sujet | Règle | Exemple |
|---|---|---|
| Préfixe d'URL | `/api/v1/` | `http://localhost:8000/api/v1/bacs/` |
| Barre finale | **Toujours** un `/` à la fin | `/bacs/` ✔ — `/bacs` ✘ |
| Noms | Français, `snake_case`, **sans accents** | `electricite_kwh`, `statut_controle` |
| Unités | Dans le nom du champ | `poids_net_kg`, `biogaz_mesure_m3`, `ecart_pct` |
| Identifiants | `id` en UUID, plus un `code` lisible créé par le serveur | `id: "bac00000-…-000000000014"`, `code: "BAC-014"` |
| Liens entre objets | `<objet>_id` | `bac_id`, `tournee_id`, `site_id` |
| Date et heure | ISO 8601 en UTC, avec `Z` | `"2026-09-12T08:30:00Z"` |
| Date seule | `AAAA-MM-JJ` | `"2026-09-12"` |
| Nombres | Toujours des nombres JSON | `34.0` ✔ — `"34.0"` ✘ |
| Arrondis | Poids, volumes, énergie : 2 décimales ; écarts : 1 décimale ; points : entier | `12.36`, `-30.0`, `105` |
| Pourcentages | En points | `20` = 20 % ; `-30` = −30 % |
| Valeur absente | `null`, le champ est toujours présent | `"date_pesee": null` |
| Énumérations | minuscules `snake_case` | `en_attente_pesee` |
| Codes d'erreur | MAJUSCULES | `SOLDE_INSUFFISANT` |
| Listes paginées | `{count, next, previous, results}` | `?page=2&taille_page=50` |
| Tri des listes | Du plus récent au plus ancien | — |

### Format des codes lisibles

| Objet | Format | Exemple |
|---|---|---|
| Bac | `BAC-` + 3 chiffres | `BAC-014` |
| Tournée | `TRN-` + MMJJ + `-` + numéro du jour | `TRN-0912-01` |
| Lot trié | préfixe de catégorie + 4 chiffres | `ORG-0258`, `PLA-0112` |
| Site | `DIG-` + 2 chiffres | `DIG-01` |
| Secteur | nom en majuscules | `NORD`, `EST`, `OUEST` |

Préfixes de lots : `ORG` organique · `BIO` biomasse · `PLA` plastique · `MET` métal · `CAR` carton/papier · `VER` verre · `REF` refus.

**QR code du bac :** il contient seulement le code, par exemple `BAC-014`, jamais une URL.

---

## 5. Les rôles et les comptes

| Rôle (`role`) | Application | Comment le compte est créé |
|---|---|---|
| `citoyen` | Flutter | **Inscription libre** dans l'app : compte **actif aussitôt**, sans code SMS ni validation |
| `collecteur` | Flutter | **Préenregistré** (données de démo ou admin). Aucune inscription possible. |
| `operateur_tri` | Control Center | Inscription dans le Control Center, **puis validation par un administrateur**, ou création directe par un administrateur |
| `responsable_methanisation` | Control Center | Inscription dans le Control Center, **puis validation par un administrateur**, ou création directe par un administrateur |
| `referent` | Control Center | Préenregistré, rattaché à un bac (suit les vérifications de sa résidence) |
| `administrateur` | Control Center | Préenregistré |
| `capteur` | aucune (le simulateur) | Préenregistré, compte technique |

### Règle importante pour les collecteurs

- L'écran d'inscription de Flutter crée **uniquement** des comptes `citoyen`. Le rôle n'est jamais choisi par l'utilisateur ; c'est le backend qui le fixe.
- Les comptes collecteurs existent déjà dans la base (données de démo). Pour la démo, on se connecte avec un collecteur préenregistré (par exemple `+2250700000002` / `greengas2026`) pour montrer son parcours.
- Après la connexion, Flutter lit le `role` renvoyé et ouvre le bon parcours : `citoyen` → écrans citoyen ; `collecteur` → écrans collecteur ; tout autre rôle → message « Utilisez le Control Center ».
- Le backend refuse côté serveur toute action collecteur faite par un citoyen (erreur 403), même si l'app était modifiée.

### Inscription d'un citoyen (Flutter)

- `POST /auth/inscription/` avec `{nom, telephone, mot_de_passe, code_bac}` → `201` et `{access, refresh, utilisateur}` : le compte est **actif** et le citoyen est connecté aussitôt. Pas de code SMS, pas de validation par le référent ou l'administrateur.
- Les routes `/auth/otp/…` ne sont plus utilisées (marquées obsolètes dans le contrat). Elles pourront revenir si on vérifie un jour le téléphone par SMS.
- La triche reste limitée par les règles des scans (§8.1) et par les vérifications : collecte « à vérifier », bac « surinscrit ». Un bac surinscrit est **signalé**, il ne bloque aucun compte.

### Inscription du personnel (Control Center)

- `POST /auth/inscription/personnel/` avec `{nom, telephone, email, mot_de_passe, role}` → `201` et l'`Utilisateur` créé. **Aucun jeton** n'est émis.
- Le paramètre `validation_comptes_personnel` (§9, 1.5.0) décide de la suite :
  - `1` (validation activée) : le compte est créé avec `statut_validation = en_attente` ; la personne ne peut pas se connecter (`403 COMPTE_NON_VALIDE`) tant qu'un administrateur n'a pas validé son compte (`POST /utilisateurs/{id}/validation/`). Refusé → connexion toujours impossible.
  - `0` (validation désactivée, valeur actuelle) : le compte est créé avec `statut_validation = valide` et la personne se connecte aussitôt. Un compte resté `en_attente` peut aussi se connecter ; un compte refusé ou désactivé reste refusé.
- `role` vaut seulement `operateur_tri` ou `responsable_methanisation`. Tout autre rôle → `400 VALIDATION`. Numéro déjà utilisé → `409 TELEPHONE_DEJA_UTILISE` ; e-mail déjà utilisé → `409 EMAIL_DEJA_UTILISE`. Téléphone et e-mail obligatoires ; l'e-mail est enregistré en minuscules. Mot de passe de 8 caractères minimum.
- Les administrateurs sont préenregistrés. Ils créent tous les autres comptes (référents, collecteurs, administrateurs…) avec `POST /utilisateurs/`.

### Connexion (identique pour tous)

1. `POST /auth/token/` avec `{telephone, mot_de_passe}` **ou** `{email, mot_de_passe}` → `{access, refresh, utilisateur}`. Un seul des deux identifiants (sinon `400 VALIDATION`) ; l'e-mail est comparé sans tenir compte des majuscules. Le Control Center propose les deux ; Flutter peut rester au téléphone.
2. Chaque requête envoie l'en-tête `Authorization: Bearer <access>`.
3. Si on reçoit une erreur 401 : on appelle **une fois** `POST /auth/token/rafraichir/` avec `{refresh}`. Si ça échoue aussi, retour à l'écran de connexion.

### Qui a le droit de faire quoi

| Action | Rôle autorisé |
|---|---|
| Scanner un bac, échanger des points | citoyen |
| Démarrer/clôturer une tournée, ouvrir/valider une collecte | collecteur (seulement ses tournées) |
| Envoyer une pesée ou une mesure de gaz | capteur |
| Saisir et valider un tri | operateur_tri |
| Clôturer la journée d'un site, résoudre une alerte, changer le statut d'un site | responsable_methanisation |
| Valider ou refuser un compte du personnel en attente | administrateur |
| Gérer les comptes, bacs, secteurs, récompenses, paramètres ; décider des collectes « à vérifier » ; lancer un scénario de démo | administrateur |

---

## 6. Les énumérations

Ces valeurs sont **exactement** celles à utiliser en base, dans l'API, dans Flutter et dans le Control Center. Le libellé à afficher est libre.

| Énumération | Valeurs | Remarque |
|---|---|---|
| `Role` | `citoyen`, `collecteur`, `operateur_tri`, `responsable_methanisation`, `referent`, `administrateur`, `capteur` | |
| `StatutValidation` (état du compte) | `en_attente`, `valide`, `refuse` | `en_attente` seulement pour le personnel inscrit lui-même |
| `StatutBac` | `actif`, `inactif` | |
| `StatutSite` | `nominal`, `alerte`, `maintenance` | `alerte` est posé par le backend |
| `CodeSecteur` | `NORD`, `EST`, `OUEST` | |
| `StatutScan` | `valide`, `non_localise`, `hors_zone`, `refuse_plafond` | seuls `valide` et `non_localise` comptent |
| `StatutTournee` | `planifiee`, `en_cours`, `collectee`, `triee` | |
| `MotifAffectation` | `secteur`, `repli` | `repli` = site du secteur en maintenance |
| `StatutCollecte` | `en_attente_pesee`, `pesee`, `validee` | |
| `StatutControle` | `normal`, `a_verifier`, `points_valides`, `points_annules` | |
| `SourceMesure` | `simule`, `capteur` | |
| `NiveauContamination` | `faible`, `moyen`, `eleve` | saisi au tri |
| `Categorie` (tri) | `organique`, `biomasse`, `plastique`, `metal`, `carton_papier`, `verre`, `refus` | |
| `Destination` | `digesteur`, `unite_biomasse`, `recycleur`, `enfouissement` | déduite de la catégorie |
| `StatutTransaction` | `creditee`, `en_attente`, `annulee` | |
| `StatutJournee` | `ouverte`, `cloturee` | production d'un site sur un jour |
| `DestinationDigestat` | `vente_agricole`, `stockage` | |
| `TypeAlerte` | `production`, `composition` | |
| `StatutAlerte` | `ouverte`, `resolue` | |
| `StatutDonnee` (badge) | `mesure`, `estime`, `simule` | affiché à côté de chaque chiffre |
| `TypeVerification` | `collecte_a_verifier`, `compte_en_attente`, `scan_hors_zone`, `scan_non_localise`, `bac_surinscrit` | |

### Catégorie → destination

| Catégorie | Destination | Compte dans l'énergie ? |
|---|---|---|
| `organique` | `digesteur` (site du secteur) | **Oui** |
| `biomasse` | `unite_biomasse` | Non (tracé seulement) |
| `plastique`, `metal`, `carton_papier`, `verre` | `recycleur` | Non (tracé seulement) |
| `refus` | `enfouissement` | Non, et 0 point |

### Les cycles de vie

```
Compte personnel en_attente ──décision admin──► valide | refuse   (citoyens et comptes créés par l'admin : valide d'emblée)
Tournée          planifiee ──demarrer──► en_cours ──cloturer──► collectee ──tri──► triee
Collecte         en_attente_pesee ──pesée──► pesee ──valider──► validee
Contrôle         (à la validation) normal | a_verifier ──décision admin──► points_valides | points_annules
Transaction      creditee   |   en_attente ──décision──► creditee | annulee
Journée de site  ouverte ──clôture (destination du digestat)──► cloturee
Alerte           ouverte ──résoudre (commentaire)──► resolue
```

Un passage qui n'est pas dans ce schéma est refusé par le backend.

---

## 7. Les modèles

Légende : **PK** clé primaire · **FK** clé étrangère · *calculé* = rempli par le backend, jamais envoyé par les clients.

### Utilisateur

| Champ | Type | Description |
|---|---|---|
| `id` | UUID, PK | |
| `nom` | texte | |
| `telephone` | texte, unique | Format `+225` + 10 chiffres. Sert d'identifiant de connexion. |
| `email` | texte, null, unique quand renseigné | En minuscules. Sert aussi d'identifiant de connexion. Obligatoire pour le personnel inscrit depuis le Control Center. |
| `mot_de_passe` | haché | Jamais renvoyé par l'API |
| `role` | `Role` | |
| `actif` | booléen | On ne supprime pas un compte, on le désactive |
| `statut_validation` | `StatutValidation` | `valide` pour tous, sauf le personnel inscrit lui-même quand `validation_comptes_personnel = 1` : `en_attente` jusqu'à la décision de l'administrateur |
| `date_creation` | date-heure | |
| `bac_id` | FK Bac, null | Pour un `citoyen` ou un `referent` |
| `telephone_verifie` | booléen | Citoyen : toujours `true` (pas de code SMS depuis 1.3.0) |
| `statut_validation` (profil) | `StatutValidation`, null | Citoyen : toujours `valide`, gardé pour compatibilité |
| `date_inscription` | date-heure, null | Citoyen seulement |

Dans l'API, les champs propres au citoyen sont regroupés dans `profil_citoyen` (ou `null` pour les autres rôles).

### Secteur

| Champ | Type | Description |
|---|---|---|
| `id` | UUID, PK | |
| `code` | `NORD` / `EST` / `OUEST` | |
| `nom` | texte | |
| `site_id` | FK Site | Site normal du secteur |
| `site_repli_id` | FK Site | Site utilisé si le site normal est en maintenance |

### Site (digesteur)

| Champ | Type | Description |
|---|---|---|
| `id` | UUID, PK | |
| `code` | texte | `DIG-01` |
| `nom` | texte | |
| `statut` | `StatutSite` | |
| `capacite_kg_jour` | décimal | |
| `latitude`, `longitude` | décimal | |
| `alertes_ouvertes` | entier, *calculé* | |

### Bac

| Champ | Type | Description |
|---|---|---|
| `id` | UUID, PK | |
| `code` | texte, *créé par le serveur* | `BAC-014` |
| `residence` | texte | |
| `secteur_id` | FK Secteur | |
| `nb_foyers_declares` | entier | Si plus de comptes validés que de foyers → vérification `bac_surinscrit` |
| `latitude`, `longitude` | décimal | Pour contrôler la distance au moment du scan |
| `tare_kg` | décimal | Poids du bac vide |
| `capacite_kg` | décimal | |
| `statut` | `StatutBac` | |
| `scans_valides_periode` | entier, *calculé* | Scans qui comptent depuis la dernière collecte |
| `nb_citoyens_valides` | entier, *calculé* | |
| `date_derniere_collecte` | date-heure, null, *calculé* | |

### Scan

| Champ | Type | Description |
|---|---|---|
| `id` | UUID, PK | |
| `citoyen_id` | FK Utilisateur | |
| `bac_id` | FK Bac | |
| `horodatage` | date-heure | |
| `latitude`, `longitude` | décimal, null | Position du téléphone |
| `distance_m` | décimal, null, *calculé* | Distance au bac |
| `statut` | `StatutScan`, *calculé* | |
| `compte` | booléen, *calculé* | `true` si le scan entre dans la répartition |

Le citoyen envoie seulement `{code_bac, latitude, longitude}`.

### Tournée

| Champ | Type | Description |
|---|---|---|
| `id` | UUID, PK | |
| `code` | texte, *créé par le serveur* | `TRN-0912-01` |
| `date` | date | |
| `secteur_id` | FK Secteur | |
| `site_id` | FK Site, *calculé* | Fixé à la création (secteur, ou repli) |
| `motif_affectation` | `MotifAffectation`, *calculé* | |
| `collecteur_id` | FK Utilisateur | |
| `statut` | `StatutTournee` | |
| `niveau_contamination` | `NiveauContamination`, null | Saisi au tri |
| `bacs` | liste de Bac | Bacs prévus dans la tournée |
| `poids_collecte_kg` | décimal, *calculé* | Somme des poids nets validés |

### Collecte

| Champ | Type | Description |
|---|---|---|
| `id` | UUID, PK | |
| `tournee_id` | FK Tournée | |
| `bac_id` | FK Bac | Unique par tournée (un bac n'est pas collecté deux fois) |
| `collecteur_id` | FK Utilisateur | |
| `statut` | `StatutCollecte` | |
| `poids_brut_kg` | décimal, null | Envoyé par le capteur ou le simulateur |
| `tare_kg` | décimal | Copiée depuis le bac |
| `poids_net_kg` | décimal, null, *calculé* | |
| `source` | `SourceMesure`, null | |
| `scans_valides` | entier, null, *calculé* | Figé à la validation |
| `kg_par_scan` | décimal, null, *calculé* | |
| `statut_controle` | `StatutControle`, null, *calculé* | |
| `date_ouverture`, `date_pesee`, `date_validation` | date-heure | |

### LotTrie

| Champ | Type | Description |
|---|---|---|
| `id` | UUID, PK | |
| `code_lot` | texte, *créé par le serveur* | `ORG-0258` |
| `tournee_id` | FK Tournée | |
| `categorie` | `Categorie` | Une seule fois par tournée |
| `poids_kg` | décimal | |
| `part_pct` | décimal, *calculé* | Part de la catégorie dans la tournée |
| `destination` | `Destination`, *calculé* | |
| `site_id` | FK Site, null | Pour l'organique seulement |

### GreenPointsTransaction

| Champ | Type | Description |
|---|---|---|
| `id` | UUID, PK | |
| `citoyen_id`, `bac_id`, `tournee_id`, `collecte_id` | FK | |
| `scans_citoyen` | entier | Scans du citoyen sur la période |
| `scans_bac` | entier | Scans du bac sur la période |
| `poids_attribue_kg` | décimal | |
| `valeur_kg` | décimal | Points par kg de la tournée |
| `coef_qualite` | décimal | |
| `points` | entier | Arrondi à l'entier inférieur |
| `statut` | `StatutTransaction` | |
| `date` | date-heure | |

### Recompense et Echange

| Recompense | Type | | Echange | Type |
|---|---|---|---|---|
| `id` | UUID | | `id` | UUID |
| `nom` | texte | | `citoyen_id` | FK |
| `description` | texte | | `recompense_id` | FK |
| `cout_points` | entier | | `cout_points` | entier, figé au moment de l'échange |
| `partenaire` | texte | | `date` | date-heure |
| `actif` | booléen | | | |

**Solde** (calculé, pas stocké) = somme des transactions `creditee` − somme des échanges.

### ProductionEnergie (une ligne par site et par jour)

| Champ | Type | Description |
|---|---|---|
| `id` | UUID, PK | |
| `site_id` | FK Site | Unique avec `date` |
| `date` | date | |
| `statut_journee` | `StatutJournee` | |
| `poids_organique_recu_kg` | décimal | Ajouté à chaque tri |
| `biogaz_attendu_m3` | décimal, *calculé* | |
| `biogaz_mesure_m3` | décimal, null | Envoyé par le capteur ou le simulateur |
| `ch4_pct`, `temperature_c`, `ph` | décimal, null | Envoyés avec la mesure |
| `ecart_pct` | décimal, null, *calculé* | |
| `biogaz_cuisson_m3`, `biogaz_perte_m3`, `biogaz_valorise_m3` | décimal, null, *calculé* | |
| `electricite_kwh`, `chaleur_kwh` | décimal, null, *calculé* | |
| `digestat_kg` | décimal, *calculé* | |
| `destination_digestat` | `DestinationDigestat`, null | Obligatoire pour clôturer |
| `foyers_equivalents`, `foyers_cuisson` | décimal, null, *calculé* | |
| `statuts_donnees` | objet, *calculé* | Badge de chaque chiffre, ex. `{"biogaz_mesure_m3": "simule"}` |

### Alerte

| Champ | Type | Description |
|---|---|---|
| `id` | UUID, PK | |
| `site_id` | FK Site | |
| `type` | `TypeAlerte` | |
| `statut` | `StatutAlerte` | |
| `valeur_attendue`, `valeur_mesuree`, `ecart_pct` | décimal | |
| `description` | texte | |
| `nb_occurrences` | entier | Jours regroupés sous la même alerte |
| `date_creation`, `date_derniere_occurrence`, `date_resolution` | date-heure | |
| `commentaire_resolution` | texte, null | Obligatoire pour résoudre |
| `resolue_par_id` | FK Utilisateur, null | |

### Parametre

| Champ | Type | Description |
|---|---|---|
| `cle` | texte, PK | Voir §9 |
| `valeur` | décimal | |
| `unite` | texte | |
| `statut` | `aligne`, `illustratif`, `a_sourcer`, `a_calibrer`, `v2` | |
| `description`, `source` | texte | |
| `date_modification` | date-heure | |

### JournalAudit

| Champ | Type | Description |
|---|---|---|
| `id` | UUID, PK | |
| `date` | date-heure | |
| `auteur_id` | FK Utilisateur | |
| `action` | texte | ex. `parametre.modifier`, `collecte.decider`, `alerte.resoudre` |
| `objet_type`, `objet_id` | texte | |
| `ancienne_valeur`, `nouvelle_valeur` | texte (JSON), null | |
| `motif` | texte, null | |

### Schéma des relations

```
Secteur 1──n Bac 1──n Scan n──1 Utilisateur (citoyen)
   │          │
   │          └──1──n Collecte n──1 Tournée n──1 Secteur
   │                     │            │
   1                     │            ├──1──n LotTrie
   Site 1──n Tournée     │            │
   │                     └──1──n GreenPointsTransaction n──1 Utilisateur
   ├──1──n ProductionEnergie
   └──1──n Alerte
Utilisateur 1──n Echange n──1 Recompense
```

---

## 8. Les calculs

Tous les calculs sont faits **par le backend uniquement**. Les coefficients sont lus dans la table des paramètres (§9), jamais écrits en dur.

### 8.1 Scan

| Règle | Résultat |
|---|---|
| Compte désactivé (`actif = false`) | Refus : erreur `COMPTE_NON_VALIDE` |
| Même citoyen, même bac, moins de 10 secondes après | Doublon : on renvoie le scan existant |
| Déjà 2 scans qui comptent aujourd'hui | `refuse_plafond` (ne compte pas) |
| Position à plus de 100 m du bac | `hors_zone` (ne compte pas) |
| Pas de position GPS | `non_localise` (compte, mais signalé) |
| Sinon | `valide` (compte) |

### 8.2 Collecte

```
poids_net_kg = poids_brut_kg − tare_kg
kg_par_scan  = poids_net_kg ÷ scans_valides          (seulement si scans_valides > 0)
statut_controle = a_verifier  si kg_par_scan < seuil_kg_par_scan (0,3)
                  normal      sinon
```

Poids net ≤ 0 ou supérieur à la capacité du bac → erreur `POIDS_INVALIDE`.

### 8.3 Tri et GreenPoints

```
ecart_tri_pct     = (poids_trie_total − poids_collecte) ÷ poids_collecte × 100
                    → refusé si |écart| > 2 %, sauf si un motif est saisi

part(f)           = poids_trie(f) ÷ poids_trie_total
valeur_kg         = Σ  part(f) × coefficient_filiere(f)
points_bac        = poids_net_bac × valeur_kg × coef_qualite
points_citoyen    = points_bac × scans_citoyen ÷ scans_bac      → arrondi à l'entier inférieur
```

Coefficients de filière : organique 10 · métal 15 · plastique 8 · biomasse 6 · carton/papier 5 · verre 3 · refus 0 (points/kg).
Coefficients de qualité : faible 1,0 · moyen 0,8 · élevé 0,5.

**Exemple (données de démo)** — tournée TRN-0912-01, 500 kg : organique 320, plastique 60, biomasse 30, carton 40, verre 20, métal 10, refus 20 ; contamination faible.

```
valeur_kg  = 0,64×10 + 0,12×8 + 0,06×6 + 0,08×5 + 0,04×3 + 0,02×15 + 0,04×0 = 8,54
BAC-014    : 34 kg, 22 scans → points_bac = 34 × 8,54 × 1,0 = 290,36
Awa   (8 scans) → 290,36 × 8/22 = 105,58 → 105 points
Koffi (6 scans) → 79   ·   Mariam (5) → 65   ·   Yao (3) → 39
```

Un bac sans aucun scan : son poids compte dans la tournée, mais aucun point n'est distribué.

### 8.4 Énergie (par site et par jour)

```
biogaz_attendu_m3   = poids_organique_recu_kg × 0,1
ecart_pct           = (biogaz_mesure − biogaz_attendu) ÷ biogaz_attendu × 100   (arrondi à 0,1)
biogaz_cuisson_m3   = biogaz_mesure × part_cuisson   (0 % en Phase 2)
biogaz_perte_m3     = biogaz_mesure × part_perte     (0 %)
biogaz_valorise_m3  = biogaz_mesure − cuisson − perte
electricite_kwh     = biogaz_valorise × 1,7
chaleur_kwh         = biogaz_valorise × 3,4
digestat_kg         = poids_organique_recu_kg × 0,5
foyers_equivalents  = electricite_kwh × 365 ÷ 1 785
```

L'énergie est calculée sur le gaz **mesuré**, pas sur l'attendu. C'est ce qui rend l'alerte utile.

### 8.5 Alertes

| Type | Se déclenche si | Regroupement |
|---|---|---|
| `production` | \|écart\| **≥** 20 % (à la baisse ou à la hausse) | Tant que l'alerte est ouverte, les jours suivants s'y ajoutent (`nb_occurrences` + 1), au lieu de créer une nouvelle alerte |
| `composition` | `ch4_pct` < 50 % | Même règle |

Un site avec au moins une alerte ouverte passe à `statut = alerte`, puis revient à `nominal` quand tout est résolu.

| Cas test (attendu 32 m³) | Mesuré | Écart | Alerte ? |
|---|---|---|---|
| Démo | 22,4 | −30 % | Oui → électricité 38,08 kWh, chaleur 76,16 kWh |
| Limite | 25,6 | −20 % | Oui (seuil inclus) |
| Juste sous le seuil | 25,92 | −19 % | Non |
| Hausse | 40 | +25 % | Oui |
| Normal | 31 | −3,1 % | Non |

### 8.6 Badges Mesuré / Estimé / Simulé

| Donnée | En démo |
|---|---|
| Scans, comptes, poids triés | `mesure` |
| Poids du bac, gaz mesuré, CH₄, température, pH | `simule` |
| Biogaz attendu, électricité, chaleur, digestat, points, foyers | `estime` |

Le backend remplit `statuts_donnees` ; le Control Center affiche le badge, il ne le déduit pas lui-même.

---

## 9. Les paramètres système

Stockés dans la table `Parametre`, modifiables par l'administrateur dans le Control Center (et devant le jury).

| `cle` | Valeur | Unité |
|---|---|---|
| `coefficient_filiere_organique` | 10 | points/kg |
| `coefficient_filiere_metal` | 15 | points/kg |
| `coefficient_filiere_plastique` | 8 | points/kg |
| `coefficient_filiere_biomasse` | 6 | points/kg |
| `coefficient_filiere_carton_papier` | 5 | points/kg |
| `coefficient_filiere_verre` | 3 | points/kg |
| `coefficient_filiere_refus` | 0 | points/kg |
| `coefficient_qualite_faible` / `_moyen` / `_eleve` | 1,0 / 0,8 / 0,5 | — |
| `max_scans_par_jour` | 2 | scans |
| `rayon_scan_m` | 100 | m |
| `seuil_kg_par_scan` | 0,3 | kg/scan |
| `duree_periode_collecte_jours` | 4 | jours |
| `tolerance_tri_pct` | 2 | % |
| `coefficient_biogaz_m3_par_kg` | 0,1 | m³/kg |
| `coefficient_electricite_kwh_par_m3` | 1,7 | kWh/m³ |
| `coefficient_chaleur_kwh_par_m3` | 3,4 | kWh/m³ |
| `part_cuisson_pct` | 0 | % |
| `conso_cuisson_foyer_m3_jour` | 1 | m³/jour |
| `part_perte_pct` | 0 | % |
| `conso_electrique_foyer_kwh_an` | 1 785 | kWh/an |
| `coefficient_digestat` | 0,5 | kg/kg |
| `seuil_alerte_production_pct` | 20 | % |
| `ch4_min_pct` | 50 | % |
| `fenetre_lissage_jours` | 1 | jours |
| `validation_comptes_personnel` | 0 | 0 = désactivée, 1 = activée (1.5.0, seules valeurs acceptées) |

---

## 10. Les endpoints par application

Toutes les URL commencent par `/api/v1` et finissent par `/`.

### Communs

| Méthode | URL | Usage |
|---|---|---|
| POST | `/auth/token/` | Connexion : `{telephone, mot_de_passe}` ou `{email, mot_de_passe}` |
| POST | `/auth/token/rafraichir/` | Nouveau jeton d'accès |
| GET | `/auth/moi/` | Mon profil |
| GET · POST | `/notifications/`, `/notifications/compteur/`, `/notifications/{id}/lue/`, `/notifications/tout-lire/` | Mes notifications (créées par le serveur, voir docs/partage/NOTE_BACKEND_notifications.md) : liste, nombre de non lues, marquer lue, tout marquer lu (1.4.0) |

### Flutter — citoyen

| Méthode | URL | Usage |
|---|---|---|
| POST | `/auth/inscription/` | `{nom, telephone, mot_de_passe, code_bac}` → jetons (compte actif) |
| POST | `/scans/` | `{code_bac, latitude, longitude}` |
| GET | `/scans/` | Mon historique |
| GET | `/greenpoints/solde/` | `{solde, points_en_attente, total_gagne, total_echange}` |
| GET | `/greenpoints/transactions/` | Détail de mes gains |
| GET | `/recompenses/` | Catalogue |
| POST / GET | `/echanges/` | Échanger `{recompense_id}` / mon historique |

### Flutter — collecteur

| Méthode | URL | Usage |
|---|---|---|
| GET | `/tournees/?date=AAAA-MM-JJ` | Mes tournées du jour |
| GET | `/tournees/{id}/` | Bacs et collectes de la tournée |
| POST | `/tournees/{id}/demarrer/` | `planifiee` → `en_cours` |
| POST | `/tournees/{id}/collectes/` | `{code_bac}` → ouvre la collecte |
| GET | `/collectes/{id}/` | À rafraîchir chaque seconde jusqu'à `pesee` |
| POST | `/collectes/{id}/valider/` | Valide la pesée |
| POST | `/tournees/{id}/cloturer/` | `en_cours` → `collectee` |

### Control Center — inscription du personnel

| Méthode | URL | Usage |
|---|---|---|
| POST | `/auth/inscription/personnel/` | `{nom, telephone, email, mot_de_passe, role}` → compte `en_attente`, sans jetons ; `role` : `operateur_tri` ou `responsable_methanisation` |

### Control Center — opérateur de tri

| Méthode | URL | Usage |
|---|---|---|
| GET | `/tournees/?statut=collectee` | Tournées à trier |
| POST | `/tournees/{id}/tri/` | `{niveau_contamination, lots: [{categorie, poids_kg}], motif_ecart}` |
| GET | `/tournees/{id}/tri/` | Résultat : lots, `valeur_kg`, points distribués |
| GET | `/lots/` | Historique des tris |

### Control Center — responsable méthanisation

| Méthode | URL | Usage |
|---|---|---|
| GET | `/sites/` | Les 3 sites et leur statut |
| PATCH | `/sites/{id}/` | `{statut: "maintenance"}` |
| GET | `/productions/globale/?date=` | Vue globale (somme des 3 sites + détail par site) |
| GET | `/productions/?site_id=&date_debut=&date_fin=` | Historique d'un site (graphiques) |
| POST | `/productions/{id}/cloturer/` | `{destination_digestat}` |
| GET | `/alertes/?statut=ouverte` | Alertes |
| POST | `/alertes/{id}/resoudre/` | `{commentaire}` |

### Control Center — administrateur

| Méthode | URL | Usage |
|---|---|---|
| GET / POST / PATCH | `/utilisateurs/`, `/utilisateurs/{id}/` | Comptes (dont les collecteurs) |
| POST | `/utilisateurs/{id}/validation/` | `{decision: "valider" ou "refuser", commentaire}` : comptes du personnel en attente seulement |
| GET / POST / PATCH | `/bacs/`, `/bacs/{id}/` | Bacs |
| GET / PATCH | `/secteurs/`, `/secteurs/{id}/` | Site normal et site de repli |
| POST | `/tournees/` | Planifier `{date, secteur_id, collecteur_id, bac_ids}` |
| GET | `/verifications/` | File des cas suspects |
| POST | `/collectes/{id}/decision/` | `{decision: "valider_points" ou "annuler_points", commentaire}` |
| GET / PATCH | `/parametres/`, `/parametres/{cle}/` | `{valeur}` |
| GET | `/bacs/{id}/tracabilite/` | Historique complet d'un bac |
| GET | `/journal/` | Journal d'audit |
| POST / DELETE | `/simulation/scenarios/` | `{site_id, facteur_mesure: 0.7}` pour la démo |

### Simulateur (compte `capteur`)

| Méthode | URL | Usage |
|---|---|---|
| POST | `/collectes/{id}/pesee/` | `{poids_brut_kg, source}` |
| POST | `/sites/{id}/mesures/` | `{date, biogaz_mesure_m3, ch4_pct, temperature_c, ph, source}` |

> Le détail exact de chaque requête et réponse se trouve dans `openapi.yaml`, pour ceux qui veulent générer leur code automatiquement. Il reprend exactement les noms de ce guide.

---

## 11. Les erreurs

Toutes les erreurs ont la même forme :

```json
{ "code": "SOLDE_INSUFFISANT", "message": "Solde insuffisant pour cette récompense", "details": { "solde": 60, "cout_points": 100 } }
```

Les applications réagissent selon `code` et affichent `message` tel quel.

| HTTP | `code` | Quand |
|---|---|---|
| 400 | `VALIDATION` | Champ manquant ou mal formé (`details` = `{champ: [messages]}`) |
| 401 | `NON_AUTHENTIFIE` | Pas de jeton ou jeton expiré |
| 403 | `ACCES_REFUSE` | Mauvais rôle |
| 404 | `INTROUVABLE` | Objet inexistant |
| 409 | `CONFLIT` | Action déjà faite (ex. tournée déjà triée) |
| 409 | `BAC_DEJA_COLLECTE` | Bac déjà collecté dans la tournée |
| 409 | `TELEPHONE_DEJA_UTILISE` | Inscription avec un numéro existant |
| 409 | `EMAIL_DEJA_UTILISE` | Inscription, création ou modification d'un compte avec un e-mail existant |
| 403 | `COMPTE_NON_VALIDE` | Connexion d'un compte du personnel en attente (si `validation_comptes_personnel = 1`) ou refusé, ou d'un compte désactivé (`details.statut_validation` ou `details.actif`) |
| 422 | `COMPTE_NON_VALIDE` | Scan par un compte citoyen désactivé |
| 422 | `OTP_INVALIDE` / `OTP_EXPIRE` | Plus utilisés depuis 1.3.0 (pas de code SMS) |
| 422 | `TOURNEE_STATUT_INVALIDE` / `COLLECTE_STATUT_INVALIDE` | Action impossible dans l'état actuel |
| 422 | `BAC_HORS_TOURNEE` | Bac qui n'est pas prévu dans la tournée |
| 422 | `POIDS_INVALIDE` | Poids nul ou supérieur à la capacité du bac |
| 422 | `ECART_TOLERANCE` | Tri à plus de 2 % d'écart sans motif |
| 422 | `SOLDE_INSUFFISANT` | Échange trop cher |
| 422 | `RECOMPENSE_INACTIVE` | Récompense retirée du catalogue |
| 422 | `JOURNEE_CLOTUREE` | Modification d'une journée déjà clôturée |
| 422 | `PARAMETRE_INVALIDE` | Valeur de paramètre impossible |
| 500 | `ERREUR_SERVEUR` | Erreur imprévue |

---

## 12. Les données de démo communes

Tout le monde utilise **les mêmes données**, avec **les mêmes identifiants**. Le fichier `seed.json` les contient ; le backend les charge, et Flutter et le Control Center s'en servent comme données factices en attendant l'API.

Mot de passe de tous les comptes : **`greengas2026`** (sauf l'administrateur principal : `admin1234`). Les comptes du personnel se connectent avec leur téléphone ou leur e-mail.

| Compte | Rôle | Téléphone | E-mail |
|---|---|---|---|
| Administrateur GreenGas | administrateur | `+2250700000001` | `admin@greengas.ci` |
| Kouadio Collecteur | collecteur (préenregistré) | `+2250700000002` | `kouadio.collecteur@greengas.ci` |
| Aya Opératrice | operateur_tri | `+2250700000003` | `aya.operatrice@greengas.ci` |
| Serge Méthanisation | responsable_methanisation | `+2250700000004` | `serge.methanisation@greengas.ci` |
| Référent Atlantic | referent (BAC-014) | `+2250700000005` | `referent.atlantic@greengas.ci` |
| Simulateur IoT | capteur | `+2250700000006` | — |
| Administrateur principal | administrateur (mot de passe **`admin1234`**) | `+2250700000007` | `admin@admin.com` |
| Ibrahim Koné | operateur_tri **en attente de validation** (connexion refusée tant que l'admin n'a pas validé) | `+2250700000008` | `ibrahim.kone@greengas.ci` |
| Awa Koné | citoyen validé, BAC-014 | `+2250701020304` | — |
| Koffi Yao | citoyen validé, BAC-014 | `+2250701020305` | — |
| Mariam Traoré | citoyen validé, BAC-014 | `+2250701020306` | — |
| Yao N'Guessan | citoyen validé, BAC-014 | `+2250701020307` | — |
| Fatou Diabaté | citoyen validé, BAC-014 (aucun scan) | `+2250701020308` | — |

| Référentiel | Contenu |
|---|---|
| Secteurs → sites | NORD → DIG-01 (repli DIG-02) · EST → DIG-02 (repli DIG-03) · OUEST → DIG-03 (repli DIG-01) |
| Bacs | NORD : BAC-014, BAC-015, BAC-016 · EST : BAC-021, BAC-022, BAC-023 · OUEST : BAC-031 |
| Tournées du 12/09/2026 | TRN-0912-01 (NORD, 500 kg) et TRN-0912-02 (EST, 500 kg), collectées et **en attente de tri** |
| Cas suspect prévu | BAC-022 : 2 kg pour 40 scans (0,05 kg/scan) → « à vérifier » ; 5 comptes pour 4 foyers → « bac surinscrit » |
| Historique énergie | 7 jours (du 05 au 11/09) pour les 3 sites, fonctionnement normal |
| Récompenses | Forfait internet 1 Go (100 pts), crédit d'appel (60 pts), bon d'achat (150 pts), kit de tri (250 pts) |

Identifiants fixes, faciles à reconnaître :

| Objet | Forme de l'UUID |
|---|---|
| Secteurs | `5ec70000-0000-4000-8000-00000000000N` |
| Sites | `d1900000-0000-4000-8000-00000000000N` |
| Bacs | `bac00000-0000-4000-8000-000000000014` (le numéro du bac à la fin) |
| Utilisateurs | `a0000000-0000-4000-8000-0000000000NN` |
| Tournées | `70e00000-0000-4000-8000-00000000000N` |

**Si chacun obtient les mêmes chiffres qu'au §8 avec ces données, c'est que tout le monde est aligné.**

---

## 13. Planning d'intégration

Le SIREXE a lieu du 18 au 22 novembre 2026. Chaque jalon se termine par un test commun sur les données de démo.

| Semaine | Backend | Flutter | Control Center | Test commun |
|---|---|---|---|---|
| 13 → 19 oct | Modèles, migrations, chargement du seed, connexion JWT, droits | Écrans de connexion, routage par rôle, données factices | Structure de l'app, connexion, menus par rôle, données factices | Les 3 se connectent avec les comptes de démo |
| 20 → 26 oct | Référentiel, scans, tournées, collectes, simulateur de pesée | Parcours citoyen (scan) et collecteur complets | Écrans admin : bacs, comptes, vérifications | Scan → collecte → tournée `collectee` |
| 27 oct → 2 nov | Pipeline de tri, GreenPoints, productions, mesures, alertes | Solde, historique, récompenses | Écran de tri, dashboards énergie, alertes | Chaîne complète du §2 |
| 3 → 9 nov | Traçabilité, journal, paramètres, scénario de démo | Finitions, packaging des téléphones | Traçabilité, paramètres, badges, packaging Electron | Démo complète chronométrée |
| 10 → 17 nov | Corrections | Corrections | Corrections | Répétitions devant un faux jury |

**Règle de travail :** à partir du **1er novembre**, plus aucun renommage de champ, d'URL ou de valeur d'énumération. On ajoute seulement, et toujours dans ce guide d'abord.
