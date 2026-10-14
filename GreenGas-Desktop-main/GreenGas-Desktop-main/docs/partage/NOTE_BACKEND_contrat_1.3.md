# Contrat 1.3.0 : comptes actifs dès l'inscription — note pour le backend

Le contrat passe en **1.3.0** (`openapi.yaml`, Guide commun §5, §6, §7, §8.1, §10, §11, §12) et le seed en **1.3.0** (`seed_v1.3.json`, à charger à la place de la 1.2).

**La règle en une phrase :** un citoyen est actif dès son inscription, sans code SMS ni validation. Seul le **personnel inscrit lui-même** (opérateur de tri, responsable méthanisation) attend la validation d'un administrateur.

## 1. Modèle `Utilisateur`

Ajouter `statut_validation` au niveau de l'utilisateur (`en_attente` | `valide` | `refuse`, valeur par défaut `valide`), renvoyé dans toutes les réponses `Utilisateur`.

| Compte | `statut_validation` à la création |
|---|---|
| Citoyen inscrit dans Flutter | `valide` |
| Compte créé par un administrateur (`POST /utilisateurs/`) | `valide` |
| Personnel inscrit lui-même (`/auth/inscription/personnel/`) | `en_attente` |

`profil_citoyen.statut_validation` reste dans la réponse, toujours à `valide` (compatibilité). `profil_citoyen.telephone_verifie` est toujours à `true`.

## 2. Inscription d'un citoyen : `POST /auth/inscription/`

- **Avant :** `201` + `Utilisateur`, statut `en_attente`, envoi d'un SMS.
- **Maintenant :** `201` + `Jetons` (`{access, refresh, utilisateur}`), comme une connexion. Le compte est `valide` et `telephone_verifie = true`. Aucun SMS.
- Les erreurs ne changent pas : `400 VALIDATION`, `404 INTROUVABLE` (code de bac inconnu), `409 TELEPHONE_DEJA_UTILISE`.
- `/auth/otp/verifier/` et `/auth/otp/renvoyer/` sont marquées **obsolètes** : pas besoin de les implémenter.

## 3. Inscription du personnel : `POST /auth/inscription/personnel/`

- **Avant :** `201` + `Jetons`, compte actif.
- **Maintenant :** `201` + `Utilisateur` avec `statut_validation = en_attente`, **sans jetons**.
- Les autres règles ne changent pas (rôles autorisés, e-mail obligatoire, unicité, 8 caractères minimum).

## 4. Connexion : `POST /auth/token/`

Vérifier d'abord le mot de passe (sinon `401` comme aujourd'hui), puis :

| Cas | Réponse |
|---|---|
| `statut_validation = en_attente` | `403 COMPTE_NON_VALIDE`, « Votre compte attend la validation d'un administrateur. », `details: {"statut_validation": "en_attente"}` |
| `statut_validation = refuse` | `403 COMPTE_NON_VALIDE`, « Votre demande d'accès a été refusée. », `details: {"statut_validation": "refuse"}` |
| `actif = false` | `403 COMPTE_NON_VALIDE`, « Ce compte est désactivé. », `details: {"actif": false}` |

Le rafraîchissement d'un jeton (`/auth/token/rafraichir/`) doit aussi être refusé pour ces comptes.

## 5. Validation : `POST /utilisateurs/{id}/validation/`

- **Administrateur seulement** (le référent ne valide plus rien) → sinon `403 ACCES_REFUSE`.
- Ne concerne que les comptes du personnel `en_attente` → sinon `409 CONFLIT` (« Ce compte n'attend pas de validation. »).
- `{decision: "valider" | "refuser", commentaire}` → met à jour `statut_validation`, écrit dans le journal (avant → après, auteur, commentaire), renvoie l'`Utilisateur`.

## 6. Vérifications et scans

- `GET /verifications/?type=compte_en_attente` ne renvoie plus que les **comptes du personnel en attente**, pour l'administrateur. Le référent ne les voit pas.
- `bac_surinscrit` reste un **signal** : il ne bloque aucun compte et ne met aucun point en attente.
- `POST /scans/` : `422 COMPTE_NON_VALIDE` seulement si le citoyen est désactivé (`actif = false`).

## 7. Seed 1.3.0

- `statut_validation` ajouté à chaque utilisateur (`valide`).
- Fatou Diabaté passe à `valide` : elle n'a aucun scan, donc aucun résultat de référence ne change (8,54 · 290 · 288 · ORG-0258 · 640 / 960 kg · −30 %).
- Nouveau compte en attente pour montrer la validation : **Ibrahim Koné**, `operateur_tri`, `+2250700000008`, `ibrahim.kone@greengas.ci`, UUID `a0000000-0000-4000-8000-000000000008`, mot de passe `greengas2026`. Sa connexion doit renvoyer `403 COMPTE_NON_VALIDE` tant que l'administrateur ne l'a pas validé.

## Pour vérifier

1. Inscription d'un citoyen avec `code_bac = BAC-014` → jetons reçus, puis `POST /scans/` accepté.
2. Inscription d'un opérateur → `201` sans jetons ; sa connexion → `403 COMPTE_NON_VALIDE`.
3. Connexion d'Ibrahim → `403` ; validation par l'admin ; nouvelle connexion → `200`.
4. Validation demandée par le référent → `403` ; validation d'un citoyen → `409`.
