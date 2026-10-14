# Propositions d'ajouts au contrat d'API

Règle de l'équipe : on ajoute au **guide commun d'abord**, on prévient, puis on code. Ces ajouts sont utilisés par
l'app mobile (le mode démo les implémente). Aucun renommage : uniquement des ajouts, compatibles avec l'existant.

> **Statut (contrat 1.4.0)** : les ajouts des sections 1 à 4 **sont intégrés** au guide commun et à `openapi.yaml`.
> Les sections 5 (langue) et 6 (durcissement sécurité) restent ouvertes.

## 1. Bacs proches (route publique), pour choisir son bac à l'inscription

Le citoyen n'a pas encore de compte : la route ne demande pas de jeton.

```
GET /api/v1/bacs/proches/?latitude=5.4005&longitude=-3.989
```
Réponse : liste des bacs `actif` (8 maximum), du plus proche au plus lointain.
```json
[{ "id": "bac00000-0000-4000-8000-000000000014", "code": "BAC-014", "residence": "Résidence Atlantic",
   "latitude": 5.4021, "longitude": -3.988, "distance_m": 210.0 }]
```
Pas de données sensibles (ni tare, ni scans). Sans cette route, l'app propose le scan du QR du bac à la place.

## 2. E-mail facultatif à l'inscription

`POST /auth/inscription/` accepte un champ optionnel `email` (texte, null si absent). Il est renvoyé dans `Utilisateur.email`.

## 3. Catégorie des récompenses

`Recompense.categorie` : `internet`, `appel`, `bon`, `don`. L'app s'en sert pour la couleur et pour savoir si un numéro
de téléphone est nécessaire (`internet` et `appel`). Tant que le champ n'existe pas, l'app déduit la catégorie du nom.

## 4. Numéro bénéficiaire d'un échange

`POST /echanges/` accepte un champ optionnel `telephone_beneficiaire` (format `+225` + 10 chiffres) :
- obligatoire côté app pour `internet` et `appel` (par défaut le téléphone du citoyen, ou celui d'un proche) ;
- absent pour `bon` et `don` ;
- renvoyé dans `Echange.telephone_beneficiaire` (null si absent) ;
- erreur `VALIDATION` si le format est invalide.

À confirmer avec le prestataire de crédit/forfait : peut-il créditer un numéro qui n'est pas celui du compte ?
Si non, l'app doit se limiter au téléphone du citoyen (retirer le choix « Un autre numéro »).

## 5. Langue (optionnel)

L'app change de langue localement. Si l'équipe veut retrouver le choix sur un autre appareil : champ `langue`
(`fr`, `en`, `dyu`, `bci`) sur le profil. Pas nécessaire pour la démo.

## 6. Durcissement (sécurité) — à trancher avec le backend

Ces points ne bloquent pas la démo mais limitent les abus d'un système où le client n'est pas de confiance
(GPS, QR) et où l'inscription est ouverte (contrat 1.3.0). On les ajoute **au guide d'abord** s'ils sont retenus.

| Priorité | Sujet | Proposition |
|---|---|---|
| Haute | **Throttling** | Limiter le débit de `POST /auth/token/`, `POST /auth/inscription/` (DRF `throttle_classes`). Sans cela, un brute-force de mot de passe ou une inscription massive est trivial. |
| Haute | **QR non signé** | Le QR ne contient que `BAC-0xx` : forgeable. V2 : QR signé (HMAC d'un secret par bac) ou code tournant. En démo, s'appuyer sur les contrôles serveur (plafond, `bac_surinscrit`). |
| Haute | **Confiance au GPS** | `latitude`/`longitude` viennent du client. Le serveur ne doit jamais en dépendre seul : garder le plafond par période, et revoir le cas `non_localise` (actuellement compté). |
| Moyenne | **Cycle de vie du jeton** | Refresh 7 jours sans rotation ni révocation. Utiliser l'app `blacklist` de simplejwt et raccourcir la durée ; prévoir un point de déconnexion globale. |
| Moyenne | **HTTPS** | Toutes les URLs de démo sont en `http://`. Pour tout déploiement réel, HTTPS obligatoire (les jetons et numéros circulent sinon en clair). |
| Basse | **Données personnelles** | Téléphone, e-mail et positions sont des données personnelles. Mentionner la conservation et l'accès (admin) dans le dossier, conformément à la loi ivoirienne (ARTCI). |
