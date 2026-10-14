import 'package:flutter_test/flutter_test.dart';
import 'package:greengas/core/phone.dart';
import 'package:greengas/domain/bac_qr.dart';

void main() {
  group('BacQr.parse (le QR contient seulement le code, guide §4)', () {
    test('accepte un code de bac', () {
      expect(BacQr.parse('BAC-014'), 'BAC-014');
      expect(BacQr.parse('  bac-021 '), 'BAC-021');
    });

    test('refuse tout le reste, y compris une URL', () {
      expect(BacQr.parse('https://greengas.ci/bac/BAC-014'), isNull);
      expect(BacQr.parse('BAC-14'), isNull);
      expect(BacQr.parse('TRN-0912-01'), isNull);
      expect(BacQr.parse(''), isNull);
    });
  });

  group('téléphone', () {
    test('ajoute +225 aux numéros à 10 chiffres', () {
      expect(normalizePhone('07 01 02 03 04'), '+2250701020304');
      expect(normalizePhone('+225 07 01 02 03 04'), '+2250701020304');
    });

    test('valide le format du guide', () {
      expect(isValidPhone('+2250701020304'), isTrue);
      expect(isValidPhone('0701020304'), isFalse);
      expect(isValidPhone('+22507010203'), isFalse);
    });
  });
}
