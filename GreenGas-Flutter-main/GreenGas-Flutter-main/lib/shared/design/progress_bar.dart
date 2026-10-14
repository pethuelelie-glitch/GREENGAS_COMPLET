import 'package:flutter/material.dart';
import 'package:greengas/shared/design/app_colors.dart';
import 'package:greengas/shared/design/tokens.dart';

/// Barre de proportion du desktop (`ChampPoids`, graphiques) : elle grandit jusqu'à sa valeur.
/// Verte une fois pleine, couleur [color] (or par défaut) avant.
class ProgressBar extends StatelessWidget {
  const ProgressBar(
      {super.key,
      required this.value,
      this.color,
      this.height = 5,
      this.track});

  /// Entre 0 et 1.
  final double value;
  final Color? color;
  final double height;
  final Color? track;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return ClipRRect(
      borderRadius: BorderRadius.circular(AppRadii.full),
      child: SizedBox(
        height: height,
        child: Stack(
          children: [
            Container(color: track ?? c.greenPale),
            TweenAnimationBuilder<double>(
              tween: Tween(begin: 0, end: value.clamp(0.0, 1.0)),
              duration: AppMotion.of(context, AppMotion.number),
              curve: AppMotion.numberCurve,
              builder: (_, v, __) => FractionallySizedBox(
                widthFactor: v,
                child: Container(color: v >= 1 ? c.green : (color ?? c.gold)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
