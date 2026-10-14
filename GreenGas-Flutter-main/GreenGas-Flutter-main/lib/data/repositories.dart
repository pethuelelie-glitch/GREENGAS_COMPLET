import 'package:greengas/data/api_client.dart';
import 'package:greengas/domain/models.dart';

/// Les repositories traduisent les routes du guide (§10) en objets Dart.
/// Ils ne contiennent aucune règle métier : le backend calcule et décide.

Map<String, dynamic> _map(dynamic j) => j as Map<String, dynamic>;
List<Map<String, dynamic>> _results(dynamic page) => [
      for (final e
          in (page as Map<String, dynamic>)['results'] as List<dynamic>)
        e as Map<String, dynamic>
    ];

class AuthRepository {
  const AuthRepository(this._api, this._tokens);
  final ApiClient _api;
  final TokenStore _tokens;

  /// Au démarrage : retrouve l'utilisateur si des jetons sont enregistrés.
  Future<Utilisateur?> restore() async {
    if (await _tokens.access == null) return null;
    try {
      return Utilisateur.fromJson(_map(await _api.get('/auth/moi/')));
    } on ApiException catch (e) {
      if (e.status == 0) rethrow; // réseau coupé : on garde les jetons
      await _tokens.clear();
      return null;
    }
  }

  Future<Utilisateur> login(String telephone, String motDePasse) async {
    final j = _map(await _api.post(
      '/auth/token/',
      body: {'telephone': telephone, 'mot_de_passe': motDePasse},
      auth: false,
    ));
    await _tokens.save(j['access'] as String, j['refresh'] as String);
    return Utilisateur.fromJson(_map(j['utilisateur']));
  }

  /// Contrat 1.3.0 : l'inscription renvoie `201` + `Jetons` (`{access, refresh, utilisateur}`).
  /// Le citoyen est actif et connecté immédiatement : plus de code SMS ni d'attente de référent.
  Future<Utilisateur> signUp({
    required String nom,
    required String telephone,
    required String motDePasse,
    required String codeBac,
    String? email,
  }) async {
    final j = _map(await _api.post(
      '/auth/inscription/',
      body: {
        'nom': nom,
        'telephone': telephone,
        'mot_de_passe': motDePasse,
        'code_bac': codeBac,
        // Facultatif : envoyé seulement s'il est renseigné (proposition de contrat).
        if (email != null && email.isNotEmpty) 'email': email,
      },
      auth: false,
    ));
    await _tokens.save(j['access'] as String, j['refresh'] as String);
    return Utilisateur.fromJson(_map(j['utilisateur']));
  }

  Future<void> logout() => _tokens.clear();
}

class ScanRepository {
  const ScanRepository(this._api);
  final ApiClient _api;

  /// Le serveur renvoie toujours le scan avec son statut (valide, non_localise, hors_zone, refuse_plafond).
  Future<Scan> scan(String codeBac,
          {double? latitude, double? longitude}) async =>
      Scan.fromJson(_map(
        await _api.post('/scans/', body: {
          'code_bac': codeBac,
          'latitude': latitude,
          'longitude': longitude,
        }),
      ));

  Future<List<Scan>> history() async => [
        for (final j in _results(
            await _api.get('/scans/', query: {'taille_page': '50'})))
          Scan.fromJson(j),
      ];
}

class PointsRepository {
  const PointsRepository(this._api);
  final ApiClient _api;

  Future<Solde> solde() async =>
      Solde.fromJson(_map(await _api.get('/greenpoints/solde/')));

  /// Historique des gains de points, du plus récent au plus ancien (guide §7 et §10).
  Future<List<GreenPointsTransaction>> transactions() async => [
        for (final j in _results(await _api
            .get('/greenpoints/transactions/', query: {'taille_page': '50'})))
          GreenPointsTransaction.fromJson(j),
      ];

  Future<List<Recompense>> recompenses() async => [
        for (final j in (await _api.get('/recompenses/') as List<dynamic>))
          Recompense.fromJson(_map(j)),
      ];

  Future<List<Echange>> echanges() async => [
        for (final j in _results(await _api.get('/echanges/')))
          Echange.fromJson(j),
      ];

