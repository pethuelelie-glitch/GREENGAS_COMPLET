import 'package:greengas/core/config.dart';
import 'package:greengas/core/geo.dart';
import 'package:greengas/data/api_client.dart';

/// Mini-serveur en mémoire : répond aux routes utilisées par l'app mobile avec
/// EXACTEMENT les formats du guide (noms, énumérations, codes d'erreur, §12 pour les données).
/// Il permet de travailler et de faire la démo sans backend. Le jour où l'API est prête :
/// `--dart-define=USE_MOCK=false`, rien d'autre ne change.
///
/// Simplifications assumées (le vrai backend fait foi) :
/// - la distance au bac n'est pas contrôlée (pas de `hors_zone`) ;
/// - le collecteur saisit le poids à la main (`source = manuel`) ;
/// - le tri se déclenche avec [simulateTri] (outil développeur) : valeur_kg = 8,54 comme au §8.3.
class FakeApiClient implements ApiClient {
  FakeApiClient({
    required this.tokens,
    DateTime Function()? clock,
    this.latency = const Duration(milliseconds: 200),
  }) : _clock = clock ?? _defaultClock {
    _seed();
  }

  /// Horloge par défaut : date du jour, ou date de travail (`DATE_TRAVAIL`) en gardant
  /// l'heure réelle qui s'écoule (indispensable pour les doublons).
  static DateTime _defaultClock() {
    final now = DateTime.now();
    const travail = AppConfig.dateTravail;
    if (travail.isEmpty) return now;
    final d = DateTime.tryParse(travail);
    if (d == null) return now;
    return DateTime(d.year, d.month, d.day, now.hour, now.minute, now.second,
        now.millisecond);
  }

  final TokenStore tokens;
  final Duration latency;
  final DateTime Function() _clock;

  /// Valeur de tri de démonstration (§8.3).
  static const _valeurKgDemo = 8.54;

  // Identifiants fixes du guide §12.
  static const _secteurNord = '5ec70000-0000-4000-8000-000000000001';
  static const _siteDig01 = 'd1900000-0000-4000-8000-000000000001';
  static String _userId(int n) =>
      'a0000000-0000-4000-8000-${n.toString().padLeft(12, '0')}';
  static String _bacId(String code) =>
      'bac00000-0000-4000-8000-${code.substring(4).padLeft(12, '0')}';

  int _seq = 1000;
  String _id(String prefix) =>
      '$prefix-0000-4000-8000-${(_seq++).toString().padLeft(12, '0')}';
  DateTime get _now => _clock();
  String _iso(DateTime t) => t.toUtc().toIso8601String();
  String _two(int n) => n.toString().padLeft(2, '0');
  String _day(DateTime t) => '${t.year}-${_two(t.month)}-${_two(t.day)}';

  final _users = <String, Map<String, dynamic>>{};
  final _bacs = <String, Map<String, dynamic>>{}; // clé = code
  final _scans = <Map<String, dynamic>>[];
  final _tournees = <Map<String, dynamic>>[];
  final _collectes = <Map<String, dynamic>>[];
  final _transactions = <Map<String, dynamic>>[];
  final _echanges = <Map<String, dynamic>>[];
  final _recompenses = <Map<String, dynamic>>[];
  final _notifications =
      <Map<String, dynamic>>[]; // notifications par utilisateur (contrat 1.4.0)

  /// Paramètres système (guide §9). Le mobile lit `max_scans_par_jour` (contrat 1.6.0).
  final _parametres = <String, Map<String, dynamic>>{
    'max_scans_par_jour': {
      'valeur': 2.0,
      'unite': 'scans',
      'description': 'Nombre maximum de scans comptés par citoyen et par jour.',
    },
  };

