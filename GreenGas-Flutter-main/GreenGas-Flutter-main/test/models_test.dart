import 'package:flutter_test/flutter_test.dart';
import 'package:greengas/domain/models.dart';

void main() {
  test('Utilisateur : lit un citoyen avec son profil', () {
    final u = Utilisateur.fromJson({
      'id': 'a0000000-0000-4000-8000-000000000011',
      'nom': 'Awa Koné',
      'telephone': '+2250701020304',
      'email': null,
      'role': 'citoyen',
      'actif': true,
      'statut_validation': 'valide',
      'date_creation': '2026-09-12T08:30:00Z',
      'profil_citoyen': {
        'bac_id': 'bac00000-0000-4000-8000-000000000014',
        'code_bac': 'BAC-014',
        'telephone_verifie': true,
        'statut_validation': 'en_attente',
        'date_inscription': '2026-09-12T08:30:00Z',
      },
    });
    expect(u.statutValidation, StatutValidation.valide);
    expect(u.role, Role.citoyen);
    expect(u.prenom, 'Awa');
    expect(u.profilCitoyen?.statutValidation, StatutValidation.enAttente);
  });

  test('Collecte : nombres JSON et valeurs absentes (null)', () {
    final c = Collecte.fromJson({
      'id': 'c1',
      'tournee_id': 't1',
      'bac_id': 'b1',
      'code_bac': 'BAC-014',
      'collecteur_id': 'u1',
      'statut': 'en_attente_pesee',
      'poids_brut_kg': null,
      'tare_kg': 6,
      'poids_net_kg': null,
      'source': null,
      'scans_valides': null,
      'kg_par_scan': null,
      'statut_controle': null,
      'date_ouverture': '2026-09-12T08:30:00Z',
      'date_pesee': null,
      'date_validation': null,
    });
    expect(c.statut, StatutCollecte.enAttentePesee);
    expect(c.tareKg, 6.0);
    expect(c.poidsBrutKg, isNull);
  });

  test('une valeur d\'énumération inconnue est signalée', () {
    expect(() => StatutScan.parse('inconnu'), throwsFormatException);
  });
}
