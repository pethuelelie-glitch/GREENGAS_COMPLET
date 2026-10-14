import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:greengas/data/api_client.dart';
import 'package:http/http.dart' as http;

/// Client réel : JSON + JWT. Sur une erreur 401, tente UNE fois de rafraîchir le jeton ;
/// si cela échoue, les jetons sont effacés et [onSessionExpired] ramène à la connexion (guide §5).
class HttpApiClient implements ApiClient {
  HttpApiClient({
    required this.baseUrl,
    required this.tokens,
    this.onSessionExpired,
    http.Client? client,
  }) : _http = client ?? http.Client();

  /// Sans barre finale, ex. `http://localhost:8000/api/v1`.
  final String baseUrl;
  final TokenStore tokens;
  final void Function()? onSessionExpired;
  final http.Client _http;

  /// Rafraîchissement « single-flight » : si plusieurs requêtes reçoivent un 401 en même temps,
  /// elles attendent le **même** appel à `/auth/token/rafraichir/` au lieu d'en lancer plusieurs.
  Future<bool>? _refreshing;

  @override
  Future<dynamic> get(String path,
          {Map<String, String>? query, bool auth = true}) =>
      _send('GET', path, query: query, auth: auth);

  @override
  Future<dynamic> post(String path, {Object? body, bool auth = true}) =>
      _send('POST', path, body: body, auth: auth);

  Future<dynamic> _send(
    String method,
    String path, {
    Map<String, String>? query,
    Object? body,
    bool auth = true,
    bool canRetry = true,
  }) async {
    final base = Uri.parse('$baseUrl$path');
    // N'ajoute une query que si elle porte au moins un paramètre (sinon `Uri.replace` produit un `?` vide).
    final uri = (query == null || query.isEmpty)
        ? base
        : base.replace(queryParameters: query);
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (auth) {
      final token = await tokens.access;
      if (token != null) headers['Authorization'] = 'Bearer $token';
    }

    final http.Response res;
    try {
      final request = method == 'GET'
          ? _http.get(uri, headers: headers)
          : _http.post(uri,
              headers: headers, body: body == null ? null : jsonEncode(body));
      res = await request.timeout(const Duration(seconds: 15));
    } on SocketException {
      throw ApiException.reseau();
    } on http.ClientException {
      throw ApiException.reseau();
    } on TimeoutException {
      throw ApiException.reseau();
    }

    if (res.statusCode == 401 && auth) {
      // Un seul rafraîchissement : si le re-essai renvoie encore 401 (canRetry == false)
      // ou si le rafraîchissement échoue, on efface la session et on ramène à la connexion.
      if (canRetry && await _refreshAccess()) {
        return _send(method, path,
            query: query, body: body, auth: auth, canRetry: false);
      }
      await tokens.clear();
      onSessionExpired?.call();
    }
    if (res.statusCode >= 200 && res.statusCode < 300) {
      if (res.bodyBytes.isEmpty) return null;
      return jsonDecode(utf8.decode(res.bodyBytes));
    }
    throw ApiException.fromBody(res.statusCode, res.bodyBytes);
  }

  Future<bool> _refreshAccess() {
    final existing = _refreshing;
    if (existing != null) return existing;
    final future = _doRefresh();
    _refreshing = future;
    future.whenComplete(() {
      if (identical(_refreshing, future)) _refreshing = null;
    });
    return future;
  }

  Future<bool> _doRefresh() async {
    final refresh = await tokens.refresh;
    if (refresh == null) return false;
    try {
      final j = await _send(
        'POST',
        '/auth/token/rafraichir/',
        body: {'refresh': refresh},
        auth: false,
        canRetry: false,
      ) as Map<String, dynamic>;
      await tokens.save(j['access'] as String, null);
      return true;
    } on ApiException {
      return false;
    }
  }
}