  // ------------------------------------------------------------------ données de démo
  void _seed() {
    void user(int n, String nom, String tel, String role,
        {String? bac, String valid = 'valide'}) {
      _users[_userId(n)] = {
        'id': _userId(n),
        'nom': nom,
        'telephone': tel,
        'role': role,
        'bac': bac,
        'valid': valid,
        'verifie': true,
      };
    }

    user(1, 'Admin Démo', '+2250700000001', 'administrateur');
    user(2, 'Kouadio Collecteur', '+2250700000002', 'collecteur');
    user(3, 'Aya Opératrice', '+2250700000003', 'operateur_tri');
    user(4, 'Serge Méthanisation', '+2250700000004',
        'responsable_methanisation');
    user(5, 'Référent Atlantic', '+2250700000005', 'referent', bac: 'BAC-014');
    user(6, 'Simulateur IoT', '+2250700000006', 'capteur');
    user(11, 'Awa Koné', '+2250701020304', 'citoyen', bac: 'BAC-014');
    user(12, 'Koffi Yao', '+2250701020305', 'citoyen', bac: 'BAC-014');
    user(13, 'Mariam Traoré', '+2250701020306', 'citoyen', bac: 'BAC-014');
    user(14, "Yao N'Guessan", '+2250701020307', 'citoyen', bac: 'BAC-014');
    user(15, 'Fatou Diabaté', '+2250701020308', 'citoyen', bac: 'BAC-014');

    void bac(
        String code, String residence, double dLat, double dLng, int foyers) {
      _bacs[code] = {
        'id': _bacId(code),
        'code': code,
        'residence': residence,
        'secteur_id': _secteurNord,
        'foyers': foyers,
        'lat': AppConfig.demoLat + dLat,
        'lng': AppConfig.demoLng + dLng,
        'tare': 6.0,
        'capacite': 120.0,
        'derniere': null,
      };
    }

    bac('BAC-014', 'Résidence Atlantic', 0.0016, 0.0010, 6);
    bac('BAC-015', 'Résidence Les Palmiers', -0.0030, 0.0022, 10);
    bac('BAC-016', 'Résidence Les Lauriers', 0.0045, 0.0035, 8);
    // Autres bacs de la ville : proposés au citoyen qui choisit son bac sur la carte.
    bac('BAC-021', 'Marché de Williamsville', 0.0120, 0.0100, 12);
    bac('BAC-022', 'Résidence Les Acacias', -0.0110, 0.0140, 5);
    bac('BAC-023', 'Cité Les Flamboyants', 0.0090, -0.0150, 9);
    bac('BAC-031', 'Résidence Océane', -0.0180, -0.0090, 7);

    // BAC-014 : 22 scans (Awa 8, Koffi 6, Mariam 5, Yao 3) comme dans l'exemple du §8.3.
    // Tous datés des jours précédents : un citoyen de démo peut donc faire ses dépôts
    // comptés du jour (plafond `max_scans_par_jour`, 2 par défaut) avant d'être bloqué.
    final today = DateTime(_now.year, _now.month, _now.day);
    var k = 0;
    void scans(int userN, int count) {
      for (var i = 0; i < count; i++) {
        final at = today.subtract(Duration(days: 1 + (k % 3), hours: -(7 + i)));
        _scans.add(_scan(_userId(userN), 'BAC-014', at));
        k++;
      }
    }

    scans(11, 8);
    scans(12, 6);
    scans(13, 5);
    scans(14, 3);
    for (var i = 0; i < 12; i++) {
      _scans.add(_scan(
          'x-$i', 'BAC-015', today.subtract(Duration(days: 1, hours: -i))));
    }
    for (var i = 0; i < 8; i++) {
      _scans.add(_scan(
          'y-$i', 'BAC-016', today.subtract(Duration(days: 2, hours: -i))));
    }

    // Tournées : une aujourd'hui, une dans 4 jours (cadence de collecte).
    void tournee(DateTime date, int n) {
      _tournees.add({
        'id': '70e00000-0000-4000-8000-${n.toString().padLeft(12, '0')}',
        'code': 'TRN-${_two(date.month)}${_two(date.day)}-01',
        'date': _day(date),
        'statut': 'planifiee',
        'collecteur': _userId(2),
        'bacs': ['BAC-014', 'BAC-015', 'BAC-016'],
      });
    }

    tournee(today, 1);
    final t4 = today.add(const Duration(days: 4));
    tournee(t4, 2);

    // Récompenses du §12.
    int r = 1;
    for (final e in [
      (
        'Forfait internet 1 Go',
        100,
        'internet',
        'Opérateur partenaire',
        'Forfait data de 1 Go.'
      ),
      (
        "Crédit d'appel 500 F",
        60,
        'appel',
        'Opérateur partenaire',
        "Crédit d'appel de 500 F."
      ),
      (
        "Bon d'achat 2 000 F",
        150,
        'bon',
        'Commerce partenaire',
        "Bon d'achat de 2 000 F."
      ),
      ('Kit de tri', 250, 'don', 'GreenGas', 'Kit de tri pour votre immeuble.'),
      (
        'Forfait internet 2 Go',
        180,
        'internet',
        'Opérateur partenaire',
        'Forfait data de 2 Go.'
      ),
      (
        "Crédit d'appel 1 000 F",
        110,
        'appel',
        'Opérateur partenaire',
        "Crédit d'appel de 1 000 F."
      ),
      (
        "Bon d'achat 5 000 F",
        320,
        'bon',
        'Commerce partenaire',
        "Bon d'achat de 5 000 F."
      ),
      (
        'Adopter un arbre',
        80,
        'don',
        'GreenGas',
        'Un arbre planté en votre nom.'
      ),
      (
        'Sac de compost',
        120,
        'bon',
        'GreenGas',
        'Compost issu du tri pour vos plantes.'
      ),
    ]) {
      _recompenses.add({
        'id': 'ec000000-0000-4000-8000-${(r++).toString().padLeft(12, '0')}',
        'nom': e.$1,
        'cout_points': e.$2,
        'categorie': e.$3,
        'partenaire': e.$4,
        'description': e.$5,
        'actif': true,
      });
    }

    // Notifications : une tournée planifiée pour le collecteur Kouadio
    _notifications.add({
      'id': _id('not100000'),
      'user_id': _userId(2),
      'type': 'tournee_planifiee',
      'niveau': 'info',
      'titre': 'Tournée planifiée',
      'message':
          'Nouvelle tournée TRN-${_two(t4.month)}${_two(t4.day)}-01 le ${_two(t4.day)}/${_two(t4.month)} (NORD, 3 bacs).',
      'objet_type': 'tournee',
      'objet_id': _tournees[1]['id'],
      'lue': false,
      'date_creation': _iso(_now.subtract(const Duration(hours: 2))),
      'date_lecture': null,
    });

    // Historique de points d'Awa : 190 gagnés, 60 échangés -> solde 130.
    for (final e in [(90, 12), (60, 8), (40, 4)]) {
      _transactions.add(_transaction(
        _userId(11),
        'BAC-014',
        null,
        e.$1,
        'creditee',
        _now.subtract(Duration(days: e.$2)),
        'TRN-0901-01',
      ));
    }
    _echanges.add({
      'id': _id('ec100000'),
      'citoyen_id': _userId(11),
      'recompense_id': _recompenses[1]['id'],
      'nom_recompense': "Crédit d'appel",
      'cout_points': 60,
      'date': _now.subtract(const Duration(days: 6)),
    });
  }

