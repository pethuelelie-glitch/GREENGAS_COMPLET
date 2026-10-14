import 'package:flutter/material.dart';
import 'package:greengas/shared/design/design.dart';

/// Visuel héros de la landing, slide 3 : quelques récompenses en bento.
class HeroRewards extends StatelessWidget {
  const HeroRewards({super.key, required this.labels});

  /// Internet, appel, bons, dons.
  final List<String> labels;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final tiles = [
      (Icons.wifi_rounded, c.blue, 128.0),
      (Icons.phone_in_talk_rounded, c.gold, 104.0),
      (Icons.redeem_rounded, c.forest, 104.0),
      (Icons.park_rounded, c.olive, 128.0),
    ];
    Widget tile(int i) => Reveal(
          index: i,
          child: Container(
            width: 132,
            height: tiles[i].$3,
            padding: const EdgeInsets.all(AppSpacing.md + 2),
            decoration: BoxDecoration(
              color: c.surface,
              borderRadius: BorderRadius.circular(AppRadii.card),
              boxShadow: AppShadows.card(context.isDark),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                IconBubble(
                    icon: tiles[i].$1,
                    color: tiles[i].$2,
                    background: tiles[i].$2.withValues(alpha: 0.14),
                    size: 40),
                Text(labels[i], style: Theme.of(context).textTheme.titleSmall),
              ],
            ),
          ),
        );
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
            mainAxisSize: MainAxisSize.min,
            children: [tile(0), const SizedBox(height: 12), tile(2)]),
        const SizedBox(width: 12),
        Column(
            mainAxisSize: MainAxisSize.min,
            children: [tile(1), const SizedBox(height: 12), tile(3)]),
      ],
    );
  }
}
