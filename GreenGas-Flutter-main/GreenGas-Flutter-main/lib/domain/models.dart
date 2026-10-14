/// Modèles du Guide commun (§6 et §7). Les noms reprennent ceux de l'API en camelCase :
/// `poids_net_kg` -> `poidsNetKg`. Rien n'est calculé ici : on lit ce que le backend renvoie.
library;

double? _d(Object? v) => v == null ? null : (v as num).toDouble();
DateTime _t(Object? v) => DateTime.parse(v as String).toLocal();
DateTime? _tn(Object? v) => v == null ? null : _t(v);

// ---------------------------------------------------------------- énumérations (§6)

enum Role {
  citoyen('citoyen'),
  collecteur('collecteur'),
  operateurTri('operateur_tri'),
  responsableMethanisation('responsable_methanisation'),
  referent('referent'),
  administrateur('administrateur'),
  capteur('capteur');

  const Role(this.api);
  final String api;
  static Role parse(Object? v) => values.firstWhere(
        (e) => e.api == v,
        orElse: () => throw FormatException('Role inconnu : $v'),
      );
}

enum StatutValidation {
  enAttente('en_attente'),
  valide('valide'),
  refuse('refuse');

  const StatutValidation(this.api);
  final String api;
  static StatutValidation parse(Object? v) => values.firstWhere(
        (e) => e.api == v,
        orElse: () => throw FormatException('StatutValidation inconnu : $v'),
      );
}

enum StatutScan {
  valide('valide'),
  nonLocalise('non_localise'),
  horsZone('hors_zone'),
  refusePlafond('refuse_plafond');

  const StatutScan(this.api);
  final String api;
  static StatutScan parse(Object? v) => values.firstWhere(
        (e) => e.api == v,
        orElse: () => throw FormatException('StatutScan inconnu : $v'),
      );
}

enum StatutTournee {
  planifiee('planifiee'),
  enCours('en_cours'),
  collectee('collectee'),
  triee('triee');

  const StatutTournee(this.api);
  final String api;
  static StatutTournee parse(Object? v) => values.firstWhere(
        (e) => e.api == v,
        orElse: () => throw FormatException('StatutTournee inconnu : $v'),
      );
}

enum StatutCollecte {
  enAttentePesee('en_attente_pesee'),
  pesee('pesee'),
  validee('validee');

  const StatutCollecte(this.api);
  final String api;
  static StatutCollecte parse(Object? v) => values.firstWhere(
        (e) => e.api == v,
        orElse: () => throw FormatException('StatutCollecte inconnu : $v'),
      );
}

enum StatutTransaction {
  creditee('creditee'),
  enAttente('en_attente'),
  annulee('annulee');

  const StatutTransaction(this.api);
  final String api;
  static StatutTransaction parse(Object? v) => values.firstWhere(
        (e) => e.api == v,
        orElse: () => throw FormatException('StatutTransaction inconnu : $v'),
      );
}

/// Types de notification par utilisateur (contrat 1.4.0).
enum TypeNotification {
  pointsCredites('points_credites'),
  pointsEnAttente('points_en_attente'),
  pointsAnnules('points_annules'),
  echangeEffectue('echange_effectue'),
  tourneePlanifiee('tournee_planifiee');

  const TypeNotification(this.api);
  final String api;
  static TypeNotification parse(Object? v) => values.firstWhere(
        (e) => e.api == v,
        orElse: () => throw FormatException('TypeNotification inconnu : $v'),
      );
}

enum NiveauNotification {
  info('info'),
  attention('attention'),
  critique('critique');

  const NiveauNotification(this.api);
  final String api;
  static NiveauNotification parse(Object? v) => values.firstWhere(
        (e) => e.api == v,
        orElse: () => throw FormatException('NiveauNotification inconnu : $v'),
      );
}

/// Valeurs de `statut_controle` d'une collecte (§6 StatutControle).
class StatutControle {
  const StatutControle._();
  static const normal = 'normal';
  static const aVerifier = 'a_verifier';
  static const pointsValides = 'points_valides';
  static const pointsAnnules = 'points_annules';
}

// ---------------------------------------------------------------- modèles (§7)

class ProfilCitoyen {
  const ProfilCitoyen({
    required this.bacId,
    required this.codeBac,
    required this.telephoneVerifie,
    required this.statutValidation,
  });

  final String bacId;
  final String codeBac;
  final bool telephoneVerifie;
  final StatutValidation statutValidation;

