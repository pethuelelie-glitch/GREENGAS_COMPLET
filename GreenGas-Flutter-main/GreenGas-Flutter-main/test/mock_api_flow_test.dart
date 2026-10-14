import 'package:flutter_test/flutter_test.dart';
import 'package:greengas/data/api_client.dart';
import 'package:greengas/data/fake_api_client.dart';
import 'package:greengas/data/repositories.dart';
import 'package:greengas/domain/models.dart';

/// Joue le parcours du guide (§2) contre le mode démo : mêmes formats que l'API.
void main() {
  late FakeApiClient api;
  late AuthRepository auth;

  setUp(() {
    final tokens = MemoryTokenStore();
    api = FakeApiClient(tokens: tokens, latency: Duration.zero);
    auth = AuthRepository(api, tokens);
  });

  test('connexion : le rôle vient du serveur', () async {
    final awa = await auth.login('+2250701020304', 'greengas2026');
    expect(awa.role, Role.citoyen);
    final kouadio = await auth.login('+2250700000002', 'greengas2026');
    expect(kouadio.role, Role.collecteur);
    final aya = await auth.login('+2250700000003', 'greengas2026');
    expect(aya.role, Role.operateurTri);
  });

  test('connexion refusée avec un mauvais mot de passe', () async {
    await expectLater(
      auth.login('+2250701020304', 'faux'),
      throwsA(
          isA<ApiException>().having((e) => e.code, 'code', 'NON_AUTHENTIFIE')),
    );
  });

  test('un citoyen inscrit peut scanner tout de suite (contrat 1.3.0)',
      () async {
    // Plus de code SMS : signUp ouvre la session et le compte est actif.
    await auth.signUp(
      nom: 'Nouveau Citoyen',
      telephone: '+2250766666666',
      motDePasse: 'motdepasse1',
      codeBac: 'BAC-014',
    );
    final scan = await ScanRepository(api).scan('BAC-014');
    expect(scan.compte, isTrue);
  });

  test('scan citoyen : sans position, puis un doublon renvoie le scan existant',
      () async {
    await auth.login(
        '+2250701020304', 'greengas2026'); // Awa : aucun scan aujourd'hui
    final scans = ScanRepository(api);
    final second = await scans.scan('BAC-014');
    expect(second.statut, StatutScan.nonLocalise);
    expect(second.compte, isTrue);
    final third = await scans.scan('BAC-014');
    // Le 3e scan arrive dans les 10 s du 2e : doublon, le scan existant est renvoyé.
    expect(third.id, second.id);
  });

  test('plafond : 2 dépôts comptés par jour, le 3e est refusé (contrat 1.6.0)',
      () async {
    var now = DateTime.now();
    final tokens = MemoryTokenStore();
    final timed =
        FakeApiClient(tokens: tokens, clock: () => now, latency: Duration.zero);
    await AuthRepository(timed, tokens).login(
        '+2250701020304', 'greengas2026'); // Awa : aucun scan aujourd'hui
    final scans = ScanRepository(timed);
    expect((await scans.scan('BAC-014')).compte, isTrue); // 1er dépôt du jour
    now = now.add(const Duration(minutes: 1));
    expect((await scans.scan('BAC-014')).compte, isTrue); // 2e dépôt du jour
    now = now.add(const Duration(minutes: 1));
    final refuse = await scans.scan('BAC-014'); // 3e : au-dessus du plafond
    expect(refuse.statut, StatutScan.refusePlafond);
    expect(refuse.compte, isFalse);
  });

  test('paramètres : le mobile lit max_scans_par_jour (contrat 1.6.0)',
      () async {
    await auth.login('+2250701020304', 'greengas2026');
    final p = await ParametresRepository(api).lire('max_scans_par_jour');
    expect(p.cle, 'max_scans_par_jour');
    expect(p.valeur, 2);
    await expectLater(
      ParametresRepository(api).lire('parametre_inconnu'),
      throwsA(isA<ApiException>().having((e) => e.code, 'code', 'INTROUVABLE')),
    );
  });

  test('plafond : il suit le paramètre modifié dans le Control Center',
      () async {
    var now = DateTime.now();
    final tokens = MemoryTokenStore();
    final timed =
        FakeApiClient(tokens: tokens, clock: () => now, latency: Duration.zero);
    await AuthRepository(timed, tokens).login(
        '+2250701020304', 'greengas2026'); // Awa : aucun scan aujourd'hui
    final scans = ScanRepository(timed);
    expect((await scans.scan('BAC-014')).compte,
        isTrue); // 1 dépôt (plafond par défaut 2)
    timed.setParametre(
        'max_scans_par_jour', 1); // l'admin abaisse le plafond à 1
    now = now.add(const Duration(minutes: 1));
    final refuse = await scans.scan('BAC-014');
    expect(refuse.statut, StatutScan.refusePlafond);
    expect(refuse.compte, isFalse);
  });

  test('un citoyen ne peut pas utiliser les routes du collecteur (403)',
      () async {
    await auth.login('+2250701020304', 'greengas2026');
    await expectLater(
      TourneeRepository(api).list(),
      throwsA(
          isA<ApiException>().having((e) => e.code, 'code', 'ACCES_REFUSE')),
    );
  });

  test(
      'chaîne complète : collecte -> tri -> +105 points pour Awa (exemple du guide §8.3)',
      () async {
    // Collecteur : démarre, scanne BAC-014, valide.
    await auth.login('+2250700000002', 'greengas2026');
    final tournees = TourneeRepository(api);
    final today = DateTime.now();
    final iso =
        '${today.year}-${today.month.toString().padLeft(2, '0')}-${today.day.toString().padLeft(2, '0')}';
    final jour = await tournees.list(date: iso);
    expect(jour, hasLength(1));
    final t = jour.single;
    expect(t.statut, StatutTournee.planifiee);

    // Bac hors tournée, tournée pas démarrée.
    await expectLater(
      tournees.ouvrirCollecte(t.id, 'BAC-014'),
      throwsA(isA<ApiException>()
          .having((e) => e.code, 'code', 'TOURNEE_STATUT_INVALIDE')),
    );
    await tournees.demarrer(t.id);
    await expectLater(
      tournees.ouvrirCollecte(t.id, 'BAC-022'),
      throwsA(isA<ApiException>()
          .having((e) => e.code, 'code', 'BAC_HORS_TOURNEE')),
    );

    // Le collecteur saisit le poids brut (tare 6,0 kg) : bac -> net attendu.
    const netParBac = {
      'BAC-014': 34.0,
      'BAC-015': 28.4,
      'BAC-016': 19.6,
    };
    for (final code in ['BAC-014', 'BAC-015', 'BAC-016']) {
      final ouverte = await tournees.ouvrirCollecte(t.id, code);
      expect(ouverte.statut, StatutCollecte.enAttentePesee);
      final pesee =
          await tournees.saisirPesee(ouverte.id, netParBac[code]! + 6.0);
      expect(pesee.statut, StatutCollecte.pesee);
      expect(pesee.source, 'manuel');
      final validee = await tournees.valider(ouverte.id);
      expect(validee.statut, StatutCollecte.validee);
      if (code == 'BAC-014') {
        expect(validee.poidsNetKg, 34.0);
        expect(validee.scansValides, 22);
        expect(validee.statutControle, StatutControle.normal);
      }
    }
    // Un bac ne peut pas être collecté deux fois dans la tournée.
    await expectLater(
      tournees.ouvrirCollecte(t.id, 'BAC-014'),
      throwsA(isA<ApiException>()
          .having((e) => e.code, 'code', 'BAC_DEJA_COLLECTE')),
    );
    final cloturee = await tournees.cloturer(t.id);
    expect(cloturee.statut, StatutTournee.collectee);
    expect(cloturee.poidsCollecteKg, closeTo(34.0 + 28.4 + 19.6, 0.01));

    // Citoyen : solde avant le tri.
    await auth.login('+2250701020304', 'greengas2026');
    final points = PointsRepository(api);
    final avant = await points.solde();
    expect(avant.solde, 130);

    // L'opérateur valide le tri (simulé) : 34 x 8,54 x 8/22 = 105,58 -> 105 points.
    api.simulateTri();
    final apres = await points.solde();
    expect(apres.solde - avant.solde, 105);
  });

  test('pesée manuelle : poids nul/trop lourd refusé, puis une seule pesée',
      () async {
    await auth.login('+2250700000002', 'greengas2026');
    final tournees = TourneeRepository(api);
    final d = DateTime.now();
    final iso =
        '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
    final t = (await tournees.list(date: iso)).single;
    await tournees.demarrer(t.id);
    final c = await tournees.ouvrirCollecte(t.id, 'BAC-014');
    await expectLater(
      tournees.saisirPesee(c.id, 0),
      throwsA(
          isA<ApiException>().having((e) => e.code, 'code', 'POIDS_INVALIDE')),
    );
    await expectLater(
      tournees.saisirPesee(c.id, 999),
      throwsA(
          isA<ApiException>().having((e) => e.code, 'code', 'POIDS_INVALIDE')),
    );
    final ok = await tournees.saisirPesee(c.id, 40.0);
    expect(ok.statut, StatutCollecte.pesee);
    expect(ok.source, 'manuel');
    expect(ok.poidsBrutKg, 40.0);
    // La pesée n'est acceptée qu'une fois.
    await expectLater(
      tournees.saisirPesee(c.id, 41.0),
      throwsA(isA<ApiException>().having((e) => e.code, 'code', 'CONFLIT')),
    );
  });

  test('boutique : solde insuffisant puis échange', () async {
    await auth.login('+2250701020304', 'greengas2026'); // solde 130
    final points = PointsRepository(api);
    final catalogue = await points.recompenses();
    final kit = catalogue.firstWhere((r) => r.coutPoints == 250);
    await expectLater(
      points.echanger(kit.id),
      throwsA(isA<ApiException>()
          .having((e) => e.code, 'code', 'SOLDE_INSUFFISANT')),
    );
    final internet = catalogue.firstWhere((r) => r.coutPoints == 100);
    await points.echanger(internet.id);
    expect((await points.solde()).solde, 30);
  });

  test('inscription citoyen : jetons reçus et session ouverte (contrat 1.3.0)',
      () async {
    final user = await auth.signUp(
      nom: 'Nouveau Citoyen',
      telephone: '+2250799999999',
      motDePasse: 'motdepasse1',
      codeBac: 'BAC-014',
    );
    expect(user.role, Role.citoyen);
    expect(user.statutValidation, StatutValidation.valide);
    expect(user.profilCitoyen?.codeBac, 'BAC-014');
    // Les jetons sont enregistrés par l'inscription : aucune reconnexion nécessaire.
    final scan = await ScanRepository(api).scan('BAC-014');
    expect(scan.compte, isTrue);
  });

  test('inscription avec e-mail facultatif : il apparaît dans le profil',
      () async {
    final user = await auth.signUp(
      nom: 'Avec Email',
      telephone: '+2250788888888',
      motDePasse: 'motdepasse1',
      codeBac: 'BAC-015',
      email: 'avec@email.ci',
    );
    expect(user.email, 'avec@email.ci');
    expect(user.profilCitoyen?.codeBac, 'BAC-015');
  });

  test('sans e-mail, le compte est créé quand même', () async {
    final user = await auth.signUp(
      nom: 'Sans Email',
      telephone: '+2250777777777',
      motDePasse: 'motdepasse1',
      codeBac: 'BAC-014',
    );
    expect(user.email, isNull);
  });

  test('bacs proches : route publique, du plus proche au plus lointain',
      () async {
    // Pas de connexion : le citoyen n'a pas encore de compte.
    final bacs = await BacRepository(api).proches(5.4005, -3.989);
    expect(bacs.length, greaterThanOrEqualTo(5));
    expect(bacs.first.code, 'BAC-014');
    final distances = [for (final b in bacs) b.distanceM!];
    expect(distances, orderedEquals([...distances]..sort()));
  });

  test('inscription : un code de bac inconnu est refusé', () async {
    await expectLater(
      auth.signUp(
          nom: 'X',
          telephone: '+2250766666666',
          motDePasse: 'motdepasse1',
          codeBac: 'BAC-999'),
      throwsA(isA<ApiException>().having((e) => e.code, 'code', 'INTROUVABLE')),
    );
  });

  test('échange d\'un forfait vers le numéro d\'un proche', () async {
    await auth.login('+2250701020304', 'greengas2026'); // solde 130
    final points = PointsRepository(api);
    final internet = (await points.recompenses())
        .firstWhere((r) => r.versUnNumero && r.coutPoints == 100);
    await expectLater(
      points.echanger(internet.id, telephoneBeneficiaire: '0712345678'),
      throwsA(isA<ApiException>().having((e) => e.code, 'code', 'VALIDATION')),
    );
    final echange = await points.echanger(internet.id,
        telephoneBeneficiaire: '+2250712345678');
    expect(echange.telephoneBeneficiaire, '+2250712345678');
    final historique = await points.echanges();
    expect(historique.first.telephoneBeneficiaire, '+2250712345678');
  });
}