  Map<String, dynamic> _scan(String citoyenId, String code, DateTime at) => {
        'id': _id('c5a00000'),
        'citoyen_id': citoyenId,
        'code_bac': code,
        'at': at,
        'statut': 'valide',
        'compte': true,
        'ferme': false,
      };

  Map<String, dynamic> _transaction(
      String citoyenId,
      String code,
      Map<String, dynamic>? collecte,
      int points,
      String statut,
      DateTime date,
      String codeTournee,
      {int scansCitoyen = 1,
      int scansBac = 1,
      double poidsKg = 0}) {
    return {
      'id': _id('7a000000'),
      'citoyen_id': citoyenId,
      'bac_id': _bacId(code),
      'tournee_id': collecte?['tournee_id'] ?? _id('70e00000'),
      'collecte_id': collecte?['id'] ?? _id('c0110000'),
      'code_tournee': codeTournee,
      'scans_citoyen': scansCitoyen,
      'scans_bac': scansBac,
      'poids_attribue_kg': poidsKg,
      'valeur_kg': _valeurKgDemo,
      'coef_qualite': 1.0,
      'points': points,
      'statut': statut,
      'date': date,
    };
  }

  // ------------------------------------------------------------------ outil développeur
  /// Simule la validation du tri (Control Center) : crédite les points des tournées `collectee`
  /// selon la formule du §8.3 (points_bac x part du citoyen, arrondi inférieur).
  /// Retourne le nombre de transactions créées.
  int simulateTri() {
    var created = 0;
    for (final t in _tournees.where((t) => t['statut'] == 'collectee')) {
      for (final c in _collectes.where(
          (c) => c['tournee_id'] == t['id'] && c['statut'] == 'validee')) {
        final snap = (c['snap'] as Map<String, int>?) ?? const {};
        final total = (c['scans'] as int?) ?? 0;
        if (total == 0) continue;
        final pointsBac = (c['net'] as double) * _valeurKgDemo;
        for (final e in snap.entries) {
          if (!_users.containsKey(e.key)) continue;
          _transactions.add(_transaction(
            e.key,
            c['code_bac'] as String,
            c,
            (pointsBac * e.value / total).floor(),
            'creditee',
            _now,
            t['code'] as String,
            scansCitoyen: e.value,
            scansBac: total,
            poidsKg: (c['net'] as double) * e.value / total,
          ));
          created++;
        }

        // Créer des notifications « points_credites » pour les citoyens crédités
        for (final e in snap.entries) {
          if (!_users.containsKey(e.key)) continue;
          final points = (pointsBac * e.value / total).floor();
          _notifications.add({
            'id': _id('not100000'),
            'user_id': e.key,
            'type': 'points_credites',
            'niveau': 'info',
            'titre': 'Points crédités',
            'message':
                '+$points points pour la collecte du ${_two(_now.day)}/${_two(_now.month)} (BAC-014).',
            'objet_type': 'transaction',
            'objet_id': null,
            'lue': false,
            'date_creation': _iso(_now),
            'date_lecture': null,
          });
        }
      }
      t['statut'] = 'triee';
    }
    return created;
  }

  /// Outil développeur/test : change un paramètre système (ex. `max_scans_par_jour`).
  /// Le Control Center fait la même chose via `PATCH /parametres/{cle}/` (contrat 1.6.0).
  void setParametre(String cle, double valeur) {
    final p = _parametres[cle] ??= {
      'valeur': valeur,
      'unite': '',
      'description': '',
    };
    p['valeur'] = valeur;
  }

  Map<String, dynamic> _parametreJson(String cle) {
    final p = _parametres[cle];
    if (p == null) {
      throw const ApiException(404, 'INTROUVABLE', 'Paramètre inconnu.');
    }
    return {
      'cle': cle,
      'valeur': p['valeur'],
      'unite': p['unite'],
      'statut': 'aligne',
      'description': p['description'],
      'source': null,
      'date_modification': _iso(_now),
    };
  }

