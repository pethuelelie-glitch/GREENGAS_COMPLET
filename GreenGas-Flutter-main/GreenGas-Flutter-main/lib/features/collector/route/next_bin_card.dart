import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:greengas/core/format.dart';
import 'package:greengas/features/collector/route/bac_line.dart';
import 'package:greengas/l10n/strings.dart';
import 'package:greengas/shared/design/design.dart';

/// Prochain bac à collecter : code, distance, résidence, et l'itinéraire en un geste.
class NextBinCard extends ConsumerWidget {
  const NextBinCard(
      {super.key, required this.line, required this.onDirections});

  final BacLine line;
  final VoidCallback onDirections;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = context.colors;
    final t = Theme.of(context).textTheme;
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              PulseRing(
                color: c.warn,
                size: 44,
                child: IconBubble(
                    icon: Icons.near_me_rounded,
                    color: Colors.white,
                    background: c.warn),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(ref.tr('nearest_bin'),
                        style: t.labelMedium?.copyWith(color: c.textMuted)),
                    CodeText(line.bac.code, size: 18),
                  ],
                ),
              ),
              Text(fmtDistance(line.metres),
                  style: t.headlineSmall?.copyWith(color: c.forestInk)),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(line.bac.residence, style: t.titleSmall),
          const SizedBox(height: AppSpacing.xs),
          Text(ref.tr('next_bin_hint'), style: t.bodySmall),
          const SizedBox(height: AppSpacing.lg),
          AppButton(
            label: ref.tr('directions'),
            icon: Icons.navigation_rounded,
            kind: ButtonKind.outline,
            height: 48,
            onPressed: onDirections,
          ),
        ],
      ),
    );
  }
}
