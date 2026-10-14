/// Le QR code d'un bac contient seulement son code, par exemple `BAC-014` (guide §4).
/// Jamais une URL.
class BacQr {
  const BacQr._();

  static final _pattern = RegExp(r'^BAC-\d{3}$');

  /// Retourne le code du bac, ou null si le contenu n'est pas un code de bac.
  static String? parse(String raw) {
    final value = raw.trim().toUpperCase();
    return _pattern.hasMatch(value) ? value : null;
  }
}
