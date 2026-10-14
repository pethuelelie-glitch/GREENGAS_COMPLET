# Design tokens GreenGas : du desktop au mobile

Analyse préalable à la refonte UI/UX de l'app mobile (étape 1). La **source de vérité** est l'app desktop
`greengas_desktop` (GREENGAS Control Center). L'image de référence « Planta » ne sert qu'à la disposition et au dock.

> Statut : **validé** (toutes les décisions du §9 acceptées).

---

## 1. Sources analysées

| Source | Contenu lu |
|---|---|
| Stack desktop | **React 18 + Vite + Tailwind 3 + Electron 37**. Animations : `motion` 12 (ex-Framer Motion) et `tailwindcss-animate`. Icônes : `lucide-react`. Primitives : Radix UI. |
| Jetons | `src/styles/tokens.css` (seul endroit où les couleurs sont écrites), `tailwind.config.ts`, `src/lib/couleurs.ts` |
| Styles globaux | `src/styles/globals.css` (corps 14 px, focus or, squelette, `prefers-reduced-motion`) |
| Animations | `src/lib/animations.ts` + toutes les props `motion` des composants |
| Composants | `components/ui/*` (bouton, champ, modale/panneau, onglets, choix segmenté), `components/greengas/*` (Carte, Indicateur, ValeurAnimee, PastilleStatut, Etats, Cloche, Notifications, Bandeau…), `app/coque/*`, `auth/*` |
| Charte | `CLAUDE.md` §6 du desktop |
| Polices | `src/assets/fonts/` : Inter variable (woff2), JetBrains Mono 500/600 (woff2) |
| Référence Planta | `docs/reference_planta.jpeg` |
| Mobile actuel | `lib/app/theme.dart`, `lib/shared/*`, shells, écrans citoyen/collecteur/auth/landing |

---

## 2. Couleurs

Noms Flutter proposés entre parenthèses. Les valeurs sont celles de `tokens.css`, à l'identique.

### 2.1 Identité et neutres

| Jeton desktop (Flutter) | Clair | Sombre | Usage |
|---|---|---|---|
| `vert-foret` (`forest`) | `#1B4332` | `#1B4332` | Bouton principal, dock actif, bannière solde, en-têtes |
| `vert-foret-survol` (`forestPressed`) | `#24563F` | `#24563F` | État pressé du bouton principal |
| `vert-foret-encre` (`forestInk`) | `#1B4332` | `#8FD0A6` | Vert employé **comme texte ou contour** (lisible sur fond sombre) |
| `vert` (`green`) | `#2E7D32` | `#5CB860` | Accents, liens, focus, valeurs positives |
| `vert-pale` (`greenPale`) | `#EDF3EC` | `#1F2D25` | Fonds secondaires, ronds d'icônes inactifs, squelettes |
| `or` (`gold`) | `#B8860B` | `#D4A42A` | Mise en avant ponctuelle, focus clavier, démo |
| `or-pale` (`goldPale`) | `#FBF3DC` | `#3A3013` | Fond d'un élément « or » |
| `or-texte` (`goldText`) | `#6E5005` | `#EBC764` | Texte sur `or-pale` |
| `fond` (`background`) | `#F6F7F4` | `#121A15` | Fond des écrans |
| `fond-cadre` (`backgroundDeep`) | `#E4E8E0` | `#0B110D` | Fond derrière les panneaux (auth, landing) |
| `surface` (`surface`) | `#FFFFFF` | `#19231D` | Cartes, panneaux, dock, bottom sheets |
| `texte` (`text`) | `#222222` | `#E4EBE5` | Texte principal |
| `texte-doux` (`textMuted`) | `#5C5C5C` | `#A2B2A7` | Libellés, sous-titres |
| `bordure` (`border`) | `#D9DED6` | `#2F3E35` | Séparateurs, contours de champs |
| `encre-claire` (`onForestMuted`) | `#CFE3D4` | `#CFE3D4` | Texte secondaire **sur** vert forêt |
| `voile` (`scrim`) | noir 50 % | noir 65 % | Fond derrière les modales et sheets |