  // ------------------------------------------------------------------ ApiClient
  @override
  Future<dynamic> get(String path,
          {Map<String, String>? query, bool auth = true}) =>
      _call('GET', path, query ?? const {}, const {});

  @override
  Future<dynamic> post(String path, {Object? body, bool auth = true}) => _call(
      'POST', path, const {}, (body as Map<String, dynamic>?) ?? const {});

  Future<dynamic> _call(String method, String path, Map<String, String> q,
      Map<String, dynamic> body) async {
    if (latency > Duration.zero) await Future<void>.delayed(latency);
    final s = path.split('/').where((e) => e.isNotEmpty).toList();
    final key = '$method ${s.join('/')}';

    // Routes publiques
    if (key == 'GET bacs/proches') return _bacsProches(q);
    if (key == 'POST auth/token') return _login(body);
    if (key == 'POST auth/token/rafraichir') {
      return {'access': 'mock-${await _meId()}'};
    }
    if (key == 'POST auth/inscription') return _signUp(body);

    final me = await _me();
    if (key == 'GET auth/moi') return _userJson(me);

    // Scans (citoyen)
    if (s.first == 'scans') {
      _need(me, 'citoyen');
      return method == 'POST'
          ? _postScan(me, body)
          : _page(_myScans(me).map(_scanJson).toList());
    }
    // Tournées et collectes (collecteur)
    if (s.first == 'tournees') return _tournees_(me, method, s, q, body);
    if (s.first == 'collectes') return _collectes_(me, method, s, body);
    // Points (citoyen)
    if (s.first == 'greenpoints' && s.length == 2) {
      _need(me, 'citoyen');
      if (s[1] == 'solde') return _soldeJson(me['id'] as String);
      if (s[1] == 'transactions') {
        final mine = _transactions
            .where((t) => t['citoyen_id'] == me['id'])
            .toList()
          ..sort((a, b) =>
              (b['date'] as DateTime).compareTo(a['date'] as DateTime));
        return _page([for (final t in mine) _transactionJson(t)]);
      }
    }
    if (s.first == 'recompenses' && method == 'GET') return _recompenses;
    if (s.first == 'echanges') {
      _need(me, 'citoyen');
      return method == 'POST' ? _postEchange(me, body) : _page(_myEchanges(me));
    }
    if (s.first == 'notifications') {
      return _notifications_(me, method, s, q);
    }
    if (s.first == 'parametres' && method == 'GET' && s.length == 2) {
      return _parametreJson(s[1]);
    }
    throw const ApiException(
        404, 'INTROUVABLE', 'Route inconnue dans le mode démo.');
  }

  // ------------------------------------------------------------------ authentification
  Future<Map<String, dynamic>> _login(Map<String, dynamic> b) async {
    final u = _users.values
        .where((u) => u['telephone'] == b['telephone'])
        .firstOrNull;
    final pass = (u?['mdp'] as String?) ?? AppConfig.demoPassword;
    if (u == null || b['mot_de_passe'] != pass) {
      throw const ApiException(
          401, 'NON_AUTHENTIFIE', 'Téléphone ou mot de passe incorrect.');
    }
    final id = u['id'] as String;
    await tokens.save('mock-$id', 'mock-refresh-$id');
    return {
      'access': 'mock-$id',
      'refresh': 'mock-refresh-$id',
      'utilisateur': _userJson(u)
    };
  }

  Future<String> _meId() async {
    final t = await tokens.access;
    final refresh = await tokens.refresh;
    final raw = t ?? refresh;
    if (raw == null) {
      throw const ApiException(401, 'NON_AUTHENTIFIE', 'Connexion requise.');
    }
    return raw.replaceFirst('mock-refresh-', '').replaceFirst('mock-', '');
  }

  Future<Map<String, dynamic>> _me() async {
    if (await tokens.access == null) {
      throw const ApiException(401, 'NON_AUTHENTIFIE', 'Connexion requise.');
    }
    final u = _users[await _meId()];
    if (u == null) {
      throw const ApiException(401, 'NON_AUTHENTIFIE', 'Compte introuvable.');
    }
    return u;
  }

  void _need(Map<String, dynamic> me, String role) {
    if (me['role'] != role) {
      throw const ApiException(403, 'ACCES_REFUSE',
          "Vous n'avez pas le droit d'effectuer cette action.");
    }
  }

  List<Map<String, dynamic>> _bacsProches(Map<String, String> q) {
    final lat = double.tryParse(q['latitude'] ?? '') ?? AppConfig.demoLat;
    final lng = double.tryParse(q['longitude'] ?? '') ?? AppConfig.demoLng;
    final list = [
      for (final b in _bacs.values)
        {
          'id': b['id'],
          'code': b['code'],
          'residence': b['residence'],
          'latitude': b['lat'],
          'longitude': b['lng'],
          'distance_m':
              distanceMeters(lat, lng, b['lat'] as double, b['lng'] as double)
                  .roundToDouble(),
        },
    ]..sort((a, b) =>
        (a['distance_m'] as double).compareTo(b['distance_m'] as double));
    return list.take(8).toList();
  }

