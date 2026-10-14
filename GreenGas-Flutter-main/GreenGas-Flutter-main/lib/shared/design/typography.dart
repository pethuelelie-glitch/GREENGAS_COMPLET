import 'package:flutter/material.dart';

/// Typographie du desktop : Inter pour l'interface, JetBrains Mono pour les
/// codes. Tailles agrandies pour le téléphone, mêmes rapports (docs/DESIGN_TOKENS.md §3.2).
abstract final class AppTypography {
  static const family = 'Inter';
  static const monoFamily = 'JetBrainsMono';

  /// Chiffres de même largeur, pour les nombres qui défilent. Pas sur tout le texte : dans Inter,
  /// ils élargissent aussi le tiret (« E - mail »).
  static const tabular = [FontFeature.tabularFigures()];

  static TextTheme textTheme(Color text, Color muted) {
    TextStyle s(double size, FontWeight w, double height,
            {double spacing = 0, Color? color}) =>
        TextStyle(
          fontFamily: family,
          fontSize: size,
          fontWeight: w,
          height: height,
          letterSpacing: spacing,
          color: color ?? text,
        );

    return TextTheme(
      displayLarge: s(44, FontWeight.w700, 1.05, spacing: -1),
      displayMedium: s(40, FontWeight.w700, 1.05, spacing: -0.8),
      displaySmall: s(36, FontWeight.w700, 1.1, spacing: -0.5),
      headlineLarge: s(30, FontWeight.w700, 1.15, spacing: -0.4),
      headlineMedium: s(27, FontWeight.w700, 1.18, spacing: -0.3),
      headlineSmall: s(24, FontWeight.w700, 1.2, spacing: -0.2),
      titleLarge: s(19, FontWeight.w700, 1.25),
      titleMedium: s(16.5, FontWeight.w700, 1.3),
      titleSmall: s(15, FontWeight.w700, 1.3),
      bodyLarge: s(16, FontWeight.w500, 1.45),
      bodyMedium: s(15, FontWeight.w400, 1.45),
      bodySmall: s(13.5, FontWeight.w500, 1.35, color: muted),
      labelLarge: s(15.5, FontWeight.w600, 1.2),
      labelMedium: s(13.5, FontWeight.w600, 1.3),
      labelSmall: s(12, FontWeight.w600, 1.3, spacing: 0.1),
    );
  }

  /// Code d'objet (BAC-014, TRN-…), comme `CodeObjet` du desktop.
  static TextStyle code(Color color, {double size = 15}) => TextStyle(
        fontFamily: monoFamily,
        fontSize: size,
        fontWeight: FontWeight.w600,
        color: color,
        letterSpacing: 0.2,
      );
}
