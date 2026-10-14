# GREENGAS — Brief design du Control Center

**Application desktop (Electron) et web (React) · SIREXE Hackathon 2026 · Équipe DEDSEC**

Ce brief est à donner à Claude Design pour fixer l'interface avant le code. Il décrit tout ce que l'interface doit montrer : les utilisateurs, les écrans, les données réelles, les états et l'identité visuelle. Les noms de champs sont ceux du *Guide commun*, pour que le passage au code avec Claude Code se fasse sans traduction.

---

## 1. Le contexte en bref

GREENGAS trace les déchets organiques du bac du citoyen jusqu'au kilowattheure produit par un biodigesteur. Le **Control Center** est le poste de pilotage de cette chaîne. Trois profils l'utilisent :

| Profil | Ce qu'il fait dans le Control Center |
|---|---|
| **Opérateur de tri** | Reçoit les tournées collectées, saisit les poids triés par catégorie, déclenche le calcul des points et l'envoi de l'organique au digesteur. |
| **Responsable méthanisation** | Surveille les 3 sites (DIG-01 à DIG-03) : biogaz attendu et mesuré, électricité, chaleur, digestat ; traite les alertes. |
| **Administrateur** | Supervise tout : traçabilité d'un bac, cas suspects, comptes, bacs, tournées, paramètres, journal ; lance le scénario de démo. |

Le référent de résidence a un accès réduit : il valide seulement les citoyens de sa résidence.

**Pour qui on dessine vraiment :** le jury du SIREXE, sur un écran projeté. Le thème du prix porte sur les **infrastructures énergétiques**. L'interface doit donc faire « salle de pilotage énergétique », pas « application de tri des déchets ».

Les trois moments qui doivent marquer le jury :

1. **L'alerte** : la production d'un site chute de 30 %, et cela doit se voir immédiatement.
2. **La traçabilité** : en un écran, on remonte d'un bac jusqu'aux points et à l'énergie.
3. **L'honnêteté des données** : chaque chiffre porte un badge Mesuré, Estimé ou Simulé.

---

## 2. Contraintes

| Sujet | Contrainte |
|---|---|
| Format | Desktop d'abord : conception à **1440 × 900**, et lisible projeté en **1920 × 1080**. Pas de version mobile. |
| Langue | Français. Nombres au format français (`1 785`, `8,54`), unités toujours affichées (kg, m³, kWh, %). |
| Données | Toujours utiliser les **données de démo** (§7), jamais du « lorem ipsum ». |
| Technologie cible | React. Prévoir des composants réutilisables, une grille simple et des icônes d'une seule famille (Lucide). |
| Accessibilité | Contraste AA minimum ; un statut n'est jamais indiqué **seulement** par la couleur (toujours une icône ou un texte en plus). |
| Projection | Gros chiffres pour les indicateurs (32 px minimum), texte courant en 14-15 px, pas de gris trop clairs. |

---

## 3. Identité visuelle

L'interface reprend l'identité du dossier de concours et du cahier des charges : des verts profonds, une touche d'or et un style sobre d'outil industriel.

### Couleurs

| Jeton | Valeur | Usage |
|---|---|---|
| `vert-foret` | `#1B4332` | Barre latérale, titres, en-têtes de tableaux, bouton principal |
| `vert` | `#2E7D32` | Accents, liens, sous-titres, graphiques (série principale) |
| `vert-pale` | `#EDF3EC` | Lignes alternées, fonds de cartes secondaires |
| `or` | `#B8860B` | Filets sous les titres, mise en avant ponctuelle (logo, chiffre clé) |
| `fond` | `#F6F7F4` | Fond de l'application |
| `surface` | `#FFFFFF` | Cartes, tableaux, modales |
| `texte` | `#222222` | Texte principal |
| `texte-doux` | `#5C5C5C` | Libellés, aides |
| `bordure` | `#D9DED6` | Séparateurs |

### Couleurs de statut

Elles sont réservées aux statuts : on ne les utilise jamais pour la décoration.