  Future<Map<String, dynamic>> _signUp(Map<String, dynamic> b) async {
    final tel = (b['telephone'] as String?) ?? '';
    if (!RegExp(r'^\+225[0-9]{10}$').hasMatch(tel)) {
      throw const ApiException(400, 'VALIDATION', 'Données invalides.', {
        'telephone': ['Format attendu : +225 suivi de 10 chiffres.'],
      });
    }
    if (_users.values.any((u) => u['telephone'] == tel)) {
      throw const ApiException(
          409, 'TELEPHONE_DEJA_UTILISE', 'Ce numéro est déjà utilisé.');
    }
    final code = ((b['code_bac'] as String?) ?? '').toUpperCase();
    if (!_bacs.containsKey(code)) {
      throw const ApiException(
          404, 'INTROUVABLE', 'Ce code de bac est inconnu.');
    }
    final id = _userId(100 + _users.length);
    // Contrat 1.3.0 : le citoyen est actif et vérifié dès l'inscription (plus de code SMS).
    _users[id] = {
      'id': id,
      'nom': b['nom'],
      'telephone': tel,
      'email': b['email'],
      'mdp': b['mot_de_passe'],
      'role': 'citoyen',
      'bac': code,
      'valid': 'valide',
      'verifie': true,
    };
    await tokens.save('mock-$id', 'mock-refresh-$id');
    return {
      'access': 'mock-$id',
      'refresh': 'mock-refresh-$id',
      'utilisateur': _userJson(_users[id]!)
    };
  }

  Map<String, dynamic> _userJson(Map<String, dynamic> u) {
    final citoyen = u['role'] == 'citoyen';
    final bac = u['bac'] as String?;
    return {
      'id': u['id'], 'nom': u['nom'], 'telephone': u['telephone'],
      'email': u['email'],
      'role': u['role'], 'actif': true,
      'date_creation': _iso(_now.subtract(const Duration(days: 30))),
      // Contrat 1.3.0 : statut_validation au niveau de l'utilisateur (toujours « valide » sur mobile).
      'statut_validation': u['valid'],
      'profil_citoyen': citoyen && bac != null
          ? {
              'bac_id': _bacId(bac),
              'code_bac': bac,
              'telephone_verifie': u['verifie'],
              'statut_validation': u['valid'],
              'date_inscription': _iso(_now.subtract(const Duration(days: 20))),
            }
          : null,
    };
  }

  // ------------------------------------------------------------------ scans
  List<Map<String, dynamic>> _myScans(Map<String, dynamic> me) =>
      _scans.where((s) => s['citoyen_id'] == me['id']).toList()
        ..sort((a, b) => (b['at'] as DateTime).compareTo(a['at'] as DateTime));

  Map<String, dynamic> _scanJson(Map<String, dynamic> s) => {
        'id': s['id'],
        'citoyen_id': s['citoyen_id'],
        'bac_id': _bacId(s['code_bac'] as String),
        'code_bac': s['code_bac'],
        'horodatage': _iso(s['at'] as DateTime),
        'latitude': null,
        'longitude': null,
        'distance_m': null,
        'statut': s['statut'],
        'compte': s['compte'],
      };

  Map<String, dynamic> _postScan(
      Map<String, dynamic> me, Map<String, dynamic> b) {
    // Contrat 1.3.0 : COMPTE_NON_VALIDE seulement si le compte est désactivé.
    if (me['actif'] == false) {
      throw const ApiException(
          403, 'COMPTE_NON_VALIDE', 'Votre compte est désactivé.');
    }
    final code = ((b['code_bac'] as String?) ?? '').toUpperCase();
    if (!_bacs.containsKey(code)) {
      throw const ApiException(404, 'INTROUVABLE', 'Ce bac est inconnu.');
    }
    final mine = _myScans(me);
    final last = mine.where((s) => s['code_bac'] == code).firstOrNull;
    if (last != null &&
        _now.difference(last['at'] as DateTime) < const Duration(seconds: 10)) {
      return _scanJson(last); // doublon : on renvoie le scan existant
    }
    final today = DateTime(_now.year, _now.month, _now.day);
    final countedToday = mine
        .where(
            (s) => s['compte'] == true && (s['at'] as DateTime).isAfter(today))
        .length;
    final scan = _scan(me['id'] as String, code, _now);
    final plafond =
        (_parametres['max_scans_par_jour']?['valeur'] as num?)?.toInt() ?? 2;
    if (countedToday >= plafond) {
      scan['statut'] = 'refuse_plafond';
      scan['compte'] = false;
    } else if (b['latitude'] == null) {
      scan['statut'] = 'non_localise';
    }
    _scans.add(scan);
    return _scanJson(scan);
  }

