# GREENGAS

GREENGAS est une plateforme de tri et de valorisation des déchets organiques. Elle suit le parcours des déchets, depuis les citoyens et les collecteurs jusqu'au centre de tri et aux unités de méthanisation, puis restitue les points, les indicateurs de production et les alertes.

Le dépôt rassemble trois applications complémentaires : une API Django, un Control Center web React/TypeScript et une application mobile Flutter. Les interfaces utilisent l'API comme source de données et de règles métier : les calculs de points, de collecte et d'énergie sont réalisés côté backend.

## Applications

| Composant | Dossier | Rôle |
|---|---|---|
| Backend | [`backend_greengas-main/backend_greengas-main/`](backend_greengas-main/backend_greengas-main/) | API REST Django, authentification et autorisations, données, règles métier, administration et simulateur. |
| Control Center | [`GreenGas-Desktop-main/GreenGas-Desktop-main/`](GreenGas-Desktop-main/GreenGas-Desktop-main/) | Interface React pour les opérateurs de tri, responsables méthanisation, référents et administrateurs. Fonctionne dans le navigateur. |
| Application mobile | [`GreenGas-Flutter-main/GreenGas-Flutter-main/`](GreenGas-Flutter-main/GreenGas-Flutter-main/) | Parcours citoyens et collecteurs : inscription, points, scans QR et collectes. |

Chaque application possède son propre README avec les détails et conventions spécifiques : [backend](backend_greengas-main/backend_greengas-main/README.md), [Control Center](GreenGas-Desktop-main/GreenGas-Desktop-main/README.md) et [Flutter](GreenGas-Flutter-main/GreenGas-Flutter-main/README.md).

## Architecture et rôles

```text
Application Flutter ─┐
                     ├── HTTP / JSON / JWT ──> API Django ──> SQLite (développement)
Control Center ──────┘                                      └─> MySQL ou PostgreSQL (déploiement)
```

- **Citoyens** : s'inscrivent, associent un bac, scannent son QR code, consultent leurs points et les récompenses.
- **Collecteurs** : consultent leur tournée, enregistrent les collectes et les pesées.
- **Opérateurs de tri** : répartissent les matières par catégorie et valident le tri des tournées.
- **Responsables méthanisation** : suivent les digesteurs, la production énergétique et les alertes.
- **Administrateurs et référents** : accèdent aux fonctions d'administration ou au suivi de leur résidence selon leurs permissions.

Les routes de l'API sont préfixées par `/api/v1/`. La documentation OpenAPI et les vues de référence sont dans les dossiers `docs/` des applications. Sur le backend en local, Swagger est disponible à <http://localhost:8000/api/docs/> et ReDoc à <http://localhost:8000/api/redoc/>.

## Prérequis

- Git
- Python 3.10 ou plus récent et `venv`
- Node.js 20 ou plus récent et npm
- Flutter stable 3.22 ou plus récent, Dart et un appareil ou émulateur configuré pour exécuter l'application mobile
- SQLite pour le développement local (inclus avec Python). MySQL/PostgreSQL et Redis sont destinés notamment aux configurations de déploiement.

Les dépendances Python et JavaScript se gèrent séparément dans leurs dossiers respectifs. Flutter nécessite aussi la configuration d'Android Studio/Android SDK ou de Xcode selon la plateforme ciblée.

## Démarrage local

Lancer chaque composant dans un terminal distinct. Commencez par le backend afin que les interfaces puissent s'y connecter.

### 1. Backend Django

```bash
cd backend_greengas-main/backend_greengas-main
python3 -m venv .venv
source .venv/bin/activate       # Windows PowerShell : .venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp .env.example .env            # Windows PowerShell : Copy-Item .env.example .env
python manage.py migrate
python manage.py charger_donnees_demo
python manage.py runserver
```

L'API répond sur <http://localhost:8000/api/v1/>. Le panneau d'administration est accessible à <http://localhost:8000/greengas/>. La commande `charger_donnees_demo` importe les comptes et données d'exemple ; elle peut être relancée pour les remettre à jour. Les identifiants de démonstration et les scénarios sont décrits dans le README du Control Center et celui de Flutter.

Le fichier `.env.example` utilise SQLite et `DEBUG=True`, pour le développement local uniquement. Ne publiez pas de fichier `.env` ou de secrets. Pour un déploiement, consultez la section production du [guide backend](backend_greengas-main/backend_greengas-main/README.md) : clé secrète forte, base et cache partagés, domaines et origines CORS explicites, HTTPS.

