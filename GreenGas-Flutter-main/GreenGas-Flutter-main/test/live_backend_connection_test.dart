// Intégration live : conserver les traces de diagnostic dans la sortie de test.
// ignore_for_file: avoid_print

import 'package:flutter_test/flutter_test.dart';
import 'package:greengas/core/config.dart';
import 'package:greengas/data/api_client.dart';
import 'package:greengas/data/http_api_client.dart';
import 'package:greengas/data/repositories.dart';
import 'package:greengas/domain/models.dart';

void main() {
  group('Connexion directe Flutter -> Backend Django en direct', () {
    late MemoryTokenStore tokens;
    late HttpApiClient client;
    late AuthRepository auth;
    late BacRepository bacRepo;
    late PointsRepository pointsRepo;
    late TourneeRepository tourneeRepo;

    setUp(() {
      tokens = MemoryTokenStore();
      client = HttpApiClient(
        baseUrl: 'http://127.0.0.1:8000/api/v1',
        tokens: tokens,
      );
      auth = AuthRepository(client, tokens);
      bacRepo = BacRepository(client);
      pointsRepo = PointsRepository(client);
      tourneeRepo = TourneeRepository(client);
    });

    test('1. Bacs proches public (inscription)', () async {
      final bacs = await bacRepo.proches(AppConfig.demoLat, AppConfig.demoLng);
      expect(bacs, isNotEmpty);
      expect(bacs.first.code, startsWith('BAC-'));
      print(
          'Bacs proches reçus du backend: ${bacs.map((b) => b.code).toList()}');
    });

    test('2. Connexion Citoyen Awa (+2250701020304)', () async {
      final user = await auth.login('+2250701020304', AppConfig.demoPassword);
      expect(user.role, Role.citoyen);
      expect(user.telephone, '+2250701020304');
      print('Citoyen connecté: ${user.nom} (${user.role.name})');

      final profile = await auth.restore();
      expect(profile?.id, user.id);

      final solde = await pointsRepo.solde();
      expect(solde.solde, isNotNull);
      print(
          'Solde GreenPoints de ${user.nom}: ${solde.solde} points (gagnés: ${solde.totalGagne}, en attente: ${solde.pointsEnAttente})');

      final recompenses = await pointsRepo.recompenses();
      expect(recompenses, isNotEmpty);
      print('Récompenses disponibles: ${recompenses.length}');
    });

    test(
        '3. Connexion Collecteur Kouadio (+2250700000002) et tournées du 12/09/2026',
        () async {
      final user = await auth.login('+2250700000002', AppConfig.demoPassword);
      expect(user.role, Role.collecteur);
      print('Collecteur connecté: ${user.nom}');

      final tournees = await tourneeRepo.list(date: '2026-09-12');
      print('Tournées du 12/09/2026 trouvées: ${tournees.length}');
      expect(tournees, isNotEmpty);
      for (final t in tournees) {
        print('  - Tournée ${t.code} (${t.statut.name}), site: ${t.codeSite}');
      }
    });
  });
}