  // ------------------------------------------------------------------ tournées
  Map<String, dynamic> _bacJson(String code) {
    final b = _bacs[code]!;
    final open = _scans.where((s) =>
        s['code_bac'] == code && s['compte'] == true && s['ferme'] == false);
    return {
      'id': b['id'],
      'code': code,
      'residence': b['residence'],
      'secteur_id': b['secteur_id'],
      'nb_foyers_declares': b['foyers'],
      'latitude': b['lat'],
      'longitude': b['lng'],
      'tare_kg': b['tare'],
      'capacite_kg': b['capacite'],
      'statut': 'actif',
      'scans_valides_periode': open.length,
      'nb_citoyens_valides': _users.values
          .where((u) =>
              u['bac'] == code &&
              u['role'] == 'citoyen' &&
              u['valid'] == 'valide')
          .length,
      'date_derniere_collecte':
          b['derniere'] == null ? null : _iso(b['derniere'] as DateTime),
      'date_creation': _iso(_now.subtract(const Duration(days: 60))),
    };
  }

  Map<String, dynamic> _tourneeJson(Map<String, dynamic> t,
      {bool detail = false}) {
    final cs = _collectes.where((c) => c['tournee_id'] == t['id']).toList();
    final done = cs.where((c) => c['statut'] == 'validee').toList();
    final j = <String, dynamic>{
      'id': t['id'],
      'code': t['code'],
      'date': t['date'],
      'secteur_id': _secteurNord,
      'site_id': _siteDig01,
      'code_site': 'DIG-01',
      'motif_affectation': 'secteur',
      'collecteur_id': t['collecteur'],
      'statut': t['statut'],
      'niveau_contamination': null,
      'nb_bacs': (t['bacs'] as List).length,
      'nb_bacs_collectes': done.length,
      'poids_collecte_kg':
          done.fold<double>(0, (a, c) => a + (c['net'] as double)),
    };
    if (detail) {
      j['bacs'] = [
        for (final code in t['bacs'] as List) _bacJson(code as String)
      ];
      j['collectes'] = [for (final c in cs) _collecteJson(c)];
    }
    return j;
  }

  Map<String, dynamic> _findTournee(String id) =>
      _tournees.where((t) => t['id'] == id).firstOrNull ??
      (throw const ApiException(404, 'INTROUVABLE', 'Tournée introuvable.'));

  dynamic _tournees_(Map<String, dynamic> me, String method, List<String> s,
      Map<String, String> q, Map<String, dynamic> body) {
    _need(me, 'collecteur');
    if (s.length == 1) {
      var list = _tournees.where((t) => t['collecteur'] == me['id']).toList();
      if (q['date'] != null) {
        list = list.where((t) => t['date'] == q['date']).toList();
      }
      if (q['statut'] != null) {
        list = list.where((t) => t['statut'] == q['statut']).toList();
      }
      list.sort((a, b) => (b['date'] as String).compareTo(a['date'] as String));
      return _page([for (final t in list) _tourneeJson(t)]);
    }
    final t = _findTournee(s[1]);
    if (t['collecteur'] != me['id']) {
      throw const ApiException(
          403, 'ACCES_REFUSE', "Cette tournée n'est pas la vôtre.");
    }
    if (s.length == 2) return _tourneeJson(t, detail: true);
    switch (s[2]) {
      case 'demarrer':
        if (t['statut'] != 'planifiee') {
          throw const ApiException(422, 'TOURNEE_STATUT_INVALIDE',
              'Cette tournée ne peut pas être démarrée.');
        }
        t['statut'] = 'en_cours';
        return _tourneeJson(t, detail: true);
      case 'collectes':
        return _openCollecte(
            t, ((body['code_bac'] as String?) ?? '').toUpperCase());
      case 'cloturer':
        if (t['statut'] != 'en_cours') {
          throw const ApiException(422, 'TOURNEE_STATUT_INVALIDE',
              "Cette tournée n'est pas en cours.");
        }
        if (_collectes.any(
            (c) => c['tournee_id'] == t['id'] && c['statut'] != 'validee')) {
          throw const ApiException(422, 'COLLECTE_STATUT_INVALIDE',
              'Validez toutes les collectes avant de clôturer.');
        }
        t['statut'] = 'collectee';
        return _tourneeJson(t, detail: true);
    }
    throw const ApiException(
        404, 'INTROUVABLE', 'Route inconnue dans le mode démo.');
  }

  // ------------------------------------------------------------------ collectes
  Map<String, dynamic> _openCollecte(Map<String, dynamic> t, String code) {
    if (t['statut'] != 'en_cours') {
      throw const ApiException(
          422, 'TOURNEE_STATUT_INVALIDE', "La tournée n'est pas en cours.");
    }
    if (!(t['bacs'] as List).contains(code)) {
      throw const ApiException(422, 'BAC_HORS_TOURNEE',
          "Ce bac n'est pas prévu dans votre tournée.");
    }
    if (_collectes
        .any((c) => c['tournee_id'] == t['id'] && c['code_bac'] == code)) {
      throw const ApiException(409, 'BAC_DEJA_COLLECTE',
          'Ce bac a déjà été collecté dans cette tournée.');
    }
    final c = {
      'id': _id('c0110000'),
      'tournee_id': t['id'],
      'code_bac': code,
      'statut': 'en_attente_pesee',
      'tare': _bacs[code]!['tare'],
      'brut': null,
      'net': null,
      'source': null,
      'scans': null,
      'kgScan': null,
      'controle': null,
      'opened': _now,
      'datePesee': null,
      'dateValidation': null,
    };
    _collectes.add(c);
    return _collecteJson(c);
  }

