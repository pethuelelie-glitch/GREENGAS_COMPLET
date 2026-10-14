import 'package:flutter/material.dart';
import 'package:greengas/shared/design/design.dart';

/// Bannière verte de la tournée : code, date, statut, progression des bacs qui défile et jauge.
class RouteBanner extends StatelessWidget {
  const RouteBanner({
    super.key,
    required this.code,
    required this.date,
    required this.status,
    required this.collected,
    required this.total,
    required this.collectedLabel,
    required this.details,
  });

  final String code;
  final String date;
  final String status;
  final int collected;
  final int total;
  final String collectedLabel;

  /// Site et poids collecté.
  final String details;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final t = Theme.of(context).textTheme;
    final white = t.displaySmall?.copyWith(color: Colors.white);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.xl),
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: c.forest,
        borderRadius: BorderRadius.circular(AppRadii.card),
        boxShadow: AppShadows.floating(context.isDark),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    CodeText(code, color: Colors.white, size: 15),
                    Text(date,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: t.labelMedium?.copyWith(color: c.onForestMuted)),
                  ],
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 150),
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.14),
                    borderRadius: BorderRadius.circular(AppRadii.md),
                  ),
                  child: Text(status,
                      maxLines: 2,
                      textAlign: TextAlign.center,
                      style: t.labelSmall?.copyWith(color: Colors.white)),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              AnimatedNumber(
                  value: collected,
                  format: (v) => '${v.round()}',
                  style: white),
              Text(' / $total',
                  style: t.headlineSmall?.copyWith(color: c.onForestMuted)),
              const SizedBox(width: AppSpacing.sm),
              Flexible(
                child: Text(collectedLabel,
                    style: t.titleSmall?.copyWith(color: c.onForestMuted)),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          ProgressBar(
            value: total == 0 ? 0 : collected / total,
            height: 8,
            color: c.onForestMuted,
            track: Colors.white.withValues(alpha: 0.14),
          ),
          const SizedBox(height: AppSpacing.md),
          Text(details, style: t.labelMedium?.copyWith(color: c.onForestMuted)),
        ],
      ),
    );
  }
}
