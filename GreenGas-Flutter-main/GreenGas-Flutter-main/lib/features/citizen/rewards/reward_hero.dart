import 'package:flutter/material.dart';
import 'package:greengas/features/citizen/rewards/reward_look.dart';
import 'package:greengas/shared/design/design.dart';

/// Visuel du haut : bouton retour et grande icône de la catégorie qui pulse.
class RewardHero extends StatelessWidget {
  const RewardHero({super.key, required this.look, required this.backLabel});
  final RewardLook look;
  final String backLabel;

  @override
  Widget build(BuildContext context) => SafeArea(
        bottom: false,
        child: SizedBox(
          height: 280,
          child: Stack(
            children: [
              Positioned(
                top: AppSpacing.sm,
                left: AppSpacing.lg,
                child: CircleIconButton(
                  icon: Icons.arrow_back_rounded,
                  tooltip: backLabel,
                  onPressed: () => Navigator.of(context).maybePop(),
                ),
              ),
              Center(
                child: TweenAnimationBuilder<double>(
                  tween: Tween(begin: 0.6, end: 1),
                  duration: AppMotion.of(context, AppMotion.softCurve.settle),
                  curve: AppMotion.softCurve,
                  builder: (_, v, child) =>
                      Transform.scale(scale: v, child: child),
                  child: PulseRing(
                    color: look.color,
                    size: 128,
                    child: Container(
                      width: 128,
                      height: 128,
                      decoration: BoxDecoration(
                        color: look.color,
                        shape: BoxShape.circle,
                        boxShadow: AppShadows.modal(context.isDark),
                      ),
                      child: Icon(look.icon, color: Colors.white, size: 60),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      );
}
