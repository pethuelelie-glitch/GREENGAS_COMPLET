import 'package:flutter_test/flutter_test.dart';
import 'package:greengas/data/api_client.dart';
import 'package:greengas/data/fake_api_client.dart';
import 'package:greengas/data/repositories.dart';
import 'package:greengas/domain/models.dart';

/// Notifications par utilisateur (contrat 1.4.0, voir notification.txt).
void main() {
  late MemoryTokenStore tokens;
  late FakeApiClient api;
  late AuthRepository auth;
  late NotificationRepository notifs;

  setUp(() {
    tokens = MemoryTokenStore();
    api = FakeApiClient(tokens: tokens, latency: Duration.zero);
    auth = AuthRepository(api, tokens);
    notifs = NotificationRepository(api);
  });

  Future<void> collecterEtTrier() async {
    await auth.login('+2250700000002', 'greengas2026'); // Kouadio
    final tournees = TourneeRepository(api);
    final d = DateTime.now();
    final iso =
        '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
    final t = (await tournees.list(date: iso)).single;
    await tournees.demarrer(t.id);
    for (final code in ['BAC-014', 'BAC-015', 'BAC-016']) {
      const brut = {'BAC-014': 40.0, 'BAC-015': 34.4, 'BAC-016': 25.6};
      final c = await tournees.ouvrirCollecte(t.id, code);
      await tournees.saisirPesee(c.id, brut[code]!);
      await tournees.valider(c.id);
    }
    await tournees.cloturer(t.id);
    api.simulateTri();
  }

  test('modèle : lit une notification du contrat 1.4.0', () {
    final n = Notification.fromJson({
      'id': 'not100000-0000-4000-8000-000000001000',
      'type': 'points_credites',
      'niveau': 'info',
      'titre': 'Points crédités',
      'message': '+105 points pour la collecte du 12/09 (BAC-014).',
      'objet_type': 'transaction',
      'objet_id': null,
      'lue': false,
      'date_creation': '2026-09-12T10:00:00Z',
      'date_lecture': null,
    });
    expect(n.type, TypeNotification.pointsCredites);
    expect(n.niveau, NiveauNotification.info);
    expect(n.lue, isFalse);
    expect(n.dateLecture, isNull);
  });

  test('le collecteur a une notification de tournée planifiée', () async {
    await auth.login('+2250700000002', 'greengas2026');
    final liste = await notifs.liste();
    expect(liste, hasLength(1));
    expect(liste.single.type, TypeNotification.tourneePlanifiee);
    expect(await notifs.compteur(), 1);
  });

  test('après un tri, Awa a 1 non lue « +105 points »', () async {
    await collecterEtTrier();
    await auth.login('+2250701020304', 'greengas2026'); // Awa
    expect(await notifs.compteur(), 1);
    final liste = await notifs.liste(lue: false);
    expect(liste.single.type, TypeNotification.pointsCredites);
    expect(liste.single.message, contains('+105 points'));
  });

  test('marquer une notification comme lue et tout lire', () async {
    await collecterEtTrier();
    await auth.login('+2250701020304', 'greengas2026');
    final n = (await notifs.liste()).single;
    await notifs.marquerLue(n.id);
    expect(await notifs.compteur(), 0);
    expect((await notifs.liste()).single.lue, isTrue);
  });

  test('tout-lire renvoie le nombre de notifications marquées', () async {
    await collecterEtTrier();
    await auth.login('+2250701020304', 'greengas2026');
    expect(await notifs.toutLire(), 1);
    expect(await notifs.compteur(), 0);
  });

  test('un citoyen ne voit pas la notification d’un autre', () async {
    // La notification « tournee_planifiee » appartient à Kouadio (collecteur).
    await auth.login('+2250701020304', 'greengas2026'); // Awa
    expect(await notifs.liste(), isEmpty);
    expect(await notifs.compteur(), 0);
  });

  test('un échange crée une notification pour le citoyen', () async {
    await auth.login('+2250701020304', 'greengas2026'); // solde 130
    final points = PointsRepository(api);
    final internet =
        (await points.recompenses()).firstWhere((r) => r.coutPoints == 100);
    await points.echanger(internet.id);
    final liste = await notifs.liste();
    expect(
        liste.any((n) => n.type == TypeNotification.echangeEffectue), isTrue);
  });
}
