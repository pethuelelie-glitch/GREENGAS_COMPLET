/// Mise en forme d'affichage seulement (les valeurs envoyées à l'API ne changent pas).
library;

/// Un nombre reste collé à ce qui le suit : « 1 000 F », « 1 Go » ne sont jamais coupés en fin de
/// ligne.
String keepNumbersTogether(String s) =>
    s.replaceAllMapped(RegExp(r'(\d) '), (m) => '${m[1]}\u00A0');

/// « +2250701020304 » → « +225 07 01 02 03 04 », insécable. Tout autre format reste tel quel.
String displayPhone(String phone) {
  final m = RegExp(r'^\+225(\d{10})$').firstMatch(phone);
  if (m == null) return phone;
  final d = m[1]!;
  return '+225 ${[
    for (var i = 0; i < 10; i += 2) d.substring(i, i + 2)
  ].join(' ')}'
      .replaceAll(' ', '\u00A0');
}