### 2.2 Statuts (toujours avec une icône ou un texte)

| Ton | Couleur | Fond | Texte | Sombre (couleur / fond / texte) |
|---|---|---|---|---|
| `ok` | `#2E7D32` | `#E3F1E4` | `#1F6B25` | `#5CB860` / `#1D3324` / `#95D69D` |
| `alerte` | `#C0392B` | `#FBE5E2` | `#A52A1E` | `#E05A4B` / `#3E201C` / `#F4A69B` |
| `attention` | `#D68910` | `#FBF0DC` | `#8A5A07` | `#E3A03A` / `#3A2C14` / `#F0C47C` |
| `neutre` | `#7F8C8D` | `#ECEEEC` | `#4D5A53` | `#95A3A4` / `#252E29` / `#BCC7C0` |

Correspondance avec le mobile : `ChipTone.neutral` → `ok` (dépôt compté), `warn` → `attention` (non localisé, points en attente), `bad` → `alerte` (hors zone, plafond).

### 2.3 Séries et catégories (desktop) → catégories de récompenses (mobile)

Le desktop n'a pas de catégories de récompenses. Proposition : reprendre ses couleurs de séries, déjà validées.

| Récompense | Jeton desktop repris | Clair | Icône |
|---|---|---|---|
| Internet | `serie-2` | `#3B7EA1` | wifi |
| Appel | `or` | `#B8860B` | téléphone |
| Bons | `vert-foret` | `#1B4332` | cadeau |
| Dons | `serie-3` / `cat-biomasse` | `#8BAA4A` | arbre |

Sur les cartes de récompenses, la couleur sert en **fond pâle avec une icône colorée** (rond 48 px), et non en aplat avec texte blanc : blanc sur or donne 3,25:1 (insuffisant pour du texte courant).

### 2.4 Carte (flutter_map)

Le desktop dessine une carte stylisée (SVG), tandis que le mobile affiche des tuiles OSM. On reprend seulement les couleurs des **pins** : bac choisi = `alerte`, autres bacs = `vert-foret`, position = `serie-2`. Le pin du bac choisi « pulse » comme les sites en alerte du desktop.

### 2.5 Contrastes vérifiés (WCAG)

| Paire | Clair | Sombre |
|---|---|---|
| Blanc sur `vert-foret` | 11,1 ✅ | 11,1 ✅ |
| `texte` sur `fond` | 14,8 ✅ | 14,6 ✅ |
| `texte-doux` sur `surface` | 6,7 ✅ | 7,3 ✅ |
| `vert` sur `surface` | 5,1 ✅ | — |
| `vert-foret-encre` sur `surface` | 11,1 ✅ | 9,0 ✅ |
| `encre-claire` sur `vert-foret` | 8,2 ✅ | 8,2 ✅ |
| Statuts texte / fond | 5,2 à 6,2 ✅ | 7,5 à 8,3 ✅ |
| Blanc sur `or` | 3,25 ⚠️ gros texte seulement | — |
| Blanc sur `vert` sombre (`#5CB860`) | — | 2,5 ❌ |
| `fond` sombre sur `vert` sombre | — | 7,2 ✅ |

Conséquence : en mode sombre, un élément plein `vert` porte une icône ou un texte **foncé** (`#121A15`), pas blanc.

---

## 3. Typographie

### 3.1 Desktop

| Usage | Police | Remarque |
|---|---|---|
| Interface et titres | **Inter** (variable 100–900) | `tabular-nums` partout (chiffres alignés) |
| Codes (BAC-014, TRN-…) | **JetBrains Mono** 500 / 600 | |
| Titres « Georgia » | déclarée dans Tailwind | **jamais utilisée** (`font-titre` : 0 occurrence). Les titres réels sont en Inter gras. |

Graisses réellement employées : 600 (65 ×), 700 (48 ×), 500 (9 ×), 800 (3 ×). Interlignage du corps : 1,45.
Tailles desktop : corps 14, libellés 12,5–13, titres de carte 14–15 gras, titres de page 22 gras (`letter-spacing -0.01em`), indicateurs 32–34 gras (`tracking-tight`).

