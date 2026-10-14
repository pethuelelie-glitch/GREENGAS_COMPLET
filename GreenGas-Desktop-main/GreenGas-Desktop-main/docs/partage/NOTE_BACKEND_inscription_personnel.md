# Contrat 1.1.0 — inscription du personnel : note pour le backend

Le contrat passe en **1.1.0** (`openapi.yaml` et Guide commun §5 et §10). Un seul ajout, rien n'est renommé ni retiré.

## Nouvel endpoint

`POST /api/v1/auth/inscription/personnel/` — sans authentification.

Corps (`InscriptionPersonnelRequete`) :

```json
{
  "nom": "Mamadou Bamba",
  "telephone": "+2250711223344",
  "mot_de_passe": "motdepasse1",
  "role": "operateur_tri"
}
```

| Cas | Réponse |
|---|---|
| Succès | `201` + `Jetons` (`{access, refresh, utilisateur}`), comme `POST /auth/token/` |
| `role` autre que `operateur_tri` ou `responsable_methanisation` | `400 VALIDATION`, `details.role` |
| `nom` vide, téléphone hors format `^\+225[0-9]{10}$`, mot de passe de moins de 8 caractères | `400 VALIDATION`, `details.<champ>` |
| Téléphone déjà utilisé | `409 TELEPHONE_DEJA_UTILISE` |

## Règles

- Le compte est créé **actif** (`actif: true`), sans code SMS, `profil_citoyen: null`.
- Les rôles `administrateur`, `referent`, `collecteur` et `capteur` ne s'inscrivent jamais : préenregistrés ou créés par un administrateur avec `POST /utilisateurs/`.
- `POST /auth/inscription/` (citoyens, Flutter) ne change pas.
- Conseillé : écrire une entrée au journal d'audit `utilisateur.inscrire` (auteur = le nouvel utilisateur), comme le fait le faux backend du Control Center.
