import 'package:flutter/material.dart';
import 'package:greengas/shared/design/design.dart';

/// Visuel héros de la landing, slide 2 : scanner → collecter → produire.
class HeroSteps extends StatelessWidget {
  const HeroSteps({super.key, required this.labels});
  final List<String> labels;

  static const _icons = [
    Icons.qr_code_scanner_rounded,
    Icons.local_shipping_rounded,
    Icons.bolt_rounded,
  ];

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final t = Theme.of(context).textTheme;
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (var i = 0; i < 3; i++) ...[
          if (i > 0)
            Padding(
              padding: const EdgeInsets.only(top: 30),
              child: Icon(Icons.arrow_forward_rounded, color: c.green),
            ),
          Reveal(
            index: i * 2,
            child: SizedBox(
              width: 92,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  IconBubble(
                    icon: _icons[i],
                    color: i == 1 ? c.forest : Colors.white,
                    background: i == 1 ? c.onForestMuted : c.forest,
                    size: 84,
                    iconSize: 38,
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Text(labels[i],
                      textAlign: TextAlign.center, style: t.titleSmall),
                ],
              ),
            ),
          ),
        ],
      ],
    );
  }
}