### 3.2 Échelle mobile proposée

Le desktop est conçu pour 1440 × 900 à 14 px. Sur téléphone, pour un public large, on garde la **même famille, les mêmes graisses et les mêmes rapports**, avec des tailles agrandies (l'app actuelle est déjà en 15,5–17).

| Rôle Flutter | Taille / graisse / interligne | Équivalent desktop |
|---|---|---|
| `displaySmall` (gros chiffre, solde) | 36 / 700 / 1,1, tracking −0,5 | Indicateur 32–34 |
| `headlineSmall` (titre d'écran) | 24 / 700 / 1,2, tracking −0,2 | Titre de page 22 |
| `titleLarge` (titre de section) | 19 / 700 / 1,25 | — |
| `titleMedium` (titre de carte, tuile) | 16,5 / 700 / 1,3 | Titre de carte 14–15 |
| `bodyLarge` | 16 / 500 / 1,45 | Corps 14 |
| `bodyMedium` | 15 / 400 / 1,45 | Corps 14 |
| `bodySmall` / `labelMedium` | 13,5 / 600 / 1,35 | Libellés 12,5–13 |
| `labelLarge` (boutons) | 15,5 / 600 | Bouton 13–14 semibold |
| Pastille de statut | 13 / 700 | 12,5 bold |
| Code (bac, tournée) | JetBrains Mono 15 / 600 | `CodeObjet` |

Tous les styles portent `FontFeature.tabularFigures()`, et les tailles respectent le réglage de taille de texte du téléphone.

### 3.3 Intégration

Flutter ne lit pas le **woff2**. Proposition : convertir les fichiers du desktop en TTF statiques (Inter 400/500/600/700/800, JetBrains Mono 500/600) avec `fonttools`, sous-ensemble latin identique au desktop, soit environ 350 Ko au total dans `assets/fonts/`. L'app reste **hors ligne**, comme le desktop, et **sans `google_fonts`**. Les licences OFL sont copiées à côté.

---

## 4. Formes

### 4.1 Rayons

| Jeton (Flutter `AppRadii`) | Valeur | Usage desktop → mobile |
|---|---|---|
| `full` | 999 | Boutons pilule, chips, onglets, dock, toasts (58 occurrences) |
| `card` | **18** | Cartes et panneaux (`rounded-carte`) |
| `kpi` | 16 | Indicateurs, bannière solde |
| `tile` | 14 | Boutons d'icône, tuiles (barre latérale) |
| `md` | 12 | Petits blocs (`rounded-xl`) |
| `field` | 12 | Champs de saisie (10 au desktop, arrondi un peu plus au toucher) |
| `sheet` | 22 | Panneau auth/landing, haut des bottom sheets |

### 4.2 Ombres (CSS → `BoxShadow`)

| Jeton | Clair | Sombre |
|---|---|---|
| `card` | `0 1px 10px` noir 12 % | `0 1px 12px` noir 45 % |
| `floating` | `0 2px 12px` noir 16 % | `0 2px 14px` noir 50 % |
| `chip` | `0 1px 6px` noir 18 % | `0 1px 8px` noir 50 % |
| `modal` (dock, sheets) | `0 24px 60px` noir 28 % | `0 24px 60px` noir 60 % |

Les cartes du desktop n'ont **pas de bordure**, seulement une ombre. Les bordures (`bordure`, 1 px) sont réservées aux séparateurs et aux champs.

### 4.3 Bordures et anneaux

| Élément | Règle |
|---|---|
| Champ | 1 px `bordure` ; focus : bordure `vert` + anneau 3 px `vert-pale` ; erreur : `alerte` + anneau `alerte-fond` |
| Bouton contour | 1,5 px `vert-foret-encre` |
| Élément en alerte | anneau 2 px `alerte` (sans bordure) |
| Focus clavier | contour 3 px `or`, décalé de 2 px |

### 4.4 Dégradés

Le desktop **n'en utilise pas** (seul le reflet du squelette en est un). Le dégradé forêt → herbe des écrans d'auth du mobile disparaît au profit d'aplats `vert-foret`.

### 4.5 Espacements (`AppSpacing`, base 4)

| Jeton | Valeur | Usage observé sur le desktop |
|---|---|---|
| `xs` | 4 | Écart icône / compteur |
| `sm` | 8 | `gap-2` (le plus fréquent) |
| `md` | 12 | `gap-3`, rangées de cartes |
| `lg` | 16 | Écart entre panneaux |
| `xl` | 20 | Rembourrage horizontal des cartes (`px-5`) et marge d'écran mobile |
| `xxl` | 24 | Rembourrage des panneaux et modales (22–24) |
| `xxxl` | 32 | Séparation de sections |

Carte : 20 × 18 (desktop `px-5 py-[18px]`). Zones tactiles : **48 px minimum**. Le desktop descend à 32–40 px, le mobile non.

### 4.6 Icônes

Desktop : `lucide-react`, trait 1,8–2,2, taille 16–22. Options pour Flutter :
- **A. Material Symbols « rounded »** (déjà dans Flutter) : aucune dépendance, style proche à trait rond.
- **B. `lucide_icons_flutter`** : jeu identique au desktop, mais une dépendance et une police d'icônes en plus (environ 1 Mo).

Recommandation : **A**.

---

## 5. Animations du desktop

Préréglages (`lib/animations.ts`) :
- `EASE_SORTIE = cubic-bezier(0.22, 1, 0.36, 1)` → `Cubic(0.22, 1, 0.36, 1)`
- `RESSORT_DOUX = spring(260, 26)`
- `RESSORT_VIF = spring(420, 30)`

Les ressorts `motion` (raideur, amortissement, masse 1) se transposent **à l'identique** en `SpringDescription(mass: 1, stiffness, damping)`. Pour les animations implicites, une petite courbe `SpringCurve` construite sur `SpringSimulation` est prévue dans `AppMotion`.

Règle desktop reprise telle quelle : **uniquement `transform` et `opacity`**, et tout est coupé si l'appareil demande moins d'animations (`MediaQuery.disableAnimationsOf` → durées nulles).

| # | Animation desktop | Durée / courbe | Déclencheur | Rendu Flutter | Mobile |
|---|---|---|---|---|---|
| 1 | Transition de page : fondu + montée 10 px | 320 ms, `EASE_SORTIE` | Changement d'écran | `PageTransitionsTheme` maison (Fade + Slide) ; changement d'onglet via `AnimatedSwitcher` | ✅ |
| 2 | Apparition en cascade : opacité 0 → 1, y 14 → 0 | 420 ms, `EASE_SORTIE`, pas 60 ms | Montage d'une liste de cartes | Widget `Reveal(index)` (Fade + Slide, délai `index × 60 ms`, plafonné à 8) | ✅ |
| 3 | Ligne de tableau : y 8 → 0 | 300 ms, délai `min(i, 14) × 35 ms` | Montage d'un tableau | Même `Reveal`, variante courte (historique dépôts / gains) | ✅ |
| 4 | Apparition à l'échelle : 0,6 → 1 | `RESSORT_VIF` | Pins, pastilles | `ScaleTransition` + ressort (pins de carte, badges) | ✅ |
| 5 | Chiffre qui défile jusqu'à sa valeur | 1,1 s, `Cubic(0.16, 1, 0.3, 1)` | Affichage et chaque mise à jour | `AnimatedNumber` : `TweenAnimationBuilder<double>` qui ne reconstruit que le `Text` | ✅ solde, gains, kg |
| 6 | Bouton : survol −1 px, pression ×0,97 | 150 ms ease-out | Survol / pression | Pas de survol sur mobile ; pression `AnimatedScale` 0,97 | ✅ |
| 7 | Indicateur d'onglet qui glisse (`layoutId`) | ressort 500 / 38 | Changement d'onglet | Indicateur positionné + ressort (chips de filtre, choix segmenté) | ✅ |
| 8 | Barre latérale : fond actif qui glisse | ressort 480 / 36 | Changement de page | **Dock** : rond actif qui glisse et se déforme (§7) | ✅ adapté |
| 9 | Barre latérale : entrées en cascade (x −10 → 0) | 300 ms, pas 50 ms | Ouverture | Tiroir latéral : cascade des entrées | ✅ |
| 10 | Logo « G » : échelle 0,6 → 1 et rotation −20° → 0 | ressort 260 / 18 | Montage | Logo de la landing et du tiroir | ✅ |
| 11 | Compteur (badge) qui surgit : échelle 0 → 1 | ressort 600 / 20 (cloche : 600 / 14) | Changement de valeur | Badge de la cloche : `ScaleTransition` keyée sur la valeur | ✅ |
| 12 | Cloche qui oscille : rotation 0 → −16 → 14 → −10 → 6 → 0° | 700 ms ease-in-out, pivot en haut | Nouvelle notification | `TweenSequence` sur `RotationTransition` | ✅ |
| 13 | Modale : échelle 0,94 → 1, y 12 → 0 ; fermeture 140 ms | ressort 420 / 32 | Ouverture de modale | Dialogues (`showGeneralDialog` + ressort) | ✅ |
| 14 | Panneau latéral qui glisse depuis la droite | ressort 340 / 34 | Ouverture de panneau | **Bottom sheet** qui monte avec le même ressort | ✅ adapté |
| 15 | Voile qui s'estompe | 180 ms | Modale ou panneau | `barrierColor` de la route (natif) | ✅ |
| 16 | Toast pilule : y −24 → 0, échelle 0,96 → 1 | ressort 420 / 30 | Succès ou erreur | `SnackBar` flottant en pilule `vert-foret` / `alerte` | ✅ |
| 17 | Alerte qui glisse depuis la droite + barre de temps (9 s) | ressort 300 / 26 + 9 s linéaire | Alerte critique | Hors périmètre mobile (pas d'alertes critiques côté citoyen ou collecteur) | ❌ |
| 18 | Bandeau d'alerte : hauteur 0 → auto, contenu y −36 → 0, reflet | 350 ms + ressort 360 / 28 + 1,4 s | Alerte active | Bannière « Limite atteinte » / compte en attente : `AnimatedSize` + slide | ✅ |
| 19 | Squelette : reflet qui traverse | 1,4 s ease-in-out, en boucle | Chargement | `Skeleton` avec `ShaderMask` animé, sous `RepaintBoundary` | ✅ |
| 20 | Pulsation : échelle 1 → 1,9, opacité 0,9 → 0 | 2 s ease-out, en boucle | Élément vivant (site en alerte) | Pin du bac choisi, point « position » | ✅ |
| 21 | Halo : échelle 1 → (1,12 ; 1,7), opacité → 0 | 2 s, en boucle | Pastille en alerte | Pastille `alerte` : refusé, hors zone (optionnel) | ⚪ option |
| 22 | Point « en ligne » (ping) | ~1 s, en boucle | Connexion live | Non retenu (pas d'indicateur live sur mobile) | ❌ |
| 23 | Flux animés (tirets qui défilent) | 2,4 à 3,8 s linéaire, en boucle | Fond de la connexion | Héros de la landing : flux qui convergent vers le bac (`CustomPainter`, `RepaintBoundary`) | ✅ |
| 24 | Carte d'auth : y 24 → 0, échelle 0,98 → 1 ; logo x −12 → 0 (délai 150 ms) | ressort 200 / 24 | Arrivée sur la connexion | Panneau blanc qui monte (auth et landing) | ✅ |
| 25 | Titre de page : x −8 → 0 | 350 ms | Montage | Titre d'écran | ✅ |
| 26 | Barre de proportion qui grandit (scaleX) | ressort 160 / 22 ou 90 / 18 | Valeur affichée | Progression vers la prochaine récompense (optionnel) | ⚪ option |
| 27 | Graphiques qui se dessinent, jauge à ressort, frise | 0,7 à 1,5 s | Données | Pas de graphiques sur mobile | ❌ |
| 28 | Spinner du bouton (`animate-spin`) | linéaire | Envoi en cours | `CircularProgressIndicator` 18 px dans le bouton | ✅ |

`flutter_animate` **n'est pas nécessaire** : tout ce qui est retenu se fait avec les animations natives de Flutter. Recommandation : ne pas l'ajouter (une dépendance de moins).

---

## 6. Comparaison avec le mobile actuel

### 6.1 Palette

| Rôle | Mobile actuel | Desktop (cible) | Écart |
|---|---|---|---|
| Primaire | forest `#31572C` | vert-foret `#1B4332` | Plus profond, plus bleuté |
| Accent | grass `#4F772D`, moss `#90A955` | vert `#2E7D32` | Vert plus franc, un seul accent |
| Clair accent | leaf `#ECF39E` (jaune-vert) | vert-pale `#EDF3EC` / or `#B8860B` | Le jaune-vert **disparaît** ; l'or prend le rôle d'accent chaud |
| Fond | paper `#FAF9F6` | fond `#F6F7F4` | Très proche |
| Texte | ink `#1B2E19` | `#222222` | Neutre au lieu de verdâtre |
| Erreur | `#B5503A` | `#C0392B` | Rouge plus franc |
| Avertissement | `#E08A1E` | `#D68910` | Proche |
| Sombre : fond / carte / en-tête | `#0F1B0E` / `#162614` / `#1F3A1C` | `#121A15` / `#19231D` / `#1B4332` | Proche, moins saturé |

L'icône de l'app et l'écran de démarrage utilisent `#31572C` (`pubspec.yaml` : `flutter_launcher_icons` et `flutter_native_splash`). Voir la décision D3.

### 6.2 Composants

| Mobile actuel | Constat | Remplacement (`lib/shared/design/`) |
|---|---|---|
| `GGHeader` (bandeau vert plein, logo, gros chiffre) | Lourd, prend un tiers de l'écran | En-tête léger (avatar, salutation, cloche) + **bannière solde** `vert-foret` arrondie 16 |
| `GGTopBar` | Bandeau vert pour chaque écran | En-tête clair sur `fond`, titre 24/700 |
| `GGCard` (bordure 1 px, rayon 14) | Bordure au lieu de l'ombre | `AppCard` : surface, rayon 18, ombre `card`, sans bordure |
| `GGListTile` (Material + bordure) | | `AppTile` : carte rayon 18, rond d'icône `vert-pale` 44, cascade |
| `StatusChip` (rayon 6, 3 tons) | Couleurs ad hoc | `StatusPill` : pilule, icône + texte, 4 tons desktop |
| `WideButton` (FilledButton) | | `PrimaryButton` (pilule 52 px, pression ×0,97, spinner) + `ArrowPillButton` (rond-flèche à gauche, landing et échange) |
| `ScanCard` | À garder fonctionnellement | Rhabillée : surface, rayon 18, cadre caméra arrondi |
| `NavPill` (indicateur rectangulaire) | Proche de l'idée, mais pas de rond actif | `FloatingDock` (§7) |
| `showResultSheet` | | `AppSheet` : rayon 22 en haut, ressort, icône statut ronde |
| `CodeBox` | | `CodeText` en JetBrains Mono |
| — | Pas d'état vide, de squelette ni d'erreur commune | `EmptyState`, `Skeleton`, `ErrorState` (copiés du desktop, avec « Réessayer ») |
| Thème : champs remplis sans bordure | | Champs desktop : surface, bordure 1 px, rayon 10, anneau de focus |

---

## 7. Dock flottant (élément signature)

- Pilule `surface`, rayon plein, hauteur 72, marges 16 / 16 / 12 + safe area, ombre `modal`.
- Onglet actif : **rond plein 56 px**, `vert-foret` en clair (icône blanche, 11:1) et `vert` en sombre (icône `#121A15`, 7,2:1). Il glisse vers l'onglet choisi avec un ressort `(420, 30)` qui produit un léger rebond, et s'étire horizontalement pendant le trajet (morphing : largeur ×1,25 au milieu de la course, puis retour à 1).
- Onglets inactifs : icône 22 dans un rond 44 `vert-pale`, libellé lu par `Semantics` (zone tactile ≥ 48).
- Contenu : `extendBody: true` et rembourrage bas = hauteur du dock + safe area + 16.
- Seul le dock est dans un `RepaintBoundary` animé : l'écran ne se reconstruit pas pendant l'animation.

---

## 8. Ce que l'image Planta apporte (et ce qu'elle n'apporte pas)

| Planta | Repris pour GreenGas |
|---|---|
| Landing : logo, grand visuel, panneau blanc arrondi, bouton pilule avec rond-flèche | Oui. Le visuel héros est animé (flux qui convergent vers un bac, logo « G » qui pulse) au lieu d'une photo : aucune image produit n'est disponible. Le carrousel des 4 slides est conservé dans le panneau. |
| Accueil : avatar + salutation + cloche, bannière promo verte, catégories, populaires | Oui : bannière = solde de points ; catégories = internet / appel / bons / dons ; populaires = récompenses ; puis historique des dépôts |
| Détail plante : visuel en haut, panneau blanc, chips d'info, sélecteur, gros bouton | Oui, pour le détail d'une récompense (écran complet au lieu de la modale actuelle) |
| Barre de recherche | Non : il n'y a rien à chercher (catalogue de quelques récompenses) |
| Couleurs vert pomme | Non : palette desktop |

---

## 9. Décisions à valider

| # | Question | Recommandation |
|---|---|---|
| D1 | Adopter la **palette desktop** à la place de forest / grass / moss / leaf (le jaune-vert `#ECF39E` disparaît) | Oui : c'est la source de vérité de la mission |
| D2 | Polices : convertir Inter et JetBrains Mono du desktop en TTF embarqués (~350 Ko), sans `google_fonts`. La conversion demande `pip install fonttools brotli` (~5 Mo) | Oui |
| D3 | Recolorer l'icône et le splash (`#31572C` → `#1B4332`) : touche `pubspec.yaml` et les fichiers natifs régénérés | Oui, en fin de chantier (hors `lib/`) |
| D4 | Icônes : Material Symbols rounded (A) ou `lucide_icons_flutter` (B) | A |
| D5 | `flutter_animate` | Non, Flutter natif suffit |
| D6 | **Accueil citoyen = onglet Scanner**. Ordre : en-tête → bannière solde avec bouton « Scanner un bac » (caméra en plein écran) → catégories → récompenses populaires → historique des dépôts | Oui ; l'encart « Limite atteinte » remplace le bouton de scan quand le plafond est atteint (comportement actuel). **Modifié le 2026-10-14** : catégories et récompenses retirées de l'accueil (bannière solde + scan, puis historique des dépôts), elles restent dans la Boutique |
| D7 | Échelle de texte mobile agrandie (§3.2) plutôt que les tailles desktop brutes | Oui |
| D8 | Outillage : `flutter analyze` et `flutter test` exigent de retélécharger le cache Flutter supprimé (**plusieurs centaines de Mo**, autant d'espace disque, alors qu'il reste ~2,6 Go) | À confirmer avant l'étape 2 |
| D9 | Image de référence déplacée en `docs/reference_planta.jpeg` | Fait |

---

## 10. Mise en œuvre

| Élément | Fichier |
|---|---|
| Couleurs clair / sombre (`AppColors`, `context.colors`) | `lib/shared/design/app_colors.dart` |
| Espacements, rayons, ombres, mouvement (`AppSpacing`, `AppRadii`, `AppShadows`, `AppMotion`, `SpringCurve`) | `lib/shared/design/tokens.dart` |
| Typographie (`AppTypography`) | `lib/shared/design/typography.dart` |
| Thème Material 3 et transition de page | `lib/app/theme.dart` |
| Composants | `lib/shared/design/*.dart` (import unique : `design.dart`) |
| Polices | `assets/fonts/` (Inter 400–800, JetBrains Mono 500/600, licences OFL) |

Écarts assumés avec le §9 : aucun. Animations du §5 non reprises : 17, 21, 22, 27 (sans objet sur mobile).

