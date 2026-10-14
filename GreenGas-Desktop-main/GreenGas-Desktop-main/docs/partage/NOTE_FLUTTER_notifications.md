# Notifications — note pour l'équipe Flutter

Le backend va créer des **notifications par utilisateur** (contrat 1.4.0). Le détail complet est dans `NOTE_BACKEND_notifications.md`. Le mobile ne crée rien : il **lit** les notifications et les **marque comme lues**.

## 1. Ce que reçoit le mobile

| Rôle | `type` | Exemple de message |
|---|---|---|
| Citoyen | `points_credites` | « +105 points pour la collecte du 12/09 (BAC-014). » |
| Citoyen | `points_en_attente` | « 15 points en attente de vérification (BAC-022). » |
| Citoyen | `points_annules` | « 15 points annulés après vérification (BAC-022). » |
| Citoyen | `echange_effectue` | « Forfait internet 1 Go échangé contre 100 points. » |
| Collecteur | `tournee_planifiee` | « Nouvelle tournée TRN-0913-01 le 13/09 (NORD, 3 bacs). » |

Chaque notification contient : `id`, `type`, `niveau` (`info` · `attention` · `critique`), `titre`, `message` (déjà rédigé : à afficher tel quel), `objet_type`, `objet_id`, `lue`, `date_creation`, `date_lecture`.

## 2. Routes

| Méthode | URL | Usage |
|---|---|---|
| GET | `/notifications/compteur/` | `{"non_lues": 3}` pour la pastille |
| GET | `/notifications/?taille_page=30` | Liste paginée standard, la plus récente en premier (filtre `lue=false` possible) |
| POST | `/notifications/{id}/lue/` | Marque une notification comme lue |
| POST | `/notifications/tout-lire/` | Tout marquer comme lu → `{"marquees": n}` |

## 3. À faire

- [ ] **Modèle** `Notification` dans `domain/models.dart`, avec les énumérations `TypeNotification` et `NiveauNotification` (valeur inconnue = erreur signalée, comme les autres énumérations).
- [ ] **Repository** `NotificationRepository` : `compteur()`, `liste()`, `marquerLue(id)`, `toutLire()`.
- [ ] **Cloche en haut à droite :**
  - dans l'en-tête des parcours citoyen **et** collecteur (`shared/header_actions.dart`), à droite, avant les autres actions ;
  - une icône cloche avec une pastille du nombre de non lues : cachée à 0, « 9+ » au-delà de 9 ;
  - le compteur se rafraîchit toutes les **15 s** quand l'app est au premier plan, et aussi au retour dans l'app.
- [ ] **Écran Notifications** (ouvert par la cloche) :
  - la liste, avec titre, message, heure relative et un point pour les non lues ;
  - « Tout marquer comme lu » en haut ;
  - tirer pour rafraîchir ;
  - états vide (« Aucune notification ») et erreur.
- [ ] **Toucher une notification :** la marquer comme lue, puis ouvrir l'écran concerné :
  - `points_credites`, `points_en_attente`, `points_annules` → écran des points ;
  - `echange_effectue` → boutique / historique des échanges ;
  - `tournee_planifiee` → écran de la tournée (détail par `objet_id`).
- [ ] **Petit effet** quand une nouvelle notification de points arrive : la pastille rebondit, et un message rapide « +105 points » s'affiche. Rafraîchir aussi le solde à ce moment.
- [ ] **Faux backend (`FakeApiClient`) :**
  - les 4 routes ;
  - créer `points_credites` pour chaque citoyen dans `simulateTri` ;
  - créer `echange_effectue` dans `_postEchange` ;
  - une notification `tournee_planifiee` de départ pour Kouadio ;
  - chaque utilisateur ne voit que les siennes (sinon `404`).
- [ ] **Tests :**
  - lecture du modèle ;
  - compteur après un tri simulé (Awa a 1 non lue « +105 points ») ;
  - marquer comme lu ;
  - tout lire ;
  - un citoyen ne lit pas la notification d'un autre.

## 4. Pour vérifier

1. Kouadio se connecte → la cloche affiche 1 (sa tournée planifiée).
2. Tri de TRN-0912-01 dans le Control Center → dans les 15 s, Awa voit la pastille passer à 1 et le message « +105 points ».
3. Toucher la notification → écran des points, pastille à 0.

Les notifications **push** (quand l'app est fermée) ne sont pas prévues pour le hackathon : seulement la cloche dans l'app.
