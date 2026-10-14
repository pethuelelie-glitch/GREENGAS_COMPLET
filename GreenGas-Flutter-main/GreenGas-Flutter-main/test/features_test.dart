import 'package:flutter_test/flutter_test.dart';
import 'package:greengas/domain/models.dart';
import 'package:greengas/l10n/app_lang.dart';
import 'package:greengas/l10n/strings.dart';

Recompense reward(String nom, {String? categorie}) => Recompense(
      id: 'r',
      nom: nom,
      description: '',
      coutPoints: 100,
      partenaire: 'P',
      actif: true,
      categorieApi: categorie,
    );

void main() {
  group(
      'catégorie de récompense (déduite du nom tant que le serveur ne l\'envoie pas)',
      () {
    test('forfaits et crédits partent vers un numéro de téléphone', () {
      expect(reward('Forfait internet 1 Go').categorie,
          RecompenseCategorie.internet);
      expect(reward("Crédit d'appel").categorie, RecompenseCategorie.appel);
      expect(reward('Forfait internet 1 Go').versUnNumero, isTrue);
      expect(reward("Crédit d'appel").versUnNumero, isTrue);
    });

    test('bons et dons n\'ont pas de numéro bénéficiaire', () {
      expect(reward("Bon d'achat").categorie, RecompenseCategorie.bon);
      expect(reward('Kit de tri').categorie, RecompenseCategorie.don);
      expect(reward("Bon d'achat").versUnNumero, isFalse);
    });

    test('la catégorie du serveur est prioritaire', () {
      expect(reward('Offre spéciale', categorie: 'appel').categorie,
          RecompenseCategorie.appel);
    });
  });

  group('traductions', () {
    test('français et anglais couvrent le même texte', () {
      expect(translate(AppLang.fr, 'start'), "C'est parti");
      expect(translate(AppLang.en, 'start'), "Let's go");
      expect(
          translate(AppLang.fr, 'n_points', args: {'n': '120'}), '120 points');
      expect(translate(AppLang.en, 'missing', args: {'n': '40'}),
          '40 pts missing');
    });

    test('dioula et baoulé : mots renseignés, le reste retombe sur le français',
        () {
      expect(translate(AppLang.dyu, 'welcome'), 'Aw bisimila');
      expect(translate(AppLang.bci, 'welcome'), 'Akwaba');
      expect(translate(AppLang.dyu, 'start'), "C'est parti");
      expect(AppLang.dyu.partial, isTrue);
      expect(AppLang.fr.partial, isFalse);
    });

    test('une clé inconnue renvoie la clé (jamais de crash)', () {
      expect(translate(AppLang.fr, 'cle_inexistante'), 'cle_inexistante');
    });
  });
}