| Statut | Couleur | Icône | Où |
|---|---|---|---|
| Nominal / normal / validé | `#2E7D32` vert | cercle coché | Sites, collectes, comptes |
| Alerte / refusé / erreur | `#C0392B` rouge | triangle | Alertes, erreurs |
| À vérifier / en attente | `#D68910` ambre | horloge ou point d'interrogation | Collectes suspectes, comptes en attente, points en attente |
| Maintenance / inactif / clôturé | `#7F8C8D` gris | clé ou cadenas | Sites en maintenance, bacs inactifs |

### Badges de provenance des données

Ces badges sont à distinguer des statuts. Ils indiquent **d'où vient un chiffre**, avec un code de **forme** plutôt que de couleur :

| Badge | Style | Signification |
|---|---|---|
| **Mesuré** | pastille pleine vert-forêt, texte blanc | Valeur saisie ou captée réellement |
| **Estimé** | pastille avec contour vert, fond blanc | Valeur calculée à partir d'hypothèses |
| **Simulé** | pastille avec contour en pointillés gris, texte gris | Valeur produite par le simulateur en démo |

Une légende permanente de ces trois badges apparaît en bas de chaque tableau de bord.

### Typographie

| Usage | Police |
|---|---|
| Titres d'écrans et de sections | Serif : **Georgia** (comme le dossier) ou Source Serif |
| Interface, tableaux, formulaires | Sans-serif : **Inter** (ou Calibri, à défaut) |
| Chiffres des indicateurs et des tableaux | Inter avec **chiffres tabulaires**, pour qu'ils restent alignés |
| Codes (BAC-014, TRN-0912-01) | Monospace discrète (JetBrains Mono), petite taille |

---

## 4. La structure commune (coque de l'application)

```
┌────────────┬──────────────────────────────────────────────────────────┐
│            │  Fil d'Ariane · Titre de l'écran   [12/09/2026] [Démo ●] [Aya ▾] │
│  GREENGAS  ├──────────────────────────────────────────────────────────┤
│            │                                                          │
│  Menu      │                Contenu de l'écran                        │
│  selon le  │                                                          │
│  rôle      │                                                          │
│            │                                                          │
│  ───────   │                                                          │
│  Rôle :    │                                                          │
│  Opératrice│                                                          │
└────────────┴──────────────────────────────────────────────────────────┘
```

- **Barre latérale** vert-forêt, avec le logo GREENGAS et un menu qui dépend du rôle connecté. Le nom et le rôle de l'utilisateur sont rappelés en bas.
- **Barre du haut** :
  - fil d'Ariane et titre de l'écran ;
  - **date de travail** (la démo se passe le 12/09/2026) ;
  - badge permanent **« Démo — pesée et digesteurs simulés »** ;
  - menu de l'utilisateur (déconnexion).
- **Bandeau d'alerte global** : quand une alerte est ouverte, une bande rouge fine apparaît sous la barre du haut chez le responsable méthanisation et l'administrateur, avec un lien vers l'alerte.
- **Rafraîchissement** : les tableaux de bord se mettent à jour toutes les 5 secondes. Un petit indicateur « Mis à jour il y a 3 s » le montre.

### Menus par rôle

| Opérateur de tri | Responsable méthanisation | Administrateur |
|---|---|---|
| Tournées à trier | Vue globale | Supervision |
| Historique des tris | Sites (DIG-01, 02, 03) | Traçabilité |
| | Alertes | Vérifications |
| | | Comptes |
| | | Bacs et secteurs |
| | | Tournées |
| | | Paramètres |
| | | Journal |
| | | Mode démo |

L'administrateur peut aussi consulter les écrans des deux autres rôles, en lecture.

---

## 5. Les écrans

Pour chaque écran : le but, ce qui est affiché, les actions possibles et les états à prévoir. Les noms entre `accents graves` sont les champs de l'API.

### E0 · Connexion

- **But :** se connecter avec un compte préenregistré.
- **Contenu :** logo, phrase d'accroche « Du déchet à la ressource, chaque flux compte. », champs **Téléphone** (`+225…`) et **Mot de passe**, bouton **Se connecter**.
- **États :**
  - identifiants faux : message sous le formulaire ;
  - compte citoyen ou collecteur : message « Ce compte s'utilise dans l'application mobile GREENGAS. » ;
  - serveur injoignable : message avec bouton **Réessayer**.
