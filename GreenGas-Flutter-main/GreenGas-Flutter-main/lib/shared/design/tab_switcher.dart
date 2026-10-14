import 'package:flutter/material.dart';
import 'package:greengas/shared/design/tokens.dart';

/// Change d'onglet avec la transition de page du desktop (fondu + montée de 10 px, 320 ms).
/// Un seul onglet est construit à la fois : la caméra et les minuteurs s'arrêtent quand on le quitte.
class TabSwitcher extends StatelessWidget {
  const TabSwitcher({super.key, required this.index, required this.child});

  final int index;
  final Widget child;

  @override
  Widget build(BuildContext context) => AnimatedSwitcher(
        duration: AppMotion.of(context, AppMotion.page),
        switchInCurve: AppMotion.out,
        switchOutCurve: Curves.easeIn,
        layoutBuilder: (current, previous) => Stack(
          alignment: Alignment.topCenter,
          children: [...previous, if (current != null) current],
        ),
        transitionBuilder: (child, animation) => FadeTransition(
          opacity: animation,
          child: SlideTransition(
            position: Tween(begin: const Offset(0, 0.015), end: Offset.zero)
                .animate(animation),
            child: child,
          ),
        ),
        child: KeyedSubtree(key: ValueKey(index), child: child),
      );
}
