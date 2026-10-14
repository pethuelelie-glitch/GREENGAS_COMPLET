import 'package:flutter/material.dart';
import 'package:greengas/shared/design/tokens.dart';
import 'package:greengas/shared/design/typography.dart';

/// Chiffre qui défile jusqu'à sa valeur (`ValeurAnimee` du desktop), à l'affichage puis à chaque
/// mise à jour. Seul le texte se reconstruit pendant l'animation.
class AnimatedNumber extends StatelessWidget {
  const AnimatedNumber({
    super.key,
    required this.value,
    required this.format,
    this.style,
  });

  final num value;
  final String Function(num) format;
  final TextStyle? style;

  @override
  Widget build(BuildContext context) {
    final reduced = AppMotion.reduced(context);
    return Semantics(
      label: format(value),
      excludeSemantics: true,
      child: TweenAnimationBuilder<double>(
        tween:
            Tween(begin: reduced ? value.toDouble() : 0, end: value.toDouble()),
        duration: reduced ? Duration.zero : AppMotion.number,
        curve: AppMotion.numberCurve,
        builder: (_, v, __) => Text(
          format(value is int ? v.round() : v),
          style: (style ?? const TextStyle())
              .copyWith(fontFeatures: AppTypography.tabular),
        ),
      ),
    );
  }
}
