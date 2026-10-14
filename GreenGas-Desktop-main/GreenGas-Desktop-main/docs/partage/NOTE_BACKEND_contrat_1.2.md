# Contrat 1.2.0 : connexion par e-mail, note pour le backend

Le contrat passe en **1.2.0** (`openapi.yaml`, Guide commun §5, §7, §10, §11 et §12) et le seed en **1.2.0** (`seed_v1.2.json`, à charger à la place de la 1.1). Rien n'est renommé ni retiré : un client qui envoie `{telephone, mot_de_passe}` continue de fonctionner.

## 1. Connexion : `POST /api/v1/auth/token/`

Le corps contient **un seul** identifiant, téléphone ou e-mail :

```json
{ "telephone": "+2250700000003", "mot_de_passe": "greengas2026" }
{ "email": "aya.operatrice@greengas.ci", "mot_de_passe": "greengas2026" }
```

| Cas | Réponse |
|---|---|
| Succès | `200` + `Jetons`, comme aujourd'hui |
| Ni téléphone ni e-mail, ou les deux | `400 VALIDATION` |
| Identifiant inconnu ou mauvais mot de passe | `401 NON_AUTHENTIFIE` (« Téléphone ou mot de passe incorrect » / « E-mail ou mot de passe incorrect ») |

L'e-mail est comparé **sans tenir compte des majuscules**.

## 2. Inscription du personnel : `POST /api/v1/auth/inscription/personnel/`

`email` devient **obligatoire** : `{nom, telephone, email, mot_de_passe, role}`.

| Cas | Réponse |
|---|---|
| E-mail absent ou mal formé | `400 VALIDATION`, `details.email` |
| E-mail déjà utilisé | `409 EMAIL_DEJA_UTILISE` (« Cette adresse e-mail est déjà utilisée par un autre compte. ») |

Les autres règles ne changent pas (rôles, `TELEPHONE_DEJA_UTILISE`, 8 caractères minimum).

## 3. Modèle `Utilisateur`

- `email` : **unique quand il est renseigné**, enregistré en minuscules (par exemple `EmailField(null=True, blank=True, unique=True)`, avec la normalisation dans le serializer).
- `POST /utilisateurs/` et `PATCH /utilisateurs/{id}/` : e-mail facultatif, mais `409 EMAIL_DEJA_UTILISE` s'il appartient déjà à un autre compte.
- Nouveau code d'erreur `EMAIL_DEJA_UTILISE` dans l'énumération `CodeErreur`.

## 4. Seed 1.2.0

- E-mails ajoutés aux comptes du personnel : `admin@greengas.ci` (au lieu de `admin@greengas.demo`), `kouadio.collecteur@greengas.ci`, `aya.operatrice@greengas.ci`, `serge.methanisation@greengas.ci`, `referent.atlantic@greengas.ci`.
- Nouveau compte **Administrateur principal** : `admin@admin.com`, mot de passe `admin1234`, téléphone `+2250700000007`, UUID `a0000000-0000-4000-8000-000000000007`.

## 5. Flutter

Aucun changement obligatoire : la connexion par téléphone reste valable. L'équipe Flutter peut, si elle le souhaite, proposer aussi l'e-mail.
