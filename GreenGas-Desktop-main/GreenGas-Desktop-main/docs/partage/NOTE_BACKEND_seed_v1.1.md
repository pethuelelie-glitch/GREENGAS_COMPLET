# Seed commun v1.1 — note pour le backend

Fichier : `seed_v1.1.json` (identique à `docs/reference/seed.json` du Control Center).

Ce fichier est **le jeu de données de démonstration à charger tel quel dans MySQL**. Le Control Center s'en sert déjà comme faux backend. Si le backend charge exactement le même fichier, les deux affichent les mêmes données au moment du branchement, sans conflit.

## Ce qui change par rapport à la v1.0.0

| Changement | Détail |
|---|---|
| Compte administrateur renommé | « Administrateur GreenGas » (téléphone `+2250700000001` inchangé) |
| Bac du référent | `utilisateurs[].bac_id` = BAC-014 pour « Référent Atlantic ». Il sert à limiter ses droits à sa résidence. |
| Historique ajouté | 12 tournées triées du 27/08 au 08/09 (4 dates × 3 secteurs), avec leurs collectes, scans, lots, résultats de tri et transactions GreenPoints |
| Production du 12/09 | DIG-03 a reçu 320 kg et mesuré 32 m³ (livraison directe au site, hors tournée) ; DIG-01 et DIG-02 sont ouvertes et vides, en attente du tri |
| `compteurs_codes` | Dernier numéro utilisé par préfixe de lot : le prochain lot organique doit être **ORG-0258** |
| `simulateur` | Facteurs de mesure nominaux par site (DIG-01 : 0,96875, DIG-02 : 0,99, DIG-03 : 1), facteur de baisse de présentation 0,7 |

## Contenu

| Clé | Nombre | Table (Guide commun §7) |
|---|---|---|
| `secteurs` | 3 | Secteur |
| `sites` | 3 | Site |
| `bacs` | 7 | Bac |
| `utilisateurs` | 16 | Utilisateur (`profil_citoyen` pour les citoyens) |
| `parametres` | 26 | Parametre |
| `recompenses` | 4 | Recompense |
| `scans` | 293 | Scan |
| `tournees` | 14 | Tournee (`bac_ids` = bacs prévus) |
| `collectes` | 34 | Collecte |
| `lots` | 84 | LotTrie |
| `resultats_tri` | 12 | Résultat du tri de chaque tournée triée (`points_bac` : points avant arrondi, par collecte) |
| `transactions` | 36 | GreenPointsTransaction |
| `productions` | 24 | ProductionEnergie (7 jours d'historique × 3 sites + la journée du 12/09) |

## Règles de chargement

1. **Garder les UUID tels quels** : le Control Center et Flutter y font référence.
2. **Hacher les mots de passe** au chargement. Ils sont tous en clair : `greengas2026`.
3. **Charger les champs calculés tels quels** pour l'historique (`kg_par_scan`, `ecart_pct`, énergie, `part_pct`, points…) : ne pas recalculer le passé.
4. **Ordre conseillé** : secteurs → sites → bacs → utilisateurs → paramètres → récompenses → tournées → collectes → scans → lots → résultats de tri → transactions → productions.
5. **Initialiser la numérotation des lots** avec `compteurs_codes.lots`.
6. **Configurer le simulateur** avec `simulateur.facteurs_nominaux`.

## Deux réglages à prévoir côté Django

- **La date de travail.** Toutes les données sont datées autour du **12/09/2026**, et la journée de présentation commence le 12/09/2026 à 09:00 UTC (`meta.debut_journee`). Le backend doit pouvoir raisonner sur cette date au lieu de la date réelle, par exemple avec un réglage `GREENGAS_DATE_TRAVAIL=2026-09-12`. Sans ça, la « production du jour » et les tournées du jour seront vides. Le Control Center utilise la même valeur (`VITE_DATE_DEMO`).
- **Le bac du référent dans l'API.** Le contrat ne renvoie pas encore le bac d'un référent dans `Utilisateur`. Proposition : ajouter `bac_id` (nullable) au modèle de lecture `Utilisateur`, à valider ensemble avant de modifier `openapi.yaml`.

## Résultats attendus après chargement (pour vérifier)

Ce sont les mêmes que dans le Guide commun §8 :

- `GET /productions/globale/?date=2026-09-12` : 320 kg reçus, DIG-03 à 32 m³ mesurés, 0 alerte.
- Tri de TRN-0912-01 avec la composition de référence : `valeur_kg` 8,54, BAC-014 à 290 points, Awa 105, Koffi 79, Mariam 65, Yao 39, premier lot **ORG-0258**.
- Ensuite, vue globale : 640 kg, puis 960 kg après le tri de TRN-0912-02.
- Scénario 0,7 sur DIG-02 : écart −30 %, alerte de production, 38,08 kWh.
