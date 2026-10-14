import 'package:flutter/material.dart';

/// Ton d'un statut : toujours accompagné d'une icône ou d'un texte (jamais la couleur seule).
enum Tone { ok, warn, alert, neutral }

/// Couleurs GreenGas, valeurs exactes du desktop (`greengas_desktop/src/styles/tokens.css`,
/// voir docs/DESIGN_TOKENS.md §2). Lues via `context.colors` : clair et sombre.
@immutable
class AppColors extends ThemeExtension<AppColors> {
  const AppColors({
    required this.forest,
    required this.forestPressed,
    required this.forestInk,
    required this.green,
    required this.greenPale,
    required this.gold,
    required this.goldPale,
    required this.goldText,
    required this.background,
    required this.backgroundDeep,
    required this.surface,
    required this.text,
    required this.textMuted,
    required this.border,
    required this.onForestMuted,
    required this.primary,
    required this.onPrimary,
    required this.scrim,
    required this.ok,
    required this.okBg,
    required this.okText,
    required this.warn,
    required this.warnBg,
    required this.warnText,
    required this.alert,
    required this.alertBg,
    required this.alertText,
    required this.neutral,
    required this.neutralBg,
    required this.neutralText,
    required this.blue,
    required this.olive,
  });

  /// Identité : barre active, bannières, en-têtes (identique en clair et en sombre).
  final Color forest;
  final Color forestPressed;

  /// Vert forêt employé comme texte ou contour (éclairci en sombre pour rester lisible).
  final Color forestInk;
  final Color green;
  final Color greenPale;
  final Color gold;
  final Color goldPale;
  final Color goldText;
  final Color background;
  final Color backgroundDeep;
  final Color surface;
  final Color text;
  final Color textMuted;
  final Color border;

  /// Texte secondaire posé sur [forest].
  final Color onForestMuted;

  /// Élément plein d'action (bouton principal, rond actif du dock). Vert forêt en clair ; en sombre,
  /// le vert clair avec un contenu foncé (blanc sur vert sombre : 2,5:1, insuffisant).
  final Color primary;
  final Color onPrimary;
  final Color scrim;
  final Color ok;
  final Color okBg;
  final Color okText;
  final Color warn;
  final Color warnBg;
  final Color warnText;
  final Color alert;
  final Color alertBg;
  final Color alertText;
  final Color neutral;
  final Color neutralBg;
  final Color neutralText;

  /// Séries du desktop reprises pour les catégories de récompenses (`serie-2`, `cat-biomasse`).
  final Color blue;
  final Color olive;

  static const light = AppColors(
    forest: Color(0xFF1B4332),
    forestPressed: Color(0xFF24563F),
    forestInk: Color(0xFF1B4332),
    green: Color(0xFF2E7D32),
    greenPale: Color(0xFFEDF3EC),
    gold: Color(0xFFB8860B),
    goldPale: Color(0xFFFBF3DC),
    goldText: Color(0xFF6E5005),
    background: Color(0xFFF6F7F4),
    backgroundDeep: Color(0xFFE4E8E0),
    surface: Color(0xFFFFFFFF),
    text: Color(0xFF222222),
    textMuted: Color(0xFF5C5C5C),
    border: Color(0xFFD9DED6),
    onForestMuted: Color(0xFFCFE3D4),
    primary: Color(0xFF1B4332),
    onPrimary: Color(0xFFFFFFFF),
    scrim: Color(0x80000000),
    ok: Color(0xFF2E7D32),
    okBg: Color(0xFFE3F1E4),
    okText: Color(0xFF1F6B25),
    warn: Color(0xFFD68910),
    warnBg: Color(0xFFFBF0DC),
    warnText: Color(0xFF8A5A07),
    alert: Color(0xFFC0392B),
    alertBg: Color(0xFFFBE5E2),
    alertText: Color(0xFFA52A1E),
    neutral: Color(0xFF7F8C8D),
    neutralBg: Color(0xFFECEEEC),
    neutralText: Color(0xFF4D5A53),
    blue: Color(0xFF3B7EA1),
    olive: Color(0xFF8BAA4A),
  );