  factory ProfilCitoyen.fromJson(Map<String, dynamic> j) => ProfilCitoyen(
        bacId: j['bac_id'] as String,
        codeBac: j['code_bac'] as String,
        telephoneVerifie: j['telephone_verifie'] as bool,
        statutValidation: StatutValidation.parse(j['statut_validation']),
      );
}

class Utilisateur {
  const Utilisateur({
    required this.id,
    required this.nom,
    required this.telephone,
    required this.role,
    required this.statutValidation,
    this.email,
    this.profilCitoyen,
  });

  final String id;
  final String nom;
  final String telephone;
  final Role role;

  /// Contrat 1.3.0 : `statut_validation` au niveau de l'utilisateur. Sur mobile il vaut
  /// toujours `valide` (le citoyen est actif dès l'inscription). Lecture tolérante : une
  /// réponse sans ce champ est considérée valide.
  final StatutValidation statutValidation;
  final String? email;
  final ProfilCitoyen? profilCitoyen;

  String get prenom => nom.split(' ').first;

  factory Utilisateur.fromJson(Map<String, dynamic> j) => Utilisateur(
        id: j['id'] as String,
        nom: j['nom'] as String,
        telephone: j['telephone'] as String,
        email: j['email'] as String?,
        role: Role.parse(j['role']),
        statutValidation: j['statut_validation'] == null
            ? StatutValidation.valide
            : StatutValidation.parse(j['statut_validation']),
        profilCitoyen: j['profil_citoyen'] == null
            ? null
            : ProfilCitoyen.fromJson(
                j['profil_citoyen'] as Map<String, dynamic>),
      );
}

class Scan {
  const Scan({
    required this.id,
    required this.codeBac,
    required this.horodatage,
    required this.statut,
    required this.compte,
    this.distanceM,
  });

  final String id;
  final String codeBac;
  final DateTime horodatage;
  final StatutScan statut;

  /// true si le scan entre dans la répartition des points.
  final bool compte;
  final double? distanceM;

  factory Scan.fromJson(Map<String, dynamic> j) => Scan(
        id: j['id'] as String,
        codeBac: j['code_bac'] as String,
        horodatage: _t(j['horodatage']),
        statut: StatutScan.parse(j['statut']),
        compte: j['compte'] as bool,
        distanceM: _d(j['distance_m']),
      );
}

class Bac {
  const Bac({
    required this.id,
    required this.code,
    required this.residence,
    required this.latitude,
    required this.longitude,
    required this.tareKg,
    required this.capaciteKg,
    required this.scansValidesPeriode,
    this.dateDerniereCollecte,
  });

  final String id;
  final String code;
  final String residence;
  final double latitude;
  final double longitude;
  final double tareKg;
  final double capaciteKg;

  /// Scans qui comptent depuis la dernière collecte (période de collecte).
  final int scansValidesPeriode;
  final DateTime? dateDerniereCollecte;

  factory Bac.fromJson(Map<String, dynamic> j) => Bac(
        id: j['id'] as String,
        code: j['code'] as String,
        residence: j['residence'] as String,
        latitude: _d(j['latitude'])!,
        longitude: _d(j['longitude'])!,
        tareKg: _d(j['tare_kg'])!,
        capaciteKg: _d(j['capacite_kg'])!,
        scansValidesPeriode: j['scans_valides_periode'] as int,
        dateDerniereCollecte: _tn(j['date_derniere_collecte']),
      );
}

class Collecte {
  const Collecte({
    required this.id,
    required this.tourneeId,
    required this.bacId,
    required this.codeBac,
    required this.statut,
    required this.tareKg,
    this.poidsBrutKg,
    this.poidsNetKg,
    this.source,
    this.scansValides,
    this.kgParScan,
    this.statutControle,
  });

  final String id;
  final String tourneeId;
  final String bacId;
  final String codeBac;
  final StatutCollecte statut;
  final double tareKg;
  final double? poidsBrutKg;
  final double? poidsNetKg;

  /// `simule`, `capteur` ou `manuel`.
  final String? source;
  final int? scansValides;
  final double? kgParScan;
  final String? statutControle;

