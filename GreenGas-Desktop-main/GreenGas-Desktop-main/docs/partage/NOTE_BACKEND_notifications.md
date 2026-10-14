# Notifications — note pour le backend

Ajout prévu au contrat **1.4.0**. Rien n'est renommé ni retiré.

**Le principe :** le backend crée une notification pour la bonne personne au moment où un événement se produit (tri validé, alerte, compte à valider…). Le Control Center et Flutter ne font que les lire et les marquer comme lues. Aucun client ne crée de notification.

## 1. Modèle `Notification` (app `supervision` ou `comptes`)

| Champ | Type | Règle |
|---|---|---|
| `id` | UUID | |
| `destinataire` | FK Utilisateur | Une notification = une personne |
| `type` | `TypeNotification` (voir §2) | |
| `niveau` | `info` · `attention` · `critique` | Pour la couleur dans les apps |
| `titre` | texte, 80 caractères max | Court, déjà rédigé par le serveur |
| `message` | texte | Une phrase, chiffres compris |
| `objet_type` | `TypeObjet` (énumération existante), null | L'objet concerné, pour ouvrir le bon écran |
| `objet_id` | UUID, null | |
| `lue` | booléen, `false` par défaut | |
| `date_creation` | date-heure UTC | |
| `date_lecture` | date-heure UTC, null | |

Index conseillé : `(destinataire, lue, date_creation)`.

## 2. Quand créer une notification

Une notification se crée **dans la même transaction** que l'événement qui la déclenche. Si l'événement est annulé, la notification l'est aussi.

| `type` | Déclencheur | Destinataires | `niveau` | Objet | Exemple de message |
|---|---|---|---|---|---|
| `tournee_a_trier` | Tournée clôturée par le collecteur (`collectee`) | Tous les `operateur_tri` actifs | info | tournee | « TRN-0912-01 (NORD, 500 kg) attend son tri. » |
| `alerte_ouverte` | Alerte créée | Tous les `responsable_methanisation` et `administrateur` | critique | alerte | « DIG-02 : biogaz −30 % (22,4 m³ pour 32 m³ attendus). » |
| `alerte_repetee` | `nb_occurrences` + 1 sur une alerte ouverte | `responsable_methanisation` | attention | alerte | « DIG-02 : l'écart continue (2 jours). » |
| `site_maintenance` | Site passé en `maintenance` ou remis en service | `responsable_methanisation`, `administrateur` | attention | site | « DIG-01 en maintenance : les tournées NORD partent vers DIG-02. » |
| `compte_a_valider` | Inscription du personnel (`en_attente`) | `administrateur` | attention | utilisateur | « Ibrahim Koné demande un accès opérateur de tri. » |
| `collecte_a_verifier` | Collecte validée avec `statut_controle = a_verifier` | `administrateur`, et le `referent` du bac s'il existe | attention | collecte | « BAC-022 : 2 kg pour 40 scans (0,05 kg/scan). » |
| `bac_surinscrit` | Un bac dépasse ses foyers déclarés | `administrateur`, `referent` du bac | info | bac | « BAC-022 : 5 comptes pour 4 foyers. » |
| `points_credites` | Transaction `creditee` (au tri, ou après la décision « valider les points ») | Le citoyen | info | transaction | « +105 points pour la collecte du 12/09 (BAC-014). » |
| `points_en_attente` | Transaction créée `en_attente` (bac à vérifier) | Le citoyen | info | transaction | « 15 points en attente de vérification (BAC-022). » |
| `points_annules` | Décision « annuler les points » | Le citoyen | attention | transaction | « 15 points annulés après vérification (BAC-022). » |
| `echange_effectue` | `POST /echanges/` réussi | Le citoyen | info | — | « Forfait internet 1 Go échangé contre 100 points. » |
| `tournee_planifiee` | `POST /tournees/` | Le collecteur affecté | info | tournee | « Nouvelle tournée TRN-0913-01 le 13/09 (NORD, 3 bacs). » |

**Règles :**
- **Pas de doublon :** pour `bac_surinscrit` et `collecte_a_verifier`, ne pas recréer de notification si la même (même destinataire, même type, même objet) n'est pas encore lue.
- **Pas de notification à l'auteur de l'action :** l'admin qui planifie une tournée n'est pas notifié de sa propre action.
- Les textes sont en français et contiennent déjà les codes et les chiffres : les apps les affichent tels quels.

## 3. Endpoints

Tous demandent un jeton. Chacun ne voit **que ses propres notifications** ; une notification d'un autre utilisateur renvoie `404 INTROUVABLE`.

| Méthode | URL | Réponse |
|---|---|---|
| GET | `/api/v1/notifications/` | Page standard `{count, next, previous, results}`, de la plus récente à la plus ancienne. Filtres : `lue` (`true` / `false`), `type`, `page`, `taille_page`. |
| GET | `/api/v1/notifications/compteur/` | `{"non_lues": 3}`. Léger : appelé toutes les 5 s pour la pastille. |
| POST | `/api/v1/notifications/{id}/lue/` | `200` + la notification (`lue = true`, `date_lecture` remplie). Déjà lue : `200` sans changement. |
| POST | `/api/v1/notifications/tout-lire/` | `200` + `{"marquees": 3}` |

Exemple d'élément renvoyé :

```json
{
  "id": "0b1f0000-0000-4000-8000-000000000001",
  "type": "points_credites",
  "niveau": "info",
  "titre": "Points crédités",
  "message": "+105 points pour la collecte du 12/09 (BAC-014).",
  "objet_type": "transaction",
  "objet_id": "7a000000-0000-4000-8000-000000000123",
  "lue": false,
  "date_creation": "2026-09-12T10:42:00Z",
  "date_lecture": null
}
```

Le compte technique `capteur` n'a pas de notifications : il reçoit une liste vide.

## 4. Au chargement du seed

Pour que la démonstration démarre avec des notifications cohérentes, créer au chargement (date `2026-09-12T09:00:00Z`, non lues) :

| Destinataire | `type` | Objet |
|---|---|---|
| Aya Opératrice | `tournee_a_trier` | TRN-0912-01 |
| Aya Opératrice | `tournee_a_trier` | TRN-0912-02 |
| Administrateur GreenGas et Administrateur principal | `compte_a_valider` | Ibrahim Koné |
| Administrateur GreenGas et Administrateur principal | `collecte_a_verifier` | Collecte de BAC-022 du 12/09 |
| Administrateur GreenGas et Administrateur principal | `bac_surinscrit` | BAC-022 |

## 5. Pour vérifier

1. Connexion d'Aya → `GET /notifications/compteur/` = `{"non_lues": 2}`.
2. Tri de TRN-0912-01 → Awa reçoit `points_credites` « +105 points… », Koffi « +79 », Mariam « +65 », Yao « +39 ».
3. Facteur 0,7 sur DIG-02 puis mesure → Serge et les deux administrateurs reçoivent `alerte_ouverte` (critique).
4. `POST /notifications/tout-lire/` → le compteur revient à 0.
5. Lire la notification d'un autre utilisateur → `404`.
