/// Saisie du téléphone : accepte "07 01 02 03 04" ou "+225 07 01 02 03 04".
/// Le serveur attend `+225` suivi de 10 chiffres (guide §7).
String normalizePhone(String raw) {
  final d = raw.replaceAll(RegExp(r'[\s.\-]'), '');
  if (d.startsWith('+225')) return d;
  if (RegExp(r'^\d{10}$').hasMatch(d)) return '+225$d';
  return d;
}

bool isValidPhone(String normalized) =>
    RegExp(r'^\+225\d{10}$').hasMatch(normalized);
