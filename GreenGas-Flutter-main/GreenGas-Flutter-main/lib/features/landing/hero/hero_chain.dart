import 'package:flutter/material.dart';
import 'package:greengas/shared/design/design.dart';

/// Visuel héros de la landing, slide 4 : la chaîne de traçabilité, du bac à l'électricité.
class HeroChain extends StatelessWidget {
  const HeroChain({super.key, required this.labels});
  final List<String> labels;

  static const _icons = [
    Icons.delete_rounded,
    Icons.local_shipping_rounded,
    Icons.tune_rounded,
    Icons.local_fire_department_rounded,
    Icons.bolt_rounded,
  ];

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Wrap(
      alignment: WrapAlignment.center,
      crossAxisAlignment: WrapCrossAlignment.center,
      spacing: 6,
      runSpacing: 12,
      children: [
        for (var i = 0; i < labels.length; i++) ...[
          if (i > 0)
            Icon(Icons.chevron_right_rounded, color: c.green, size: 20),
          Reveal(
            index: i,
            child: Container(
              padding: const EdgeInsets.fromLTRB(8, 8, 14, 8),
              decoration: BoxDecoration(
                color: i == labels.length - 1 ? c.forest : c.surface,
                borderRadius: BorderRadius.circular(AppRadii.full),
                boxShadow: AppShadows.chip(context.isDark),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  IconBubble(
                      icon: _icons[i],
                      color: i == labels.length - 1 ? c.forest : c.forestInk,
                      background: i == labels.length - 1
                          ? c.onForestMuted
                          : c.greenPale,
                      size: 32),
                  const SizedBox(width: 8),
                  Text(labels[i],
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          color: i == labels.length - 1 ? Colors.white : null)),
                ],
              ),
            ),
          ),
        ],
      ],
    );
  }
}