- **Option démo :** sous le formulaire, des boutons de connexion rapide « Opératrice · Responsable · Admin », visibles seulement en mode démo.

---

### Opérateur de tri

#### T1 · Tournées à trier

- **But :** voir les tournées collectées qui attendent le tri.
- **Contenu :** tableau avec les colonnes code (`TRN-0912-01`), date, secteur, site de destination (`DIG-01`), nombre de bacs, **poids collecté** (`poids_collecte_kg`), collecteur et statut.
- **Action :** bouton **Trier** sur chaque ligne.
- **États :**
  - vide : « Aucune tournée en attente de tri » ;
  - une tournée contient un bac à vérifier : petite pastille ambre sur la ligne.

#### T2 · Saisie du tri (écran clé)

- **But :** saisir les poids triés par catégorie. C'est la saisie qui déclenche toute la chaîne.
- **En-tête :** code de la tournée, secteur, site de destination et **poids collecté : 500 kg** en grand.
- **Formulaire :** une ligne par catégorie, dans cet ordre, chacune avec une icône et un champ en kg :
  `organique` · `biomasse` · `plastique` · `metal` · `carton_papier` · `verre` · `refus`.
  À côté de chaque ligne : la destination déduite (Digesteur DIG-01, Unité biomasse, Recycleur, Enfouissement), et une barre qui montre la part de la catégorie.
- **Niveau de contamination :** trois boutons radio, **Faible / Moyen / Élevé**.
- **Contrôle de cohérence en direct** :
  - total trié face au poids collecté ;
  - **écart en %** affiché en vert s'il reste à ±2 %, en ambre au-delà ;
  - au-delà de 2 %, un champ **Motif de l'écart** devient obligatoire.
