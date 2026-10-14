# Contrat 1.3.0 : inscription sans code SMS — note pour l'équipe Flutter

Le contrat passe en **1.3.0** et le seed en **1.3.0**. Fichiers à remplacer dans `docs/contrat/` : `openapi.yaml`, `GREENGAS_Guide_Commun.md`, et ajouter `seed_v1.3.json`.

**Ce qui change pour le mobile :** le citoyen est **actif et connecté dès son inscription**. Il n'y a plus de code SMS ni d'attente de validation par le référent.

## 1. Inscription : `POST /auth/inscription/`

- **Avant :** la réponse était un `Utilisateur`, puis l'app ouvrait l'écran du code SMS, puis renvoyait vers la connexion.
- **Maintenant :** la réponse est `201` + `Jetons` (`{access, refresh, utilisateur}`), exactement comme `POST /auth/token/`.

À faire :

- [ ] `AuthRepository.signUp` : enregistrer `access` et `refresh` (comme `login`) et renvoyer l'`Utilisateur`.
- [ ] `signup_screen.dart` : après l'inscription, mettre l'utilisateur en session (`sessionProvider`) et ouvrir directement l'écran citoyen. Supprimer le passage par `OtpScreen`.
- [ ] Supprimer `otp_screen.dart`, `verifyOtp` et `resendOtp` (les routes `/auth/otp/…` sont marquées obsolètes, le backend ne les fera pas).
- [ ] Retirer le message « Connectez-vous : votre référent validera votre compte ».

## 2. Faux backend (`FakeApiClient`)

- [ ] `_signUp` : créer le citoyen avec `valid = 'valide'` et `verifie = true`, enregistrer les jetons et renvoyer `{access, refresh, utilisateur}`.
- [ ] Retirer `_verifyOtp`, la route `auth/otp/renvoyer` et `otpDemo`.
- [ ] Fatou Diabaté (`+2250701020308`) passe à `valide` : retirer le raccourci « Citoyen en attente » de l'écran de connexion, ou le remplacer.
- [ ] `_postScan` : `COMPTE_NON_VALIDE` seulement si le compte est désactivé.
- [ ] Ajouter `statut_validation: 'valide'` au niveau de chaque utilisateur dans `_userJson`.

## 3. Modèles (`domain/models.dart`)

- [ ] `Utilisateur` : nouveau champ `statutValidation` (`statut_validation`, obligatoire dans le contrat). Pour le mobile, il vaudra toujours `valide`.
- [ ] `ProfilCitoyen.statutValidation` et `telephoneVerifie` restent lus (toujours `valide` / `true`).

## 4. Connexion

- Un compte du personnel en attente reçoit `403 COMPTE_NON_VALIDE` à la connexion. Ces comptes ne s'utilisent pas sur mobile ; il suffit que le message du serveur s'affiche (c'est déjà le cas avec `friendlyError`).

## 5. Tests à adapter

- [ ] `mock_api_flow_test.dart` :
  - « un citoyen en attente ne peut pas scanner » → à remplacer par « un citoyen inscrit peut scanner tout de suite » ;
  - « inscription citoyen puis code SMS » → « inscription citoyen : jetons reçus et session ouverte ».
- [ ] `models_test.dart` : ajouter `statut_validation` dans le JSON de test d'`Utilisateur`.

## Pour vérifier

1. Créer un compte avec le code BAC-014 → l'écran citoyen s'ouvre aussitôt, sans code.
2. Scanner BAC-014 tout de suite → scan accepté.
3. Fermer et rouvrir l'app → la session est retrouvée.

Les autres points de `docs/REVUE_FLUTTER.md` restent valables. Un seul est clos : le cas « citoyen en attente » n'existe plus.