  factory Collecte.fromJson(Map<String, dynamic> j) => Collecte(
        id: j['id'] as String,
        tourneeId: j['tournee_id'] as String,
        bacId: j['bac_id'] as String,
        codeBac: j['code_bac'] as String,
        statut: StatutCollecte.parse(j['statut']),
        tareKg: _d(j['tare_kg'])!,
        poidsBrutKg: _d(j['poids_brut_kg']),
        poidsNetKg: _d(j['poids_net_kg']),
        source: j['source'] as String?,
        scansValides: j['scans_valides'] as int?,
        kgParScan: _d(j['kg_par_scan']),
        statutControle: j['statut_controle'] as String?,
      );
}

class Tournee {
  const Tournee({
    required this.id,
    required this.code,
    required this.date,
    required this.codeSite,
    required this.statut,
    required this.nbBacs,
    required this.nbBacsCollectes,
    required this.poidsCollecteKg,
    this.bacs = const [],
    this.collectes = const [],
  });

  final String id;
  final String code;

  /// Date seule, `AAAA-MM-JJ`.
  final String date;
  final String codeSite;
  final StatutTournee statut;
  final int nbBacs;
  final int nbBacsCollectes;
  final double poidsCollecteKg;

  /// Remplis seulement par `GET /tournees/{id}/` (détail).
  final List<Bac> bacs;
  final List<Collecte> collectes;

  factory Tournee.fromJson(Map<String, dynamic> j) => Tournee(
        id: j['id'] as String,
        code: j['code'] as String,
        date: j['date'] as String,
        codeSite: j['code_site'] as String,
        statut: StatutTournee.parse(j['statut']),
        nbBacs: j['nb_bacs'] as int,
        nbBacsCollectes: j['nb_bacs_collectes'] as int,
        poidsCollecteKg: _d(j['poids_collecte_kg']) ?? 0,
        bacs: [
          for (final b in (j['bacs'] as List<dynamic>? ?? const []))
            Bac.fromJson(b as Map<String, dynamic>),
        ],
        collectes: [
          for (final c in (j['collectes'] as List<dynamic>? ?? const []))
            Collecte.fromJson(c as Map<String, dynamic>),
        ],
      );
}

class Solde {
  const Solde({
    required this.solde,
    required this.pointsEnAttente,
    required this.totalGagne,
    required this.totalEchange,
  });

  final int solde;
  final int pointsEnAttente;
  final int totalGagne;
  final int totalEchange;

  factory Solde.fromJson(Map<String, dynamic> j) => Solde(
        solde: j['solde'] as int,
        pointsEnAttente: j['points_en_attente'] as int,
        totalGagne: j['total_gagne'] as int,
        totalEchange: j['total_echange'] as int,
      );
}

/// Détail d'un gain de points (`GET /greenpoints/transactions/`, guide §7 et §10).
class GreenPointsTransaction {
  const GreenPointsTransaction({
    required this.id,
    required this.codeTournee,
    required this.scansCitoyen,
    required this.scansBac,
    required this.points,
    required this.statut,
    required this.date,
    this.poidsAttribueKg,
    this.valeurKg,
    this.coefQualite,
  });

  final String id;
  final String codeTournee;
  final int scansCitoyen;
  final int scansBac;
  final double? poidsAttribueKg;
  final double? valeurKg;
  final double? coefQualite;
  final int points;
  final StatutTransaction statut;
  final DateTime date;

  factory GreenPointsTransaction.fromJson(Map<String, dynamic> j) =>
      GreenPointsTransaction(
        id: j['id'] as String,
        codeTournee: (j['code_tournee'] as String?) ?? '',
        scansCitoyen: (j['scans_citoyen'] as int?) ?? 0,
        scansBac: (j['scans_bac'] as int?) ?? 0,
        points: j['points'] as int,
        statut: StatutTransaction.parse(j['statut']),
        date: _t(j['date']),
        poidsAttribueKg: _d(j['poids_attribue_kg']),
        valeurKg: _d(j['valeur_kg']),
        coefQualite: _d(j['coef_qualite']),
      );
}

/// Notification par utilisateur (contrat 1.4.0, voir `notification.txt`).
/// Le mobile ne crée rien : il lit et marque comme lues.
class Notification {
  const Notification({
    required this.id,
    required this.type,
    required this.niveau,
    required this.titre,
    required this.message,
    required this.lue,
    required this.dateCreation,
    this.objetType,
    this.objetId,
    this.dateLecture,
  });

  final String id;
  final TypeNotification type;
  final NiveauNotification niveau;
  final String titre;

  /// Message déjà rédigé par le backend : affiché tel quel.
  final String message;
  final String? objetType;
  final String? objetId;
  final bool lue;
  final DateTime dateCreation;
  final DateTime? dateLecture;

