# Backlog mobile (une issue GitHub par ligne)

Calé sur le planning d'intégration du guide (§13). Aucun renommage de champ, d'URL ou de valeur après le 1er novembre.

## 13 -> 19 octobre : connexion et aiguillage
- [ ] Brancher `HttpApiClient` sur le backend local (`USE_MOCK=false`) et vérifier la connexion des comptes de démo
- [ ] Vérifier chaque modèle de `domain/models.dart` contre les réponses réelles de l'API
- [ ] Message « Utilisez le Control Center » pour les rôles non mobiles (fait en démo, à tester en réel)
- [ ] Gestion du jeton expiré et du rafraîchissement sur le vrai serveur

## 20 -> 26 octobre : parcours citoyen et collecteur
- [ ] Scan citoyen avec position réelle : tester `valide`, `hors_zone`, `non_localise`, `refuse_plafond`
- [ ] Inscription citoyen de bout en bout (contrat 1.3.0 : **sans SMS**, connexion immédiate) contre le vrai backend
- [ ] Parcours collecteur sur le simulateur de pesée : démarrer, scanner, valider, clôturer
- [ ] Carte : vérifier les coordonnées réelles des bacs, afficher la position en continu
- [ ] Impression des QR codes `BAC-0xx` pour les tests terrain

## 27 octobre -> 2 novembre : points et boutique
- [ ] Solde et points en attente (`points_en_attente`) avec les vraies transactions
- [ ] Écran de détail des gains (`GET /greenpoints/transactions/`) si le jury le demande
- [ ] Récompenses réelles, états vides et erreurs réseau

## 3 -> 9 novembre : finitions
- [ ] Tests sur téléphones Android d'entrée de gamme (caméra, GPS, performance)
- [ ] Packaging : icône, nom, signature de l'APK
- [ ] Scénario de démo chronométré et vidéo de secours

## Interface et langues
- [ ] Faire écrire / valider les traductions dioula et baoulé par des locuteurs natifs (`lib/l10n/strings.dart`)
- [ ] Traduire les écrans restants (collecteur, messages d'erreur) et enregistrer la langue choisie sur le téléphone
- [ ] Écran de démarrage avec le logo (`flutter_native_splash`, config prête : `dart run flutter_native_splash:create`)
- [x] Icône de l'application avec le logo (`flutter_launcher_icons`, composée depuis `logo_white.png`)
- [x] Faire valider les ajouts de contrat (bacs proches, e-mail, bénéficiaire d'échange, notifications) : intégrés au contrat 1.4.0

## Transverse
- [ ] Mode hors-ligne du collecteur (file d'attente) : à ouvrir seulement si le guide l'ajoute
- [ ] Notifications (cloche, contrat 1.4.0) : brancher sur le vrai backend et vérifier les 4 routes (`/notifications/…`)
- [ ] Tests de widgets pour les écrans de scan et de collecte
