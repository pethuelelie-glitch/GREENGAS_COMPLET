import 'package:flutter/material.dart';
import 'package:flutter/physics.dart';

/// Espacements (base 4), voir docs/DESIGN_TOKENS.md §4.5.
abstract final class AppSpacing {
  static const xs = 4.0;
  static const sm = 8.0;
  static const md = 12.0;
  static const lg = 16.0;
  static const xl = 20.0;
  static const xxl = 24.0;
  static const xxxl = 32.0;

  /// Marge horizontale des écrans.
  static const screen = 20.0;

  /// Rembourrage d'une carte (desktop `px-5 py-[18px]`).
  static const card = EdgeInsets.fromLTRB(20, 18, 20, 18);

  /// Zone tactile minimale.
  static const touch = 48.0;
}

/// Rayons (§4.1).
abstract final class AppRadii {
  static const full = 999.0;
  static const card = 18.0;
  static const kpi = 16.0;
  static const tile = 14.0;
  static const md = 12.0;
  static const field = 12.0;
  static const sheet = 22.0;
}

/// Ombres du desktop (`--ombre-*`), plus marquées en sombre (§4.2).
abstract final class AppShadows {
  static List<BoxShadow> card(bool dark) => [
        BoxShadow(
            color: Colors.black.withValues(alpha: dark ? 0.45 : 0.12),
            offset: const Offset(0, 1),
            blurRadius: dark ? 12 : 10),
      ];

  static List<BoxShadow> floating(bool dark) => [
        BoxShadow(
            color: Colors.black.withValues(alpha: dark ? 0.5 : 0.16),
            offset: const Offset(0, 2),
            blurRadius: dark ? 14 : 12),
      ];

  static List<BoxShadow> chip(bool dark) => [
        BoxShadow(
            color: Colors.black.withValues(alpha: dark ? 0.5 : 0.18),
            offset: const Offset(0, 1),
            blurRadius: dark ? 8 : 6),
      ];

  static List<BoxShadow> modal(bool dark) => [
        BoxShadow(
            color: Colors.black.withValues(alpha: dark ? 0.6 : 0.28),
            offset: const Offset(0, 24),
            blurRadius: 60),
      ];

  /// Ombre douce du dock : la version modale du desktop, adoucie pour un élément toujours visible.
  static List<BoxShadow> dock(bool dark) => [
        BoxShadow(
            color: Colors.black.withValues(alpha: dark ? 0.55 : 0.14),
            offset: const Offset(0, 10),
            blurRadius: 30),
      ];
}

/// Durées, courbes et ressorts du desktop (`src/lib/animations.ts`, §5).
abstract final class AppMotion {
  static const press = Duration(milliseconds: 150);
  static const fast = Duration(milliseconds: 180);
  static const base = Duration(milliseconds: 260);
  static const page = Duration(milliseconds: 320);
  static const reveal = Duration(milliseconds: 420);
  static const row = Duration(milliseconds: 300);
  static const number = Duration(milliseconds: 1100);
  static const shimmer = Duration(milliseconds: 1400);
  static const pulse = Duration(milliseconds: 2000);
  static const bell = Duration(milliseconds: 700);

  /// `EASE_SORTIE` = cubic-bezier(0.22, 1, 0.36, 1).
  static const out = Cubic(0.22, 1, 0.36, 1);

  /// Défilement des chiffres (`ValeurAnimee`).
  static const numberCurve = Cubic(0.16, 1, 0.3, 1);

  /// `RESSORT_DOUX` (260 / 26) et `RESSORT_VIF` (420 / 30).
  static const softSpring =
      SpringDescription(mass: 1, stiffness: 260, damping: 26);
  static const snappySpring =
      SpringDescription(mass: 1, stiffness: 420, damping: 30);

  /// Ressort plus souple du dock : léger rebond à l'arrivée.
  static const dockSpring =
      SpringDescription(mass: 1, stiffness: 380, damping: 24);

  static const softCurve = SpringCurve(softSpring);
  static const snappyCurve = SpringCurve(snappySpring);

  /// Vrai si le téléphone demande moins d'animations (accessibilité).
  static bool reduced(BuildContext context) =>
      MediaQuery.maybeDisableAnimationsOf(context) ?? false;

  /// [d], ou zéro si les animations sont désactivées.
  static Duration of(BuildContext context, Duration d) =>
      reduced(context) ? Duration.zero : d;
}

/// Courbe tirée d'un ressort : permet d'utiliser les ressorts du desktop dans les animations
/// implicites (`AnimatedScale`, `AnimatedSlide`…). La durée conseillée est [settle].
class SpringCurve extends Curve {
  const SpringCurve(this.spring);
  final SpringDescription spring;

  /// Temps pour que l'oscillation devienne invisible (enveloppe e^(-6)).
  Duration get settle => Duration(
      milliseconds: (12 * spring.mass / spring.damping * 1000).round());

  @override
  double transformInternal(double t) {
    final sim = SpringSimulation(spring, 0, 1, 0);
    return sim.x(t * settle.inMilliseconds / 1000);
  }
}