  factory Notification.fromJson(Map<String, dynamic> j) => Notification(
        id: j['id'] as String,
        type: TypeNotification.parse(j['type']),
        niveau: NiveauNotification.parse(j['niveau']),
        titre: j['titre'] as String,
        message: j['message'] as String,
        objetType: j['objet_type'] as String?,
        objetId: j['objet_id'] as String?,
        lue: j['lue'] as bool,
        dateCreation: _t(j['date_creation']),
        dateLecture: _tn(j['date_lecture']),
      );
}

/// Type de récompense. Si le serveur ne renvoie pas `categorie` (pas encore dans le contrat),
/// on le déduit du nom : voir [Recompense.categorie].
enum RecompenseCategorie { internet, appel, bon, don }

class Recompense {
  const Recompense({
    required this.id,
    required this.nom,
    required this.description,
    required this.coutPoints,
    required this.partenaire,
    required this.actif,
    this.categorieApi,
  });

  final String? categorieApi;

  RecompenseCategorie get categorie {
    final byApi = RecompenseCategorie.values
        .where((c) => c.name == categorieApi)
        .firstOrNull;
    if (byApi != null) return byApi;
    final n = nom.toLowerCase();
    if (n.contains('internet') || n.contains('forfait') || n.contains('data')) {
      return RecompenseCategorie.internet;
    }
    if (n.contains('appel') || n.contains('crédit') || n.contains('credit')) {
      return RecompenseCategorie.appel;
    }
    if (n.contains('arbre') || n.contains('kit') || n.contains('don')) {
      return RecompenseCategorie.don;
    }
    return RecompenseCategorie.bon;
  }

  /// Internet et crédit d'appel sont livrés sur un numéro de téléphone (le sien ou celui d'un proche).
  bool get versUnNumero =>
      categorie == RecompenseCategorie.internet ||
      categorie == RecompenseCategorie.appel;

  final String id;
  final String nom;
  final String description;
  final int coutPoints;
  final String partenaire;
  final bool actif;

  factory Recompense.fromJson(Map<String, dynamic> j) => Recompense(
        id: j['id'] as String,
        nom: j['nom'] as String,
        description: j['description'] as String,
        coutPoints: j['cout_points'] as int,
        partenaire: j['partenaire'] as String,
        actif: j['actif'] as bool,
        categorieApi: j['categorie'] as String?,
      );
}

class Echange {
  const Echange({
    required this.id,
    required this.nomRecompense,
    required this.coutPoints,
    required this.date,
    this.telephoneBeneficiaire,
  });

  /// Numéro qui reçoit le forfait ou le crédit (absent pour un bon ou un don).
  final String? telephoneBeneficiaire;

  final String id;
  final String nomRecompense;
  final int coutPoints;
  final DateTime date;

  factory Echange.fromJson(Map<String, dynamic> j) => Echange(
        id: j['id'] as String,
        nomRecompense: j['nom_recompense'] as String,
        coutPoints: j['cout_points'] as int,
        date: _t(j['date']),
        telephoneBeneficiaire: j['telephone_beneficiaire'] as String?,
      );
}

/// Bac proposé à l'inscription (route publique `GET /bacs/proches/`, proposition de contrat).
class BacPublic {
  const BacPublic({
    required this.code,
    required this.residence,
    this.latitude,
    this.longitude,
    this.distanceM,
  });

  final String code;
  final String residence;
  final double? latitude;
  final double? longitude;
  final double? distanceM;

  factory BacPublic.fromJson(Map<String, dynamic> j) => BacPublic(
        code: j['code'] as String,
        residence: j['residence'] as String,
        latitude: _d(j['latitude']),
        longitude: _d(j['longitude']),
        distanceM: _d(j['distance_m']),
      );
}

/// Paramètre système (guide §9). Le mobile lit surtout `max_scans_par_jour` (contrat 1.6.0)
/// pour bloquer le scan à l'avance, mais rien n'est calculé ici : la valeur vient du serveur.
class Parametre {
  const Parametre({
    required this.cle,
    required this.valeur,
    this.unite,
    this.description,
  });

  final String cle;
  final double valeur;
  final String? unite;
  final String? description;

  factory Parametre.fromJson(Map<String, dynamic> j) => Parametre(
        cle: j['cle'] as String,
        valeur: (j['valeur'] as num).toDouble(),
        unite: j['unite'] as String?,
        description: j['description'] as String?,
      );
}
