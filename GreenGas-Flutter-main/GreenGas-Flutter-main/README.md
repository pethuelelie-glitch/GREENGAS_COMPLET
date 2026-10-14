# GreenGas (application mobile Flutter)

Collecte, traçabilité et valorisation des déchets organiques, du bac du citoyen jusqu'au biogaz.
Une application, deux parcours selon le rôle renvoyé par le serveur :

| Rôle | Ce qu'il fait |
|---|---|
| **Citoyen** | S'inscrit (téléphone, e-mail facultatif, code du bac) en choisissant son bac sur une carte, scanne le QR de son bac avant chaque dépôt (l'app lit le plafond de dépôts du jour et le prévient quand il est atteint), voit ses points et son historique, échange ses points en boutique (forfait internet ou crédit d'appel pour lui ou un proche). Compte actif et connecté dès l'inscription (contrat 1.3.0, sans code SMS). |
| **Collecteur** | Compte préenregistré. Voit sa tournée, la carte et les bacs proches, scanne le QR du bac sur place puis saisit le poids brut, et valide la collecte. |

Chaque écran a, en haut à droite, le profil et un menu à trois points (paramètres, langue, mode nuit, déconnexion). Langues : français, anglais, et une base pour le dioula et le baoulé (partielles, à faire valider par des locuteurs).

Les autres rôles (opérateur, responsable, référent, administrateur) utilisent le Control Center : l'app leur affiche un message.

**Le contrat commun est dans [docs/contrat/](docs/contrat/)** (guide de l'équipe et `openapi.yaml`). L'app n'invente aucune règle :
le backend calcule, l'app affiche. Détails dans [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Démarrer

Prérequis : Flutter stable (3.22 ou plus), Android Studio ou Xcode, Python 3.

```bash
git clone <url-du-depot> greengas && cd greengas
./scripts/bootstrap.sh     # android/ios, permissions, flutter pub get, format
flutter run                # connexion au backend Django local
```

Le scan QR demande un vrai téléphone (caméra). Sur Windows, utilisez WSL ou Git Bash pour le script.
Si Android se plaint de `minSdk`, mettez `minSdk = 23` dans `android/app/build.gradle(.kts)`.

### Deux modes

| Mode | Commande |
|---|---|
| Backend local (défaut) | `flutter run` |
| Mode démo | `flutter run --dart-define=USE_MOCK=true` |
| Backend sur un autre hôte | `flutter run --dart-define=API_BASE_URL=http://192.168.1.20:8000/api/v1` |

Pour un téléphone réel, utilisez l'adresse IP de votre PC sur le Wi-Fi et lancez Django avec `runserver 0.0.0.0:8000`.
L'émulateur Android utilise automatiquement `http://10.0.2.2:8000/api/v1`; le navigateur et les autres plateformes utilisent `localhost`.
Le serveur de maquette Prism du contrat fonctionne aussi
(`npx @stoplight/prism-cli mock docs/contrat/openapi.yaml -p 4010`), mais ses réponses sont statiques.

### Comptes de démo (mot de passe `greengas2026`)

| Compte | Téléphone | Parcours |
|---|---|---|
| Awa Koné (citoyen validé, 130 points) | `+2250701020304` | citoyen |
| Fatou Diabaté (citoyen validé) | `+2250701020308` | citoyen |
| Kouadio Collecteur | `+2250700000002` | collecteur |
| Aya Opératrice | `+2250700000003` | message « Utilisez le Control Center » |

En mode démo, des boutons de la connexion préremplissent ces comptes. L'inscription connecte directement (contrat 1.3.0 : plus de code SMS).

### Scénario de test complet (mode démo)
1. Collecteur : Tournée > « Démarrer la tournée ».
2. Collecteur : Scanner > scanne `BAC-014` (voir plus bas) > saisit le poids brut (ex. `40` kg) > « Enregistrer la pesée » > « Valider la collecte ». Répéter pour BAC-015 et BAC-016.
3. Collecteur : Tournée > « Clôturer la tournée ».
4. Paramètres > « Simuler la validation du tri » (c'est l'opérateur du Control Center en vrai).
5. Se déconnecter, se connecter en citoyen Awa : le solde passe de 130 à 235 points (+105, exemple du guide §8.3).

L'inscription citoyen propose les bacs sur la carte (aucun scan nécessaire). Le contrat est en 1.6.0 : bacs proches, e-mail facultatif, numéro bénéficiaire, **pesée manuelle du collecteur** et **plafond de scans/jour lu depuis `/parametres/{cle}/`** sont intégrés (voir [docs/PROPOSITIONS_CONTRAT.md](docs/PROPOSITIONS_CONTRAT.md) pour ce qui reste ouvert). Les cartes utilisent `flutter_map`/OSRM avec un bouton « Ouvrir dans Google Maps » (`url_launcher`, sans clé).

Pas de bac physique : générez un QR code avec le texte `BAC-014` (n'importe quel générateur en ligne) et affichez-le sur un écran.

## Commandes utiles
```bash
flutter analyze        # analyse statique
flutter test           # modèles, QR, parcours complet contre le mode démo
dart format lib test   # formatage (exigé par la CI)
```

## Structure
```
lib/
  app/        thème, racine (aiguillage par rôle)
  l10n/       langues et traductions
  core/       configuration, formats, téléphone, localisation
  domain/     modèles et énumérations du guide, lecture du QR
  data/       ApiClient (HTTP réel + mode démo), repositories par route, providers Riverpod
  shared/     widgets réutilisables, scanner QR
  features/   landing, auth, citizen, collector, settings
test/         tests unitaires
assets/images/ logo GreenGas (couleurs et blanc) et icônes d'app
docs/         architecture, backlog, contrat (guide + openapi.yaml), propositions, branding
.github/      CI, modèles de PR et d'issues, CODEOWNERS
```

Travail en équipe : lisez [CONTRIBUTING.md](CONTRIBUTING.md) avant la première PR.