- **Aperçu calculé par le serveur :** après validation seulement (pas de calcul côté écran).
- **Actions :** **Valider le tri** (avec une modale de confirmation qui récapitule l'organique envoyé à DIG-01) et **Annuler**.
- **États :**
  - envoi en cours : bouton désactivé avec indicateur ;
  - erreur `ECART_TOLERANCE` : le champ motif est mis en évidence ;
  - erreur `CONFLIT` : « Cette tournée a déjà été triée ».

#### T3 · Résultat du tri

- **But :** montrer ce que le tri a déclenché. C'est la preuve visuelle de la chaîne.
- **Contenu, sous forme de flux horizontal :**
  `Lots créés → Valeur de la tournée → Points distribués → Organique envoyé au site`
  - Lots : `ORG-0258` 320 kg, `PLA-…` 60 kg, etc.
  - **Valeur de la tournée : 8,54 points/kg**, coefficient de qualité 1,0.
  - Tableau par bac : BAC-014 34 kg → **290 points** répartis entre 4 citoyens ; BAC-015 et BAC-016 → 0 point (aucun scan).
  - Points crédités (288) et points en attente (0).
  - Organique : **320 kg → DIG-01**, biogaz attendu **32 m³** (badge Estimé).
- **Actions :** **Voir la traçabilité de BAC-014** et **Retour aux tournées**.

#### T4 · Historique des tris

- Tableau des tournées triées, avec date, poids, écart, contamination, `valeur_kg`, points et site. Filtres par date et par secteur.

---

### Responsable méthanisation

#### M1 · Vue globale (écran d'accueil du rôle)

- **But :** l'état de production des 3 sites en un coup d'œil.
- **Rangée d'indicateurs** pour le jour, chacun avec son badge :

  | Indicateur | Exemple | Badge |
  |---|---|---|
  | Organique reçu | 960 kg | Mesuré |
  | Biogaz mesuré / attendu | 85,4 / 96 m³ | Simulé / Estimé |
  | Électricité | 145,18 kWh | Estimé |
  | Chaleur | 290,36 kWh | Estimé |
  | Foyers équivalents | 29,7 | Estimé |
  | Alertes ouvertes | 1 | — |

- **Trois cartes de site** (DIG-01, DIG-02, DIG-03), chacune avec :
  - le statut (nominal, alerte ou maintenance) ;
  - une mini-jauge de l'écart entre attendu et mesuré ;
  - le biogaz et l'électricité du jour ;
  - le lien **Ouvrir**.

  La carte d'un site en alerte se distingue nettement : bordure rouge et icône.
- Une petite carte schématique d'Abidjan avec les 3 sites et leur couleur de statut est un plus, pas une obligation.

#### M2 · Tableau de bord d'un site (écran clé)

- **En-tête :** code du site (`DIG-02`), nom, statut, sélecteur de date et bouton **Mettre en maintenance**.
- **Graphique principal :** biogaz **attendu** (ligne en pointillés) et **mesuré** (ligne pleine) sur les 7 derniers jours, plus aujourd'hui, avec la zone de tolérance de ±20 % en fond clair. Le point du jour en alerte est marqué en rouge.
- **Bloc « Aujourd'hui »** :
  - organique reçu : 320 kg ;
  - attendu : 32 m³ ;
  - mesuré : 22,4 m³ ;
  - **écart −30 %**, en grand.
- **Bloc « Énergie »** : électricité 38,08 kWh, chaleur 76,16 kWh, digestat 160 kg, foyers équivalents 7,8.
- **Bloc « Digesteur »** : méthane 61 %, température 36,2 °C, pH 7,1, chacun avec une petite courbe. Tous portent le badge Simulé.
- **Encart « Hypothèses de calcul »** (repliable) : 0,1 m³ de biogaz par kg, 1,7 kWh d'électricité et 3,4 kWh de chaleur par m³, 1 785 kWh par foyer et par an. Un lien mène vers les paramètres.
- **Action :** **Clôturer la journée**, qui ouvre une modale où l'on choisit la destination du digestat (vente agricole ou stockage).
- **États :**
  - mesure pas encore reçue : les blocs Énergie affichent « En attente de la mesure du compteur » ;
  - journée clôturée : bandeau gris et champs verrouillés.

#### M3 · Alertes

- **Liste**, avec des filtres par site, statut et type. Chaque ligne montre le type (production ou composition), le site, l'écart, la date, le nombre de jours regroupés (`nb_occurrences`) et le statut.
- **Détail d'une alerte**, dans un panneau latéral :
  - attendu, mesuré et écart ;
  - description et historique des occurrences ;
  - champ **Commentaire de résolution** (obligatoire) et bouton **Marquer comme résolue**.
- **Moment de démo :** quand l'alerte arrive, une notification apparaît en haut à droite, le bandeau rouge global s'affiche et la carte du site passe en alerte.

---

### Administrateur

#### A1 · Supervision (accueil)

- Résumé de toute la chaîne du jour :
  - scans ;
  - collectes ;
  - tournées triées ;
  - points distribués ;
  - énergie produite ;
  - alertes ouvertes ;
  - cas à vérifier.
- Raccourcis vers **Traçabilité**, **Vérifications** et **Mode démo**.

#### A2 · Traçabilité d'un bac (l'écran le plus important de la démo)

- **Recherche :** un champ « Code du bac » (BAC-014) avec autocomplétion.
- **Fiche du bac :** code, résidence, secteur, foyers déclarés, citoyens rattachés (avec leur statut de validation), date de la dernière collecte.
- **Frise horizontale de la chaîne**, avec une étape par bloc reliée par des flèches :

  ```
  Scans (22)  →  Collecte 34 kg  →  Tournée TRN-0912-01  →  Tri ORG-0258…  →  Points 290  →  DIG-01 · 32 m³ · 54,4 kWh
  ```

  Un clic sur une étape déplie son détail en dessous : liste des scans par citoyen, pesée (brut, tare, net, source simulée), lots, transactions par citoyen (Awa 105, Koffi 79, Mariam 65, Yao 39), production du site.
- Chaque chiffre de la frise porte son badge Mesuré, Estimé ou Simulé.
- Historique des collectes précédentes du même bac, sous la frise.

#### A3 · Vérifications

- **File des cas suspects**, triée du plus ancien au plus récent, avec un onglet par type :

  | Type | Exemple |
  |---|---|
  | Collecte à vérifier | BAC-022 : 2 kg pour 40 scans (0,05 kg/scan) |
  | Bac surinscrit | BAC-022 : 5 comptes pour 4 foyers |
  | Compte en attente | Fatou Diabaté, BAC-014 |
  | Scan hors zone | Koffi Yao, à 3,1 km du bac |

- **Actions :** sur une collecte, **Valider les points** ou **Annuler les points** ; sur un compte, **Valider** ou **Refuser**. Un commentaire est obligatoire, et une modale de confirmation précise que la décision sera inscrite au journal.

#### A4 · Comptes

- Onglets **Citoyens**, **Personnel** et **En attente**.
- Le personnel comprend les **collecteurs préenregistrés**. C'est ici qu'on les crée, car il n'existe aucune inscription collecteur dans l'app mobile.
- **Création d'un compte :** nom, téléphone, rôle, bac (pour un référent) et mot de passe initial.
- **Désactiver** remplace « Supprimer ».

#### A5 · Bacs et secteurs

- **Tableau des bacs :** code, résidence, secteur, foyers déclarés, citoyens validés, scans de la période en cours, dernière collecte et statut.
- **Fiche d'un bac**, avec un aperçu de son **QR code** (qui contient seulement `BAC-014`) et un bouton pour l'imprimer.
- **Secteurs :** pour NORD, EST et OUEST, le site normal et le site de repli.

#### A6 · Tournées

- Liste des tournées par date et par statut (planifiee, en_cours, collectee, triee).
- **Planifier une tournée :** date, secteur, collecteur (liste des collecteurs préenregistrés) et sélection des bacs. Le site de destination et le motif d'affectation s'affichent automatiquement, en lecture seule.

#### A7 · Paramètres

- Tableau regroupé par famille : **GreenPoints**, **Collecte**, **Énergie**, **Alertes**.
- Chaque ligne montre la clé, un libellé lisible, la valeur (modifiable sur place), l'unité, le **statut** (aligné, illustratif, à sourcer, à calibrer, V2) et la source.
- **Modifier :** une modale de confirmation indique « La nouvelle valeur s'applique au prochain calcul » et demande un motif.
- Ce changement en direct doit pouvoir se montrer au jury.

#### A8 · Journal

- Tableau chronologique : date, auteur, action, objet, ancienne valeur → nouvelle valeur, motif. Filtres par type d'objet et par auteur.

#### A9 · Mode démo

- **But :** piloter la démonstration devant le jury.
- **Contenu :** pour chaque site, son facteur de mesure actuel (nominal 0,95-1,05) et un bouton **Simuler une baisse de 30 %**, qui force le facteur à 0,70. Un bouton **Revenir à la normale** annule le scénario.
- **Rappel du scénario** sous forme de liste cochable : scan → collecte → tri → points → baisse → alerte → résolution → traçabilité.
- Cet écran doit être sobre et clairement identifié comme réservé à la démo.

---

## 6. Composants à concevoir une fois et réutiliser partout

| Composant | Variantes |
|---|---|
| **Indicateur (KPI)** | libellé, gros chiffre, unité, badge de provenance, variation facultative |
| **Pastille de statut** | nominal, alerte, à vérifier, maintenance, en attente, validé, refusé |
| **Badge de provenance** | Mesuré, Estimé, Simulé |
| **Code** | BAC-014, TRN-0912-01, ORG-0258, DIG-01 ; police monospace, cliquable |
| **Tableau** | en-tête vert-forêt, lignes alternées, tri, filtres, pagination, ligne vide |
| **Jauge d'écart** | de −50 % à +50 %, zone verte de ±20 %, aiguille |
| **Graphique attendu / mesuré** | deux séries, zone de tolérance, point d'alerte |
| **Frise de traçabilité** | étapes reliées, chacune dépliable |
| **Formulaire de poids** | champ numérique en kg avec unité, barre de part |
| **Modale de confirmation** | titre, récapitulatif, champ commentaire facultatif ou obligatoire |
| **Panneau latéral de détail** | pour une alerte ou une vérification |
| **Notification** | succès, erreur, alerte entrante |
| **Bandeau** | alerte globale (rouge), journée clôturée (gris), mode démo (or) |
| **États** | chargement (squelettes), vide (illustration simple + phrase), erreur (message de l'API + Réessayer), hors ligne |

---

## 7. Données de démo à utiliser dans les maquettes

| Élément | Valeurs |
|---|---|
| Date de travail | 12/09/2026 |
| Utilisateurs | Aya Opératrice (tri), Serge Méthanisation (responsable), Admin Démo, Kouadio Collecteur |
| Sites | DIG-01 Site Nord, DIG-02 Site Est, DIG-03 Site Ouest |
| Secteurs | NORD → DIG-01, EST → DIG-02, OUEST → DIG-03 |
| Tournées | TRN-0912-01 (NORD, BAC-014/015/016, 500 kg) et TRN-0912-02 (EST, BAC-021/022/023, 500 kg) |
| Tri | organique 320, plastique 60, biomasse 30, carton/papier 40, verre 20, métal 10, refus 20 (kg) ; contamination faible |
| Points | valeur 8,54 points/kg ; BAC-014 34 kg → 290 points ; Awa 105, Koffi 79, Mariam 65, Yao 39 |
| Site normal (DIG-01) | attendu 32 m³, mesuré 31 m³, écart −3,1 %, électricité 52,7 kWh |
| Site en alerte (DIG-02) | attendu 32 m³, mesuré 22,4 m³, **écart −30 %**, électricité 38,08 kWh, chaleur 76,16 kWh, digestat 160 kg, CH₄ 61 %, 36,2 °C, pH 7,1 |
| Historique | 7 jours (05 → 11/09), écarts entre −3 % et +3 % |
| Cas suspect | BAC-022 : 2 kg pour 40 scans ; 5 comptes pour 4 foyers |
| Compte en attente | Fatou Diabaté (BAC-014) |

---

## 8. Prompts prêts à coller dans Claude Design

Utiliser les prompts dans l'ordre : d'abord le système visuel et la coque, puis les écrans clés.

### Prompt 1 — Système visuel et coque

> Conçois le système visuel et la structure d'une application desktop de pilotage énergétique appelée **GREENGAS Control Center** (1440 × 900, en français). Elle supervise une chaîne qui va du bac de déchets organiques jusqu'à l'électricité produite par trois biodigesteurs à Abidjan.
>
> Identité : vert forêt #1B4332 (barre latérale, titres, bouton principal), vert #2E7D32 (accents), vert pâle #EDF3EC (lignes alternées), or #B8860B (filets et détails), fond #F6F7F4, texte #222222. Titres en Georgia, interface en Inter avec chiffres tabulaires. Style sobre d'outil industriel, ambiance « salle de pilotage énergétique ».
>
> Couleurs de statut, toujours accompagnées d'une icône : nominal vert #2E7D32, alerte rouge #C0392B, à vérifier ambre #D68910, maintenance gris #7F8C8D. Badges de provenance distingués par la forme : Mesuré (pastille pleine vert forêt), Estimé (contour vert), Simulé (contour pointillé gris).
>
> Coque : barre latérale vert forêt avec logo et menu selon le rôle ; barre du haut avec fil d'Ariane, date de travail 12/09/2026, badge « Démo — pesée et digesteurs simulés » et menu utilisateur. Montre la page de composants : indicateur, pastilles, badges, tableau, jauge d'écart, modale, notification, bandeaux, états vide/chargement/erreur.

### Prompt 2 — Saisie du tri

> Écran « Saisie du tri » pour l'opératrice Aya, tournée TRN-0912-01 (secteur Nord, destination DIG-01), poids collecté 500 kg. Une ligne par catégorie avec icône, champ en kg, destination déduite et barre de part : organique 320 (→ Digesteur DIG-01), biomasse 30, plastique 60, métal 10, carton/papier 40, verre 20 (→ Recycleur), refus 20 (→ Enfouissement). Choix de contamination Faible/Moyen/Élevé. Contrôle en direct : total trié 500 / 500 kg, écart 0 % en vert, qui devient ambre au-delà de ±2 % et fait apparaître un champ motif obligatoire. Boutons Valider le tri et Annuler. Montre aussi la variante avec un écart de −2,2 %.

### Prompt 3 — Tableau de bord d'un site en alerte

> Écran « DIG-02 · Site Est » pour le responsable méthanisation, le 12/09/2026, site en alerte. Graphique du biogaz attendu (pointillés) et mesuré (plein) sur 8 jours avec zone de tolérance ±20 %, le dernier point en rouge. Bloc Aujourd'hui : organique 320 kg (Mesuré), attendu 32 m³ (Estimé), mesuré 22,4 m³ (Simulé), écart −30 % en très grand. Bloc Énergie : électricité 38,08 kWh, chaleur 76,16 kWh, digestat 160 kg, foyers équivalents 7,8 (Estimé). Bloc Digesteur : CH₄ 61 %, 36,2 °C, pH 7,1 (Simulé). Encart repliable des hypothèses (0,1 m³/kg ; 1,7 et 3,4 kWh/m³). Bandeau rouge d'alerte en haut, bouton Clôturer la journée. Légende des badges en bas.

### Prompt 4 — Vue globale

> Écran d'accueil « Vue globale » du responsable méthanisation : rangée d'indicateurs du jour avec badges (organique 960 kg, biogaz mesuré 85,4 / attendu 96 m³, électricité 145,18 kWh, chaleur 290,36 kWh, foyers équivalents 29,7, 1 alerte ouverte), puis trois cartes de site : DIG-01 nominal (−3,1 %), DIG-02 en alerte (−30 %, bordure rouge), DIG-03 nominal. Chaque carte a une jauge d'écart, le biogaz et l'électricité du jour.

### Prompt 5 — Traçabilité d'un bac

> Écran « Traçabilité » de l'administrateur pour le bac BAC-014 (Résidence Atlantic, secteur Nord, 6 foyers, 4 citoyens validés et 1 en attente). Frise horizontale reliée par des flèches : Scans (22) → Collecte 34 kg (brut 46,5, tare 12,5, Simulé) → Tournée TRN-0912-01 → Tri (ORG-0258 320 kg…, valeur 8,54 pts/kg) → Points 290 (Awa 105, Koffi 79, Mariam 65, Yao 39) → DIG-01 : 32 m³ attendus, 54,4 kWh. Une étape dépliée sous la frise (les points par citoyen). Chaque chiffre porte son badge Mesuré, Estimé ou Simulé. Champ de recherche de bac en haut.

### Prompt 6 — Vérifications et mode démo

> Deux écrans administrateur. (1) « Vérifications » : onglets Collectes à vérifier, Bacs surinscrits, Comptes en attente, Scans hors zone ; ligne exemple « BAC-022 : 2 kg pour 40 scans (0,05 kg/scan) » avec boutons Valider les points / Annuler les points et une modale qui exige un commentaire. (2) « Mode démo » : pour DIG-01, 02 et 03, facteur de mesure actuel et bouton « Simuler une baisse de 30 % », bouton « Revenir à la normale », et la liste cochable du scénario de démo. Bandeau or « Réservé à la démonstration ».

---

## 9. Après Claude Design : le passage à Claude Code

1. Valider dans Claude Design le système visuel (prompt 1) **avant** les écrans.
2. Exporter les maquettes validées et le code produit par Claude Design, puis les placer dans `control-center/design/`.
3. Dans Claude Code, partir de ces maquettes et du *Guide commun* : les composants reçoivent des données dont les noms sont **exactement** ceux du guide (`poids_collecte_kg`, `ecart_pct`, `statuts_donnees`…).
4. Construire d'abord la coque, la connexion et les composants partagés, puis les écrans dans l'ordre de la démo : T2 → T3 → M1 → M2 → M3 → A2 → A3 → A9 → le reste.
5. Brancher d'abord sur les données de démo (`seed.json` ou le serveur de maquette), puis sur le vrai backend quand il est prêt.

### Écrans par priorité

| Priorité | Écrans |
|---|---|
| **Indispensables pour la démo** | E0, T1, T2, T3, M1, M2, M3, A2, A9 |
| Importants | A3, A7, T4 |
| Si le temps le permet | A1, A4, A5, A6, A8 |
