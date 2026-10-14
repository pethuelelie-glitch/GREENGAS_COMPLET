import 'package:flutter/material.dart';
import 'package:greengas/shared/design/design.dart';

/// Visuel héros de la landing, slide 1 : le « G » qui respire, comme le logo de la barre latérale du desktop.
class HeroLogo extends StatelessWidget {
  const HeroLogo({super.key});

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return PulseRing(
      color: c.green,
      size: 168,
      child: TweenAnimationBuilder<double>(
        tween: Tween(begin: 0, end: 1),
        duration: AppMotion.of(context, AppMotion.softCurve.settle),
        curve: AppMotion.softCurve,
        builder: (_, v, child) => Transform.rotate(
          angle: (1 - v) * -0.35,
          child: Transform.scale(scale: 0.6 + 0.4 * v, child: child),
        ),
        child: Container(
          width: 168,
          height: 168,
          padding: const EdgeInsets.all(38),
          decoration: BoxDecoration(
            color: c.surface,
            shape: BoxShape.circle,
            boxShadow: AppShadows.modal(context.isDark),
          ),
          child: Image.asset('assets/images/logo_g.png',
              fit: BoxFit.contain, excludeFromSemantics: true),
        ),
      ),
    );
  }
}