  /// Simulateur IoT désactivé : en mobile, c'est le collecteur qui saisit la pesée (source manuel).
  Map<String, dynamic> _collecteJson(Map<String, dynamic> c) {
    final code = c['code_bac'] as String;
    return {
      'id': c['id'],
      'tournee_id': c['tournee_id'],
      'bac_id': _bacId(code),
      'code_bac': code,
      'collecteur_id': _userId(2),
      'statut': c['statut'],
      'poids_brut_kg': c['brut'],
      'tare_kg': c['tare'],
      'poids_net_kg': c['net'],
      'source': c['source'],
      'scans_valides': c['scans'],
      'kg_par_scan': c['kgScan'],
      'statut_controle': c['controle'],
      'date_ouverture': _iso(c['opened'] as DateTime),
      'date_pesee':
          c['datePesee'] == null ? null : _iso(c['datePesee'] as DateTime),
      'date_validation': c['dateValidation'] == null
          ? null
          : _iso(c['dateValidation'] as DateTime),
    };
  }

  dynamic _collectes_(Map<String, dynamic> me, String method, List<String> s,
      Map<String, dynamic> body) {
    _need(me, 'collecteur');
    final c = _collectes.where((c) => c['id'] == s[1]).firstOrNull ??
        (throw const ApiException(404, 'INTROUVABLE', 'Collecte introuvable.'));
    if (s.length == 2) return _collecteJson(c);
    if (s[2] == 'pesee') {
      if (c['statut'] == 'validee') {
        throw const ApiException(
            409, 'CONFLIT', 'Cette collecte est déjà validée.');
      }
      if (c['statut'] == 'pesee') {
        throw const ApiException(
            409, 'CONFLIT', 'La pesée a déjà été enregistrée.');
      }
      final brut = (body['poids_brut_kg'] as num?)?.toDouble();
      final capacite = _bacs[c['code_bac']]!['capacite'] as double;
      if (brut == null || brut <= 0 || brut > capacite) {
        throw const ApiException(422, 'POIDS_INVALIDE',
            'Poids nul ou supérieur à la capacité du bac.');
      }
      c['brut'] = double.parse(brut.toStringAsFixed(2));
      c['source'] = (body['source'] as String?) ?? 'manuel';
      c['statut'] = 'pesee';
      c['datePesee'] = _now;
      return _collecteJson(c);
    }
    if (s[2] == 'valider') {
      if (c['statut'] == 'validee') {
        throw const ApiException(
            409, 'CONFLIT', 'Cette collecte est déjà validée.');
      }
      if (c['statut'] != 'pesee') {
        throw const ApiException(422, 'COLLECTE_STATUT_INVALIDE',
            "La pesée n'est pas encore reçue.");
      }
      final net = ((c['brut'] as double) - (c['tare'] as double));
      final code = c['code_bac'] as String;
      final open = _scans
          .where((s) =>
              s['code_bac'] == code &&
              s['compte'] == true &&
              s['ferme'] == false)
          .toList();
      final snap = <String, int>{};
      for (final sc in open) {
        snap[sc['citoyen_id'] as String] =
            (snap[sc['citoyen_id'] as String] ?? 0) + 1;
        sc['ferme'] = true; // remise à zéro du compteur de scans du bac
      }
      c['net'] = double.parse(net.toStringAsFixed(2));
      c['scans'] = open.length;
      c['snap'] = snap;
      c['kgScan'] = open.isEmpty
          ? null
          : double.parse((net / open.length).toStringAsFixed(2));
      c['controle'] = (c['kgScan'] != null && (c['kgScan'] as double) < 0.3)
          ? 'a_verifier'
          : 'normal';
      c['statut'] = 'validee';
      c['dateValidation'] = _now;
      _bacs[code]!['derniere'] = _now;
      return _collecteJson(c);
    }
    throw const ApiException(
        404, 'INTROUVABLE', 'Route inconnue dans le mode démo.');
  }

  // ------------------------------------------------------------------ points
  Map<String, dynamic> _transactionJson(Map<String, dynamic> t) => {
        ...t,
        'date': _iso(t['date'] as DateTime),
      };

  Map<String, dynamic> _soldeJson(String id) {
    int sum(String statut) => _transactions
        .where((t) => t['citoyen_id'] == id && t['statut'] == statut)
        .fold<int>(0, (a, t) => a + (t['points'] as int));
    final echange = _echanges
        .where((e) => e['citoyen_id'] == id)
        .fold<int>(0, (a, e) => a + (e['cout_points'] as int));
    final gagne = sum('creditee');
    return {
      'citoyen_id': id,
      'solde': gagne - echange,
      'points_en_attente': sum('en_attente'),
      'total_gagne': gagne,
      'total_echange': echange,
    };
  }

