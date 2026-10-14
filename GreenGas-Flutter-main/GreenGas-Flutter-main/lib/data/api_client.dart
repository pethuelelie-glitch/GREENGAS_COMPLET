import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Erreur renvoyée par l'API : `{code, message, details}` (guide §11).
/// L'app réagit selon [code] et affiche [message] tel quel.
class ApiException implements Exception {
  const ApiException(this.status, this.code, this.message,
      [this.details = const {}]);

  final int status;
  final String code;
  final String message;
  final Map<String, dynamic> details;

  factory ApiException.reseau() => const ApiException(
        0,
        'RESEAU',
        'Impossible de joindre le serveur. Vérifiez votre connexion.',
      );

  factory ApiException.fromBody(int status, List<int> bytes) {
    try {
      final j = jsonDecode(utf8.decode(bytes)) as Map<String, dynamic>;
      return ApiException(
        status,
        j['code'] as String? ?? 'ERREUR_SERVEUR',
        j['message'] as String? ?? 'Erreur inattendue.',
        (j['details'] as Map<String, dynamic>?) ?? const {},
      );
    } catch (_) {
      return ApiException(
          status, 'ERREUR_SERVEUR', 'Erreur inattendue du serveur.');
    }
  }

  @override
  String toString() => '$code: $message';
}

/// Texte à montrer à l'utilisateur pour n'importe quelle erreur.
String friendlyError(Object e) {
  if (e is! ApiException) return 'Une erreur est survenue. Réessayez.';
  if (e.code == 'VALIDATION' && e.details.isNotEmpty) {
    final lines = [
      for (final v in e.details.values)
        if (v is List) ...v.map((m) => '$m') else '$v',
    ];
    if (lines.isNotEmpty) return lines.join('\n');
  }
  return e.message;
}

/// Les deux implémentations (HttpApiClient réel, FakeApiClient démo) parlent le même langage :
/// chemins du guide (`/scans/`), JSON décodé en retour (Map, List ou null pour un 204).
abstract class ApiClient {
  /// [auth] false pour les routes publiques (ex. bacs proches à l'inscription).
  Future<dynamic> get(String path,
      {Map<String, String>? query, bool auth = true});

  /// [auth] false pour les routes publiques (connexion, inscription, OTP).
  Future<dynamic> post(String path, {Object? body, bool auth = true});
}

abstract class TokenStore {
  Future<String?> get access;
  Future<String?> get refresh;
  Future<void> save(String access, String? refresh);
  Future<void> clear();
}

class MemoryTokenStore implements TokenStore {
  String? _access;
  String? _refresh;

  @override
  Future<String?> get access async => _access;

  @override
  Future<String?> get refresh async => _refresh;

  @override
  Future<void> save(String access, String? refresh) async {
    _access = access;
    _refresh = refresh ?? _refresh;
  }

  @override
  Future<void> clear() async {
    _access = null;
    _refresh = null;
  }
}

/// Jetons chiffrés sur le téléphone (Keystore / Keychain).
class SecureTokenStore implements TokenStore {
  const SecureTokenStore();
  static const _storage = FlutterSecureStorage();

  @override
  Future<String?> get access => _storage.read(key: 'access');

  @override
  Future<String?> get refresh => _storage.read(key: 'refresh');

  @override
  Future<void> save(String access, String? refresh) async {
    await _storage.write(key: 'access', value: access);
    if (refresh != null) await _storage.write(key: 'refresh', value: refresh);
  }

  @override
  Future<void> clear() async {
    await _storage.delete(key: 'access');
    await _storage.delete(key: 'refresh');
  }
}
