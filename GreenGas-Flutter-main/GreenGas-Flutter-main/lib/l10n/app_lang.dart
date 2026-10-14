/// Langues de l'application.
///
/// Français et anglais sont complets. Le dioula et le baoulé sont **partiels** : seuls quelques mots
/// sont renseignés, le reste retombe sur le français. Les traductions doivent être écrites ou validées
/// par des locuteurs : voir lib/l10n/strings.dart.
enum AppLang {
  fr('Français', false),
  en('English', false),
  dyu('Dioula', true),
  bci('Baoulé', true);

  const AppLang(this.label, this.partial);
  final String label;
  final bool partial;
}