  /// 422 SOLDE_INSUFFISANT / RECOMPENSE_INACTIVE : le message du serveur est affiché tel quel.
  ///
  /// [telephoneBeneficiaire] : numéro qui reçoit un forfait internet ou un crédit d'appel
  /// (le sien ou celui d'un proche). Proposition de contrat, voir docs/PROPOSITIONS_CONTRAT.md.
  Future<Echange> echanger(String recompenseId,
          {String? telephoneBeneficiaire}) async =>
      Echange.fromJson(_map(await _api.post('/echanges/', body: {
        'recompense_id': recompenseId,
        if (telephoneBeneficiaire != null)
          'telephone_beneficiaire': telephoneBeneficiaire,
      })));
}

class TourneeRepository {
  const TourneeRepository(this._api);
  final ApiClient _api;

  Future<List<Tournee>> list({String? date, String? statut}) async => [
        for (final j in _results(await _api.get('/tournees/', query: {
          if (date != null) 'date': date,
          if (statut != null) 'statut': statut,
        })))
          Tournee.fromJson(j),
      ];

  Future<Tournee> detail(String id) async =>
      Tournee.fromJson(_map(await _api.get('/tournees/$id/')));

  Future<Tournee> demarrer(String id) async =>
      Tournee.fromJson(_map(await _api.post('/tournees/$id/demarrer/')));

  Future<Tournee> cloturer(String id) async =>
      Tournee.fromJson(_map(await _api.post('/tournees/$id/cloturer/')));

  /// Scan du bac : ouvre la collecte (`en_attente_pesee`). Le collecteur saisit ensuite le poids
  /// à la main (`saisirPesee`), contrat 1.5.0.
  Future<Collecte> ouvrirCollecte(String tourneeId, String codeBac) async =>
      Collecte.fromJson(_map(await _api.post('/tournees/$tourneeId/collectes/',
          body: {'code_bac': codeBac})));

  /// Pesée saisie à la main par le collecteur (`source = manuel`) : `en_attente_pesee` → `pesee`.
  /// 422 POIDS_INVALIDE si le poids est nul ou supérieur à la capacité du bac.
  Future<Collecte> saisirPesee(String id, double poidsBrutKg) async =>
      Collecte.fromJson(_map(await _api.post('/collectes/$id/pesee/', body: {
        'poids_brut_kg': poidsBrutKg,
        'source': 'manuel',
      })));

  Future<Collecte> collecte(String id) async =>
      Collecte.fromJson(_map(await _api.get('/collectes/$id/')));

  Future<Collecte> valider(String id) async =>
      Collecte.fromJson(_map(await _api.post('/collectes/$id/valider/')));
}

class BacRepository {
  const BacRepository(this._api);
  final ApiClient _api;

  /// Bacs autour d'une position, du plus proche au plus lointain (route publique : le citoyen
  /// n'a pas encore de compte). Proposition de contrat, voir docs/PROPOSITIONS_CONTRAT.md.
  Future<List<BacPublic>> proches(double latitude, double longitude) async {
    final j = await _api.get(
      '/bacs/proches/',
      query: {'latitude': '$latitude', 'longitude': '$longitude'},
      auth: false,
    );
    final list =
        j is List ? j : (j as Map<String, dynamic>)['results'] as List<dynamic>;
    return [
      for (final e in list) BacPublic.fromJson(e as Map<String, dynamic>)
    ];
  }
}

class NotificationRepository {
  const NotificationRepository(this._api);
  final ApiClient _api;

  Future<int> compteur() async {
    final j = _map(await _api.get('/notifications/compteur/'));
    return j['non_lues'] as int? ?? 0;
  }

  Future<List<Notification>> liste({bool? lue}) async {
    final q = <String, String>{'taille_page': '30'};
    if (lue != null) q['lue'] = lue.toString();
    final res = _results(await _api.get('/notifications/', query: q));
    return [for (final e in res) Notification.fromJson(e)];
  }

  Future<void> marquerLue(String id) async {
    await _api.post('/notifications/$id/lue/');
  }

  Future<int> toutLire() async {
    final j = _map(await _api.post('/notifications/tout-lire/'));
    return j['marquees'] as int? ?? 0;
  }
}

class ParametresRepository {
  const ParametresRepository(this._api);
  final ApiClient _api;

  /// Lit un paramètre système (guide §9). Contrat 1.6.0 : route ouverte à tout utilisateur
  /// authentifié — le mobile lit `max_scans_par_jour` pour bloquer le scan à l'avance.
  Future<Parametre> lire(String cle) async =>
      Parametre.fromJson(_map(await _api.get('/parametres/$cle/')));
}
