import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:greengas/data/api_client.dart';
import 'package:greengas/data/http_api_client.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

/// Tests du client réel : jetons, rafraîchissement sur 401, lecture des erreurs du contrat.
void main() {
  const base = 'http://test.local/api/v1';

  HttpApiClient client(
    MockClient mock,
    MemoryTokenStore tokens, {
    void Function()? expired,
  }) =>
      HttpApiClient(
          baseUrl: base,
          tokens: tokens,
          client: mock,
          onSessionExpired: expired);

  test('envoie le jeton en en-tête Bearer', () async {
    final tokens = MemoryTokenStore()..save('jeton-abc', 'ref-abc');
    String? seen;
    final mock = MockClient((request) async {
      seen = request.headers['Authorization'];
      return http.Response(jsonEncode({'id': 'u1'}), 200);
    });
    await client(mock, tokens).get('/auth/moi/');
    expect(seen, 'Bearer jeton-abc');
  });

  test('401 : rafraîchit une fois puis rejoue la requête', () async {
    final tokens = MemoryTokenStore()..save('vieux', 'le-refresh');
    var refreshCalls = 0;
    var moicalls = 0;
    final mock = MockClient((request) async {
      if (request.url.path.endsWith('/auth/token/rafraichir/')) {
        refreshCalls++;
        expect(jsonDecode(request.body), {'refresh': 'le-refresh'});
        return http.Response(jsonEncode({'access': 'neuf'}), 200);
      }
      moicalls++;
      // Premier appel : jeton expiré. Second appel (après refresh) : OK.
      if (moicalls == 1) {
        return http.Response(jsonEncode({'code': 'NON_AUTHENTIFIE'}), 401);
      }
      expect(request.headers['Authorization'], 'Bearer neuf');
      return http.Response(jsonEncode({'id': 'u1'}), 200);
    });

    final result = await client(mock, tokens).get('/auth/moi/');
    expect((result as Map)['id'], 'u1');
    expect(refreshCalls, 1);
    expect(moicalls, 2);
  });

  test('échec du rafraîchissement : session effacée et retour à la connexion',
      () async {
    final tokens = MemoryTokenStore()..save('vieux', 'le-refresh');
    var expired = false;
    final mock = MockClient((request) async {
      if (request.url.path.endsWith('/auth/token/rafraichir/')) {
        return http.Response(jsonEncode({'code': 'NON_AUTHENTIFIE'}), 401);
      }
      return http.Response(jsonEncode({'code': 'NON_AUTHENTIFIE'}), 401);
    });

    await expectLater(
      client(mock, tokens, expired: () => expired = true).get('/auth/moi/'),
      throwsA(isA<ApiException>().having((e) => e.status, 'status', 401)),
    );
    expect(expired, isTrue);
    expect(await tokens.access, isNull);
    expect(await tokens.refresh, isNull);
  });

  test(
      'le re-essai renvoie encore 401 : session effacée et retour à la connexion',
      () async {
    final tokens = MemoryTokenStore()..save('vieux', 'le-refresh');
    var expired = false;
    final mock = MockClient((request) async {
      if (request.url.path.endsWith('/auth/token/rafraichir/')) {
        return http.Response(jsonEncode({'access': 'neuf'}), 200);
      }
      // Toujours 401, même après le rafraîchissement.
      return http.Response(jsonEncode({'code': 'NON_AUTHENTIFIE'}), 401);
    });

    await expectLater(
      client(mock, tokens, expired: () => expired = true).get('/auth/moi/'),
      throwsA(
          isA<ApiException>().having((e) => e.code, 'code', 'NON_AUTHENTIFIE')),
    );
    expect(expired, isTrue);
    expect(await tokens.access, isNull);
  });

  test('lit {code, message, details} renvoyés par le serveur', () async {
    final tokens = MemoryTokenStore()..save('jeton', 'ref');
    final mock = MockClient((request) async => http.Response(
          jsonEncode({
            'code': 'SOLDE_INSUFFISANT',
            'message': 'Solde insuffisant pour cette récompense.',
            'details': {'solde': 60, 'cout_points': 100},
          }),
          422,
          headers: {'content-type': 'application/json; charset=utf-8'},
        ));

    await expectLater(
      client(mock, tokens).post('/echanges/', body: {'recompense_id': 'r'}),
      throwsA(isA<ApiException>()
          .having((e) => e.code, 'code', 'SOLDE_INSUFFISANT')
          .having((e) => e.details['solde'], 'solde', 60)),
    );
  });

  test('une réponse 204 vide renvoie null', () async {
    final tokens = MemoryTokenStore()..save('jeton', 'ref');
    final mock = MockClient((request) async => http.Response('', 204));
    expect(await client(mock, tokens).post('/auth/otp/renvoyer/', auth: false),
        isNull);
  });

  test('pas de `?` vide quand la query est absente ou vide', () async {
    final tokens = MemoryTokenStore()..save('jeton', 'ref');
    final urls = <String>[];
    final mock = MockClient((request) async {
      urls.add(request.url.toString());
      return http.Response('{}', 200);
    });
    final api = client(mock, tokens);
    await api.get('/tournees/');
    await api.get('/tournees/', query: const {});
    await api.get('/tournees/', query: const {'date': '2026-09-12'});

    expect(urls[0], '$base/tournees/');
    expect(urls[1], '$base/tournees/');
    expect(urls[2], '$base/tournees/?date=2026-09-12');
  });

  test('401 simultanés : un seul rafraîchissement (single-flight)', () async {
    final tokens = MemoryTokenStore()..save('vieux', 'le-refresh');
    var refreshCalls = 0;
    final mock = MockClient((request) async {
      if (request.url.path.endsWith('/auth/token/rafraichir/')) {
        refreshCalls++;
        await Future<void>.delayed(const Duration(milliseconds: 20));
        return http.Response(jsonEncode({'access': 'neuf'}), 200);
      }
      if (request.headers['Authorization'] == 'Bearer neuf') {
        return http.Response(jsonEncode({'ok': true}), 200);
      }
      return http.Response(jsonEncode({'code': 'NON_AUTHENTIFIE'}), 401);
    });

    final api = client(mock, tokens);
    final results =
        await Future.wait([api.get('/a/'), api.get('/b/'), api.get('/c/')]);
    expect(results, hasLength(3));
    expect(refreshCalls, 1);
  });
}
