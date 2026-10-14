# Travailler à plusieurs sur GreenGas

Objectif : que 5 personnes avancent en parallèle sans se marcher dessus, avec un `main` toujours démontrable.

## 1. Branches

| Branche | Rôle | Qui écrit dedans |
|---|---|---|
| `main` | Version stable, prête à démontrer. Chaque version est taguée (`v0.1.0`). | Personne directement : uniquement via PR depuis `develop` |
| `develop` | Intégration : tout ce qui est terminé et relu | Uniquement via PR |
| `feature/<zone>-<sujet>` | Une tâche = une branche (ex. `feature/collector-offline-queue`) | Son auteur |
| `fix/<sujet>` | Correction de bug | Son auteur |
| `docs/<sujet>`, `chore/<sujet>` | Documentation, outillage | Son auteur |

Une branche vit au maximum quelques jours. Plus elle vit, plus le conflit sera douloureux.

## 2. Le cycle d'une tâche

```bash
git switch develop && git pull                  # partir de la dernière version
git switch -c feature/citizen-shop-filters      # 1 tâche = 1 branche
# ... coder, tester ...
dart format lib test && flutter analyze && flutter test
git add -p                                      # choisir ce qu'on commit, pas de "git add ."
git commit -m "feat(citizen): filtrer la boutique par catégorie"
git fetch && git rebase origin/develop          # se mettre à jour avant la PR
git push -u origin feature/citizen-shop-filters
```
Puis ouvrir une **Pull Request vers `develop`** sur GitHub, remplir le modèle, demander une relecture.

## 3. Messages de commit (Conventional Commits)

Format : `type(zone): message à l'impératif, en français, sans point final`

- Types : `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
- Zones : `auth`, `citizen`, `collector`, `domain`, `data`, `ui`, `contrat`, `ci`

Exemples : `feat(collector): saisie du poids avec confirmation` · `fix(domain): jour de ramassage avant la date d'ancrage` · `test(domain): couvrir le statut en retard`

## 4. Pull Requests et relectures

- **Petites** : idéalement moins de 400 lignes, un seul sujet.
- **Une approbation minimum**, CI verte (format, analyse, tests), conversations résolues.
- **Squash and merge** vers `develop` : un commit propre par fonctionnalité.
- On ne relit pas pour critiquer, on relit pour comprendre. Si vous ne comprenez pas, le code n'est pas assez clair.
- Le propriétaire du dossier (voir `.github/CODEOWNERS`) est relecteur obligatoire.
- Toute règle métier modifiée dans `lib/domain/` s'accompagne d'un test.

## 5. Le contrat d'API passe avant le code

[docs/contrat/GREENGAS_Guide_Commun.md](docs/contrat/GREENGAS_Guide_Commun.md) et `openapi.yaml` sont la référence commune
(Flutter, Control Center, backend). Règles :
- Un champ, une URL ou une valeur d'énumération manque ? On l'ajoute **au guide d'abord**, on prévient l'équipe, puis on code.
- Aucun renommage à partir du **1er novembre** : on ajoute seulement.
- `lib/domain/models.dart` reflète les modèles du guide : toute modification du guide met ce fichier à jour dans la même PR.
- Les copies de `docs/contrat/` sont synchronisées depuis le dépôt qui détient la version de référence.
- L'app n'implémente jamais un calcul métier (points, poids net, seuils) : si le serveur ne renvoie pas une valeur, on la demande au backend.

## 6. Éviter les conflits

- **Un dossier = un propriétaire** (`CODEOWNERS`). Évitez de modifier le dossier d'un autre sans le prévenir : ouvrez une issue ou une PR courte.
- Les fichiers partagés (`pubspec.yaml`, `lib/data/providers.dart`, `lib/shared/design/`) : changements minuscules, fusionnés vite.
- Ne reformatez jamais des fichiers que vous ne modifiez pas.
- En cas de conflit : `git rebase origin/develop`, ouvrez les fichiers en conflit, gardez les deux intentions, puis `git add` et `git rebase --continue`. Demandez de l'aide avant de forcer quoi que ce soit.
- `git push --force` seulement sur **sa propre** branche de feature (`--force-with-lease`), jamais sur `develop` ou `main`.

## 7. Ne jamais commiter
Clés d'API, mots de passe, `google-services.json`, `.env`, keystores (`*.jks`). Tout est déjà dans `.gitignore`. Si un secret est poussé par erreur, prévenez le lead immédiatement : il faut le révoquer, pas seulement le supprimer.

## 8. Versions et démo
- `develop` → `main` par PR, quand la version est stable. Le lead pose un tag : `git tag v0.1.0 && git push --tags`.
- **J-3 avant une démo : gel.** Plus de nouvelles fonctionnalités sur `develop`, seulement des corrections. Une vidéo de secours est enregistrée sur la version taguée.

## 9. Mise en place initiale (à faire une fois, par le lead)

1. Créer le dépôt GitHub (privé) et inviter l'équipe avec le rôle *Write*.
2. Pousser le projet :
   ```bash
   cd greengas && git init -b main && git add . && git commit -m "chore: initialisation du projet"
   git remote add origin <url> && git push -u origin main
   git switch -c develop && git push -u origin develop
   ```
3. Dans **Settings > Branches**, ajouter des règles de protection sur `main` **et** `develop` :
   *Require a pull request before merging* (1 approbation), *Require status checks* (job `quality`), *Require review from Code Owners*, *Do not allow force pushes*.
4. **Settings > General** : n'autoriser que *Squash merging*, activer *Automatically delete head branches*.
5. Mettre à jour `.github/CODEOWNERS` avec les vrais pseudos GitHub.
6. Créer les issues du [backlog](docs/BACKLOG.md) et un tableau *Projects* (À faire, En cours, En relecture, Terminé).
7. Chacun fait `./scripts/bootstrap.sh` après le clone, puis son premier `flutter run`.

## 10. Aide-mémoire Git

| Je veux... | Commande |
|---|---|
| Voir où j'en suis | `git status` |
| Voir mes changements | `git diff` |
| Annuler un fichier modifié (non commité) | `git restore <fichier>` |
| Mettre de côté mon travail | `git stash` puis `git stash pop` |
| Corriger mon dernier commit (non poussé) | `git commit --amend` |
| Récupérer les nouveautés | `git fetch` puis `git rebase origin/develop` |
| Changer de branche | `git switch <branche>` |