  static const dark = AppColors(
    forest: Color(0xFF1B4332),
    forestPressed: Color(0xFF24563F),
    forestInk: Color(0xFF8FD0A6),
    green: Color(0xFF5CB860),
    greenPale: Color(0xFF1F2D25),
    gold: Color(0xFFD4A42A),
    goldPale: Color(0xFF3A3013),
    goldText: Color(0xFFEBC764),
    background: Color(0xFF121A15),
    backgroundDeep: Color(0xFF0B110D),
    surface: Color(0xFF19231D),
    text: Color(0xFFE4EBE5),
    textMuted: Color(0xFFA2B2A7),
    border: Color(0xFF2F3E35),
    onForestMuted: Color(0xFFCFE3D4),
    primary: Color(0xFF5CB860),
    onPrimary: Color(0xFF121A15),
    scrim: Color(0xA6000000),
    ok: Color(0xFF5CB860),
    okBg: Color(0xFF1D3324),
    okText: Color(0xFF95D69D),
    warn: Color(0xFFE3A03A),
    warnBg: Color(0xFF3A2C14),
    warnText: Color(0xFFF0C47C),
    alert: Color(0xFFE05A4B),
    alertBg: Color(0xFF3E201C),
    alertText: Color(0xFFF4A69B),
    neutral: Color(0xFF95A3A4),
    neutralBg: Color(0xFF252E29),
    neutralText: Color(0xFFBCC7C0),
    blue: Color(0xFF3B7EA1),
    olive: Color(0xFF8BAA4A),
  );

  Color toneColor(Tone t) => switch (t) {
        Tone.ok => ok,
        Tone.warn => warn,
        Tone.alert => alert,
        Tone.neutral => neutral,
      };

  Color toneBg(Tone t) => switch (t) {
        Tone.ok => okBg,
        Tone.warn => warnBg,
        Tone.alert => alertBg,
        Tone.neutral => neutralBg,
      };

  Color toneText(Tone t) => switch (t) {
        Tone.ok => okText,
        Tone.warn => warnText,
        Tone.alert => alertText,
        Tone.neutral => neutralText,
      };

  @override
  AppColors copyWith() => this;

  @override
  AppColors lerp(covariant AppColors? other, double t) {
    if (other == null) return this;
    Color l(Color a, Color b) => Color.lerp(a, b, t)!;
    return AppColors(
      forest: l(forest, other.forest),
      forestPressed: l(forestPressed, other.forestPressed),
      forestInk: l(forestInk, other.forestInk),
      green: l(green, other.green),
      greenPale: l(greenPale, other.greenPale),
      gold: l(gold, other.gold),
      goldPale: l(goldPale, other.goldPale),
      goldText: l(goldText, other.goldText),
      background: l(background, other.background),
      backgroundDeep: l(backgroundDeep, other.backgroundDeep),
      surface: l(surface, other.surface),
      text: l(text, other.text),
      textMuted: l(textMuted, other.textMuted),
      border: l(border, other.border),
      onForestMuted: l(onForestMuted, other.onForestMuted),
      primary: l(primary, other.primary),
      onPrimary: l(onPrimary, other.onPrimary),
      scrim: l(scrim, other.scrim),
      ok: l(ok, other.ok),
      okBg: l(okBg, other.okBg),
      okText: l(okText, other.okText),
      warn: l(warn, other.warn),
      warnBg: l(warnBg, other.warnBg),
      warnText: l(warnText, other.warnText),
      alert: l(alert, other.alert),
      alertBg: l(alertBg, other.alertBg),
      alertText: l(alertText, other.alertText),
      neutral: l(neutral, other.neutral),
      neutralBg: l(neutralBg, other.neutralBg),
      neutralText: l(neutralText, other.neutralText),
      blue: l(blue, other.blue),
      olive: l(olive, other.olive),
    );
  }
}

extension AppColorsContext on BuildContext {
  AppColors get colors => Theme.of(this).extension<AppColors>()!;
  bool get isDark => Theme.of(this).brightness == Brightness.dark;
}