### 2. Control Center web

Dans un second terminal :

```bash
cd GreenGas-Desktop-main/GreenGas-Desktop-main
npm ci
cp .env.example .env            # Windows PowerShell : Copy-Item .env.example .env
npm run dev
```

Ouvrez <http://localhost:5173/>. Le fichier `.env.example` configure l'API réelle sur `http://localhost:8000/api/v1`. Pour utiliser les données simulées à la place, définissez `VITE_API_MODE=mock` dans `.env`. La version navigateur est le parcours web documenté ; le packaging Electron est indiqué « à venir » dans la documentation du Control Center.

### 3. Application mobile Flutter

Dans un troisième terminal, avec un émulateur ou appareil prêt :

```bash
cd GreenGas-Flutter-main/GreenGas-Flutter-main
./scripts/bootstrap.sh
flutter run
```

Le script prépare les plateformes natives si nécessaire, récupère les paquets et formate le code. Par défaut l'application appelle le backend local. Sur un émulateur Android, l'adresse `10.0.2.2` permet de joindre le serveur qui tourne sur l'ordinateur. Pour un téléphone physique, connectez-le au même réseau Wi-Fi. Dans un terminal backend séparé, depuis la racine du dépôt, lancez Django ainsi :

```bash
cd backend_greengas-main/backend_greengas-main
source .venv/bin/activate
python manage.py runserver 0.0.0.0:8000
```

Puis passez l'adresse IP locale de l'ordinateur à Flutter :

```bash
flutter run --dart-define=API_BASE_URL=http://192.168.1.20:8000/api/v1
```

Remplacez `192.168.1.20` par l'adresse réelle de votre ordinateur. Le pare-feu doit autoriser la connexion au port 8000. Pour une démonstration hors API, utilisez `flutter run --dart-define=USE_MOCK=true`.

## Comptes de démonstration

Après le chargement des données, les comptes et mots de passe de démonstration sont répertoriés dans les README des interfaces : [Control Center](GreenGas-Desktop-main/GreenGas-Desktop-main/README.md#se-connecter) et [application Flutter](GreenGas-Flutter-main/GreenGas-Flutter-main/README.md#comptes-de-démo-mot-de-passe-greengas2026). Ces identifiants sont uniquement destinés au développement local ; ne les réutilisez pas en production.

## Vérifications et tests

Les suites se lancent depuis le dossier du composant concerné. Chaque bloc ci-dessous part de la racine du dépôt :

```bash
# Backend Django
cd backend_greengas-main/backend_greengas-main
python manage.py test
```

```bash
# Control Center React
cd GreenGas-Desktop-main/GreenGas-Desktop-main
npm test
npm run build
```

```bash
# Application Flutter
cd GreenGas-Flutter-main/GreenGas-Flutter-main
flutter analyze
flutter test
```

Le détail des commandes backend et frontales se trouve dans les README propres à chaque composant.

## Dépannage

- **Connexion refusée ou erreur réseau** : vérifiez que Django tourne sur le port 8000 et que `VITE_API_URL` ou `API_BASE_URL` pointe vers la bonne adresse.
- **Erreur CORS dans le navigateur** : vérifiez `CORS_ALLOWED_ORIGINS` dans le `.env` backend. En local, l'origine Vite est `http://localhost:5173`.
- **Base vide** : exécutez `python manage.py migrate` puis `python manage.py charger_donnees_demo` depuis le dossier backend.
- **Android ne joint pas Django** : l'émulateur utilise `10.0.2.2`, pas `localhost`. Un téléphone physique utilise l'adresse IP du PC sur le réseau local.
- **Problème de dépendances** : exécutez `npm ci` dans le dossier web, `pip install -r requirements.txt` dans le backend activé, ou `flutter pub get` dans le dossier Flutter.

## Documentation complémentaire

- [Guide backend et déploiement](backend_greengas-main/backend_greengas-main/README.md)
- [Guide du Control Center](GreenGas-Desktop-main/GreenGas-Desktop-main/README.md)
- [Guide de l'application Flutter](GreenGas-Flutter-main/GreenGas-Flutter-main/README.md)
- [Guide partagé GreenGas](GreenGas-Flutter-main/GreenGas-Flutter-main/GREENGAS_Guide_Commun.md)
- [Licence](LICENSE)