  List<Map<String, dynamic>> _myEchanges(Map<String, dynamic> me) {
    final mine = _echanges.where((e) => e['citoyen_id'] == me['id']).toList()
      ..sort(
          (a, b) => (b['date'] as DateTime).compareTo(a['date'] as DateTime));
    return [
      for (final e in mine)
        {
          'telephone_beneficiaire': null,
          ...e,
          'date': _iso(e['date'] as DateTime)
        },
    ];
  }

  Map<String, dynamic> _postEchange(
      Map<String, dynamic> me, Map<String, dynamic> b) {
    final r =
        _recompenses.where((r) => r['id'] == b['recompense_id']).firstOrNull ??
            (throw const ApiException(
                404, 'INTROUVABLE', 'Récompense introuvable.'));
    if (r['actif'] != true) {
      throw const ApiException(422, 'RECOMPENSE_INACTIVE',
          "Cette récompense n'est plus disponible.");
    }
    final beneficiaire = b['telephone_beneficiaire'] as String?;
    if (beneficiaire != null &&
        !RegExp(r'^\+225[0-9]{10}$').hasMatch(beneficiaire)) {
      throw const ApiException(400, 'VALIDATION', 'Données invalides.', {
        'telephone_beneficiaire': [
          'Format attendu : +225 suivi de 10 chiffres.'
        ],
      });
    }
    final solde = _soldeJson(me['id'] as String)['solde'] as int;
    if (solde < (r['cout_points'] as int)) {
      throw ApiException(
          422,
          'SOLDE_INSUFFISANT',
          'Solde insuffisant pour cette récompense.',
          {'solde': solde, 'cout_points': r['cout_points']});
    }
    final e = {
      'id': _id('ec100000'),
      'citoyen_id': me['id'],
      'recompense_id': r['id'],
      'nom_recompense': r['nom'],
      'cout_points': r['cout_points'],
      'date': _now,
      'telephone_beneficiaire': beneficiaire,
    };
    _echanges.add(e);
    // Notification échange effectué
    _notifications.add({
      'id': _id('not100000'),
      'user_id': me['id'],
      'type': 'echange_effectue',
      'niveau': 'info',
      'titre': 'Échange effectué',
      'message': "${r['nom']} échangé contre ${r['cout_points']} points.",
      'objet_type': 'echange',
      'objet_id': e['id'],
      'lue': false,
      'date_creation': _iso(_now),
      'date_lecture': null,
    });
    return {...e, 'date': _iso(_now)};
  }

  Map<String, dynamic> _notificationJson(Map<String, dynamic> n) => {
        'id': n['id'],
        'type': n['type'],
        'niveau': n['niveau'],
        'titre': n['titre'],
        'message': n['message'],
        'objet_type': n['objet_type'],
        'objet_id': n['objet_id'],
        'lue': n['lue'],
        'date_creation': n['date_creation'],
        'date_lecture': n['date_lecture'],
      };

  dynamic _notifications_(Map<String, dynamic> me, String method,
      List<String> s, Map<String, String> q) {
    final mine = _notifications.where((n) => n['user_id'] == me['id']).toList()
      ..sort((a, b) => (b['date_creation'] as String)
          .compareTo(a['date_creation'] as String));
    if (s.length == 1) {
      final lue = q['lue'];
      var list = mine;
      if (lue == 'false') list = mine.where((n) => n['lue'] == false).toList();
      if (lue == 'true') list = mine.where((n) => n['lue'] == true).toList();
      return _page([for (final n in list.take(30)) _notificationJson(n)]);
    }
    if (s.length == 2 && method == 'POST' && s[1] == 'tout-lire') {
      final nonLues = mine.where((n) => n['lue'] == false).toList();
      for (final n in nonLues) {
        n['lue'] = true;
        n['date_lecture'] = _iso(_now);
      }
      return {'marquees': nonLues.length};
    }
    // POST /notifications/{id}/lue/
    if (s.length == 3 && method == 'POST' && s[2] == 'lue') {
      final n = mine.where((x) => x['id'] == s[1]).firstOrNull;
      if (n == null) {
        throw const ApiException(
            404, 'INTROUVABLE', 'Notification introuvable.');
      }
      if (n['lue'] == false) {
        n['lue'] = true;
        n['date_lecture'] = _iso(_now);
      }
      return _notificationJson(n);
    }
    if (s.length == 2 && s[1] == 'compteur') {
      return {'non_lues': mine.where((n) => n['lue'] == false).length};
    }
    if (s.length == 2 && method == 'GET') {
      final n = mine.where((x) => x['id'] == s[1]).firstOrNull;
      if (n == null) {
        throw const ApiException(
            404, 'INTROUVABLE', 'Notification introuvable.');
      }
      return _notificationJson(n);
    }
    throw const ApiException(
        404, 'INTROUVABLE', 'Route inconnue dans le mode démo.');
  }

  Map<String, dynamic> _page(List<Map<String, dynamic>> items) =>
      {'count': items.length, 'next': null, 'previous': null, 'results': items};
}
